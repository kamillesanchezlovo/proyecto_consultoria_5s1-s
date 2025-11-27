from rest_framework import serializers
from .models import Evento, Tarea, SubTarea, DocumentoROI
from people.models import Empleado


class EmpleadoLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empleado
        fields = ["id", "nombres", "apellidos"]


class SubTareaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubTarea
        fields = "__all__"


class TareaSerializer(serializers.ModelSerializer):
    responsable = EmpleadoLiteSerializer(read_only=True)
    subtareas = SubTareaSerializer(many=True, read_only=True)

    class Meta:
        model = Tarea
        fields = "__all__"


class TareaWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tarea
        fields = "__all__"


class EventoSerializer(serializers.ModelSerializer):
    tareas = TareaSerializer(many=True, read_only=True)

    class Meta:
        model = Evento
        fields = "__all__"


class DocumentoROISerializer(serializers.ModelSerializer):
    evento_relacionado = EventoSerializer(read_only=True)

    class Meta:
        model = DocumentoROI
        fields = "__all__"


class DocumentoROIWriteSerializer(serializers.ModelSerializer):
    """
    Para crear/editar ROI desde la UI (archivo o enlace, al menos uno).
    """

    class Meta:
        model = DocumentoROI
        fields = "__all__"
        read_only_fields = ["fecha_recepcion", "creado_por"]

    def validate(self, attrs):
        archivo = attrs.get("archivo") or getattr(self.instance, "archivo", None)
        enlace = attrs.get("enlace_documento") or getattr(
            self.instance, "enlace_documento", ""
        )

        if not archivo and not enlace:
            raise serializers.ValidationError(
                "Debe proporcionar un archivo o un enlace del documento."
            )
        return attrs


class DocumentoROIClasificacionSerializer(serializers.Serializer):
    """
    Para actualizar urgencia/estado desde el frontend (clasificación manual).
    """

    estado_urgencia = serializers.ChoiceField(
        choices=DocumentoROI.URGENCIA_CHOICES
    )
    motivo_urgencia = serializers.CharField(
        required=False,
        allow_blank=True,
    )
    estado_proceso = serializers.ChoiceField(
        choices=DocumentoROI.ESTADO_CHOICES,
        required=False,
    )
