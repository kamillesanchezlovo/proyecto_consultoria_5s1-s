"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../../components/MainLayout";
import { apiGet, apiPost, getStoredUser } from "../../../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

function puedeGestionarEventos(user) {
  const slugs = getRoleSlugs(user);
  return slugs.includes("admin") || slugs.includes("resp_ti");
}

export default function NuevaSubTareaPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [tareas, setTareas] = useState([]);

  const [tareaId, setTareaId] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
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
        setError("No tiene permisos para crear subtareas.");
        setLoading(false);
        return;
      }

      try {
        const tareasData = await apiGet("/api/tareas/");
        setTareas(Array.isArray(tareasData) ? tareasData : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudieron cargar las tareas.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMensajeOk(null);

    if (!tareaId) {
      setError("Debe seleccionar una tarea.");
      return;
    }

    if (!nombre.trim()) {
      setError("El nombre de la subtarea es obligatorio.");
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        tarea: Number(tareaId),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        completada,
      };

      await apiPost("/api/subtareas/", payload);

      setMensajeOk("Subtarea creada correctamente.");
      setNombre("");
      setDescripcion("");
      setCompletada(false);
      // deja la tarea seleccionada
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo crear la subtarea.");
    } finally {
      setGuardando(false);
    }
  }

  if (!currentUser && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-sm text-slate-500">
        Cargando subtarea...
      </div>
    );
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-brand-tertiary">
            Nueva subtarea
          </h1>
          <p className="text-xs text-slate-500">
            Registre una subtarea asociada a una tarea de evento.
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
            {/* Tarea */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Tarea *
              </label>
              <select
                value={tareaId}
                onChange={(e) => setTareaId(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none bg-white focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary"
              >
                <option value="">Seleccione una tarea</option>
                {tareas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Nombre */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Nombre de la subtarea *
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
                Subtarea completada
              </label>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => router.push("/eventos/subtareas")}
                className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Guardar subtarea"}
              </button>
            </div>
          </form>
        )}
      </div>
    </MainLayout>
  );
}
