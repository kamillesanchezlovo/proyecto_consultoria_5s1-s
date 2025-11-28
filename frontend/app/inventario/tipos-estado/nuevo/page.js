"use client";

import { useState, useEffect } from "react";
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

export default function NuevaUnidadMedidaPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [nombre, setNombre] = useState("");
  const [nomenclatura, setNomenclatura] = useState("");
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  }, [router]);

  if (!currentUser && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-sm text-slate-500">
        Cargando...
      </div>
    );
  }

  if (!puedeGestionarInventario(currentUser)) {
    return (
      <MainLayout currentUser={currentUser}>
        <div className="p-6 text-sm text-red-600">
          No tiene permisos para crear unidades de medida.
        </div>
      </MainLayout>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await apiPost("/api/tipos-estado/", {
        nombre,
        nomenclatura,
      });
      router.push("/inventario/tipos-estado");
    } catch (err) {
      console.error(err);
      alert(err.message || "No se pudo crear la unidad de medida.");
    }
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <h1 className="text-lg font-semibold text-brand-tertiary">
          Nueva unidad de medida
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 space-y-3"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-secondary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Descripción *
            </label>
            <input
              type="text"
              value={nomenclatura}
              onChange={(e) => setNomenclatura(e.target.value)}
              required
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-secondary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push("/inventario/unidades-medida")}
              className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="text-xs px-4 py-1.5 rounded-md bg-brand-secondary hover:bg-brand-tertiary text-white font-medium"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
