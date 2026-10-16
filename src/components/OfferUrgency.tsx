import { useOfferDeadline } from "@/hooks/use-offer-deadline";

export function OfferUrgency({ variant = "plan" }: { variant?: "plan" | "checkout" }) {
  // Checkout keeps a live reservation window: if the funnel timer already ran
  // out, a fresh 10-minute hold starts instead of showing weaker copy.
  const { ready, expired, label } = useOfferDeadline(variant === "checkout" ? 10 * 60 * 1000 : undefined);
  if (!ready) return null;

  if (expired) {
    return (
      <div className="offer-urgency offer-urgency--soft" role="status">
        <span className="offer-urgency__icon" aria-hidden="true">⏱</span>
        <span className="offer-urgency__text">
          Offer ending soon - complete your order to keep this price
        </span>
      </div>
    );
  }

  return (
    <div className="offer-urgency" role="status">
      <span className="offer-urgency__icon" aria-hidden="true">⏱</span>
      <span className="offer-urgency__text">
        {variant === "checkout" ? "Your discounted price is reserved for" : "Today's offer ends in"}{" "}
        <span className="offer-urgency__time">{label}</span>
        {variant === "checkout" ? "" : " - lock in your discounted price"}
      </span>
    </div>
  );
}
