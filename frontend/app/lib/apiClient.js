"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

/**
 * Devuelve headers con Authorization si hay token.
 */
function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("accessToken");
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Manejo centralizado de respuestas.
 */
async function handleResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        clearAuth();
      }
      throw new Error("Sesión vencida o credenciales inválidas.");
    }

    if (res.status === 403) {
      const detail =
        data?.detail || "Usted no tiene permiso para realizar esta acción.";
      throw new Error(detail);
    }

    const detail =
      data?.detail ||
      data?.message ||
      `Error ${res.status}: ${res.statusText || "Error en la API"}`;
    throw new Error(detail);
  }

  return data;
}

/**
 * Cliente genérico de fetch.
 */
async function api(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...getAuthHeaders(),
    ...options.headers,
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  return handleResponse(res);
}

export function saveAuth({ access, user }) {
  if (typeof window === "undefined") return;
  localStorage.setItem("accessToken", access);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Métodos de conveniencia
export function apiGet(path) {
  return api(path, { method: "GET" });
}

export function apiPost(path, body) {
  return api(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPatch(path, body) {
  return api(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function apiDelete(path) {
  return api(path, { method: "DELETE" });
}

export default api;
