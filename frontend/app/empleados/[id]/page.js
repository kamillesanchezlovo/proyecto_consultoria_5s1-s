"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import MainLayout from "../../components/MainLayout";
import { apiGet, apiPatch, getStoredUser } from "../../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

function puedeGestionarEmpleados(user) {
  const slugs = getRoleSlugs(user);
  return slugs.includes("admin") || slugs.includes("resp_ti");
}

export default function EditarEmpleadoPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").filter(Boolean).pop();

  const [currentUser, setCurrentUser] = useState(null);
  const [cargos, setCargos] = useState([]);

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cargoId, setCargoId] = useState("");
  const [activo, setActivo] = useState(true);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeOk, setMensajeOk] = useState(null);

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
        setError("No tiene permisos para editar empleados.");
        setLoading(false);
        return;
      }

      if (!id) {
        setError("No se pudo determinar el ID del empleado.");
        setLoading(false);
        return;
      }

      try {
        const [cargosData, emp] = await Promise.all([
          apiGet("/api/cargos/"),
          apiGet(`/api/empleados/${id}/`),
        ]);

        setCargos(Array.isArray(cargosData) ? cargosData : []);

        setNombres(emp.nombres || "");
        setApellidos(emp.apellidos || "");
        setEmail(emp.email || "");
        setTelefono(emp.telefono || "");
        setActivo(!!emp.activo);
        setCargoId(emp.cargo?.id || "");
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudo cargar el empleado.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router, id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMensajeOk(null);

    if (!nombres.trim() || !apellidos.trim()) {
      setError("Nombres y apellidos son obligatorios.");
      return;
    }

    try {
      setGuardando(true);

      await apiPatch(`/api/empleados/${id}/`, {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        activo,
        cargo: cargoId || null,
      });

      setMensajeOk("Empleado actualizado correctamente.");
      setTimeout(() => {
        router.push("/empleados");
      }, 800);
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo actualizar el empleado.");
    } finally {
      setGuardando(false);
    }
  }

  if (!currentUser && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-sm text-slate-500">
        Cargando empleado...
      </div>
    );
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-brand-tertiary">
            Editar empleado
          </h1>
          <p className="text-xs text-slate-500">
            Actualice los datos del colaborador.
          </p>
        </div>

        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {mensajeOk && (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-md">
            {mensajeOk}
          </div>
        )}

        {!loading && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 space-y-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Nombres *
                </label>
                <input
                  type="text"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Apellidos *
                </label>
                <input
                  type="text"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Cargo
                </label>
                <select
                  value={cargoId}
                  onChange={(e) => setCargoId(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
                >
                  <option value="">Seleccione un cargo</option>
                  {cargos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-medium text-slate-600">
                  Estado
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <input
                    id="activo"
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="w-3 h-3"
                  />
                  <label htmlFor="activo" className="text-slate-600">
                    Empleado activo
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push("/empleados")}
                className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </div>
    </MainLayout>
  );
}
