import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pastrim kimik",
    short_name: "Pastrimi",
    description: "Porosi për pastrim kimik; çmimorja dhe orari lexohen edhe pa internet.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f9fa",
    theme_color: "#0b6e7f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
