import { beforeEach, describe, expect, it, vi } from "vitest";
import { containsLikelyMedicalDetails } from "./contact-message-policy";

const mocks = vi.hoisted(() => ({ from: vi.fn(), fetch: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: mocks.from },
}));

import { processContactSubmission } from "./contact-submission.server";

const data = {
  submissionId: "ff62310b-5547-47c9-8a03-858d9ccf5c98",
  name: "Test Person",
  email: "test@example.com",
  phone: "5551234567",
  message: "Please help me access my account.",
  transactionalConsent: false,
  marketingConsent: false,
};

function mockStorage(status: string = "pending", overrides: Record<string, unknown> = {}) {
  const stored = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    message: data.message,
    transactional_consent: data.transactionalConsent,
    marketing_consent: data.marketingConsent,
    delivery_status: status,
    delivery_attempted_at: null,
    ...overrides,
  };
  const read = {
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: stored, error: null }),
  };
  const claim = {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: { id: data.submissionId }, error: null }),
  };
  const save = {
    eq: vi.fn().mockReturnThis(),
    then: (resolve: (value: { error: null }) => unknown) =>
      Promise.resolve({ error: null }).then(resolve),
  };
  const submissions = {
    upsert: vi.fn().mockResolvedValue({ error: null }),
    select: vi.fn().mockReturnValue(read),
    update: vi.fn().mockReturnValueOnce(claim).mockReturnValue(save),
  };
  mocks.from.mockReturnValue(submissions);
  return { submissions, read, claim };
}

beforeEach(() => {
  mocks.from.mockReset();
  mocks.fetch.mockReset();
  vi.stubGlobal("fetch", mocks.fetch);
});

describe("general contact form delivery", () => {
  it("rejects obvious medical details before storage or forwarding", async () => {
    const result = await processContactSubmission({
      ...data,
      message: "My dose is 10 mg and I feel dizzy.",
    });
    expect(result).toEqual({ ok: false, reason: "medical_details" });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("stores one request ID, claims it, and records endpoint acceptance", async () => {
    const { submissions } = mockStorage();
    mocks.fetch.mockResolvedValue({ ok: true, status: 200 });
    await expect(processContactSubmission(data)).resolves.toEqual({ ok: true });
    expect(submissions.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: data.submissionId }),
      { onConflict: "id", ignoreDuplicates: true },
    );
    expect(submissions.update).toHaveBeenCalledWith(
      expect.objectContaining({ delivery_status: "delivering" }),
    );
    expect(submissions.update).toHaveBeenCalledWith(
      expect.objectContaining({ delivery_status: "accepted" }),
    );
    expect(mocks.fetch).toHaveBeenCalledOnce();
  });

  it("does not forward an accepted submission again", async () => {
    const { submissions } = mockStorage("accepted");
    await expect(processContactSubmission(data)).resolves.toEqual({ ok: true });
    expect(submissions.update).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("does not forward when another request claimed the same submission", async () => {
    const { claim } = mockStorage();
    claim.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(processContactSubmission(data)).resolves.toEqual({
      ok: false,
      reason: "delivery_pending",
    });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("reports an HTTP rejection and does not resend that ID", async () => {
    mockStorage();
    mocks.fetch.mockResolvedValue({ ok: false, status: 502 });
    await expect(processContactSubmission(data)).resolves.toEqual({
      ok: false,
      reason: "delivery_failed",
    });
    const { submissions } = mockStorage("failed");
    await expect(processContactSubmission(data)).resolves.toEqual({
      ok: false,
      reason: "delivery_failed",
    });
    expect(submissions.update).not.toHaveBeenCalled();
    expect(mocks.fetch).toHaveBeenCalledOnce();
  });

  it("does not resend when a timeout leaves delivery uncertain", async () => {
    mockStorage();
    mocks.fetch.mockRejectedValue(new Error("timeout"));
    await expect(processContactSubmission(data)).resolves.toEqual({
      ok: false,
      reason: "delivery_unconfirmed",
    });
    mockStorage("unconfirmed");
    await expect(processContactSubmission(data)).resolves.toEqual({
      ok: false,
      reason: "delivery_unconfirmed",
    });
    expect(mocks.fetch).toHaveBeenCalledOnce();
  });

  it("rejects reuse of an ID for changed content", async () => {
    mockStorage("accepted", { message: "A different message" });
    await expect(processContactSubmission(data)).rejects.toThrow("already in use");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("keeps normal support topics available", () => {
    expect(containsLikelyMedicalDetails(data.message)).toBe(false);
    expect(containsLikelyMedicalDetails("Where can I find my payment receipt?")).toBe(false);
  });
});
