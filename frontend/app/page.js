"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MainLayout from "./components/MainLayout";
import { apiGet, getStoredUser } from "./lib/apiClient";

const EMPTY_COUNTERS = {
  usuarios: null,
  empleados: null,
  roles: null,
  productos: null,
  movimientos: null,
  eventos: null,
  documentosRoi: null,
};

function getRoleSlugs(user) {
  return (user?.roles || []).map((r) => r.slug);
}

export default function DashboardPage() {
  const router = useRouter();

  // HOOKS (siempre en el mismo orden)
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counters, setCounters] = useState(EMPTY_COUNTERS);
  const [globalError, setGlobalError] = useState(null);

  // ================== useEffect ÚNICO: autentica y carga datos ==================
  useEffect(() => {
    async function init() {
      if (typeof window === "undefined") return;

      // 1) Verificar token
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.replace("/login");
        return;
      }

      // 2) Verificar usuario en localStorage
      const user = getStoredUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      setCurrentUser(user);

      // 3) Cargar datos del dashboard según rol
      const roleSlugs = getRoleSlugs(user);
      const isAdmin = roleSlugs.includes("admin");
      const isRespTI = roleSlugs.includes("resp_ti");
      const isRespAdmCont = roleSlugs.includes("resp_adm_contable");

      const requests = [];

      // Usuarios: admin o resp_ti
      if (isAdmin || isRespTI) {
        requests.push(["usuarios", () => apiGet("/api/usuarios/")]);
      }

      // Roles: solo admin
      if (isAdmin) {
        requests.push(["roles", () => apiGet("/api/roles/")]);
      }

      // Empleados: admin, resp_ti, resp_adm_contable
      if (isAdmin || isRespTI || isRespAdmCont) {
        requests.push(["empleados", () => apiGet("/api/empleados/")]);
      }

      // Inventario + eventos + ROI: admin o resp_adm_contable
      if (isAdmin || isRespAdmCont) {
        requests.push(["productos", () => apiGet("/api/productos/")]);
        requests.push(["movimientos", () => apiGet("/api/movimientos/")]);
        requests.push(["eventos", () => apiGet("/api/eventos/")]);
        requests.push(["documentosRoi", () => apiGet("/api/documentos-roi/")]);
      }

      setGlobalError(null);
      const newCounters = { ...EMPTY_COUNTERS };

      if (requests.length === 0) {
        // Rol sin módulos todavía
        setCounters(newCounters);
        setLoading(false);
        return;
      }

      try {
        const results = await Promise.allSettled(
          requests.map(([, fn]) => fn())
        );

        results.forEach((res, index) => {
          const [key] = requests[index];
          if (res.status === "fulfilled") {
            newCounters[key] = Array.isArray(res.value)
              ? res.value.length
              : 0;
          } else {
            console.warn(`No se pudo cargar ${key}:`, res.reason);
            newCounters[key] = null; // 403 u otro error
          }
        });

        const allFailed = results.every((r) => r.status === "rejected");
        if (allFailed) {
          setGlobalError(
            "No se pudieron cargar los datos del panel para su rol."
          );
        }

        setCounters(newCounters);
      } catch (err) {
        console.error("Error inesperado cargando dashboard:", err);
        setGlobalError(err.message || "Error cargando el panel");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  // ================== RENDER ==================
  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-sm text-slate-500">
        Cargando panel...
      </div>
    );
  }

  const roleSlugs = getRoleSlugs(currentUser);
  const isAdmin = roleSlugs.includes("admin");
  const isRespTI = roleSlugs.includes("resp_ti");
  const isRespAdmCont = roleSlugs.includes("resp_adm_contable");

  const nombreMostrado =
    `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() ||
    currentUser.username;

  // Armamos las tarjetas SIN hooks adicionales
  const tarjetas = [];

  if (isAdmin || isRespTI) {
    tarjetas.push({
      key: "usuarios",
      label: "Usuarios del sistema",
      value: counters.usuarios,
      href: "/usuarios",
    });
  }

  if (isAdmin) {
    tarjetas.push({
      key: "roles",
      label: "Roles configurados",
      value: counters.roles,
      href: "/roles",
    });
  }

  if (isAdmin || isRespTI || isRespAdmCont) {
    tarjetas.push({
      key: "empleados",
      label: "Empleados registrados",
      value: counters.empleados,
      href: "/empleados",
    });
  }

  if (isAdmin || isRespAdmCont) {
    tarjetas.push(
      {
        key: "productos",
        label: "Productos en inventario",
        value: counters.productos,
        href: "/inventario/productos",
      },
      {
        key: "movimientos",
        label: "Movimientos de inventario",
        value: counters.movimientos,
        href: "/inventario/movimientos",
      },
      {
        key: "eventos",
        label: "Eventos registrados",
        value: counters.eventos,
        href: "/eventos",
      },
      {
        key: "documentosRoi",
        label: "Documentos ROI",
        value: counters.documentosRoi,
        href: "/eventos/documentos-roi",
      }
    );
  }

  return (
    <MainLayout currentUser={currentUser}>
      <div className="p-6 space-y-6">
        {/* Saludo */}
        <div className="bg-gradient-to-r from-brand-secondary to-brand-tertiary text-white rounded-xl p-5 shadow-md">
          <p className="text-xs uppercase tracking-wide opacity-80">
            Panel de{" "}
            {isAdmin ? "Administrador" : isRespTI ? "Responsable TI" : "Gestión"}
          </p>
          <h1 className="text-lg md:text-xl font-semibold">
            Bienvenido, {nombreMostrado}
          </h1>
          <p className="text-xs mt-1 text-white/80">
            Aquí puede ver un resumen de las operaciones de su área.
          </p>
        </div>

        {globalError && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
            {globalError}
          </div>
        )}

        {/* Tarjetas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tarjetas.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              className="group bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
                    {card.label}
                  </p>
                  <p className="text-2xl font-semibold text-brand-tertiary">
                    {card.value === null ? "—" : card.value}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-brand-accent2/30 text-brand-tertiary">
                  Ver detalle
                </span>
              </div>
              <span className="mt-3 text-[11px] text-brand-secondary group-hover:underline">
                Ir a {card.label.toLowerCase()}
              </span>
            </Link>
          ))}

          {tarjetas.length === 0 && (
            <div className="col-span-full text-xs text-slate-500">
              Su rol aún no tiene módulos asociados. Contacte al administrador
              para que le asigne permisos.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
