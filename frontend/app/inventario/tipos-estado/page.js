"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../components/MainLayout";
import { apiGet, apiDelete, getStoredUser } from "../../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

function puedeGestionarInventario(user) {
  const slugs = getRoleSlugs(user);
  return slugs.includes("admin") || slugs.includes("resp_admin");
}

export default function TiposEstadoPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [tiposEstado, setTiposEstado] = useState([]);
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
        setError("No tiene permisos para gestionar tipos de estado.");
        setLoading(false);
        return;
      }

      try {
        const data = await apiGet("/api/tipos-estado/");
        setTiposEstado(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudieron cargar los tipos de estado.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleDelete(id) {
    const te = tiposEstado.find((t) => t.id === id);
    const nombre = te ? te.nombre : id;

    if (
      !window.confirm(
        `¿Seguro que desea eliminar el tipo de estado "${nombre}"?`
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      await apiDelete(`/api/tipos-estado/${id}/`);
      setTiposEstado((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo eliminar el tipo de estado.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!currentUser && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-sm text-slate-500">
        Cargando...
      </div>
    );
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-brand-tertiary">
              Tipos de estado
            </h1>
            <p className="text-xs text-slate-500">
              Define los distintos estados que pueden tener los productos en el
              inventario.
            </p>
          </div>

          {puedeGestionarInventario(currentUser) && (
            <button
              onClick={() => router.push("/inventario/tipos-estado/nuevo")}
              className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium shadow-sm"
            >
              + Nuevo tipo de estado
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
                <th className="text-left px-4 py-2 w-56">Nombre</th>
                <th className="text-left px-4 py-2">Descripción</th>
                <th className="text-right px-4 py-2 w-32">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Cargando tipos de estado...
                  </td>
                </tr>
              )}

              {!loading && tiposEstado.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No hay tipos de estado registrados.
                  </td>
                </tr>
              )}

              {!loading &&
                tiposEstado.map((te) => (
                  <tr
                    key={te.id}
                    className="border-t border-slate-50 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-2 text-slate-700 font-medium">
                      {te.nombre}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {te.descripcion || (
                        <span className="text-slate-400">Sin descripción</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right space-x-1">
                      <button
                        onClick={() =>
                          router.push(`/inventario/tipos-estado/${te.id}`)
                        }
                        className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(te.id)}
                        disabled={deletingId === te.id}
                        className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingId === te.id ? "Eliminando..." : "Eliminar"}
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
