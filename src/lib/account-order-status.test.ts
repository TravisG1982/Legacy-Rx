import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    ilike: vi.fn(),
    neq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  return { query, from: vi.fn(), verifiedEmail: vi.fn() };
});

vi.mock("./account-access.server", () => ({
  verifiedAccountEmail: mocks.verifiedEmail,
  sameVerifiedEmail: (stored: string, verified: string) => stored.trim().toLowerCase() === verified,
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: mocks.from },
}));

import { loadVerifiedOrderStatus } from "./account-order-status.server";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verifiedEmail.mockResolvedValue("verified@example.com");
  mocks.from.mockReturnValue(mocks.query);
  mocks.query.select.mockReturnValue(mocks.query);
  mocks.query.eq.mockReturnValue(mocks.query);
  mocks.query.ilike.mockReturnValue(mocks.query);
  mocks.query.neq.mockReturnValue(mocks.query);
});

describe("verified order status access", () => {
  it("reads only a matching order for the signed-in user and verified email", async () => {
    mocks.query.maybeSingle.mockResolvedValue({
      data: { order_number: "LR-123", status: "shipped", email: "Verified@Example.com" },
      error: null,
    });
    await expect(loadVerifiedOrderStatus("user-1", "LR-123")).resolves.toEqual({
      orderNumber: "LR-123",
      status: "shipped",
    });
    expect(mocks.verifiedEmail).toHaveBeenCalledWith("user-1");
    expect(mocks.query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(mocks.query.eq).toHaveBeenCalledWith("order_number", "LR-123");
    expect(mocks.query.ilike).toHaveBeenCalledWith("email", "verified@example.com");
  });

  it("rejects an order missing from the authenticated user's query", async () => {
    mocks.query.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(loadVerifiedOrderStatus("user-1", "OTHER-ORDER")).rejects.toThrow(
      "not available in your account",
    );
  });

  it("rejects an order whose stored email differs from the verified email", async () => {
    mocks.query.maybeSingle.mockResolvedValue({
      data: { order_number: "LR-123", status: "shipped", email: "other@example.com" },
      error: null,
    });
    await expect(loadVerifiedOrderStatus("user-1", "LR-123")).rejects.toThrow(
      "not available in your account",
    );
  });

  it("does not query orders when email verification fails", async () => {
    mocks.verifiedEmail.mockRejectedValue(new Error("Confirm your email address"));
    await expect(loadVerifiedOrderStatus("user-1", "LR-123")).rejects.toThrow(
      "Confirm your email address",
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
