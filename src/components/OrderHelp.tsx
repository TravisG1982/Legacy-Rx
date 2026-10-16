import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { askOrderHelp } from "@/lib/order-help.functions";

const STEPS = [
  "Answering the assessment",
  "Choosing a treatment",
  "FuseHealth secure form / health questions",
  "Payment",
  "After paying / waiting for review",
  "Not sure",
];

/** AI-powered, non-medical help for customers stuck while ordering. */
export function OrderHelp() {
  const ask = useServerFn(askOrderHelp);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(STEPS[0]!);
  const [problem, setProblem] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (problem.trim().length < 5 || busy) return;
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const r = await ask({ data: { problem, step } });
      if (r.ok) setAnswer(r.answer);
      else setError(r.error);
    } catch {
      setError("We couldn't get guidance right now. Please try again or use the Contact page.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="order-help">
      {!open ? (
        <button type="button" className="order-help-toggle" onClick={() => setOpen(true)}>
          Stuck while ordering? Get help
        </button>
      ) : (
        <form onSubmit={submit} className="order-help-box">
          <div className="order-help-head">
            <strong>Where are you stuck?</strong>
            <button type="button" className="order-help-close" onClick={() => setOpen(false)} aria-label="Close help">×</button>
          </div>
          <label className="order-help-label">
            Step
            <select value={step} onChange={(e) => setStep(e.target.value)}>
              {STEPS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="order-help-label">
            What's happening?
            <textarea
              rows={3}
              maxLength={1000}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="e.g. The form is blank, or my card keeps getting declined"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy || problem.trim().length < 5}>
            {busy ? "Finding next steps…" : "Get next steps"}
          </button>
          {answer && <div className="order-help-answer" aria-live="polite">{answer}</div>}
          {error && <p className="order-help-error" role="alert">{error}</p>}
          <p className="order-help-note">
            AI-powered order help only, not medical advice. Health questions are answered by your provider. Still stuck?{" "}
            <Link to="/contact-us">Contact us</Link>.
          </p>
        </form>
      )}
    </div>
  );
}
