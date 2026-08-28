# Generated for the initial Reflex schema.
import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name="TeamMember",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("phone_number", models.CharField(blank=True, max_length=30)),
                ("role", models.CharField(choices=[("RETAILER", "Retailer"), ("DISPATCHER", "Dispatcher"), ("RIDER", "Rider")], max_length=10)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Delivery",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("customer_name", models.CharField(max_length=120)),
                ("customer_phone", models.CharField(max_length=30)),
                ("delivery_address", models.TextField()),
                ("item_description", models.TextField()),
                ("status", models.CharField(choices=[("NEW", "New"), ("ASSIGNED", "Assigned"), ("PICKED_UP", "Picked up"), ("DELIVERED", "Delivered"), ("DELIVERY_FAILED", "Delivery failed")], default="NEW", max_length=20)),
                ("failure_reason", models.CharField(blank=True, choices=[("CUSTOMER_UNAVAILABLE", "Customer unavailable"), ("WRONG_ADDRESS", "Wrong address"), ("PHONE_UNREACHABLE", "Phone unreachable"), ("CUSTOMER_REFUSED", "Customer refused delivery"), ("OTHER", "Other")], max_length=30)),
                ("failure_notes", models.TextField(blank=True)),
                ("confirmation_code", models.CharField(blank=True, max_length=20)),
                ("confirmed_at", models.DateTimeField(blank=True, null=True)),
                ("tracking_token", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("assigned_rider", models.ForeignKey(blank=True, limit_choices_to={"role": "RIDER"}, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="assigned_deliveries", to="deliveries.teammember")),
                ("retailer", models.ForeignKey(limit_choices_to={"role": "RETAILER"}, on_delete=django.db.models.deletion.PROTECT, related_name="created_deliveries", to="deliveries.teammember")),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [models.Index(fields=["status", "created_at"], name="deliveries__status_a4e49b_idx"), models.Index(fields=["assigned_rider", "status"], name="deliveries__assigne_e3c6e2_idx")],
                "constraints": [models.CheckConstraint(condition=models.Q(("status", "NEW"), ("assigned_rider__isnull", False), _connector="OR"), name="non_new_delivery_has_rider"), models.CheckConstraint(condition=models.Q(("status", "DELIVERY_FAILED"), ("failure_reason", ""), _connector="OR"), name="failure_reason_only_on_failed_delivery")],
            },
        ),
        migrations.CreateModel(
            name="DeliveryEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("NEW", "New"), ("ASSIGNED", "Assigned"), ("PICKED_UP", "Picked up"), ("DELIVERED", "Delivered"), ("DELIVERY_FAILED", "Delivery failed")], max_length=20)),
                ("note", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="delivery_events", to="deliveries.teammember")),
                ("delivery", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="events", to="deliveries.delivery")),
            ],
            options={"ordering": ["created_at", "id"], "indexes": [models.Index(fields=["delivery", "created_at"], name="deliveries__deliver_6b4086_idx")]},
        ),
    ]
