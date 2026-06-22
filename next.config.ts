import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Erlaubt den Zugriff über VS-Code-/Cloud-Tunnel-Adressen im Dev-Modus
  // (sonst blockt der Dev-Server fremde Hosts beim Handy-Test).
  allowedDevOrigins: ["*.devtunnels.ms", "*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok.io"],
};

export default nextConfig;
