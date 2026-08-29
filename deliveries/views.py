from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Delivery, TeamMember
from .permissions import (
    HasSelectedMember,
    IsDispatcher,
    IsRetailer,
    IsRider,
)
from .serializers import (
    AssignRiderSerializer,
    DeliveryConfirmationSerializer,
    DeliveryCreateSerializer,
    DeliveryDetailSerializer,
    DeliveryListSerializer,
    FailedDeliverySerializer,
    TeamMemberSerializer,
    TrackingSerializer,
)
from .services import (
    assign_rider,
    create_delivery,
    mark_delivered,
    mark_failed,
    mark_picked_up,
)


def convert_validation_error(error):
    if hasattr(error, "message_dict"):
        return ValidationError(error.message_dict)

    return ValidationError(error.messages)


class TeamMemberListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        members = TeamMember.objects.filter(is_active=True)
        role = request.query_params.get("role")

        if role:
            members = members.filter(role=role.upper())

        serializer = TeamMemberSerializer(members, many=True)
        return Response(serializer.data)


class SelectMemberView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        member_id = request.data.get("member_id")

        if not member_id:
            raise ValidationError(
                {"member_id": "A team member ID is required."}
            )

        member = get_object_or_404(
            TeamMember,
            id=member_id,
            is_active=True,
        )

        request.session.cycle_key()
        request.session["team_member_id"] = member.id

        return Response(
            {
                "message": "Team member selected.",
                "member": TeamMemberSerializer(member).data,
            }
        )


class CurrentMemberView(APIView):
    permission_classes = [HasSelectedMember]

    def get(self, request):
        return Response(
            TeamMemberSerializer(request.team_member).data
        )

    def delete(self, request):
        request.session.pop("team_member_id", None)

        return Response(status=status.HTTP_204_NO_CONTENT)


class DeliveryListCreateView(APIView):
    permission_classes = [HasSelectedMember]

    def get(self, request):
        member = request.team_member

        deliveries = Delivery.objects.select_related(
            "retailer",
            "assigned_rider",
        )

        if member.role == TeamMember.Role.RETAILER:
            deliveries = deliveries.filter(retailer=member)

        elif member.role == TeamMember.Role.RIDER:
            deliveries = deliveries.filter(assigned_rider=member)

        delivery_status = request.query_params.get("status")

        if delivery_status:
            deliveries = deliveries.filter(status=delivery_status.upper())

        serializer = DeliveryListSerializer(deliveries, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.team_member.role != TeamMember.Role.RETAILER:
            return Response(
                {"detail": "Only retailers can create deliveries."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = DeliveryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            delivery = create_delivery(
                retailer=request.team_member,
                validated_data=serializer.validated_data,
            )
        except DjangoValidationError as error:
            raise convert_validation_error(error)

        return Response(
            DeliveryDetailSerializer(delivery).data,
            status=status.HTTP_201_CREATED,
        )


class DeliveryDetailView(APIView):
    permission_classes = [HasSelectedMember]

    def get(self, request, delivery_id):
        delivery = get_object_or_404(
            Delivery.objects.select_related(
                "retailer",
                "assigned_rider",
            ).prefetch_related(
                "events",
                "events__actor",
            ),
            id=delivery_id,
        )

        member = request.team_member

        if (
            member.role == TeamMember.Role.RETAILER
            and delivery.retailer_id != member.id
        ):
            return Response(
                {"detail": "You cannot view this delivery."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if (
            member.role == TeamMember.Role.RIDER
            and delivery.assigned_rider_id != member.id
        ):
            return Response(
                {"detail": "You cannot view this delivery."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(DeliveryDetailSerializer(delivery).data)


class AssignRiderView(APIView):
    permission_classes = [IsDispatcher]

    def post(self, request, delivery_id):
        serializer = AssignRiderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            delivery = assign_rider(
                delivery_id=delivery_id,
                rider=serializer.validated_data["rider"],
                dispatcher=request.team_member,
            )
        except Delivery.DoesNotExist:
            return Response(
                {"detail": "Delivery not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except DjangoValidationError as error:
            raise convert_validation_error(error)

        return Response(DeliveryDetailSerializer(delivery).data)


class PickUpDeliveryView(APIView):
    permission_classes = [IsRider]

    def post(self, request, delivery_id):
        try:
            delivery = mark_picked_up(
                delivery_id=delivery_id,
                rider=request.team_member,
            )
        except Delivery.DoesNotExist:
            return Response(
                {"detail": "Delivery not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except DjangoValidationError as error:
            raise convert_validation_error(error)

        return Response(DeliveryDetailSerializer(delivery).data)


class FailDeliveryView(APIView):
    permission_classes = [IsRider]

    def post(self, request, delivery_id):
        serializer = FailedDeliverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            delivery = mark_failed(
                delivery_id=delivery_id,
                rider=request.team_member,
                **serializer.validated_data,
            )
        except Delivery.DoesNotExist:
            return Response(
                {"detail": "Delivery not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except DjangoValidationError as error:
            raise convert_validation_error(error)

        return Response(DeliveryDetailSerializer(delivery).data)


class CompleteDeliveryView(APIView):
    permission_classes = [IsRider]

    def post(self, request, delivery_id):
        serializer = DeliveryConfirmationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            delivery = mark_delivered(
                delivery_id=delivery_id,
                rider=request.team_member,
                confirmation_code=(
                    serializer.validated_data["confirmation_code"]
                ),
            )
        except Delivery.DoesNotExist:
            return Response(
                {"detail": "Delivery not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except DjangoValidationError as error:
            raise convert_validation_error(error)

        return Response(DeliveryDetailSerializer(delivery).data)


class RiderWorkloadView(APIView):
    permission_classes = [IsDispatcher]

    def get(self, request):
        active_statuses = [
            Delivery.Status.ASSIGNED,
            Delivery.Status.PICKED_UP,
        ]

        riders = TeamMember.objects.filter(
            role=TeamMember.Role.RIDER,
            is_active=True,
        ).annotate(
            active_deliveries=Count(
                "assigned_deliveries",
                filter=Q(
                    assigned_deliveries__status__in=active_statuses
                ),
            )
        )

        data = [
            {
                "id": rider.id,
                "name": rider.name,
                "active_deliveries": rider.active_deliveries,
            }
            for rider in riders
        ]

        return Response(data)


class TrackingView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, tracking_token):
        delivery = get_object_or_404(
            Delivery.objects.select_related(
                "assigned_rider",
            ).prefetch_related(
                "events",
                "events__actor",
            ),
            tracking_token=tracking_token,
        )

        return Response(TrackingSerializer(delivery).data)