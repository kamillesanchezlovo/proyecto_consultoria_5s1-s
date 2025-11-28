"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../components/MainLayout";
import { apiPost, getStoredUser } from "../../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

function puedeGestionarEventos(user) {
  const slugs = getRoleSlugs(user);
  // Ajusta "resp_admin" si tu slug real es otro (ej. "resp_adm_contable")
  return slugs.includes("admin") || slugs.includes("resp_admin");
}

// Combina fecha + hora en un string ISO que entienda DRF: "YYYY-MM-DDTHH:MM:SS"
function buildDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  const time = timeStr && timeStr.trim() !== "" ? timeStr : "00:00";
  // DRF suele aceptar "2025-11-26T10:30:00"
  return `${dateStr}T${time}:00`;
}

export default function NuevoEventoPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [fechaInicioFecha, setFechaInicioFecha] = useState("");
  const [fechaInicioHora, setFechaInicioHora] = useState("");

  const [fechaFinFecha, setFechaFinFecha] = useState("");
  const [fechaFinHora, setFechaFinHora] = useState("");

  const [lugar, setLugar] = useState("");
  const [activo, setActivo] = useState(true);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeOk, setMensajeOk] = useState(null);

  useEffect(() => {
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
      setError("No tiene permisos para crear eventos.");
    }
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMensajeOk(null);

    if (!nombre.trim()) {
      setError("El nombre del evento es obligatorio.");
      return;
    }

    if (!fechaInicioFecha) {
      setError("La fecha de inicio del evento es obligatoria.");
      return;
    }

    const fechaInicio = buildDateTime(fechaInicioFecha, fechaInicioHora);
    if (!fechaInicio) {
      setError("La fecha de inicio del evento es obligatoria.");
      return;
    }

    const fechaFin = buildDateTime(fechaFinFecha, fechaFinHora);

    try {
      setGuardando(true);

      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(), // puede ir vacío, DRF lo acepta si tiene blank=True
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin, // puede ir null si tu modelo tiene null=True, blank=True
        lugar: lugar.trim(),
        activo: activo,
      };

      await apiPost("/api/eventos/", payload);

      setMensajeOk("Evento creado correctamente.");
      setTimeout(() => {
        router.push("/eventos");
      }, 700);
    } catch (err) {
      console.error("Error al crear evento:", err);
      setError(err.message || "No se pudo crear el evento.");
    } finally {
      setGuardando(false);
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-sm text-slate-500">
        Cargando...
      </div>
    );
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-brand-tertiary">
            Nuevo evento
          </h1>
          <p className="text-xs text-slate-500">
            Registre un nuevo evento con sus fechas, lugar y estado.
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

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 space-y-4"
        >
          {/* Nombre */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">
              Nombre del evento *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
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
              rows={3}
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white resize-y"
            />
          </div>

          {/* Fecha inicio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Fecha inicio *
              </label>
              <input
                type="date"
                value={fechaInicioFecha}
                onChange={(e) => setFechaInicioFecha(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Hora inicio
              </label>
              <input
                type="time"
                value={fechaInicioHora}
                onChange={(e) => setFechaInicioHora(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
              />
            </div>
          </div>

          {/* Fecha fin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Fecha fin (opcional)
              </label>
              <input
                type="date"
                value={fechaFinFecha}
                onChange={(e) => setFechaFinFecha(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Hora fin (opcional)
              </label>
              <input
                type="time"
                value={fechaFinHora}
                onChange={(e) => setFechaFinHora(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
              />
            </div>
          </div>

          {/* Lugar */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">
              Lugar
            </label>
            <input
              type="text"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
            />
          </div>

          {/* Activo */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="activo"
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-3 w-3"
            />
            <label
              htmlFor="activo"
              className="text-[11px] text-slate-600 select-none"
            >
              Evento activo
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => router.push("/eventos")}
              className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Crear evento"}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
