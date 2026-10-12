import type { APIRoute } from "astro";
import { withBase } from "../lib/url";

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: "Вишлист",
      short_name: "Вишлист",
      description: "Список желаемых подарков",
      lang: "ru",
      dir: "ltr",
      start_url: withBase(),
      scope: withBase(),
      display: "standalone",
      background_color: "#f5f5f2",
      theme_color: "#f5f5f2",
      icons: [
        {
          src: withBase("icon-192.png"),
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: withBase("icon-512.png"),
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: withBase("icon-512.png"),
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    }),
    { headers: { "Content-Type": "application/manifest+json; charset=utf-8" } },
  );
