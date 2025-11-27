from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

from accounts.views import (
    CustomTokenObtainPairView,
    UsuarioViewSet,
    RolViewSet,
    PermisoViewSet,
)
from people.views import CargoViewSet, EmpleadoViewSet
from inventory.views import (
    MarcaViewSet,
    CategoriaViewSet,
    UnidadMedidaViewSet,
    TipoEstadoViewSet,
    ProductoViewSet,
    MovimientoInventarioViewSet,
)
from events.views import (
    EventoViewSet,
    TareaViewSet,
    SubTareaViewSet,
    DocumentoROIViewSet,
)

router = DefaultRouter()

# Accounts / usuarios
router.register(r"usuarios", UsuarioViewSet, basename="usuario")
router.register(r"roles", RolViewSet, basename="rol")
router.register(r"permisos", PermisoViewSet, basename="permiso")

# People
router.register(r"cargos", CargoViewSet, basename="cargo")
router.register(r"empleados", EmpleadoViewSet, basename="empleado")

# Inventory
router.register(r"marcas", MarcaViewSet, basename="marca")
router.register(r"categorias", CategoriaViewSet, basename="categoria")
router.register(r"unidades-medida", UnidadMedidaViewSet, basename="unidad-medida")
router.register(r"tipos-estado", TipoEstadoViewSet, basename="tipo-estado")
router.register(r"productos", ProductoViewSet, basename="producto")
router.register(r"movimientos", MovimientoInventarioViewSet, basename="movimiento")

# Events + ROI
router.register(r"eventos", EventoViewSet, basename="evento")
router.register(r"tareas", TareaViewSet, basename="tarea")
router.register(r"subtareas", SubTareaViewSet, basename="subtarea")
router.register(r"documentos-roi", DocumentoROIViewSet, basename="documento-roi")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path(
        "api/auth/token/",
        CustomTokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
