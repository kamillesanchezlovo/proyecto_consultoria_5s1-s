from django.contrib import admin
from .models import Cargo, Empleado


@admin.register(Cargo)
class CargoAdmin(admin.ModelAdmin):
    list_display = ("nombre",)


@admin.register(Empleado)
class EmpleadoAdmin(admin.ModelAdmin):
    list_display = ("nombres", "apellidos", "cargo", "activo")
    list_filter = ("activo", "cargo")
