from rest_framework.permissions import BasePermission


class HasRole(BasePermission):
    """
    Vista define allowed_roles = ["admin", ...].
    El rol "admin" siempre tiene acceso.
    """

    allowed_roles = []

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        allowed = getattr(view, "allowed_roles", self.allowed_roles)
        if not allowed:
            return False

        user_roles = set(user.roles.values_list("slug", flat=True))

        if "admin" in user_roles:
            return True

        return bool(user_roles.intersection(allowed))


class IsAdminOrRespAdmContable(HasRole):
    allowed_roles = ["resp_adm_contable"]


class IsAdminOrRespTI(HasRole):
    allowed_roles = ["resp_ti"]
