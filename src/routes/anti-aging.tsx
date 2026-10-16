import { createFileRoute } from "@tanstack/react-router";
import { HormoneProgram } from "@/components/HormoneProgram";

export const Route = createFileRoute("/anti-aging")({
  head: () => ({
    meta: [
      { title: "NAD+ Injections & Sermorelin Online - LegacyRX" },
      { name: "description", content: "NAD+ injections, sermorelin and prescription anti-aging skin cream, prescribed online by licensed providers and shipped to your door." },
      { property: "og:title", content: "NAD+ Injections & Sermorelin Online - LegacyRX" },
      { property: "og:description", content: "NAD+ injections, sermorelin and prescription skin cream, prescribed online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <HormoneProgram track="aa" />,
});
