// src/lib/stripe.server.ts
import { createHmac, timingSafeEqual } from "node:crypto";
import Stripe from 'stripe';
const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

export type StripeEnv = 'sandbox' | 'live';

export function getStripeSecretKey(env: StripeEnv): string {
  return env === 'sandbox'
    ? getEnv('STRIPE_SANDBOX_SECRET_KEY')
    : getEnv('STRIPE_LIVE_SECRET_KEY');
}

/** Live is only available once the direct live Stripe secret key exists. */
export function getStripeEnvironment(): StripeEnv {
  try {
    return getEnv('STRIPE_LIVE_SECRET_KEY') ? 'live' : 'sandbox';
  } catch {
    return 'sandbox';
  }
}

export function createStripeClient(env: StripeEnv): Stripe {
  return new Stripe(getStripeSecretKey(env), {
    apiVersion: '2026-03-25.dahlia',
  });
}

export function getStripeErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const stripeError = error as {
      message?: string;
      type?: string;
      code?: string;
      decline_code?: string;
      param?: string;
      requestId?: string;
      raw?: {
        message?: string;
        type?: string;
        code?: string;
        decline_code?: string;
        param?: string;
        requestId?: string;
      };
    };

    const message = stripeError.raw?.message ?? stripeError.message;
    if (message) {
      const details = [
        stripeError.raw?.type ?? stripeError.type,
        stripeError.raw?.code ?? stripeError.code,
        stripeError.raw?.decline_code ?? stripeError.decline_code,
        stripeError.raw?.param ?? stripeError.param,
        stripeError.raw?.requestId ?? stripeError.requestId,
      ].filter(Boolean);
      return details.length ? `${message} (${details.join(', ')})` : message;
    }
  }

  return 'Stripe request failed';
}

/**
 * Verifies the `v1` payload signature against the webhook signing secret.
 * Returns true when the payload is authentic; treat anything else as a 400.
 */
export function verifyWebhook(
  payload: string,
  sigHeader: string | null,
  secret: string,
): boolean {
  if (!sigHeader) return false;
  const parts = sigHeader.split(',').reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
