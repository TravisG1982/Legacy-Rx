import { createFileRoute } from "@tanstack/react-router";
import { HormoneProgram } from "@/components/HormoneProgram";

export const Route = createFileRoute("/sexual-health")({
  head: () => ({
    meta: [
      { title: "ED Treatment Online - Sildenafil & Tadalafil - LegacyRX" },
      { name: "description", content: "Generic Viagra (sildenafil) and daily Cialis (tadalafil) prescribed online by licensed providers, shipped in discreet packaging." },
      { property: "og:title", content: "ED Treatment Online - LegacyRX" },
      { property: "og:description", content: "Sildenafil and daily tadalafil prescribed online, shipped discreetly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <HormoneProgram track="sh" />,
});
