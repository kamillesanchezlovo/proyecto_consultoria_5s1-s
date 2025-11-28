"use client";

import React from "react";
import Link from "next/link";

export default function MainLayout({ currentUser, children }) {
  const primaryRole = currentUser?.roles?.[0] || null;

  const roleName = primaryRole?.nombre || "Sin rol asignado";
  const roleSlug = primaryRole?.slug || null;

  const fullName =
    `${currentUser?.first_name || ""} ${
      currentUser?.last_name || ""
    }`.trim() || currentUser?.username || "Usuario";

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-slate-800">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-56 bg-brand-tertiary text-white">
        <div className="h-16 flex items-center justify-center font-semibold tracking-wide text-sm border-b border-white/10">
          KVC
        </div>
        <nav className="flex-1 text-xs space-y-1 px-2 py-3 overflow-y-auto">
          <Link
            href="/"
            className="block px-3 py-2 rounded-md hover:bg-white/10 transition"
          >
            Dashboard
          </Link>

          {/* Gestión de usuarios */}
          {(roleSlug === "admin" || roleSlug === "resp_ti") && (
            <>
              <div className="mt-3 mb-1 px-3 text-[10px] uppercase tracking-wide text-white/50">
                Gestión de usuarios
              </div>
              <Link
                href="/usuarios"
                className="block px-3 py-2 rounded-md hover:bg-white/10 transition"
              >
                Usuarios
              </Link>
              {roleSlug === "admin" && (
                <Link
                  href="/roles"
                  className="block px-3 py-2 rounded-md hover:bg-white/10 transition"
                >
                  Roles
                </Link>
              )}
            </>
          )}

          {/* Personas */}
          {(roleSlug === "admin" ||
            roleSlug === "resp_ti" ||
            roleSlug === "resp_adm_contable") && (
            <>
              <div className="mt-3 mb-1 px-3 text-[10px] uppercase tracking-wide text-white/50">
                Personas
              </div>
              <Link
                href="/empleados"
                className="block px-3 py-2 rounded-md hover:bg-white/10 transition"
              >
                Empleados
              </Link>
              <Link
                href="/cargos"
                className="block px-3 py-2 rounded-md hover:bg-white/10 transition"
              >
                Cargos
              </Link>
            </>
          )}

          {/* Inventario & Eventos */}
          {(roleSlug === "admin" || roleSlug === "resp_adm_contable") && (
            <>
              <div className="mt-3 mb-1 px-3 text-[10px] uppercase tracking-wide text-white/50">
                Inventario & Eventos
              </div>

              {/* Inventario */}
              <Link
                href="/inventario/productos"
                className="block px-3 py-2 rounded-md hover:bg-white/10 transition"
              >
                Productos
              </Link>
              <Link
                href="/inventario/movimientos"
                className="block px-3 py-2 rounded-md hover:bg-white/10 transition"
              >
                Movimientos
              </Link>
              <Link
                href="/inventario/categorias"
                className="block px-3 py-2 rounded-md hover:bg-white/10 transition"
              >
                Categorías
              </Link>
              <Link
                href="/inventario/marcas"
                className="block px-3 py-2 rounded-md hover:bg-white/10 transition"
              >
                Marcas
              </Link>
              <Link
                href="/inventario/unidades-medida"
                className="block px-3 py-2 rounded-md hover:bg-white/10 transition"
              >
                Unidades de medida
              </Link>
              <Link
                href="/inventario/tipos-estado"
                className="block px-3 py-2 rounded-md hover:bg-white/10 transition"
              >
                Tipos de estado
              </Link>

              {/* Eventos, tareas, sub-tareas, ROI */}
              <Link
                href="/eventos"
                className="block px-3 py-2 rounded-md hover:bg-white/10 transition"
              >
                Eventos
              </Link>
              <Link
                href="/eventos/tareas"
                className="block px-3 py-2 rounded-md hover:bg-white/10 transition"
              >
                Tareas
              </Link>
              <Link
                href="/eventos/subtareas"
                className="block px-3 py-2 rounded-md hover:bg-white/10 transition"
              >
                Subtareas
              </Link>
              <Link
                href="/eventos/documentos-roi"
                className="block px-3 py-2 rounded-md hover:bg-white/10 transition"
              >
                Documentos ROI
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-white/10 px-3 py-3 text-[11px]">
          <div className="font-semibold truncate">{fullName}</div>
          <div className="text-white/70 truncate">{roleName}</div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between bg-white border-b border-slate-100 px-4">
          <div className="flex items-center gap-2">
            <div className="md:hidden mr-2 text-slate-500 text-xl">☰</div>
            <div className="font-semibold text-sm text-brand-tertiary">
              Panel KVC
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="font-semibold text-slate-700">{fullName}</span>
              <span className="text-slate-400">{roleName}</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-brand-secondary text-white flex items-center justify-center text-[11px] font-semibold">
              {fullName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Contenedor de páginas */}
        <main className="flex-1 overflow-y-auto bg-[var(--bg-main)]">
          {children}
        </main>
      </div>
    </div>
  );
}
