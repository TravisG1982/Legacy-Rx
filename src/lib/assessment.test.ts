import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assessmentStep1Schema,
  assessmentStep2Schema,
  passesAssessmentStep2,
} from "./assessment-rules";

const sessionState = vi.hoisted(() => ({ data: {} as Record<string, unknown> }));
vi.mock("@tanstack/react-start/server", () => ({
  useSession: () => ({
    get data() {
      return sessionState.data;
    },
    update: async (next: Record<string, unknown>) => {
      sessionState.data = next;
    },
    clear: async () => {
      sessionState.data = {};
    },
  }),
}));

import {
  assessmentProgress,
  beginAssessment,
  clearAssessment,
  finishAssessment,
  requireCompletedAssessment,
} from "./assessment.server";

beforeEach(() => {
  process.env["SESSION_SECRET"] = "test-only-secret-at-least-thirty-two-characters-long";
  sessionState.data = {};
});

describe("assessment server gate", () => {
  it("rejects checkout without both completed steps", async () => {
    await expect(requireCompletedAssessment("sema", "guest@example.com")).rejects.toThrow(
      "Complete the assessment",
    );
    await beginAssessment("glp1", "guest@example.com");
    expect(await assessmentProgress("glp1")).toBe(2);
    await expect(requireCompletedAssessment("sema", "guest@example.com")).rejects.toThrow(
      "Complete the assessment",
    );
  });

  it("binds completed screening to the same email and product track", async () => {
    await beginAssessment("glp1", "Guest@Example.com ");
    await finishAssessment("glp1");
    expect(await assessmentProgress("glp1")).toBe(3);
    await expect(requireCompletedAssessment("sema", "guest@example.com")).resolves.toBeUndefined();
    await expect(requireCompletedAssessment("sema", "other@example.com")).rejects.toThrow(
      "Complete the assessment",
    );
    await expect(requireCompletedAssessment("trt_inj", "guest@example.com")).rejects.toThrow(
      "Complete the assessment",
    );
  });

  it("rejects expired or invalidated assessments", async () => {
    await beginAssessment("glp1", "guest@example.com");
    await finishAssessment("glp1");
    sessionState.data["expiresAt"] = Date.now() - 1;
    expect(await assessmentProgress("glp1")).toBe(1);
    await expect(requireCompletedAssessment("sema", "guest@example.com")).rejects.toThrow(
      "Complete the assessment",
    );
    await clearAssessment();
    expect(await assessmentProgress("glp1")).toBe(1);
  });
});

describe("required answers", () => {
  const step1 = {
    track: "glp1",
    state: "Georgia",
    firstName: "Test",
    lastName: "Person",
    email: "test@example.com",
    phone: "(555) 123-4567",
    age18: "yes",
    onGlp1: "no",
    emailConsent: true,
    emailMarketingConsent: false,
    smsConsent: false,
  };

  it("requires adult status and mandatory answers at the server boundary", () => {
    expect(assessmentStep1Schema.safeParse(step1).success).toBe(true);
    expect(assessmentStep1Schema.safeParse({ ...step1, age18: "no" }).success).toBe(false);
    expect(assessmentStep1Schema.safeParse({ ...step1, onGlp1: null }).success).toBe(false);
    expect(assessmentStep1Schema.safeParse({ ...step1, state: "unknown" }).success).toBe(false);
    expect(assessmentStep1Schema.safeParse({ ...step1, emailConsent: false }).success).toBe(false);
    expect(assessmentStep1Schema.safeParse({ ...step1, emailMarketingConsent: true }).success).toBe(
      true,
    );
  });

  it("requires no selected contraindications and blood-work answer where shown", () => {
    const glp1 = assessmentStep2Schema.parse({ track: "glp1", none: true, conditions: [] });
    expect(passesAssessmentStep2(glp1)).toBe(true);
    expect(passesAssessmentStep2({ ...glp1, conditions: [0] })).toBe(false);
    const trt = assessmentStep2Schema.parse({ track: "trt", none: true, conditions: [] });
    expect(passesAssessmentStep2(trt)).toBe(false);
    expect(passesAssessmentStep2({ ...trt, labs: "no" })).toBe(true);
  });
});
