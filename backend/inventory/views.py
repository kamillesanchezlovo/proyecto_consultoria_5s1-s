from rest_framework import viewsets
from accounts.permissions import IsAdminOrRespAdmContable
from .models import (
    Marca,
    Categoria,
    UnidadMedida,
    TipoEstado,
    Producto,
    MovimientoInventario,
)
from .serializers import (
    MarcaSerializer,
    CategoriaSerializer,
    UnidadMedidaSerializer,
    TipoEstadoSerializer,
    ProductoSerializer,
    ProductoWriteSerializer,
    MovimientoInventarioSerializer,
)


class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.all().order_by("nombre")
    serializer_class = MarcaSerializer
    permission_classes = [IsAdminOrRespAdmContable]


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all().order_by("nombre")
    serializer_class = CategoriaSerializer
    permission_classes = [IsAdminOrRespAdmContable]


class UnidadMedidaViewSet(viewsets.ModelViewSet):
    queryset = UnidadMedida.objects.all().order_by("nombre")
    serializer_class = UnidadMedidaSerializer
    permission_classes = [IsAdminOrRespAdmContable]


class TipoEstadoViewSet(viewsets.ModelViewSet):
    queryset = TipoEstado.objects.all().order_by("nombre")
    serializer_class = TipoEstadoSerializer
    permission_classes = [IsAdminOrRespAdmContable]


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by("nombre")
    permission_classes = [IsAdminOrRespAdmContable]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ProductoWriteSerializer
        return ProductoSerializer


class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all().order_by("-fecha")
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [IsAdminOrRespAdmContable]
