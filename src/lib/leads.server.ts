import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";
import type { LeadStage } from "./leads-types";

export const STAGES: LeadStage[] = [
  "unregistered",
  "registered",
  "health_screen",
  "plan_selection",
  "added_to_cart",
  "checkout_contact",
  "checkout_started",
  "payment_step",
  "payment_attempt",
  "ordered",

  "not_eligible",
];


export type GateSession = { unlocked?: boolean };

export function travisSessionConfig() {
  return {
    password: process.env['SESSION_SECRET']!,
    name: "travis-gate",
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

export function travisSession() {
  return useSession<GateSession>(travisSessionConfig());
}

export function passwordMatches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}
