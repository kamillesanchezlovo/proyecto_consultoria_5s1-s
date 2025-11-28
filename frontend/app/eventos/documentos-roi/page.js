"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../components/MainLayout";
import { apiGet, apiDelete, getStoredUser } from "../../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

function puedeGestionarROI(user) {
  const slugs = getRoleSlugs(user);
  return slugs.includes("admin") || slugs.includes("resp_admin");
}

export default function DocumentosROIPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [documentos, setDocumentos] = useState([]);
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

      if (!puedeGestionarROI(user)) {
        setError("No tiene permisos para gestionar documentos ROI.");
        setLoading(false);
        return;
      }

      try {
        const data = await apiGet("/api/documentos-roi/");
        setDocumentos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudieron cargar los documentos ROI.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleDelete(id) {
    const doc = documentos.find((d) => d.id === id);
    const nombre = doc ? `${doc.codigo || ""} - ${doc.titulo || ""}` : id;

    if (!window.confirm(`¿Seguro que desea eliminar el documento "${nombre}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await apiDelete(`/api/documentos-roi/${id}/`);
      setDocumentos((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo eliminar el documento.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!currentUser && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-sm text-slate-500">
        Cargando documentos ROI...
      </div>
    );
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-brand-tertiary">
              Documentos ROI
            </h1>
            <p className="text-xs text-slate-500">
              Administre los documentos ROI asociados a sus eventos o clientes.
            </p>
          </div>

          {puedeGestionarROI(currentUser) && (
            <button
              onClick={() => router.push("/eventos/documentos-roi/nuevo")}
              className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium shadow-sm"
            >
              + Nuevo documento
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
                <th className="text-left px-4 py-2 w-28">Código</th>
                <th className="text-left px-4 py-2 w-56">Título</th>
                <th className="text-left px-4 py-2 w-40">Cliente</th>
                <th className="text-left px-4 py-2 w-32">Fecha evento</th>
                <th className="text-left px-4 py-2 w-32">Estado proceso</th>
                <th className="text-right px-4 py-2 w-32">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    Cargando documentos...
                  </td>
                </tr>
              )}

              {!loading && documentos.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No hay documentos ROI registrados.
                  </td>
                </tr>
              )}

              {!loading &&
                documentos.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-t border-slate-50 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-2 text-slate-700 font-mono">
                      {doc.codigo || "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-700 font-medium">
                      {doc.titulo || "Sin título"}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {doc.cliente || "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {doc.fecha_evento || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border border-slate-200 text-slate-600 bg-slate-50">
                        {doc.estado_proceso || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right space-x-1">
                      <button
                        onClick={() =>
                          router.push(`/eventos/documentos-roi/${doc.id}`)
                        }
                        className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingId === doc.id ? "Eliminando..." : "Eliminar"}
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
