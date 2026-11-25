import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pastrim Kimik Expert Wash",
    short_name: "Expert Wash",
    description: "Porosi për pastrim kimik; çmimorja dhe orari lexohen edhe pa internet.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f9ff",
    theme_color: "#1f6fe0",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
