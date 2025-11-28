"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../components/MainLayout";
import { apiGet, apiDelete, getStoredUser } from "../../lib/apiClient";

// Helpers de rol
function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

function puedeGestionarInventario(user) {
  const slugs = getRoleSlugs(user);
  return slugs.includes("admin") || slugs.includes("resp_admin");
}

export default function MovimientosPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [productosMap, setProductosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
        setError("No tiene permisos para gestionar movimientos de inventario.");
        setLoading(false);
        return;
      }

      try {
        // Traemos movimientos y productos para poder mostrar el nombre del producto
        const [movs, prods] = await Promise.all([
          apiGet("/api/movimientos/"),
          apiGet("/api/productos/"),
        ]);

        setMovimientos(Array.isArray(movs) ? movs : []);

        const map = {};
        if (Array.isArray(prods)) {
          prods.forEach((p) => {
            map[p.id] = p;
          });
        }
        setProductosMap(map);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudieron cargar los movimientos.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleDelete(id) {
    const mov = movimientos.find((m) => m.id === id);
    const ref = mov ? mov.referencia || `Movimiento #${id}` : id;

    if (
      !window.confirm(
        `¿Seguro que desea eliminar el movimiento "${ref}"?\nEsta acción no modifica el stock automáticamente.`
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      await apiDelete(`/api/movimientos/${id}/`);
      setMovimientos((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo eliminar el movimiento.");
    } finally {
      setDeletingId(null);
    }
  }

  function formatFecha(fechaStr) {
    if (!fechaStr) return "—";
    const d = new Date(fechaStr);
    if (Number.isNaN(d.getTime())) return fechaStr;
    return d.toLocaleString();
  }

  function TipoBadge({ tipo }) {
    const t = (tipo || "").toLowerCase();
    let classes =
      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600";

    if (t === "entrada") {
      classes =
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700";
    } else if (t === "salida") {
      classes =
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-red-50 text-red-700";
    }

    return <span className={classes}>{tipo}</span>;
  }

  if (!currentUser && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-sm text-slate-500">
        Cargando movimientos...
      </div>
    );
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-brand-tertiary">
              Movimientos de inventario
            </h1>
            <p className="text-xs text-slate-500">
              Registre entradas y salidas de productos para mantener el control
              de stock.
            </p>
          </div>

          {puedeGestionarInventario(currentUser) && (
            <button
              onClick={() => router.push("/inventario/movimientos/nuevo")}
              className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium shadow-sm"
            >
              + Nuevo movimiento
            </button>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[11px] text-slate-500">
                <th className="text-left px-3 py-2 w-16">ID</th>
                <th className="text-left px-3 py-2 w-40">Fecha</th>
                <th className="text-left px-3 py-2 w-24">Tipo</th>
                <th className="text-left px-3 py-2">Producto</th>
                <th className="text-right px-3 py-2 w-20">Cantidad</th>
                <th className="text-left px-3 py-2">Referencia</th>
                <th className="text-right px-3 py-2 w-32">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Cargando movimientos...
                  </td>
                </tr>
              )}

              {!loading && movimientos.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No hay movimientos registrados.
                  </td>
                </tr>
              )}

              {!loading &&
                movimientos.map((mov) => {
                  const prod = productosMap[mov.producto];
                  const nombreProd = prod ? prod.nombre : `ID ${mov.producto}`;

                  return (
                    <tr
                      key={mov.id}
                      className="border-t border-slate-50 hover:bg-slate-50/60"
                    >
                      <td className="px-3 py-2 text-slate-500">{mov.id}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {formatFecha(mov.fecha)}
                      </td>
                      <td className="px-3 py-2">
                        <TipoBadge tipo={mov.tipo} />
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {nombreProd}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">
                        {mov.cantidad}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {mov.referencia || (
                          <span className="text-slate-400">Sin referencia</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right space-x-1">
                        <button
                          onClick={() =>
                            router.push(`/inventario/movimientos/${mov.id}`)
                          }
                          className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(mov.id)}
                          disabled={deletingId === mov.id}
                          className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          {deletingId === mov.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
