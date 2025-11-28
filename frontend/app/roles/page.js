"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import { apiGet, apiDelete, getStoredUser } from "../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

export default function RolesPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [roles, setRoles] = useState([]);
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

      const slugRoles = getRoleSlugs(user);
      const esAdmin = slugRoles.includes("admin");

      if (!esAdmin) {
        setError("No tiene permisos para gestionar roles.");
        setLoading(false);
        return;
      }

      try {
        const data = await apiGet("/api/roles/");
        setRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudieron cargar los roles.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleDelete(id) {
    const rol = roles.find((r) => r.id === id);
    const nombre = rol ? rol.nombre : id;

    if (!window.confirm(`¿Seguro que desea eliminar el rol "${nombre}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await apiDelete(`/api/roles/${id}/`);
      setRoles((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo eliminar el rol.");
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
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold text-brand-tertiary">
              Gestión de roles
            </h1>
            <p className="text-xs text-slate-500">
              Cree, edite y elimine los roles disponibles en KVC.
            </p>
          </div>

          <button
            onClick={() => router.push("/roles/nuevo")}
            className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium shadow-sm"
          >
            + Nuevo rol
          </button>
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
                <th className="text-left px-4 py-2">Nombre</th>
                <th className="text-left px-4 py-2">Slug</th>
                <th className="text-left px-4 py-2">Descripción</th>
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
                    Cargando roles...
                  </td>
                </tr>
              )}

              {!loading && roles.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No hay roles registrados.
                  </td>
                </tr>
              )}

              {!loading &&
                roles.map((rol) => (
                  <tr
                    key={rol.id}
                    className="border-t border-slate-50 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-2 text-slate-700">{rol.nombre}</td>
                    <td className="px-4 py-2 text-[11px] text-slate-500">
                      {rol.slug}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {rol.descripcion || (
                        <span className="text-slate-400">Sin descripción</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right space-x-1">
                      <button
                        onClick={() => router.push(`/roles/${rol.id}`)}
                        className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(rol.id)}
                        disabled={deletingId === rol.id}
                        className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingId === rol.id ? "Eliminando..." : "Eliminar"}
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
