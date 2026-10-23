import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AdminStatus } from "@/lib/admin-access.server";

export function AdminGate({ status }: { status: AdminStatus }) {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    await router.invalidate();
  }

  async function enroll() {
    setBusy(true);
    setMessage(null);
    try {
      // A reload can lose the one-time QR while leaving an unverified factor.
      // Remove incomplete setup attempts before creating a fresh factor.
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      for (const factor of factors.all.filter((item) => item.factor_type === "totp" && item.status === "unverified")) {
        const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (removeError) throw removeError;
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error) throw error;
      setFactorId(data.id);
      setQr(data.totp.qr_code);
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true);
    setMessage(null);
    try {
      let id = factorId;
      if (!id) {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        id = data.totp.find((factor) => factor.status === "verified")?.id ?? null;
      }
      if (!id) throw new Error("Enroll an authenticator first.");
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: id });
      if (challengeError) throw challengeError;
      const { error } = await supabase.auth.mfa.verify({ factorId: id, challengeId: challenge.id, code });
      if (error) throw error;
      await supabase.auth.refreshSession();
      await router.invalidate();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  if (status.state === "signed_out") return <div className="lx-card" style={{ maxWidth: 440, margin: "60px auto" }}>
    <h1>Admin sign in</h1><p>Use your personal LegacyRX account, then return to this page.</p>
    <a className="btn btn-primary" href={`/auth?next=${encodeURIComponent(window.location.pathname === "/travis" ? "/travis" : "/admin")}`}>Sign in</a>
  </div>;
  if (status.state === "forbidden") return <div className="lx-card" style={{ maxWidth: 440, margin: "60px auto" }}>
    <h1>Access unavailable</h1><p>This account has no admin role.</p><button className="btn btn-ghost" onClick={() => void signOut()}>Sign out</button>
  </div>;
  return <div className="lx-card" style={{ maxWidth: 440, margin: "60px auto", display: "grid", gap: 12 }}>
    <h1>Authenticator required</h1>
    <p>Enter the six digit code from your authenticator app to continue.</p>
    {qr && <img src={qr} alt="Authenticator setup QR code" style={{ maxWidth: 220 }} />}
    <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" aria-label="Authenticator code" />
    <button className="btn btn-primary" disabled={busy || code.length !== 6} onClick={() => void verify()}>Verify code</button>
    {!qr && <button className="btn btn-ghost" disabled={busy} onClick={() => void enroll()}>Set up authenticator</button>}
    {message && <p role="alert">{message}</p>}
    <button className="btn btn-ghost" onClick={() => void signOut()}>Sign out</button>
  </div>;
}
