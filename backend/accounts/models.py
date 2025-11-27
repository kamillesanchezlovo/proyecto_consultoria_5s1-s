from django.db import models
from django.contrib.auth.models import AbstractUser


class Rol(models.Model):
    """
    Roles del sistema:
    - admin
    - resp_adm_contable
    - resp_ti
    """
    nombre = models.CharField(max_length=80)
    slug = models.SlugField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True)

    def __str__(self):
        return self.nombre


class Permiso(models.Model):
    nombre = models.CharField(max_length=80)
    descripcion = models.TextField(blank=True)

    def __str__(self):
        return self.nombre


class Usuario(AbstractUser):
    email = models.EmailField(unique=True)

    roles = models.ManyToManyField(
        Rol,
        related_name="usuarios",
        blank=True,
    )
    permisos = models.ManyToManyField(
        Permiso,
        related_name="usuarios",
        blank=True,
    )

    def __str__(self):
        return self.username or self.email
