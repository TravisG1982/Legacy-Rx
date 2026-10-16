import { createFileRoute, Link } from "@tanstack/react-router";
import { FunnelShell } from "../components/FunnelShell";

export const Route = createFileRoute("/thank-you")({
  head: () => ({
    meta: [
      { title: "Thank You - LegacyRX" },
      { name: "description", content: "Your LegacyRX visit was received. A licensed provider usually reviews within 1 day." },
      { property: "og:title", content: "Thank You - LegacyRX" },
      { property: "og:description", content: "Your visit was received and is waiting for provider review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  return (
    <FunnelShell pct={100} wide={false}>
      <div style={{ textAlign: "center", padding: "8px 4px" }}>
        <h2 className="qcard-title" style={{ marginBottom: 12 }}>Thank you — we've got it</h2>
        <p className="qsub" style={{ marginBottom: 24 }}>
          A licensed provider usually reviews your answers within 1 day. If approved, your medication ships from a
          licensed pharmacy and you'll get updates by email.
        </p>
        <Link to="/" className="qbtn">Back to home</Link>
      </div>
    </FunnelShell>
  );
}
