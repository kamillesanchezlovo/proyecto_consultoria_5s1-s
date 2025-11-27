from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Usuario, Rol, Permiso


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ["id", "nombre", "slug", "descripcion"]


class PermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permiso
        fields = ["id", "nombre", "descripcion"]


class UsuarioSerializer(serializers.ModelSerializer):
    roles = RolSerializer(many=True, read_only=True)
    permisos = PermisoSerializer(many=True, read_only=True)

    class Meta:
        model = Usuario
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "roles",
            "permisos",
        ]


class UsuarioWriteSerializer(serializers.ModelSerializer):
    rol_ids = serializers.PrimaryKeyRelatedField(
        queryset=Rol.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source="roles",
    )

    class Meta:
        model = Usuario
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "password",
            "rol_ids",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def create(self, validated_data):
        roles = validated_data.pop("roles", [])
        password = validated_data.pop("password", None)
        user = Usuario(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        if roles:
            user.roles.set(roles)
        return user

    def update(self, instance, validated_data):
        roles = validated_data.pop("roles", None)
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        if roles is not None:
            instance.roles.set(roles)
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    JWT que incluye roles en el payload y en la respuesta.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["roles"] = list(user.roles.values_list("slug", flat=True))
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "roles": list(self.user.roles.values("id", "nombre", "slug")),
        }
        return data
