from django.db import models, transaction
from django.db.models import F


class Marca(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)

    def __str__(self):
        return self.nombre


class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)

    def __str__(self):
        return self.nombre


class UnidadMedida(models.Model):
    nombre = models.CharField(max_length=50)
    nomenclatura = models.CharField(max_length=10)

    def __str__(self):
        return self.nomenclatura


class TipoEstado(models.Model):
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True)

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    codigo_producto = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=150)
    stock_minimo_inicial = models.PositiveIntegerField()
    stock = models.IntegerField()
    fecha_ingreso = models.DateTimeField(auto_now_add=True)

    unidad_medida = models.ForeignKey(
        UnidadMedida,
        on_delete=models.PROTECT,
        related_name="productos",
    )
    tipo_estado = models.ForeignKey(
        TipoEstado,
        on_delete=models.PROTECT,
        related_name="productos",
    )
    marca = models.ForeignKey(
        Marca,
        on_delete=models.PROTECT,
        related_name="productos",
        null=True,
        blank=True,
    )
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name="productos",
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.nombre


class MovimientoInventario(models.Model):
    TIPO_CHOICES = (
        ("entrada", "Entrada"),
        ("salida", "Salida"),
    )

    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        related_name="movimientos",
    )
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    cantidad = models.IntegerField()
    fecha = models.DateTimeField(auto_now_add=True)
    referencia = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.tipo} {self.cantidad} de {self.producto}"

    # --------- LÓGICA PARA ACTUALIZAR STOCK ---------

    def _aplicar_en_stock(self, prod, tipo, cantidad, signo=1):
        """
        Aplica el movimiento al stock de un producto.

        signo = 1  -> aplicar
        signo = -1 -> revertir
        """
        if tipo == "entrada":
            prod.stock = F("stock") + signo * cantidad
        else:  # salida
            prod.stock = F("stock") - signo * cantidad
        prod.save(update_fields=["stock"])
        # Traemos el valor real desde la BD por si usamos F()
        prod.refresh_from_db(fields=["stock"])

    @transaction.atomic
    def save(self, *args, **kwargs):
        """
        - Si es un movimiento nuevo: aplica su efecto al stock.
        - Si se está editando: revierte el movimiento anterior y aplica el nuevo.
        """
        # ¿Es una edición (ya existía)?
        if self.pk:
            # Bloqueamos el movimiento anterior para consistencia
            old = MovimientoInventario.objects.select_for_update().get(pk=self.pk)

            # Si cambiaron el producto, revertimos en el producto viejo
            # y aplicamos en el nuevo
            if old.producto_id != self.producto_id:
                # Revertir en producto viejo
                self._aplicar_en_stock(old.producto, old.tipo, old.cantidad, signo=-1)
            else:
                # Revertir en el mismo producto
                self._aplicar_en_stock(self.producto, old.tipo, old.cantidad, signo=-1)

        # Guardamos el movimiento (nuevo o editado)
        super().save(*args, **kwargs)

        # Aplicar el movimiento sobre el producto actual
        self._aplicar_en_stock(self.producto, self.tipo, self.cantidad, signo=1)

    @transaction.atomic
    def delete(self, *args, **kwargs):
        """
        Al eliminar un movimiento, se revierte su efecto en el stock.
        """
        # Revertimos su efecto
        self._aplicar_en_stock(self.producto, self.tipo, self.cantidad, signo=-1)
        # Luego borramos el registro
        super().delete(*args, **kwargs)
