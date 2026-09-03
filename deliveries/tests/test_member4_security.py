from django.test import TestCase
from django.core.exceptions import ValidationError

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