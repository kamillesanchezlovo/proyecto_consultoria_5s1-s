"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import MainLayout from "../../components/MainLayout";
import { apiGet, apiPatch, getStoredUser } from "../../lib/apiClient";

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

export default function EditarUsuarioPage() {
  const router = useRouter();
  const pathname = usePathname();

  // obtenemos el id de la última parte de la URL: /usuarios/[id]
  const id = pathname.split("/").filter(Boolean).pop();

  const [currentUser, setCurrentUser] = useState(null);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState("");
  const [rolesSeleccionados, setRolesSeleccionados] = useState([]);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [globalError, setGlobalError] = useState(null);
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

      const roleSlugs = getRoleSlugs(user);
      const isAdmin = roleSlugs.includes("admin");
      const isRespTI = roleSlugs.includes("resp_ti");

      if (!isAdmin && !isRespTI) {
        setGlobalError("No tiene permisos para editar usuarios.");
        setLoading(false);
        return;
      }

      if (!id) {
        setGlobalError("No se pudo determinar el ID del usuario.");
        setLoading(false);
        return;
      }

      try {
        const [roles, usuario] = await Promise.all([
          apiGet("/api/roles/"),
          apiGet(`/api/usuarios/${id}/`),
        ]);

        setRolesDisponibles(Array.isArray(roles) ? roles : []);

        setUsername(usuario.username || "");
        setEmail(usuario.email || "");
        setFirstName(usuario.first_name || "");
        setLastName(usuario.last_name || "");
        setIsActive(!!usuario.is_active);

        const rolesIds =
          (usuario.roles || []).map((r) => Number(r.id)) ?? [];
        setRolesSeleccionados(rolesIds);
      } catch (err) {
        console.error("Error cargando usuario:", err);
        setGlobalError(
          err.message || "No se pudo cargar la información del usuario."
        );
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router, id]);

  function manejarCambioRoles(e) {
    const options = Array.from(e.target.options);
    const seleccionados = options
      .filter((opt) => opt.selected)
      .map((opt) => Number(opt.value));
    setRolesSeleccionados(seleccionados);
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setGlobalError(null);
    setMensajeOk(null);

    if (!username.trim()) {
      setGlobalError("El nombre de usuario es obligatorio.");
      return;
    }

    const payload = {
      username: username.trim(),
      email: email.trim() || null,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      is_active: isActive,
      rol_ids: rolesSeleccionados,
    };

    // Contraseña opcional
    if (password.trim()) {
      payload.password = password;
    }

    try {
      setGuardando(true);
      await apiPatch(`/api/usuarios/${id}/`, payload);
      setMensajeOk("Usuario actualizado correctamente.");
      setTimeout(() => {
        router.push("/usuarios");
      }, 800);
    } catch (err) {
      console.error("Error actualizando usuario:", err);
      setGlobalError(err.message || "No se pudo actualizar el usuario.");
    } finally {
      setGuardando(false);
    }
  }

  if (!currentUser && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-sm text-slate-500">
        Cargando usuario...
      </div>
    );
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-brand-tertiary">
            Editar usuario
          </h1>
          <p className="text-xs text-slate-500">
            Modifique los datos del usuario y actualice sus roles.
          </p>
        </div>

        {globalError && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
            {globalError}
          </div>
        )}

        {mensajeOk && (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-md">
            {mensajeOk}
          </div>
        )}

        <form
          onSubmit={manejarSubmit}
          className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 space-y-4"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Usuario *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Nombres
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Apellidos
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
              />
            </div>
          </div>

          {/* Contraseña opcional */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Nueva contraseña (opcional)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Déjelo vacío para mantener la actual"
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Roles
              </label>
              <select
                multiple
                size={4}
                value={rolesSeleccionados.map(String)}
                onChange={manejarCambioRoles}
                className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-brand-secondary focus:border-brand-secondary bg-white"
              >
                {rolesDisponibles.map((rol) => (
                  <option key={rol.id} value={rol.id}>
                    {rol.nombre} ({rol.slug})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Mantenga presionada la tecla Ctrl / Cmd para seleccionar varios
                roles.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-medium text-slate-600">
                Estado
              </label>
              <div className="flex items-center gap-2 text-xs">
                <input
                  id="activo"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-3 h-3"
                />
                <label htmlFor="activo" className="text-slate-600">
                  Usuario activo
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push("/usuarios")}
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
      </div>
    </MainLayout>
  );
}
