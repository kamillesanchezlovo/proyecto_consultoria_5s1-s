"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import MainLayout from "../../../components/MainLayout";
import { apiGet, apiPatch, getStoredUser } from "../../../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

function puedeGestionarEventos(user) {
  const slugs = getRoleSlugs(user);
  return slugs.includes("admin") || slugs.includes("resp_ti");
}

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

function splitDateTime(dt) {
  if (!dt) return { date: "", time: "" };
  const [datePart, timePartRaw] = dt.split("T");
  const timePart = (timePartRaw || "").replace("Z", "").slice(0, 5);
  return { date: datePart, time: timePart };
}

function combinarFechaHora(fecha, hora) {
  if (!fecha && !hora) return null;
  if (!fecha && hora) {
    const hoy = new Date().toISOString().slice(0, 10);
    return `${hoy}T${hora}:00`;
  }
  if (fecha && !hora) {
    return `${fecha}T00:00:00`;
  }
  return `${fecha}T${hora}:00`;
}

export default function EditarTareaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").filter(Boolean).pop();

  const [currentUser, setCurrentUser] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  const [eventoId, setEventoId] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [responsableId, setResponsableId] = useState("");
  const [completada, setCompletada] = useState(false);

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

      if (!puedeGestionarEventos(user)) {
        setError("No tiene permisos para editar tareas.");
        setLoading(false);
        return;
      }

      if (!id) {
        setError("No se pudo determinar la tarea.");
        setLoading(false);
        return;
      }

      try {
        const [eventosData, empleadosData, tareaData] = await Promise.all([
          apiGet("/api/eventos/"),
          apiGet("/api/empleados/"),
          apiGet(`/api/tareas/${id}/`),
        ]);

        setEventos(Array.isArray(eventosData) ? eventosData : []);
        setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);

        // Cargar datos de la tarea
        setNombre(tareaData.nombre || "");
        setDescripcion(tareaData.descripcion || "");
        setCompletada(!!tareaData.completada);

        if (tareaData.evento) {
          setEventoId(String(tareaData.evento.id));
        }

        if (tareaData.responsable) {
          setResponsableId(String(tareaData.responsable.id));
        }

        const fi = splitDateTime(tareaData.fecha_inicio);
        setFechaInicio(fi.date);
        setHoraInicio(fi.time);

        const ff = splitDateTime(tareaData.fecha_fin);
        setFechaFin(ff.date);
        setHoraFin(ff.time);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudo cargar la tarea.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router, id, pathname]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMensajeOk(null);

    if (!eventoId) {
      setError("Debe seleccionar un evento.");
      return;
    }

    if (!nombre.trim()) {
      setError("El nombre de la tarea es obligatorio.");
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        evento: Number(eventoId),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        fecha_inicio: combinarFechaHora(fechaInicio, horaInicio),
        fecha_fin: combinarFechaHora(fechaFin, horaFin),
        responsable: responsableId ? Number(responsableId) : null,
        completada,
      };

      await apiPatch(`/api/tareas/${id}/`, payload);

      setMensajeOk("Tarea actualizada correctamente.");
      setTimeout(() => {
        router.push("/eventos/tareas");
      }, 700);
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo actualizar la tarea.");
    } finally {
      setGuardando(false);
    }
  }

  if (!currentUser && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-sm text-slate-500">
        Cargando tarea...
      </div>
    );
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-brand-tertiary">
            Editar tarea
          </h1>
          <p className="text-xs text-slate-500">
            Actualice los datos de la tarea seleccionada.
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
            {/* Evento */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Evento *
              </label>
              <select
                value={eventoId}
                onChange={(e) => setEventoId(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none bg-white focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
              >
                <option value="">Seleccione un evento</option>
                {eventos.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Nombre */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Nombre de la tarea *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none bg-white focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={4}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none bg-white focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary resize-y"
              />
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-slate-600">
                  Fecha y hora de inicio
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none bg-white focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
                  />
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-28 border border-slate-200 rounded-md px-2 py-1.5 text-xs outline-none bg-white focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-medium text-slate-600">
                  Fecha y hora de fin
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none bg-white focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
                  />
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-28 border border-slate-200 rounded-md px-2 py-1.5 text-xs outline-none bg-white focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
                  />
                </div>
              </div>
            </div>

            {/* Responsable */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Responsable
              </label>
              <select
                value={responsableId}
                onChange={(e) => setResponsableId(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none bg-white focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
              >
                <option value="">Sin responsable asignado</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmpleadoLabel(emp)}
                  </option>
                ))}
              </select>
            </div>

            {/* Completada */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="completada"
                type="checkbox"
                checked={completada}
                onChange={(e) => setCompletada(e.target.checked)}
                className="h-3 w-3 rounded border-slate-300 text-brand-secondary focus:ring-brand-secondary"
              />
              <label
                htmlFor="completada"
                className="text-[11px] text-slate-600"
              >
                Tarea completada
              </label>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => router.push("/eventos/tareas")}
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
