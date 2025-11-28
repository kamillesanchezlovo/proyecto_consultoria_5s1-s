"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../components/MainLayout";
import { apiPost, getStoredUser } from "../../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

export default function NuevoRolPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
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

    const slugRoles = getRoleSlugs(user);
    const esAdmin = slugRoles.includes("admin");
    if (!esAdmin) {
      setError("No tiene permisos para crear roles.");
    }
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMensajeOk(null);

    if (!nombre.trim()) {
      setError("El nombre del rol es obligatorio.");
      return;
    }

    if (!slug.trim()) {
      setError("El slug del rol es obligatorio.");
      return;
    }

    try {
      setGuardando(true);

      await apiPost("/api/roles/", {
        nombre: nombre.trim(),
        slug: slug.trim(),
        descripcion: descripcion.trim() || "",
      });

      setMensajeOk("Rol creado correctamente.");
      setTimeout(() => {
        router.push("/roles");
      }, 800);
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo crear el rol.");
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
            Nuevo rol
          </h1>
          <p className="text-xs text-slate-500">
            Defina un nuevo rol para asignar permisos dentro de KVC.
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
              Nombre del rol *
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
              Slug *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ej: admin, resp_ti, resp_contable"
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
            />
            <p className="text-[10px] text-slate-400">
              Identificador interno del rol, en minúsculas y sin espacios.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push("/roles")}
              className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Crear rol"}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
