from rest_framework import serializers
from .models import Cargo, Empleado
from accounts.models import Usuario


class CargoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cargo
        fields = "__all__"


class EmpleadoSerializer(serializers.ModelSerializer):
    cargo = CargoSerializer(read_only=True)
    usuario = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.all(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Empleado
        fields = "__all__"


class EmpleadoWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empleado
        fields = "__all__"
