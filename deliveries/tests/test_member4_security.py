from django.test import TestCase
from django.core.exceptions import ValidationError
from django.urls import reverse

from deliveries.models import Delivery, TeamMember
from deliveries.services import (
    assign_rider,
    mark_delivered,
    mark_failed,
    mark_picked_up,
)


class Member4AccessControlTests(TestCase):

    def setUp(self):
        """Create the team members and delivery used by the tests."""

        self.retailer = TeamMember.objects.create(
            name="Test Retailer",
            role=TeamMember.Role.RETAILER,
        )

        self.dispatcher = TeamMember.objects.create(
            name="Test Dispatcher",
            role=TeamMember.Role.DISPATCHER,
        )

        self.rider_peter = TeamMember.objects.create(
            name="Peter",
            role=TeamMember.Role.RIDER,
        )

        self.rider_amina = TeamMember.objects.create(
            name="Amina",
            role=TeamMember.Role.RIDER,
        )

        self.delivery = Delivery.objects.create(
            retailer=self.retailer,
            customer_name="Test Customer",
            customer_phone="0700000000",
            delivery_address="Nairobi",
            item_description="Test Package",
            status=Delivery.Status.NEW,
        )

    def test_retailer_cannot_assign_rider(self):
        """A retailer must not be able to perform dispatcher actions."""

        with self.assertRaises(ValidationError):
            assign_rider(
                delivery_id=self.delivery.id,
                rider=self.rider_peter,
                dispatcher=self.retailer,
            )

    def test_dispatcher_can_assign_rider(self):
        """A dispatcher should be able to assign an active rider."""

        delivery = assign_rider(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        self.assertEqual(
            delivery.assigned_rider,
            self.rider_peter,
        )

        self.assertEqual(
            delivery.status,
            Delivery.Status.ASSIGNED,
        )

    def test_wrong_rider_cannot_pick_up_delivery(self):
        """A rider must not update another rider's delivery."""

        assign_rider(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        with self.assertRaises(ValidationError):
            mark_picked_up(
                delivery_id=self.delivery.id,
                rider=self.rider_amina,
            )

    def test_assigned_rider_can_pick_up_delivery(self):
        """The assigned rider should be able to update their delivery."""

        assign_rider(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        delivery = mark_picked_up(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
        )

        self.assertEqual(
            delivery.status,
            Delivery.Status.PICKED_UP,
        )

    def test_assignment_creates_audit_event(self):
        """Assigning a rider should create an accountability event."""

        assign_rider(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        self.assertEqual(
            self.delivery.events.count(),
            1,
        )

        event = self.delivery.events.first()

        self.assertEqual(
            event.actor,
            self.dispatcher,
        )

        self.assertEqual(
            event.status,
            Delivery.Status.ASSIGNED,
        )

    def test_failed_delivery_requires_reason(self):
        """A failed delivery must include a failure reason."""

        assign_rider(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )


        with self.assertRaises(ValidationError):
            mark_failed(
                delivery_id=self.delivery.id,
                rider=self.rider_peter,
                failure_reason="",
            )
    def test_failed_delivery_records_reason_and_audit_event(self):
        """A valid failed delivery should record the reason and actor."""

        assign_rider(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        delivery = mark_failed(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            failure_reason=Delivery.FailureReason.CUSTOMER_UNAVAILABLE,
            failure_notes="Customer did not answer the phone.",
        )

        self.assertEqual(
            delivery.status,
            Delivery.Status.DELIVERY_FAILED,
        )

        self.assertEqual(
            delivery.failure_reason,
            Delivery.FailureReason.CUSTOMER_UNAVAILABLE,
        )

        event = delivery.events.last()

        self.assertEqual(
            event.actor,
            self.rider_peter,
        )

        self.assertEqual(
            event.status,
            Delivery.Status.DELIVERY_FAILED,
        )
    def test_delivered_delivery_records_proof_and_audit_event(self):
        """A completed delivery should record proof and accountability details."""

        assign_rider(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        mark_picked_up(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
        )

        delivery = mark_delivered(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            confirmation_code="4821",
        )

        self.assertEqual(
            delivery.status,
            Delivery.Status.DELIVERED,
        )

        self.assertEqual(
            delivery.confirmation_code,
            "4821",
        )

        self.assertIsNotNone(
            delivery.confirmed_at,
        )

        event = delivery.events.last()

        self.assertEqual(
            event.actor,
            self.rider_peter,
        )

        self.assertEqual(
            event.status,
            Delivery.Status.DELIVERED,
        )
    def test_delivery_cannot_be_completed_before_pickup(self):
        """A delivery must be picked up before it can be completed."""

        assign_rider(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        with self.assertRaises(ValidationError):
            mark_delivered(
                delivery_id=self.delivery.id,
                rider=self.rider_peter,
                confirmation_code="4821",
            )
    def test_delivery_cannot_be_assigned_twice(self):
        """An already assigned delivery must not be assigned to another rider."""

        assign_rider(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        with self.assertRaises(ValidationError):
            assign_rider(
                delivery_id=self.delivery.id,
                rider=self.rider_amina,
                dispatcher=self.dispatcher,
            )
    def test_inactive_rider_cannot_be_assigned(self):
        """A dispatcher must not assign a delivery to an inactive rider."""

        inactive_rider = TeamMember.objects.create(
            name="Inactive Rider",
            role=TeamMember.Role.RIDER,
            is_active=False,
        )

        with self.assertRaises(ValidationError):
            assign_rider(
                delivery_id=self.delivery.id,
                rider=inactive_rider,
                dispatcher=self.dispatcher,
            )
    def test_retailer_gets_403_when_using_assignment_endpoint(self):
        """A retailer should be forbidden from using the dispatcher assignment API."""

        session = self.client.session
        session["team_member_id"] = self.retailer.id
        session.save()

        url = reverse(
            "deliveries:assign-rider",
            kwargs={"delivery_id": self.delivery.id},
        )

        response = self.client.post(
            url,
            {
                "rider_id": self.rider_peter.id,
            },
        )

        self.assertEqual(
            response.status_code,
            403,
        )
    def test_rider_cannot_view_another_riders_delivery(self):
        """A rider should receive 403 when viewing another rider's delivery."""

        assign_rider(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        # Log in to the demo session as Amina, not Peter.
        session = self.client.session
        session["team_member_id"] = self.rider_amina.id
        session.save()

        url = reverse(
            "deliveries:delivery-detail",
            kwargs={"delivery_id": self.delivery.id},
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            403,
        )
    def test_assigned_rider_can_view_their_delivery(self):
        """The assigned rider should be able to view their own delivery."""

        assign_rider(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        session = self.client.session
        session["team_member_id"] = self.rider_peter.id
        session.save()

        url = reverse(
            "deliveries:delivery-detail",
            kwargs={"delivery_id": self.delivery.id},
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            200,
        )
    def test_wrong_rider_cannot_pick_up_delivery_via_api(self):
        """A rider should not update another rider's delivery through the API."""

        assign_rider(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        # Amina becomes the selected session member.
        session = self.client.session
        session["team_member_id"] = self.rider_amina.id
        session.save()

        url = reverse(
            "deliveries:pick-up-delivery",
            kwargs={"delivery_id": self.delivery.id},
        )

        response = self.client.post(url)

        self.assertEqual(
            response.status_code,
            400,
        )

        # Confirm the unauthorized attempt did NOT change the delivery.
        self.delivery.refresh_from_db()

        self.assertEqual(
            self.delivery.status,
            Delivery.Status.ASSIGNED,
        )

        self.assertEqual(
            self.delivery.assigned_rider,
            self.rider_peter,
        )
    def test_assigned_rider_can_pick_up_delivery_via_api(self):
        """The assigned rider should be able to pick up their delivery through the API."""

        assign_rider(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        session = self.client.session
        session["team_member_id"] = self.rider_peter.id
        session.save()

        url = reverse(
            "deliveries:pick-up-delivery",
            kwargs={"delivery_id": self.delivery.id},
        )

        response = self.client.post(url)

        self.assertEqual(
            response.status_code,
            200,
        )

        self.delivery.refresh_from_db()

        self.assertEqual(
            self.delivery.status,
            Delivery.Status.PICKED_UP,
        )
    def test_successful_delivery_creates_full_audit_timeline(self):
        """A completed delivery should keep a full ordered audit trail."""

        delivery = Delivery.objects.create(
            retailer=self.retailer,
            customer_name="Timeline Customer",
            customer_phone="0711111111",
            delivery_address="Nairobi",
            item_description="Timeline Package",
            status=Delivery.Status.NEW,
        )

        from deliveries.models import DeliveryEvent

        DeliveryEvent.objects.create(
            delivery=delivery,
            actor=self.retailer,
            status=Delivery.Status.NEW,
            note="Delivery request created.",
        )

        assign_rider(
            delivery_id=delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        mark_picked_up(
            delivery_id=delivery.id,
            rider=self.rider_peter,
        )

        mark_delivered(
            delivery_id=delivery.id,
            rider=self.rider_peter,
            confirmation_code="4821",
        )

        statuses = list(
            delivery.events.values_list("status", flat=True)
        )

        self.assertEqual(
            statuses,
            [
                Delivery.Status.NEW,
                Delivery.Status.ASSIGNED,
                Delivery.Status.PICKED_UP,
                Delivery.Status.DELIVERED,
            ],
        )
    def test_failed_delivery_creates_full_audit_timeline(self):
        """A failed delivery should keep a full ordered audit trail."""

        delivery = Delivery.objects.create(
            retailer=self.retailer,
            customer_name="Failed Timeline Customer",
            customer_phone="0722222222",
            delivery_address="Nairobi",
            item_description="Failed Timeline Package",
            status=Delivery.Status.NEW,
        )

        from deliveries.models import DeliveryEvent

        DeliveryEvent.objects.create(
            delivery=delivery,
            actor=self.retailer,
            status=Delivery.Status.NEW,
            note="Delivery request created.",
        )

        assign_rider(
            delivery_id=delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        mark_failed(
            delivery_id=delivery.id,
            rider=self.rider_peter,
            failure_reason=Delivery.FailureReason.CUSTOMER_UNAVAILABLE,
            failure_notes="Customer was not available.",
        )

        statuses = list(
            delivery.events.values_list("status", flat=True)
        )

        self.assertEqual(
            statuses,
            [
                Delivery.Status.NEW,
                Delivery.Status.ASSIGNED,
                Delivery.Status.DELIVERY_FAILED,
            ],
        )
    def test_other_failure_reason_requires_notes(self):
        """The OTHER failure reason must include explanatory notes."""

        assign_rider(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        with self.assertRaises(ValidationError):
            mark_failed(
                delivery_id=self.delivery.id,
                rider=self.rider_peter,
                failure_reason=Delivery.FailureReason.OTHER,
                failure_notes="",
            )
    def test_other_failure_reason_accepts_notes(self):
        """OTHER should be accepted when explanatory notes are provided."""

        assign_rider(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            dispatcher=self.dispatcher,
        )

        delivery = mark_failed(
            delivery_id=self.delivery.id,
            rider=self.rider_peter,
            failure_reason=Delivery.FailureReason.OTHER,
            failure_notes="Customer requested delivery on another day.",
        )

        self.assertEqual(
            delivery.status,
            Delivery.Status.DELIVERY_FAILED,
        )

        self.assertEqual(
            delivery.failure_reason,
            Delivery.FailureReason.OTHER,
        )

        self.assertEqual(
            delivery.failure_notes,
            "Customer requested delivery on another day.",
        )