from django.urls import path

from .views import (
    AssignRiderView,
    CompleteDeliveryView,
    CurrentMemberView,
    DeliveryDetailView,
    DeliveryListCreateView,
    FailDeliveryView,
    PickUpDeliveryView,
    RiderWorkloadView,
    SelectMemberView,
    TeamMemberListView,
    TrackingView,
)


app_name = "deliveries"

urlpatterns = [
    path(
        "team-members/",
        TeamMemberListView.as_view(),
        name="team-member-list",
    ),
    path(
        "session/select-member/",
        SelectMemberView.as_view(),
        name="select-member",
    ),
    path(
        "session/current-member/",
        CurrentMemberView.as_view(),
        name="current-member",
    ),
    path(
        "deliveries/",
        DeliveryListCreateView.as_view(),
        name="delivery-list",
    ),
    path(
        "deliveries/<int:delivery_id>/",
        DeliveryDetailView.as_view(),
        name="delivery-detail",
    ),
    path(
        "deliveries/<int:delivery_id>/assign/",
        AssignRiderView.as_view(),
        name="assign-rider",
    ),
    path(
        "deliveries/<int:delivery_id>/pick-up/",
        PickUpDeliveryView.as_view(),
        name="pick-up-delivery",
    ),
    path(
        "deliveries/<int:delivery_id>/fail/",
        FailDeliveryView.as_view(),
        name="fail-delivery",
    ),
    path(
        "deliveries/<int:delivery_id>/complete/",
        CompleteDeliveryView.as_view(),
        name="complete-delivery",
    ),
    path(
        "riders/workload/",
        RiderWorkloadView.as_view(),
        name="rider-workload",
    ),
    path(
        "tracking/<uuid:tracking_token>/",
        TrackingView.as_view(),
        name="tracking",
    ),
]