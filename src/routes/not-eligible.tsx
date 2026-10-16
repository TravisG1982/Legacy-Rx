import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { FunnelShell } from "../components/FunnelShell";

export const Route = createFileRoute("/not-eligible")({
  head: () => ({
    meta: [
      { title: "Not Eligible - LegacyRX" },
      { name: "description", content: "Based on your responses, this program may not be the right fit at this time." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotEligiblePage,
});

function NotEligiblePage() {
  const navigate = useNavigate();
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0 });
  }, []);
  return (
    <FunnelShell pct={0} wide={false}>
      <div style={{ textAlign: "center", padding: "8px 4px" }}>
        <h2 className="qcard-title" style={{ marginBottom: 12 }}>We're Sorry</h2>
        <p className="qsub" style={{ marginBottom: 24 }}>
          Based on your responses, this program may not be right for you at this time.
          Please consult with your doctor for personalized guidance.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          style={{ minWidth: 180 }}
          onClick={() => navigate({ to: "/qualify" })}
        >
          ← Go Back
        </button>
      </div>
    </FunnelShell>
  );
}
