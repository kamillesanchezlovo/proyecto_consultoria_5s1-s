"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/app/components/MainLayout";
import useCurrentUser from "@/hooks/useCurrentUser";
import { apiPost } from "@/lib/apiClient";

export default function NuevaCategoriaPage() {
  const router = useRouter();
  const { currentUser, loading } = useCurrentUser();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (loading) return <div>Cargando...</div>;
  if (!currentUser) return <div>No autenticado</div>;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await apiPost("/api/categorias/", {
        nombre,
        descripcion,
      });
      router.push("/inventario/categorias");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al crear la categoría");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-lg font-semibold text-brand-tertiary mb-4">
          Nueva categoría
        </h1>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-secondary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-secondary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push("/inventario/categorias")}
              className="px-3 py-2 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-2 text-xs rounded bg-brand-secondary text-white hover:bg-brand-secondary/90 disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar categoría"}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
