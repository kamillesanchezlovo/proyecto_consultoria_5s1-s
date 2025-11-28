"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import { apiGet, apiDelete, getStoredUser } from "../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

function puedeGestionarEmpleados(user) {
  const slugs = getRoleSlugs(user);
  return slugs.includes("admin") || slugs.includes("resp_ti");
}

export default function EmpleadosPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [empleados, setEmpleados] = useState([]);
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

      if (!puedeGestionarEmpleados(user)) {
        setError("No tiene permisos para gestionar empleados.");
        setLoading(false);
        return;
      }

      try {
        const data = await apiGet("/api/empleados/");
        setEmpleados(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudieron cargar los empleados.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleDelete(id) {
    const emp = empleados.find((e) => e.id === id);
    const nombre = emp ? `${emp.nombres} ${emp.apellidos}` : id;

    if (!window.confirm(`¿Seguro que desea eliminar al empleado "${nombre}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await apiDelete(`/api/empleados/${id}/`);
      setEmpleados((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo eliminar el empleado.");
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
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold text-brand-tertiary">
              Gestión de empleados
            </h1>
            <p className="text-xs text-slate-500">
              Registre y administre el personal que utiliza KVC.
            </p>
          </div>

        {puedeGestionarEmpleados(currentUser) && (
          <button
            onClick={() => router.push("/empleados/nuevo")}
            className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium shadow-sm"
          >
            + Nuevo empleado
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
                <th className="text-left px-4 py-2">Nombre</th>
                <th className="text-left px-4 py-2">Cargo</th>
                <th className="text-left px-4 py-2">Correo</th>
                <th className="text-left px-4 py-2">Teléfono</th>
                <th className="text-center px-4 py-2 w-24">Estado</th>
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
                    Cargando empleados...
                  </td>
                </tr>
              )}

              {!loading && empleados.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No hay empleados registrados.
                  </td>
                </tr>
              )}

              {!loading &&
                empleados.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-t border-slate-50 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-2 text-slate-700">
                      {emp.nombres} {emp.apellidos}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {emp.cargo?.nombre || (
                        <span className="text-slate-400">Sin cargo</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {emp.email || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {emp.telefono || (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium " +
                          (emp.activo
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-slate-50 text-slate-500 border border-slate-100")
                        }
                      >
                        {emp.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right space-x-1">
                      <button
                        onClick={() => router.push(`/empleados/${emp.id}`)}
                        className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        disabled={deletingId === emp.id}
                        className="inline-flex items-center text-[11px] px-2 py-1 rounded border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingId === emp.id ? "Eliminando..." : "Eliminar"}
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
