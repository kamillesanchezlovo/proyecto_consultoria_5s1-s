"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import MainLayout from "../../../components/MainLayout";
import { apiGet, apiPatch, getStoredUser } from "../../../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

function puedeGestionarInventario(user) {
  const slugs = getRoleSlugs(user);
  return slugs.includes("admin") || slugs.includes("resp_admin");
}

export default function EditarMovimientoPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").filter(Boolean).pop();

  const [currentUser, setCurrentUser] = useState(null);
  const [productos, setProductos] = useState([]);

  const [productoId, setProductoId] = useState("");
  const [tipo, setTipo] = useState("entrada");
  const [cantidad, setCantidad] = useState("");
  const [referencia, setReferencia] = useState("");

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeOk, setMensajeOk] = useState(null);

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
        setError("No tiene permisos para editar movimientos.");
        setLoading(false);
        return;
      }

      if (!id) {
        setError("No se pudo determinar el movimiento.");
        setLoading(false);
        return;
      }

      try {
        const [prods, mov] = await Promise.all([
          apiGet("/api/productos/"),
          apiGet(`/api/movimientos/${id}/`),
        ]);

        setProductos(Array.isArray(prods) ? prods : []);

        setProductoId(mov.producto || "");
        setTipo(mov.tipo || "entrada");
        setCantidad(
          typeof mov.cantidad === "number" ? String(mov.cantidad) : ""
        );
        setReferencia(mov.referencia || "");
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudo cargar el movimiento.");
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

    if (!productoId) {
      setError("Debe seleccionar un producto.");
      return;
    }
    const cantNum = Number(cantidad);
    if (!Number.isFinite(cantNum) || cantNum <= 0) {
      setError("La cantidad debe ser un número mayor que 0.");
      return;
    }

    try {
      setGuardando(true);

      await apiPatch(`/api/movimientos/${id}/`, {
        producto: Number(productoId),
        tipo,
        cantidad: cantNum,
        referencia: referencia.trim() || "",
      });

      setMensajeOk("Movimiento actualizado correctamente.");
      setTimeout(() => {
        router.push("/inventario/movimientos");
      }, 700);
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo actualizar el movimiento.");
    } finally {
      setGuardando(false);
    }
  }

  if (!currentUser && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-sm text-slate-500">
        Cargando movimiento...
      </div>
    );
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-brand-tertiary">
            Editar movimiento
          </h1>
          <p className="text-xs text-slate-500">
            Actualice los datos del movimiento seleccionado.
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
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Producto *
              </label>
              <select
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none bg-white focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
              >
                <option value="">Seleccione un producto</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo_producto ? `${p.codigo_producto} - ` : ""}
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Tipo de movimiento *
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none bg-white focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
                >
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Cantidad *
                </label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Referencia / comentario
              </label>
              <textarea
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push("/inventario/movimientos")}
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
