from rest_framework import viewsets
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Usuario, Rol, Permiso
from .serializers import (
    CustomTokenObtainPairSerializer,
    UsuarioSerializer,
    UsuarioWriteSerializer,
    RolSerializer,
    PermisoSerializer,
)
from .permissions import IsAdminOrRespTI
from rest_framework.permissions import IsAdminUser


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    Gestión de usuarios - sólo Admin y Responsable de TI.
    """
    queryset = Usuario.objects.all().order_by("username")
    permission_classes = [IsAdminOrRespTI]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return UsuarioWriteSerializer
        return UsuarioSerializer


class RolViewSet(viewsets.ModelViewSet):
    """
    Gestión de roles - sólo Admin.
    """
    queryset = Rol.objects.all().order_by("nombre")
    serializer_class = RolSerializer
    permission_classes = [IsAdminUser]


class PermisoViewSet(viewsets.ModelViewSet):
    """
    Gestión de permisos - sólo Admin.
    """
    queryset = Permiso.objects.all().order_by("nombre")
    serializer_class = PermisoSerializer
    permission_classes = [IsAdminUser]
