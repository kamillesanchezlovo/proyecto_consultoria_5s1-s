from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Rol, Permiso


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    model = Usuario
    list_display = ("username", "email", "is_active")
    list_filter = ("is_active", "roles")
    filter_horizontal = ("roles", "permisos")


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ("nombre", "slug")


@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    list_display = ("nombre",)
