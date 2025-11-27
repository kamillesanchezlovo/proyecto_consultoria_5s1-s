from rest_framework import viewsets
from accounts.permissions import IsAdminOrRespTI
from .models import Cargo, Empleado
from .serializers import CargoSerializer, EmpleadoSerializer, EmpleadoWriteSerializer


class CargoViewSet(viewsets.ModelViewSet):
    queryset = Cargo.objects.all().order_by("nombre")
    serializer_class = CargoSerializer
    permission_classes = [IsAdminOrRespTI]


class EmpleadoViewSet(viewsets.ModelViewSet):
    queryset = Empleado.objects.all().order_by("apellidos", "nombres")
    permission_classes = [IsAdminOrRespTI]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return EmpleadoWriteSerializer
        return EmpleadoSerializer
