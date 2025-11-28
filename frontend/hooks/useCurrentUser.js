"use client";

import { useState, useEffect } from "react";

/**
 * Hook muy simple que lee el usuario actual almacenado en localStorage
 * por el login (saveAuth) y lo expone como { currentUser, loading }.
 */
export default function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem("currentUser");
      if (raw) {
        const parsed = JSON.parse(raw);
        setCurrentUser(parsed);
      }
    } catch (err) {
      console.error("Error leyendo currentUser de localStorage", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { currentUser, loading };
}
