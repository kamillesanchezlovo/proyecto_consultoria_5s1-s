"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, saveAuth, clearAuth } from "../lib/apiClient";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const tokenData = await apiPost("/api/auth/token/", {
        username: form.username,
        password: form.password,
      });

      // tokenData = { access, refresh, user:{..., roles:[...] } }
      saveAuth({
        access: tokenData.access,
        refresh: tokenData.refresh,
        user: tokenData.user,
      });

      router.push("/");
    } catch (err) {
      console.error("Error login:", err);
      clearAuth();
      setError(err.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-quinario via-brand-tertiary to-brand-secondary">
      <div className="relative w-full max-w-md mx-4">
        <div className="absolute -top-32 -left-40 w-72 h-72 bg-brand-accent2/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-40 w-72 h-72 bg-brand-secondary/40 rounded-full blur-3xl" />

        <div className="relative bg-white/95 rounded-2xl shadow-2xl border border-brand-accent2/60 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-brand-secondary flex items-center justify-center text-2xl font-bold text-white">
              GT
            </div>
          </div>

          <h1 className="text-center text-xl font-semibold text-brand-tertiary mb-1">
            Iniciar sesión
          </h1>
          <p className="text-center text-xs text-slate-500 mb-6">
            Panel de administración KVC – GastroTech
          </p>

          {error && (
            <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1 text-sm">
              <label className="text-xs font-semibold text-slate-600">
                Usuario
              </label>
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="usuario o correo"
                className="px-3 py-2 rounded-md border border-brand-secondary/50 bg-white focus:outline-none focus:ring-2 focus:ring-brand-secondary/70 text-sm"
                required
              />
            </div>

            <div className="flex flex-col gap-1 text-sm">
              <label className="text-xs font-semibold text-slate-600">
                Contraseña
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="px-3 py-2 rounded-md border border-brand-secondary/50 bg-white focus:outline-none focus:ring-2 focus:ring-brand-secondary/70 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full py-2.5 rounded-md bg-brand-tertiary text-white text-sm font-semibold shadow-soft hover:bg-brand-quinario transition disabled:opacity-60"
            >
              {loading ? "Accediendo..." : "Acceder"}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] text-slate-400">
            ¿Olvidó contraseña? Contacte al administrador de GastroTech.
          </p>
        </div>
      </div>
    </div>
  );
}
