import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VocaStar: Vokabeln lernen mit Spaß",
    short_name: "VocaStar",
    description: "Vokabeln spielerisch lernen mit Voki der Eule.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff7ea",
    theme_color: "#7c3aed",
    lang: "de",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
