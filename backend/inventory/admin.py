from django.contrib import admin
from .models import (
    Marca,
    Categoria,
    UnidadMedida,
    TipoEstado,
    Producto,
    MovimientoInventario,
)


admin.site.register(Marca)
admin.site.register(Categoria)
admin.site.register(UnidadMedida)
admin.site.register(TipoEstado)
admin.site.register(Producto)
admin.site.register(MovimientoInventario)
