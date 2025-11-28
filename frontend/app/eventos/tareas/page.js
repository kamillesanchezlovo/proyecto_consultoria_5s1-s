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

/** Cómo mostrar el nombre del responsable */
function getEmpleadoLabel(emp) {
  if (!emp) return "";
  if (emp.nombre_completo) return emp.nombre_completo;
  if (emp.nombres && emp.apellidos) return `${emp.nombres} ${emp.apellidos}`;
  if (emp.nombre && emp.apellido) return `${emp.nombre} ${emp.apellido}`;
  if (emp.first_name || emp.last_name)
    return `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
  if (emp.usuario && emp.usuario.username) return emp.usuario.username;
  return `Empleado #${emp.id}`;
}

export default function TareasPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [tareas, setTareas] = useState([]);
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
        setError("No tiene permisos para gestionar tareas de eventos.");
        setLoading(false);
        return;
      }

      try {
        const data = await apiGet("/api/tareas/");
        setTareas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudieron cargar las tareas.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleDelete(id) {
    const tarea = tareas.find((t) => t.id === id);
    const nombre = tarea ? tarea.nombre : id;

    if (!window.confirm(`¿Seguro que desea eliminar la tarea "${nombre}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await apiDelete(`/api/tareas/${id}/`);
      setTareas((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo eliminar la tarea.");
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
              Tareas de eventos
            </h1>
            <p className="text-xs text-slate-500">
              Administre las tareas asociadas a cada evento.
            </p>
          </div>

          {puedeGestionarEventos(currentUser) && (
            <button
              onClick={() => router.push("/eventos/tareas/nueva")}
              className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium shadow-sm"
            >
              + Nueva tarea
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
                <th className="text-left px-4 py-2 w-48">Evento</th>
                <th className="text-left px-4 py-2 w-64">Nombre</th>
                <th className="text-left px-4 py-2 w-48">Responsable</th>
                <th className="text-left px-4 py-2 w-24">Estado</th>
                <th className="text-right px-4 py-2 w-32">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Cargando tareas...
                  </td>
                </tr>
              )}

              {!loading && tareas.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No hay tareas registradas.
                  </td>
                </tr>
              )}

              {!loading &&
                tareas.map((t) => {
                  const eventoNombre =
                    t.evento?.nombre ||
                    (t.evento?.id ? `Evento #${t.evento.id}` : "Sin evento");
                  const responsableNombre = getEmpleadoLabel(t.responsable);
                  const estadoTexto = t.completada
                    ? "Completada"
                    : "Pendiente";

                  return (
                    <tr
                      key={t.id}
                      className="border-t border-slate-50 hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-2 text-slate-700">
                        {eventoNombre}
                      </td>
                      <td className="px-4 py-2 text-slate-700 font-medium">
                        {t.nombre}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {responsableNombre || (
                          <span className="text-slate-400">
                            Sin responsable
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] border ${
                            t.completada
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
                            router.push(`/eventos/tareas/${t.id}`)
                          }
                          className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={deletingId === t.id}
                          className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          {deletingId === t.id ? "Eliminando..." : "Eliminar"}
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
