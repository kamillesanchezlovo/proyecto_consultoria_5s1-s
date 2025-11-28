"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import MainLayout from "../../../components/MainLayout";
import { apiGet, apiPatch, getStoredUser } from "../../../lib/apiClient";

// Helpers de roles
function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

function puedeGestionarInventario(user) {
  const slugs = getRoleSlugs(user);
  return slugs.includes("admin") || slugs.includes("resp_admin");
}

export default function EditarProductoPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").filter(Boolean).pop();

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeOk, setMensajeOk] = useState(null);

  // Catálogos
  const [marcas, setMarcas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [tiposEstado, setTiposEstado] = useState([]);

  // Campos del producto
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");
  const [stockActual, setStockActual] = useState("");
  const [unidadMedidaId, setUnidadMedidaId] = useState("");
  const [tipoEstadoId, setTipoEstadoId] = useState("");
  const [marcaId, setMarcaId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");

  useEffect(() => {
    async function init() {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.replace("/login");
        return;
      }

      const user = getStoredUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setCurrentUser(user);

      if (!puedeGestionarInventario(user)) {
        setError("No tiene permisos para editar productos de inventario.");
        setLoading(false);
        return;
      }

      if (!id) {
        setError("No se pudo determinar el producto a editar.");
        setLoading(false);
        return;
      }

      try {
        // Cargar catálogos en paralelo
        const [marcasData, categoriasData, unidadesData, tiposEstadoData] =
          await Promise.all([
            apiGet("/api/marcas/"),
            apiGet("/api/categorias/"),
            apiGet("/api/unidades-medida/"),
            apiGet("/api/tipos-estado/"),
          ]);

        setMarcas(Array.isArray(marcasData) ? marcasData : []);
        setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
        setUnidades(Array.isArray(unidadesData) ? unidadesData : []);
        setTiposEstado(Array.isArray(tiposEstadoData) ? tiposEstadoData : []);

        // Cargar producto
        const prod = await apiGet(`/api/productos/${id}/`);

        setCodigo(prod.codigo_producto || "");
        setNombre(prod.nombre || "");
        setStockMinimo(
          typeof prod.stock_minimo_inicial === "number"
            ? String(prod.stock_minimo_inicial)
            : ""
        );
        setStockActual(
          typeof prod.stock === "number" ? String(prod.stock) : ""
        );
        setUnidadMedidaId(prod.unidad_medida?.id ? String(prod.unidad_medida.id) : "");
        setTipoEstadoId(prod.tipo_estado?.id ? String(prod.tipo_estado.id) : "");
        setMarcaId(prod.marca?.id ? String(prod.marca.id) : "");
        setCategoriaId(prod.categoria?.id ? String(prod.categoria.id) : "");
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudo cargar el producto.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router, id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMensajeOk(null);

    if (!codigo.trim()) {
      setError("El código del producto es obligatorio.");
      return;
    }
    if (!nombre.trim()) {
      setError("El nombre del producto es obligatorio.");
      return;
    }
    if (!stockMinimo || isNaN(Number(stockMinimo))) {
      setError("El stock mínimo debe ser un número.");
      return;
    }
    if (!stockActual || isNaN(Number(stockActual))) {
      setError("El stock actual debe ser un número.");
      return;
    }
    if (!unidadMedidaId) {
      setError("Debe seleccionar una unidad de medida.");
      return;
    }
    if (!tipoEstadoId) {
      setError("Debe seleccionar un tipo de estado.");
      return;
    }

    // Payload que espera ProductoWriteSerializer
    const payload = {
      codigo_producto: codigo.trim(),
      nombre: nombre.trim(),
      stock_minimo_inicial: Number(stockMinimo),
      stock: Number(stockActual),
      unidad_medida_id: Number(unidadMedidaId),
      tipo_estado_id: Number(tipoEstadoId),
    };

    if (marcaId) {
      payload.marca_id = Number(marcaId);
    } else {
      payload.marca_id = null;
    }

    if (categoriaId) {
      payload.categoria_id = Number(categoriaId);
    } else {
      payload.categoria_id = null;
    }

    try {
      setGuardando(true);
      await apiPatch(`/api/productos/${id}/`, payload);
      setMensajeOk("Producto actualizado correctamente.");

      setTimeout(() => {
        router.push("/inventario/productos");
      }, 800);
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      setError(err.message || "No se pudo actualizar el producto.");
    } finally {
      setGuardando(false);
    }
  }

  if (!currentUser && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-sm text-slate-500">
        Cargando producto...
      </div>
    );
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-brand-tertiary">
            Editar producto
          </h1>
          <p className="text-xs text-slate-500">
            Actualice la información del producto seleccionado.
          </p>
        </div>

        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {mensajeOk && (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-md">
            {mensajeOk}
          </div>
        )}

        {!loading && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 space-y-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Código del producto *
                </label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Stock mínimo inicial *
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Stock actual *
                </label>
                <input
                  type="number"
                  value={stockActual}
                  onChange={(e) => setStockActual(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Unidad de medida *
                </label>
                <select
                  value={unidadMedidaId}
                  onChange={(e) => setUnidadMedidaId(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
                >
                  <option value="">Seleccione...</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.nomenclatura})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Tipo de estado *
                </label>
                <select
                  value={tipoEstadoId}
                  onChange={(e) => setTipoEstadoId(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
                >
                  <option value="">Seleccione...</option>
                  {tiposEstado.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Marca
                </label>
                <select
                  value={marcaId}
                  onChange={(e) => setMarcaId(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
                >
                  <option value="">Sin marca</option>
                  {marcas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Categoría
                </label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push("/inventario/productos")}
                className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </div>
    </MainLayout>
  );
}
