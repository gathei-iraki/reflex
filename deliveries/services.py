from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from .models import Delivery, DeliveryEvent, TeamMember

#business-logic service

def validate_model(instance):
    instance.full_clean()
    instance.save()


@transaction.atomic
def create_delivery(*, retailer, validated_data):
    if retailer.role != TeamMember.Role.RETAILER:
        raise ValidationError("Only a retailer can create a delivery.")

    delivery = Delivery(
        retailer=retailer,
        status=Delivery.Status.NEW,
        **validated_data,
    )

    validate_model(delivery)

    DeliveryEvent.objects.create(
        delivery=delivery,
        actor=retailer,
        status=Delivery.Status.NEW,
        note="Delivery request created.",
    )

    return delivery


@transaction.atomic
def assign_rider(*, delivery_id, rider, dispatcher):
    delivery = Delivery.objects.select_for_update().get(id=delivery_id)

    if dispatcher.role != TeamMember.Role.DISPATCHER:
        raise ValidationError("Only a dispatcher can assign deliveries.")

    if rider.role != TeamMember.Role.RIDER or not rider.is_active:
        raise ValidationError("The selected team member is not an active rider.")

    if delivery.status != Delivery.Status.NEW:
        raise ValidationError(
            "Only a new delivery can be assigned to a rider."
        )

    if delivery.assigned_rider_id:
        raise ValidationError("This delivery already has a rider.")

    delivery.assigned_rider = rider
    delivery.status = Delivery.Status.ASSIGNED

    validate_model(delivery)

    DeliveryEvent.objects.create(
        delivery=delivery,
        actor=dispatcher,
        status=Delivery.Status.ASSIGNED,
        note=f"Delivery assigned to {rider.name}.",
    )

    return delivery


@transaction.atomic
def mark_picked_up(*, delivery_id, rider):
    delivery = Delivery.objects.select_for_update().get(id=delivery_id)

    ensure_assigned_rider(delivery, rider)

    if delivery.status != Delivery.Status.ASSIGNED:
        raise ValidationError(
            "Only an assigned delivery can be marked as picked up."
        )

    delivery.status = Delivery.Status.PICKED_UP

    validate_model(delivery)

    DeliveryEvent.objects.create(
        delivery=delivery,
        actor=rider,
        status=Delivery.Status.PICKED_UP,
        note="Delivery picked up by rider.",
    )

    return delivery


@transaction.atomic
def mark_failed(
    *,
    delivery_id,
    rider,
    failure_reason,
    failure_notes="",
):
    delivery = Delivery.objects.select_for_update().get(id=delivery_id)

    ensure_assigned_rider(delivery, rider)

    allowed_statuses = {
        Delivery.Status.ASSIGNED,
        Delivery.Status.PICKED_UP,
    }

    if delivery.status not in allowed_statuses:
        raise ValidationError(
            "Only an assigned or picked-up delivery can be marked as failed."
        )

    delivery.status = Delivery.Status.DELIVERY_FAILED
    delivery.failure_reason = failure_reason
    delivery.failure_notes = failure_notes

    validate_model(delivery)

    note = f"Delivery failed: {delivery.get_failure_reason_display()}."

    if failure_notes:
        note = f"{note} {failure_notes}"

    DeliveryEvent.objects.create(
        delivery=delivery,
        actor=rider,
        status=Delivery.Status.DELIVERY_FAILED,
        note=note,
    )

    return delivery


@transaction.atomic
def mark_delivered(*, delivery_id, rider, confirmation_code):
    delivery = Delivery.objects.select_for_update().get(id=delivery_id)

    ensure_assigned_rider(delivery, rider)

    if delivery.status != Delivery.Status.PICKED_UP:
        raise ValidationError(
            "The delivery must be picked up before it can be delivered."
        )

    delivery.status = Delivery.Status.DELIVERED
    delivery.confirmation_code = confirmation_code
    delivery.confirmed_at = timezone.now()
    delivery.failure_reason = ""
    delivery.failure_notes = ""

    validate_model(delivery)

    DeliveryEvent.objects.create(
        delivery=delivery,
        actor=rider,
        status=Delivery.Status.DELIVERED,
        note="Delivery completed with confirmation code.",
    )

    return delivery


def ensure_assigned_rider(delivery, rider):
    if rider.role != TeamMember.Role.RIDER:
        raise ValidationError("Only a rider can update delivery progress.")

    if delivery.assigned_rider_id != rider.id:
        raise ValidationError(
            "You cannot update a delivery assigned to another rider."
        )