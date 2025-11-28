"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import { apiGet, apiDelete, getStoredUser } from "../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

function puedeGestionarEventos(user) {
  const slugs = getRoleSlugs(user);
  // Ajusta los slugs según tu definición de roles
  return slugs.includes("admin") || slugs.includes("resp_admin");
}

export default function EventosPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [eventos, setEventos] = useState([]);
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
        setError("No tiene permisos para gestionar eventos.");
        setLoading(false);
        return;
      }

      try {
        const data = await apiGet("/api/eventos/");
        setEventos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudieron cargar los eventos.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleDelete(id) {
    const ev = eventos.find((e) => e.id === id);
    const nombre = ev ? ev.nombre || ev.titulo || `Evento #${id}` : id;

    if (!window.confirm(`¿Seguro que desea eliminar el evento "${nombre}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await apiDelete(`/api/eventos/${id}/`);
      setEventos((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo eliminar el evento.");
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
              Eventos
            </h1>
            <p className="text-xs text-slate-500">
              Administre los eventos registrados en KVC (talleres, actividades,
              etc.).
            </p>
          </div>

          {puedeGestionarEventos(currentUser) && (
            <button
              onClick={() => router.push("/eventos/nuevo")}
              className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium shadow-sm"
            >
              + Nuevo evento
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
                <th className="text-left px-4 py-2 w-64">Nombre</th>
                <th className="text-left px-4 py-2 w-40">Fecha</th>
                <th className="text-left px-4 py-2 w-32">Estado</th>
                <th className="text-left px-4 py-2">Descripción</th>
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
                    Cargando eventos...
                  </td>
                </tr>
              )}

              {!loading && eventos.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No hay eventos registrados.
                  </td>
                </tr>
              )}

              {!loading &&
                eventos.map((ev) => {
                  const nombre = ev.nombre || ev.titulo || `Evento #${ev.id}`;
                  const fecha =
                    ev.fecha_inicio ||
                    ev.fecha ||
                    ev.fecha_evento ||
                    "";
                  const estado = ev.estado || ev.status || "";

                  return (
                    <tr
                      key={ev.id}
                      className="border-t border-slate-50 hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-2 text-slate-700 font-medium">
                        {nombre}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {fecha || (
                          <span className="text-slate-400">Sin fecha</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {estado || (
                          <span className="text-slate-400">Sin estado</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {ev.descripcion || ev.detalle || (
                          <span className="text-slate-400">Sin descripción</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right space-x-1">
                        <button
                          onClick={() => router.push(`/eventos/${ev.id}`)}
                          className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          disabled={deletingId === ev.id}
                          className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          {deletingId === ev.id ? "Eliminando..." : "Eliminar"}
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
