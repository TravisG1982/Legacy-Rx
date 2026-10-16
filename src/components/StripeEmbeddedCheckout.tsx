import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";

/**
 * Renders the embedded payment form inline (PCI-compliant iframe). The parent
 * creates the payment session first so the amount is fixed server-side, then
 * passes the client secret down.
 */
export function StripeEmbeddedCheckout({ clientSecret }: { clientSecret: string }) {
  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
