"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../../components/MainLayout";
import { apiGet, apiPost, getStoredUser } from "../../../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

function puedeGestionarROI(user) {
  const slugs = getRoleSlugs(user);
  return slugs.includes("admin") || slugs.includes("resp_admin");
}

export default function NuevoDocumentoROIPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);

  const [codigo, setCodigo] = useState("");
  const [titulo, setTitulo] = useState("");
  const [cliente, setCliente] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaEvento, setFechaEvento] = useState("");
  const [fechaLimiteOferta, setFechaLimiteOferta] = useState("");

  const [estadoSeguimiento, setEstadoSeguimiento] = useState("No se conoce");
  const [estadoProceso, setEstadoProceso] = useState("Pendiente");
  const [origenClasificacion, setOrigenClasificacion] = useState("Manual");
  const [motivoSuspendido, setMotivoSuspendido] = useState("");

  const [archivo, setArchivo] = useState(null); // por ahora no se envía
  const [enlaceDocumento, setEnlaceDocumento] = useState("");

  const [eventoId, setEventoId] = useState("");
  const [creadoPorId, setCreadoPorId] = useState("");

  const [eventos, setEventos] = useState([]);
  const [empleados, setEmpleados] = useState([]);

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

      if (!puedeGestionarROI(user)) {
        setError("No tiene permisos para crear documentos ROI.");
        return;
      }

      try {
        const [eventosData, empleadosData] = await Promise.all([
          apiGet("/api/eventos/"),
          apiGet("/api/empleados/"),
        ]);

        setEventos(Array.isArray(eventosData) ? eventosData : []);
        setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);

        // si quieres, podrías setear creadoPorId con el empleado ligado al usuario actual
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudieron cargar datos auxiliares.");
      }
    }

    init();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMensajeOk(null);

    if (!codigo.trim() || !titulo.trim()) {
      setError("El código y el título del documento son obligatorios.");
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        codigo: codigo.trim(),
        titulo: titulo.trim(),
        cliente: cliente.trim() || null,
        descripcion: descripcion.trim() || null,
        fecha_evento: fechaEvento || null,
        fecha_limite_oferta: fechaLimiteOferta || null,
        estado_seguimiento: estadoSeguimiento || null,
        estado_proceso: estadoProceso || null,
        origen_clasificacion: origenClasificacion || null,
        motivo_suspendido: motivoSuspendido.trim() || null,
        // archivo se deja como null; adaptar a FormData si tu API lo requiere
        archivo: null,
        enlace_documento: enlaceDocumento.trim() || null,
        evento_id: eventoId || null,
        creado_por_id: creadoPorId || null,
      };

      await apiPost("/api/documentos-roi/", payload);

      setMensajeOk("Documento ROI creado correctamente.");
      setTimeout(() => {
        router.push("/eventos/documentos-roi");
      }, 700);
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo crear el documento.");
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
            Nuevo documento ROI
          </h1>
          <p className="text-xs text-slate-500">
            Registre un nuevo documento ROI con la información relevante.
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
          {/* Código / Título */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Código *
              </label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Título *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
              />
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">
              Cliente
            </label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
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
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary resize-y"
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Fecha evento
              </label>
              <input
                type="date"
                value={fechaEvento}
                onChange={(e) => setFechaEvento(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Fecha límite oferta
              </label>
              <input
                type="date"
                value={fechaLimiteOferta}
                onChange={(e) => setFechaLimiteOferta(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
              />
            </div>
          </div>

          {/* Estados y origen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Estado seguimiento
              </label>
              <select
                value={estadoSeguimiento}
                onChange={(e) => setEstadoSeguimiento(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
              >
                <option>No se conoce</option>
                <option>En seguimiento</option>
                <option>Cerrado</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Estado proceso
              </label>
              <select
                value={estadoProceso}
                onChange={(e) => setEstadoProceso(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
              >
                <option>Pendiente</option>
                <option>En curso</option>
                <option>Finalizado</option>
                <option>Suspendido</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Origen clasificación
              </label>
              <select
                value={origenClasificacion}
                onChange={(e) => setOrigenClasificacion(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
              >
                <option>Manual</option>
                <option>Automático</option>
              </select>
            </div>
          </div>

          {/* Motivo suspendido */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">
              Motivo suspendido
            </label>
            <textarea
              value={motivoSuspendido}
              onChange={(e) => setMotivoSuspendido(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary resize-y"
            />
          </div>

          {/* Archivo + enlace */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">
              Archivo (PDF, DOCX, etc.)
            </label>
            <input
              type="file"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white"
            />
            <p className="text-[10px] text-slate-400">
              (Actualmente el archivo no se envía; adapta a FormData si tu API
              lo requiere.)
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">
              Enlace documento (URL)
            </label>
            <input
              type="url"
              value={enlaceDocumento}
              onChange={(e) => setEnlaceDocumento(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
            />
          </div>

          {/* Evento relacionado / Creado por */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Evento relacionado
              </label>
              <select
                value={eventoId}
                onChange={(e) => setEventoId(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
              >
                <option value="">— Ninguno —</option>
                {eventos.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nombre || ev.titulo || `Evento #${ev.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Creado por
              </label>
              <select
                value={creadoPorId}
                onChange={(e) => setCreadoPorId(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
              >
                <option value="">— Seleccionar —</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre_completo || emp.nombre || `Empleado #${emp.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push("/eventos/documentos-roi")}
              className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
