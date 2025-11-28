"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MainLayout from "../components/MainLayout";
import { apiGet, apiDelete, getStoredUser } from "../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

export default function UsuariosPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [accionEnProgreso, setAccionEnProgreso] = useState(false);

  // Carga inicial
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

      const roleSlugs = getRoleSlugs(user);
      const isAdmin = roleSlugs.includes("admin");
      const isRespTI = roleSlugs.includes("resp_ti");

      if (!isAdmin && !isRespTI) {
        setGlobalError("No tiene permisos para ver la gestión de usuarios.");
        setUsuarios([]);
        setLoading(false);
        return;
      }

      await cargarUsuarios();
    }

    init();
  }, [router]);

  async function cargarUsuarios() {
    setLoading(true);
    setGlobalError(null);
    try {
      const data = await apiGet("/api/usuarios/");
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      setGlobalError(
        err.message || "No se pudieron cargar los usuarios del sistema."
      );
    } finally {
      setLoading(false);
    }
  }

  async function manejarEliminar(usuario) {
    const confirma = window.confirm(
      `¿Seguro que desea eliminar al usuario "${usuario.username}"? Esta acción no se puede deshacer.`
    );
    if (!confirma) return;

    try {
      setAccionEnProgreso(true);
      setGlobalError(null);
      await apiDelete(`/api/usuarios/${usuario.id}/`);
      await cargarUsuarios();
    } catch (err) {
      console.error("Error eliminando usuario:", err);
      setGlobalError(err.message || "No se pudo eliminar el usuario.");
    } finally {
      setAccionEnProgreso(false);
    }
  }

  const usuariosFiltrados = usuarios.filter((u) => {
    if (!filtro) return true;
    const term = filtro.toLowerCase();
    return (
      u.username.toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      `${u.first_name || ""} ${u.last_name || ""}`
        .toLowerCase()
        .includes(term)
    );
  });

  if (!currentUser && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-sm text-slate-500">
        Cargando usuarios...
      </div>
    );
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 space-y-4">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-brand-tertiary">
              Gestión de usuarios
            </h1>
            <p className="text-xs text-slate-500">
              Administre las cuentas de acceso al sistema KVC.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por usuario, nombre o correo..."
              className="border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
            />
            <Link
              href="/usuarios/nuevo"
              className="text-xs bg-brand-secondary hover:bg-brand-tertiary text-white px-3 py-1.5 rounded-md font-medium transition"
            >
              Nuevo usuario
            </Link>
          </div>
        </div>

        {globalError && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
            {globalError}
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Usuarios ({usuariosFiltrados.length})
            </span>
            {accionEnProgreso && (
              <span className="text-[10px] text-slate-400">
                Procesando acción...
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-4 py-6 text-xs text-slate-500">
                Cargando usuarios...
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="px-4 py-6 text-xs text-slate-500">
                No se encontraron usuarios con el filtro aplicado.
              </div>
            ) : (
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="text-left px-4 py-2">Usuario</th>
                    <th className="text-left px-4 py-2">Nombre completo</th>
                    <th className="text-left px-4 py-2">Correo</th>
                    <th className="text-left px-4 py-2">Roles</th>
                    <th className="text-left px-4 py-2">Estado</th>
                    <th className="text-right px-4 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((u) => {
                    const nombreCompleto =
                      `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                      "—";
                    const rolesTexto =
                      (u.roles || [])
                        .map((r) => r.nombre || r.slug)
                        .join(", ") || "Sin rol";

                    return (
                      <tr
                        key={u.id}
                        className="border-b border-slate-50 hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-2 font-medium text-slate-700">
                          {u.username}
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {nombreCompleto}
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {u.email || "—"}
                        </td>
                        <td className="px-4 py-2 text-slate-600">
                          {rolesTexto}
                        </td>
                        <td className="px-4 py-2">
                          {u.is_active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-medium">
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-medium">
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right space-x-2">
                          <Link
                            href={`/usuarios/${u.id}`}
                            className="text-[11px] text-brand-secondary hover:text-brand-tertiary font-medium"
                          >
                            Editar
                          </Link>
                          <button
                            type="button"
                            onClick={() => manejarEliminar(u)}
                            className="text-[11px] text-rose-500 hover:text-rose-600 font-medium disabled:opacity-50"
                            disabled={accionEnProgreso}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
