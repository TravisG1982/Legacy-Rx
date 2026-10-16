import { createFileRoute } from "@tanstack/react-router";
import { HormoneProgram } from "@/components/HormoneProgram";

export const Route = createFileRoute("/womens-hrt")({
  head: () => ({
    meta: [
      { title: "Menopause Hormone Therapy (HRT) Online - LegacyRX" },
      { name: "description", content: "Doctor-prescribed estradiol cream for menopause symptoms. Online consultation with a licensed provider and discreet delivery." },
      { property: "og:title", content: "Menopause Hormone Therapy (HRT) Online - LegacyRX" },
      { property: "og:description", content: "Estradiol cream for menopause symptoms, prescribed online by licensed providers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <HormoneProgram track="hrt" />,
});
