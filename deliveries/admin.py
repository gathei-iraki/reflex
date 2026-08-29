from django.contrib import admin

from .models import Delivery, DeliveryEvent, TeamMember


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "role",
        "phone_number",
        "is_active",
        "created_at",
    ]
    list_filter = ["role", "is_active"]
    search_fields = ["name", "phone_number"]


class DeliveryEventInline(admin.TabularInline):
    model = DeliveryEvent
    extra = 0
    readonly_fields = [
        "status",
        "actor",
        "note",
        "created_at",
    ]


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "customer_name",
        "status",
        "retailer",
        "assigned_rider",
        "created_at",
    ]
    list_filter = ["status", "failure_reason"]
    search_fields = [
        "customer_name",
        "customer_phone",
        "delivery_address",
        "item_description",
    ]
    readonly_fields = [
        "tracking_token",
        "created_at",
        "updated_at",
    ]
    inlines = [DeliveryEventInline]


@admin.register(DeliveryEvent)
class DeliveryEventAdmin(admin.ModelAdmin):
    list_display = [
        "delivery",
        "status",
        "actor",
        "created_at",
    ]
    list_filter = ["status"]
    readonly_fields = ["created_at"]