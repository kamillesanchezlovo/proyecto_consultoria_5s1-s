from rest_framework import serializers
from .models import (
    Marca,
    Categoria,
    UnidadMedida,
    TipoEstado,
    Producto,
    MovimientoInventario,
)


class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = "__all__"


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = "__all__"


class UnidadMedidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnidadMedida
        fields = "__all__"


class TipoEstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoEstado
        fields = "__all__"


class ProductoSerializer(serializers.ModelSerializer):
    marca = MarcaSerializer(read_only=True)
    categoria = CategoriaSerializer(read_only=True)
    unidad_medida = UnidadMedidaSerializer(read_only=True)
    tipo_estado = TipoEstadoSerializer(read_only=True)

    class Meta:
        model = Producto
        fields = "__all__"


class ProductoWriteSerializer(serializers.ModelSerializer):
    marca_id = serializers.PrimaryKeyRelatedField(
        queryset=Marca.objects.all(),
        source="marca",
        allow_null=True,
        required=False,
    )
    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        source="categoria",
        allow_null=True,
        required=False,
    )
    unidad_medida_id = serializers.PrimaryKeyRelatedField(
        queryset=UnidadMedida.objects.all(),
        source="unidad_medida",
        required=True,
    )
    tipo_estado_id = serializers.PrimaryKeyRelatedField(
        queryset=TipoEstado.objects.all(),
        source="tipo_estado",
        required=True,
    )

    class Meta:
        model = Producto
        fields = [
            "id",
            "codigo_producto",
            "nombre",
            "stock_minimo_inicial",
            "stock",
            "unidad_medida_id",
            "tipo_estado_id",
            "marca_id",
            "categoria_id",
        ]


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoInventario
        fields = "__all__"
