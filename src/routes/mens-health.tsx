import { createFileRoute } from "@tanstack/react-router";
import { HormoneProgram } from "@/components/HormoneProgram";

export const Route = createFileRoute("/mens-health")({
  head: () => ({
    meta: [
      { title: "TRT Online - Testosterone Therapy - LegacyRX" },
      { name: "description", content: "Get TRT online: doctor-prescribed testosterone injections, cream and enclomiphene. Licensed provider review, lab guidance and discreet shipping." },
      { property: "og:title", content: "TRT Online - Testosterone Therapy - LegacyRX" },
      { property: "og:description", content: "TRT online: injections, cream and enclomiphene prescribed by licensed providers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <HormoneProgram track="trt" />,
});
