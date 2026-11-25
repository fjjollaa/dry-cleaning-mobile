"use client";
import { useEffect } from "react";

// Regjistron service worker dhe ruan një kopje të çmimores publike për lexim pa internet.
export default function Pwa() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    // Server rendering nuk mbush cache-n e JSON-it. E kërkojmë një herë këtu.
    async function ngrohKopjen() {
      if (cancelled || !navigator.serviceWorker.controller) return;
      try {
        await fetch("/api/sherbimet", { cache: "no-store" });
      } catch {
        /* pa internet */
      }
    }
    navigator.serviceWorker.addEventListener("controllerchange", ngrohKopjen);
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => navigator.serviceWorker.ready)
      .then(ngrohKopjen)
      .catch(() => {});
    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", ngrohKopjen);
    };
  }, []);
  return null;
}
