import { useEffect, useState } from "react";

const STEPS = [
  "Details received",
  "Checking state availability",
  "Preparing your health review",
];

/** Short branded "we're reviewing this" moment between qualify step 1 and 2. */
export function ReviewingResponses({ open, onDone }: { open: boolean; onDone: () => void }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (!open) {
      setDone(0);
      return;
    }
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const total = reduced ? 900 : 2200;
    const timers = [
      window.setTimeout(() => setDone(1), total * 0.22),
      window.setTimeout(() => setDone(2), total * 0.55),
      window.setTimeout(() => setDone(3), total * 0.86),
      window.setTimeout(onDone, total),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [open, onDone]);

  if (!open) return null;

  return (
    <div className="qrev-backdrop" role="status" aria-live="polite">
      <div className="qrev">
        <div className="qrev-brand">LegacyRX</div>
        <h2 className="qrev-title">Reviewing your responses</h2>
        <div className="qrev-card">
          {STEPS.map((label, i) => (
            <div key={label} className={`qrev-row ${i < done ? "is-done" : ""}`}>
              <span className="qrev-check" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span className="qrev-label">{label}</span>
            </div>
          ))}
          <div className="qrev-track">
            <span className="qrev-fill" />
          </div>
        </div>
        <p className="qrev-foot">This only takes a moment.</p>
      </div>
    </div>
  );
}
