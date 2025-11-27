from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsAdminOrRespAdmContable
from .models import Evento, Tarea, SubTarea, DocumentoROI
from .serializers import (
    EventoSerializer,
    TareaSerializer,
    TareaWriteSerializer,
    SubTareaSerializer,
    DocumentoROISerializer,
    DocumentoROIWriteSerializer,
    DocumentoROIClasificacionSerializer,
)


class EventoViewSet(viewsets.ModelViewSet):
    queryset = Evento.objects.all().order_by("-fecha_inicio")
    serializer_class = EventoSerializer
    permission_classes = [IsAdminOrRespAdmContable]


class TareaViewSet(viewsets.ModelViewSet):
    queryset = Tarea.objects.all().order_by("-fecha_inicio")
    permission_classes = [IsAdminOrRespAdmContable]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return TareaWriteSerializer
        return TareaSerializer


class SubTareaViewSet(viewsets.ModelViewSet):
    queryset = SubTarea.objects.all()
    serializer_class = SubTareaSerializer
    permission_classes = [IsAdminOrRespAdmContable]


class DocumentoROIViewSet(viewsets.ModelViewSet):
    """
    CRUD de documentos ROI.
    - Admin y Responsable adm-contable pueden crear/editar.
    - Clasificación de urgencia se hace manualmente desde el frontend o admin.
    - Endpoint `proximos` para ver los más cercanos por estados.
    """
    queryset = DocumentoROI.objects.all()
    permission_classes = [IsAdminOrRespAdmContable]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return DocumentoROIWriteSerializer
        return DocumentoROISerializer

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(creado_por=user)

    @action(detail=True, methods=["post"], url_path="clasificar")
    def clasificar(self, request, pk=None):
        """
        Clasificación MANUAL desde la UI.

        POST /api/documentos-roi/{id}/clasificar/
        Body:
        {
            "estado_urgencia": "...",
            "motivo_urgencia": "texto",
            "estado_proceso": "PENDIENTE" | "EN_ANALISIS" | "OFERTA_GENERADA" | "CERRADO"
        }
        """
        documento = self.get_object()
        serializer = DocumentoROIClasificacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        datos = serializer.validated_data

        documento.estado_urgencia = datos["estado_urgencia"]
        documento.origen_clasificacion = DocumentoROI.ORIGEN_MANUAL
        if "motivo_urgencia" in datos:
            documento.motivo_urgencia = datos["motivo_urgencia"]
        if "estado_proceso" in datos:
            documento.estado_proceso = datos["estado_proceso"]

        documento.save()
        return Response(
            DocumentoROISerializer(documento).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="proximos")
    def proximos(self, request):
        """
        Lista de ROI ordenados por fecha de evento (más cercanos primero),
        filtrados opcionalmente por estado_proceso.

        GET /api/documentos-roi/proximos/?estados=PENDIENTE,EN_ANALISIS
        """
        estados = request.query_params.get("estados")
        qs = self.get_queryset().exclude(fecha_evento__isnull=True)

        if estados:
            lista_estados = [e.strip() for e in estados.split(",") if e.strip()]
            qs = qs.filter(estado_proceso__in=lista_estados)

        qs = qs.order_by("fecha_evento")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
