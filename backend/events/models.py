from django.db import models
from django.conf import settings
from people.models import Empleado


class Evento(models.Model):
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    lugar = models.CharField(max_length=200, blank=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre


class Tarea(models.Model):
    evento = models.ForeignKey(
        Evento,
        on_delete=models.CASCADE,
        related_name="tareas",
    )
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    responsable = models.ForeignKey(
        Empleado,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tareas",
    )
    completada = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.nombre} ({self.evento})"


class SubTarea(models.Model):
    tarea = models.ForeignKey(
        Tarea,
        on_delete=models.CASCADE,
        related_name="subtareas",
    )
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    completada = models.BooleanField(default=False)

    def __str__(self):
        return self.nombre


class DocumentoROI(models.Model):
    """
    Documento ROI que se clasifica manualmente por urgencia para priorizar ofertas.
    Admin y Responsable adm-contable pueden editar la clasificación.
    """

    URGENTE = "URGENTE"
    NO_URGENTE = "NO_URGENTE"
    EVENTO_CERCANO = "EVENTO_CERCANO"
    EVENTO_LEJANO = "EVENTO_LEJANO"

    URGENCIA_CHOICES = (
        (URGENTE, "Urgente"),
        (NO_URGENTE, "No urgente"),
        (EVENTO_CERCANO, "Evento cercano"),
        (EVENTO_LEJANO, "Evento lejano"),
    )

    ESTADO_PENDIENTE = "PENDIENTE"
    ESTADO_EN_ANALISIS = "EN_ANALISIS"
    ESTADO_OFERTA_GENERADA = "OFERTA_GENERADA"
    ESTADO_CERRADO = "CERRADO"

    ESTADO_CHOICES = (
        (ESTADO_PENDIENTE, "Pendiente"),
        (ESTADO_EN_ANALISIS, "En análisis"),
        (ESTADO_OFERTA_GENERADA, "Oferta generada"),
        (ESTADO_CERRADO, "Cerrado"),
    )

    ORIGEN_MANUAL = "MANUAL"
    ORIGEN_AUTOMATICO = "AUTOMATICO"
    ORIGEN_N8N = "N8N"  # lo dejamos por si en el futuro vuelves a integrar, pero no se usa

    ORIGEN_CHOICES = (
        (ORIGEN_MANUAL, "Manual"),
        (ORIGEN_AUTOMATICO, "Automático"),
        (ORIGEN_N8N, "Integración externa"),
    )

    codigo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Identificador interno del ROI (por ejemplo ROI-2025-001).",
    )
    titulo = models.CharField(max_length=200)
    cliente = models.CharField(max_length=200, blank=True)
    descripcion = models.TextField(blank=True)

    fecha_recepcion = models.DateTimeField(auto_now_add=True)
    fecha_evento = models.DateField(null=True, blank=True)
    fecha_limite_oferta = models.DateField(null=True, blank=True)

    estado_urgencia = models.CharField(
        max_length=20,
        choices=URGENCIA_CHOICES,
        default=NO_URGENTE,
    )
    estado_proceso = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default=ESTADO_PENDIENTE,
    )

    origen_clasificacion = models.CharField(
        max_length=20,
        choices=ORIGEN_CHOICES,
        default=ORIGEN_MANUAL,
    )
    motivo_urgencia = models.TextField(
        blank=True,
        help_text="Explicación de por qué se clasificó con este nivel de urgencia.",
    )

    archivo = models.FileField(
        upload_to="roi/",
        null=True,
        blank=True,
        help_text="Archivo del ROI (PDF, DOCX, etc.).",
    )

    enlace_documento = models.URLField(
        blank=True,
        help_text="URL al ROI (Drive, KVC, etc.).",
    )

    evento_relacionado = models.ForeignKey(
        Evento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documentos_roi",
    )

    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documentos_roi_creados",
    )

    class Meta:
        ordering = ["fecha_evento", "-fecha_recepcion"]

    def __str__(self):
        return f"{self.codigo} - {self.titulo}"
