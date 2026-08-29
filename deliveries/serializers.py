from rest_framework import serializers

from .models import Delivery, DeliveryEvent, TeamMember
#contains the json serializers for the deliveries app

class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = [
            "id",
            "name",
            "phone_number",
            "role",
            "is_active",
        ]


class DeliveryEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(
        source="actor.name",
        read_only=True,
        default=None,
    )

    class Meta:
        model = DeliveryEvent
        fields = [
            "id",
            "status",
            "actor",
            "actor_name",
            "note",
            "created_at",
        ]


class DeliveryListSerializer(serializers.ModelSerializer):
    retailer_name = serializers.CharField(
        source="retailer.name",
        read_only=True,
    )
    rider_name = serializers.CharField(
        source="assigned_rider.name",
        read_only=True,
        default=None,
    )

    class Meta:
        model = Delivery
        fields = [
            "id",
            "customer_name",
            "customer_phone",
            "delivery_address",
            "item_description",
            "status",
            "retailer",
            "retailer_name",
            "assigned_rider",
            "rider_name",
            "failure_reason",
            "failure_notes",
            "confirmed_at",
            "tracking_token",
            "created_at",
            "updated_at",
        ]


class DeliveryDetailSerializer(DeliveryListSerializer):
    events = DeliveryEventSerializer(many=True, read_only=True)

    class Meta(DeliveryListSerializer.Meta):
        fields = DeliveryListSerializer.Meta.fields + ["events"]


class DeliveryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = [
            "customer_name",
            "customer_phone",
            "delivery_address",
            "item_description",
        ]


class AssignRiderSerializer(serializers.Serializer):
    rider_id = serializers.PrimaryKeyRelatedField(
        source="rider",
        queryset=TeamMember.objects.filter(
            role=TeamMember.Role.RIDER,
            is_active=True,
        ),
    )


class FailedDeliverySerializer(serializers.Serializer):
    failure_reason = serializers.ChoiceField(
        choices=Delivery.FailureReason.choices
    )
    failure_notes = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    def validate(self, attrs):
        reason = attrs["failure_reason"]
        notes = attrs.get("failure_notes", "")

        if reason == Delivery.FailureReason.OTHER and not notes.strip():
            raise serializers.ValidationError(
                {
                    "failure_notes": (
                        "Provide details when the failure reason is Other."
                    )
                }
            )

        return attrs


class DeliveryConfirmationSerializer(serializers.Serializer):
    confirmation_code = serializers.CharField(
        max_length=20,
        trim_whitespace=True,
    )

    def validate_confirmation_code(self, value):
        if not value:
            raise serializers.ValidationError(
                "A confirmation code is required."
            )

        return value


class TrackingSerializer(serializers.ModelSerializer):
    rider_name = serializers.CharField(
        source="assigned_rider.name",
        read_only=True,
        default=None,
    )
    events = DeliveryEventSerializer(many=True, read_only=True)

    class Meta:
        model = Delivery
        fields = [
            "customer_name",
            "item_description",
            "delivery_address",
            "status",
            "rider_name",
            "failure_reason",
            "failure_notes",
            "confirmed_at",
            "created_at",
            "updated_at",
            "events",
        ]