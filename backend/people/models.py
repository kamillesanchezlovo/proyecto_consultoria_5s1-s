from django.db import models
from accounts.models import Usuario


class Cargo(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)

    def __str__(self):
        return self.nombre


class Empleado(models.Model):
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name="empleado",
        null=True,
        blank=True,
    )
    nombres = models.CharField(max_length=150)
    apellidos = models.CharField(max_length=150)
    cedula = models.CharField(max_length=50, blank=True)
    correo = models.EmailField(blank=True)
    telefono = models.CharField(max_length=50, blank=True)
    cargo = models.ForeignKey(
        Cargo,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="empleados",
    )
    fecha_ingreso = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"
