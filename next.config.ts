import type { NextConfig } from "next";

// Betrieb unter einer Unteradresse (z. B. /marketplace2026) über NEXT_PUBLIC_BASE_PATH.
// Lokal leer → App läuft wie bisher unter "/". In Produktion auf dem Hosting gesetzt.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(basePath ? { basePath } : {}),
  // Erlaubt den Zugriff über VS-Code-/Cloud-Tunnel-Adressen im Dev-Modus
  // (sonst blockt der Dev-Server fremde Hosts beim Handy-Test).
  allowedDevOrigins: ["*.devtunnels.ms", "*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok.io"],
};

export default nextConfig;
