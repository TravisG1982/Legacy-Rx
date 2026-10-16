import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { FunnelShell } from "../components/FunnelShell";
import { createFuseCheckout } from "../lib/fuse-checkout.functions";
import { readFunnel } from "../lib/funnel-store";
import { leadSessionId } from "../lib/lead-capture";
import { MEDS, hasFuseProgram, isMedKey } from "../lib/legacyrx-data";

export const Route = createFileRoute("/start/$med")({
  head: () => ({
    meta: [
      { title: "Start Your Visit - LegacyRX" },
      { name: "description", content: "Complete your secure health questionnaire and payment with LegacyRX's licensed partner." },
      { property: "og:title", content: "Start Your Visit - LegacyRX" },
      { property: "og:description", content: "Secure health questionnaire and payment for your LegacyRX treatment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StartVisitPage,
});

function StartVisitPage() {
  const { med } = Route.useParams();
  const navigate = useNavigate();
  const start = useServerFn(createFuseCheckout);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!isMedKey(med) || !hasFuseProgram(med)) {
      setError("This treatment isn't available online yet.");
      return;
    }
    const c = readFunnel().contact ?? {};
    const qs = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "gclid", "fbclid"]) {
      const v = qs.get(k) ?? sessionStorage.getItem(k);
      if (v) utm[k] = v;
    }
    start({
      data: {
        med,
        leadSessionId: leadSessionId() ?? undefined,
        email: c.email || undefined,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        state: c.state,
        utm,
      },
    })
      .then((r) => {
        setEmbedUrl(r.embedUrl);
        // FuseHealth blocks being shown inside other sites, so send the visitor straight to its secure form.
        window.location.assign(r.embedUrl);
      })
      .catch(() => setError("We couldn't open the secure form. Please refresh the page or try again in a minute."));
  }, [med, start]);

  useEffect(() => {
    if (!embedUrl) return;
    const origin = new URL(embedUrl).origin;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== origin) return;
      const type = typeof e.data === "string" ? e.data : (e.data as { type?: string } | null)?.type;
      if (type === "fuse:completed") navigate({ to: "/thank-you" });
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [embedUrl, navigate]);

  const name = isMedKey(med) ? MEDS[med].co : "your treatment";

  return (
    <FunnelShell pct={90} wide>
      <h2 className="qcard-title" style={{ marginBottom: 6 }}>Start your visit</h2>
      <p className="qsub" style={{ marginBottom: 16 }}>
        {name}: answer a few health questions and complete payment securely. A licensed provider usually reviews within 1 day. Not everyone qualifies.
      </p>
      {error ? (
        <p className="qsub" role="alert">{error}</p>
      ) : embedUrl ? (
        <p className="qsub" style={{ textAlign: "center" }}>
          Taking you to the secure form… <a href={embedUrl}>Tap here if nothing happens</a>.
        </p>

      ) : (
        <p className="qsub">Opening your secure form…</p>
      )}
    </FunnelShell>
  );
}
