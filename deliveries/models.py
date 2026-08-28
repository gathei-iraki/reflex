import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


class TeamMember(models.Model):
    class Role(models.TextChoices):
        RETAILER = "RETAILER", "Retailer"
        DISPATCHER = "DISPATCHER", "Dispatcher"
        RIDER = "RIDER", "Rider"

    name = models.CharField(max_length=120)
    phone_number = models.CharField(max_length=30, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"


class Delivery(models.Model):
    class Status(models.TextChoices):
        NEW = "NEW", "New"
        ASSIGNED = "ASSIGNED", "Assigned"
        PICKED_UP = "PICKED_UP", "Picked up"
        DELIVERED = "DELIVERED", "Delivered"
        DELIVERY_FAILED = "DELIVERY_FAILED", "Delivery failed"

    class FailureReason(models.TextChoices):
        CUSTOMER_UNAVAILABLE = "CUSTOMER_UNAVAILABLE", "Customer unavailable"
        WRONG_ADDRESS = "WRONG_ADDRESS", "Wrong address"
        PHONE_UNREACHABLE = "PHONE_UNREACHABLE", "Phone unreachable"
        CUSTOMER_REFUSED = "CUSTOMER_REFUSED", "Customer refused delivery"
        OTHER = "OTHER", "Other"

    retailer = models.ForeignKey(
        TeamMember,
        on_delete=models.PROTECT,
        related_name="created_deliveries",
        limit_choices_to={"role": TeamMember.Role.RETAILER},
    )
    assigned_rider = models.ForeignKey(
        TeamMember,
        on_delete=models.PROTECT,
        related_name="assigned_deliveries",
        limit_choices_to={"role": TeamMember.Role.RIDER},
        null=True,
        blank=True,
    )
    customer_name = models.CharField(max_length=120)
    customer_phone = models.CharField(max_length=30)
    delivery_address = models.TextField()
    item_description = models.TextField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NEW
    )
    failure_reason = models.CharField(
        max_length=30, choices=FailureReason.choices, blank=True
    )
    failure_notes = models.TextField(blank=True)
    confirmation_code = models.CharField(max_length=20, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    tracking_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=Q(status="NEW") | Q(assigned_rider__isnull=False),
                name="non_new_delivery_has_rider",
            ),
            models.CheckConstraint(
                condition=Q(status="DELIVERY_FAILED") | Q(failure_reason=""),
                name="failure_reason_only_on_failed_delivery",
            ),
        ]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["assigned_rider", "status"]),
        ]

    def clean(self):
        errors = {}
        if self.retailer_id and self.retailer.role != TeamMember.Role.RETAILER:
            errors["retailer"] = "The delivery creator must be a retailer."
        if self.assigned_rider_id and self.assigned_rider.role != TeamMember.Role.RIDER:
            errors["assigned_rider"] = "The assignee must be a rider."
        if self.status != self.Status.NEW and not self.assigned_rider_id:
            errors["assigned_rider"] = "This status requires an assigned rider."
        if self.status == self.Status.DELIVERY_FAILED and not self.failure_reason:
            errors["failure_reason"] = "A failed delivery requires a reason."
        if self.failure_reason == self.FailureReason.OTHER and not self.failure_notes:
            errors["failure_notes"] = "Provide details for the other failure reason."
        if self.status == self.Status.DELIVERED and not self.confirmation_code:
            errors["confirmation_code"] = "Proof of delivery is required."
        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"Delivery #{self.pk or 'new'} for {self.customer_name}"


class DeliveryEvent(models.Model):
    delivery = models.ForeignKey(
        Delivery, on_delete=models.CASCADE, related_name="events"
    )
    status = models.CharField(max_length=20, choices=Delivery.Status.choices)
    actor = models.ForeignKey(
        TeamMember,
        on_delete=models.PROTECT,
        related_name="delivery_events",
        null=True,
        blank=True,
    )
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [models.Index(fields=["delivery", "created_at"])]

    def __str__(self):
        return f"{self.delivery} - {self.get_status_display()}"
