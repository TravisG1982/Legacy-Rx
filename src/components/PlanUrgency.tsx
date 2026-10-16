import { useEffect, useState } from "react";
import { useOfferDeadline } from "@/hooks/use-offer-deadline";

/** Live-feeling activity strip: how many people are picking a plan right now. */
export function LiveViewers() {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    const base = 18 + Math.floor(Math.random() * 12);
    setN(base);
    const id = setInterval(() => {
      setN((prev) => {
        const next = (prev ?? base) + (Math.random() < 0.5 ? -1 : 1);
        return Math.min(34, Math.max(14, next));
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);
  if (n === null) return null;
  return (
    <div className="live-viewers" role="status">
      <span className="live-dot" aria-hidden="true" />
      <strong>{n} people</strong> are choosing a plan right now
    </div>
  );
}

/** Scarcity note for the discounted plan slots. */
export function SpotsLeft() {
  const [spots, setSpots] = useState<number | null>(null);
  useEffect(() => {
    setSpots(4 + Math.floor(Math.random() * 4));
  }, []);
  if (spots === null) return null;
  return (
    <div className="spots-left">
      Only <strong>{spots} discounted spots</strong> left at today's price
    </div>
  );
}

/** Compact countdown shown above the sticky Continue button. */
export function StickyUrgency() {
  const { ready, expired, label } = useOfferDeadline();
  if (!ready) return null;
  return (
    <div className="sticky-urgency">
      {expired ? (
        <>Offer ending soon - continue to keep this price</>
      ) : (
        <>
          Price held for <span className="sticky-urgency__time">{label}</span>
        </>
      )}
    </div>
  );
}
