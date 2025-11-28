"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../../components/MainLayout";
import { apiPost, getStoredUser } from "../../../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

function puedeGestionarInventario(user) {
  const slugs = getRoleSlugs(user);
  return slugs.includes("admin") || slugs.includes("resp_admin");
}

export default function NuevaMarcaPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
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

    if (!puedeGestionarInventario(user)) {
      setError("No tiene permisos para crear marcas.");
    }
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMensajeOk(null);

    if (!nombre.trim()) {
      setError("El nombre de la marca es obligatorio.");
      return;
    }

    try {
      setGuardando(true);

      await apiPost("/api/marcas/", {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
      });

      setMensajeOk("Marca creada correctamente.");
      setTimeout(() => {
        router.push("/inventario/marcas");
      }, 700);
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo crear la marca.");
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
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-brand-tertiary">
            Nueva marca
          </h1>
          <p className="text-xs text-slate-500">
            Registre una nueva marca comercial.
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
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">
              Nombre de la marca *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
            />
          </div>

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

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push("/inventario/marcas")}
              className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Crear marca"}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
