#session-based role permissions

from rest_framework.permissions import BasePermission

from .models import TeamMember


class HasSelectedMember(BasePermission):
    message = "Select a team member before performing this action."

    def has_permission(self, request, view):
        member_id = request.session.get("team_member_id")

        if not member_id:
            return False

        try:
            request.team_member = TeamMember.objects.get(
                id=member_id,
                is_active=True,
            )
        except TeamMember.DoesNotExist:
            request.session.pop("team_member_id", None)
            return False

        return True


class IsRetailer(HasSelectedMember):
    message = "Only retailers can perform this action."

    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.team_member.role == TeamMember.Role.RETAILER
        )


class IsDispatcher(HasSelectedMember):
    message = "Only dispatchers can perform this action."

    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.team_member.role == TeamMember.Role.DISPATCHER
        )


class IsRider(HasSelectedMember):
    message = "Only riders can perform this action."

    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.team_member.role == TeamMember.Role.RIDER
        )