import { createHmac, timingSafeEqual } from "node:crypto";
import { useSession } from "@tanstack/react-start/server";
import { MED_INFO, type MedKey, type Track } from "./legacyrx-data";

const MAX_AGE_SECONDS = 30 * 60;

type AssessmentSession = {
  track?: Track;
  emailDigest?: string;
  step?: 2 | 3;
  expiresAt?: number;
};

function sessionSecret(): string {
  const secret = process.env["SESSION_SECRET"];
  if (!secret || secret.length < 32) throw new Error("Assessment session is not configured.");
  return secret;
}

function assessmentSession() {
  // TanStack's request-scoped useSession is a server API, not a React hook.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSession<AssessmentSession>({
    password: sessionSecret(),
    name: "legacyrx-assessment",
    maxAge: MAX_AGE_SECONDS,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  });
}

function emailDigest(email: string): string {
  return createHmac("sha256", sessionSecret())
    .update("assessment-email:v1:")
    .update(email.trim().toLowerCase())
    .digest("hex");
}

function sameDigest(a: string | undefined, b: string): boolean {
  if (!a || !/^[a-f0-9]{64}$/.test(a)) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

export async function beginAssessment(track: Track, email: string) {
  const session = await assessmentSession();
  await session.update({
    track,
    emailDigest: emailDigest(email),
    step: 2,
    expiresAt: Date.now() + MAX_AGE_SECONDS * 1000,
  });
}

export async function clearAssessment() {
  const session = await assessmentSession();
  await session.clear();
}

export async function assessmentProgress(track: Track): Promise<1 | 2 | 3> {
  const session = await assessmentSession();
  const data = session.data;
  if (data.track !== track || !data.expiresAt || data.expiresAt <= Date.now()) return 1;
  return data.step === 2 || data.step === 3 ? data.step : 1;
}

export async function finishAssessment(track: Track) {
  const session = await assessmentSession();
  const data = session.data;
  if (
    data.track !== track ||
    (data.step !== 2 && data.step !== 3) ||
    !data.emailDigest ||
    !data.expiresAt ||
    data.expiresAt <= Date.now()
  ) {
    throw new Error("Complete the first assessment step again.");
  }
  await session.update({ ...data, step: 3 });
}

export async function requireCompletedAssessment(med: MedKey, email: string) {
  const session = await assessmentSession();
  const data = session.data;
  if (
    data.step !== 3 ||
    data.track !== MED_INFO[med].track ||
    !data.expiresAt ||
    data.expiresAt <= Date.now() ||
    !sameDigest(data.emailDigest, emailDigest(email))
  ) {
    throw new Error("Complete the assessment before starting checkout.");
  }
}
