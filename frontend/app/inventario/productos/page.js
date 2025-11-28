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

export default function ProductosPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [productos, setProductos] = useState([]);
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
        setError("No tiene permisos para gestionar productos de inventario.");
        setLoading(false);
        return;
      }

      try {
        const data = await apiGet("/api/productos/");
        setProductos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudieron cargar los productos.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleDelete(id) {
    const prod = productos.find((p) => p.id === id);
    const nombre = prod ? prod.nombre : id;

    if (!window.confirm(`¿Seguro que desea eliminar el producto "${nombre}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await apiDelete(`/api/productos/${id}/`);
      setProductos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo eliminar el producto.");
    } finally {
      setDeletingId(null);
    }
  }

  // Badge de estado según el nombre del tipo_estado
  function EstadoBadge({ estado }) {
    if (!estado) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-500">
          Sin estado
        </span>
      );
    }

    const nombre = (estado.nombre || "").toLowerCase();
    let classes =
      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-500";

    if (nombre.includes("activo")) {
      classes =
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700";
    } else if (nombre.includes("inactivo") || nombre.includes("baja")) {
      classes =
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-red-50 text-red-700";
    }

    return <span className={classes}>{estado.nombre}</span>;
  }

  if (!currentUser && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-sm text-slate-500">
        Cargando productos...
      </div>
    );
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-brand-tertiary">
              Inventario – productos
            </h1>
            <p className="text-xs text-slate-500">
              Administre el catálogo de productos que utiliza KVC para compras,
              bodegas y control de stock.
            </p>
          </div>

          {puedeGestionarInventario(currentUser) && (
            <button
              onClick={() => router.push("/inventario/productos/nuevo")}
              className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium shadow-sm"
            >
              + Nuevo producto
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
                <th className="text-left px-3 py-2 w-32">Código</th>
                <th className="text-left px-3 py-2">Producto</th>
                <th className="text-left px-3 py-2">Categoría</th>
                <th className="text-left px-3 py-2">Marca</th>
                <th className="text-right px-3 py-2 w-24">Stock</th>
                <th className="text-left px-3 py-2 w-32">Estado</th>
                <th className="text-right px-3 py-2 w-32">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Cargando productos...
                  </td>
                </tr>
              )}

              {!loading && productos.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No hay productos registrados.
                  </td>
                </tr>
              )}

              {!loading &&
                productos.map((prod) => (
                  <tr
                    key={prod.id}
                    className="border-t border-slate-50 hover:bg-slate-50/60"
                  >
                    <td className="px-3 py-2 text-slate-500">{prod.id}</td>
                    <td className="px-3 py-2 text-slate-700 font-medium">
                      {prod.codigo_producto || "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{prod.nombre}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {prod.categoria?.nombre || (
                        <span className="text-slate-400">Sin categoría</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {prod.marca?.nombre || (
                        <span className="text-slate-400">Sin marca</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {typeof prod.stock === "number" ? prod.stock : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <EstadoBadge estado={prod.tipo_estado} />
                    </td>
                    <td className="px-3 py-2 text-right space-x-1">
                      <button
                        onClick={() =>
                          router.push(`/inventario/productos/${prod.id}`)
                        }
                        className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id)}
                        disabled={deletingId === prod.id}
                        className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingId === prod.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
