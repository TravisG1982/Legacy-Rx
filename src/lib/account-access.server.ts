/** Resolve the current verified email and atomically claim matching guest records. */
export async function verifiedAccountEmail(userId: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: email, error } = await supabaseAdmin.rpc("claim_verified_guest_records", { _user_id: userId });
  if (error || !email) throw new Error("Confirm your email address before viewing account information.");
  return email;
}

export function sameVerifiedEmail(stored: string, verified: string): boolean {
  return stored.trim().toLowerCase() === verified;
}
