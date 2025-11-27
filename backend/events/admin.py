from django.contrib import admin
from .models import Evento, Tarea, SubTarea, DocumentoROI


@admin.register(Evento)
class EventoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "fecha_inicio", "fecha_fin", "lugar", "activo")
    list_filter = ("activo", "fecha_inicio")
    search_fields = ("nombre", "descripcion", "lugar")


@admin.register(Tarea)
class TareaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "evento", "responsable", "completada")
    list_filter = ("completada", "evento")
    search_fields = ("nombre", "descripcion")


@admin.register(SubTarea)
class SubTareaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "tarea", "completada")
    list_filter = ("completada", "tarea")
    search_fields = ("nombre", "descripcion")


@admin.register(DocumentoROI)
class DocumentoROIAdmin(admin.ModelAdmin):
    list_display = (
        "codigo",
        "titulo",
        "cliente",
        "estado_urgencia",
        "estado_proceso",
        "fecha_evento",
        "fecha_recepcion",
    )
    list_filter = ("estado_urgencia", "estado_proceso", "fecha_evento")
    search_fields = ("codigo", "titulo", "cliente", "descripcion")
