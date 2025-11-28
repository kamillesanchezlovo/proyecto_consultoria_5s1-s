"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import MainLayout from "../../../components/MainLayout";
import { apiGet, apiPatch, getStoredUser } from "../../../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

function puedeGestionarInventario(user) {
  const slugs = getRoleSlugs(user);
  return slugs.includes("admin") || slugs.includes("resp_admin");
}

export default function EditarUnidadMedidaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").filter(Boolean).pop(); // último segmento de la URL

  const [currentUser, setCurrentUser] = useState(null);
  const [nombre, setNombre] = useState("");
  const [nomenclatura, setNomenclatura] = useState("");
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

      if (!puedeGestionarInventario(user)) {
        setError("No tiene permisos para editar unidades de medida.");
        setLoading(false);
        return;
      }

      if (!id) {
        setError("No se pudo determinar la unidad de medida.");
        setLoading(false);
        return;
      }

      try {
        const um = await apiGet(`/api/unidades-medida/${id}/`);
        setNombre(um.nombre || "");
        setNomenclatura(um.nomenclatura || "");
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudo cargar la unidad de medida.");
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

    if (!nombre.trim() || !nomenclatura.trim()) {
      setError("Nombre y nomenclatura son obligatorios.");
      return;
    }

    try {
      setGuardando(true);

      await apiPatch(`/api/unidades-medida/${id}/`, {
        nombre: nombre.trim(),
        nomenclatura: nomenclatura.trim(),
      });

      setMensajeOk("Unidad de medida actualizada correctamente.");
      setTimeout(() => {
        router.push("/inventario/unidades-medida");
      }, 700);
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo actualizar la unidad de medida.");
    } finally {
      setGuardando(false);
    }
  }

  if (!currentUser && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-sm text-slate-500">
        Cargando unidad de medida...
      </div>
    );
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-brand-tertiary">
            Editar unidad de medida
          </h1>
          <p className="text-xs text-slate-500">
            Actualice los datos de la unidad de medida seleccionada.
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
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Nombre de la unidad *
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
                Nomenclatura *
              </label>
              <input
                type="text"
                value={nomenclatura}
                onChange={(e) => setNomenclatura(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push("/inventario/unidades-medida")}
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
