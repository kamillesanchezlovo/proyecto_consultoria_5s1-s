"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../components/MainLayout";
import { apiGet, apiDelete, getStoredUser } from "../../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

function puedeGestionarEventos(user) {
  const slugs = getRoleSlugs(user);
  return slugs.includes("admin") || slugs.includes("resp_ti");
}

export default function SubTareasPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [subtareas, setSubtareas] = useState([]);
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

      if (!puedeGestionarEventos(user)) {
        setError("No tiene permisos para gestionar subtareas de eventos.");
        setLoading(false);
        return;
      }

      try {
        const data = await apiGet("/api/subtareas/");
        setSubtareas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudieron cargar las subtareas.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleDelete(id) {
    const st = subtareas.find((s) => s.id === id);
    const nombre = st ? st.nombre : id;

    if (!window.confirm(`¿Seguro que desea eliminar la subtarea "${nombre}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await apiDelete(`/api/subtareas/${id}/`);
      setSubtareas((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo eliminar la subtarea.");
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
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-brand-tertiary">
              Subtareas de eventos
            </h1>
            <p className="text-xs text-slate-500">
              Administre las subtareas asociadas a cada tarea de evento.
            </p>
          </div>

        {puedeGestionarEventos(currentUser) && (
          <button
            onClick={() => router.push("/eventos/subtareas/nueva")}
            className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium shadow-sm"
          >
            + Nueva subtarea
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
                <th className="text-left px-4 py-2 w-64">Tarea</th>
                <th className="text-left px-4 py-2 w-64">Nombre</th>
                <th className="text-left px-4 py-2 w-32">Estado</th>
                <th className="text-right px-4 py-2 w-32">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Cargando subtareas...
                  </td>
                </tr>
              )}

              {!loading && subtareas.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No hay subtareas registradas.
                  </td>
                </tr>
              )}

              {!loading &&
                subtareas.map((s) => {
                  const tareaNombre =
                    s.tarea?.nombre ||
                    (s.tarea?.id ? `Tarea #${s.tarea.id}` : "Sin tarea");
                  const estadoTexto = s.completada ? "Completada" : "Pendiente";

                  return (
                    <tr
                      key={s.id}
                      className="border-t border-slate-50 hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-2 text-slate-700">
                        {tareaNombre}
                      </td>
                      <td className="px-4 py-2 text-slate-700 font-medium">
                        {s.nombre}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] border ${
                            s.completada
                              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                              : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}
                        >
                          {estadoTexto}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right space-x-1">
                        <button
                          onClick={() =>
                            router.push(`/eventos/subtareas/${s.id}`)
                          }
                          className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          {deletingId === s.id ? "Eliminando..." : "Eliminar"}
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
