import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authRedirectUrl, cancelAuthCallbackPending, consumeAuthReturn, markAuthCallbackPending, prepareAuthReturn } from "@/lib/auth-return";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in - LegacyRX" },
      {
        name: "description",
        content: "Sign in to your LegacyRX account to view orders and manage your plan.",
      },
      { property: "og:title", content: "Sign in - LegacyRX" },
      { property: "og:description", content: "View your LegacyRX orders and manage your plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const redirected = useRef(false);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const finishSignIn = useCallback(() => {
    if (redirected.current) return;
    redirected.current = true;
    void navigate({ to: consumeAuthReturn(window.sessionStorage) });
  }, [navigate]);

  useEffect(() => {
    prepareAuthReturn(window.location.search, window.location.hash, window.sessionStorage);
    const error =
      new URLSearchParams(window.location.search).get("error_description") ??
      new URLSearchParams(window.location.hash.slice(1)).get("error_description");
    if (error) {
      setMsg(error);
      return;
    }

    let active = true;
    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active && data.user) finishSignIn();
      })
      .catch(() => {
        // A missing or expired session leaves the sign-in form available.
      });
    return () => {
      active = false;
    };
  }, [finishSignIn]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res =
        mode === "in"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: authRedirectUrl(window.location.origin) },
            });
      if (res.error) return setMsg(res.error.message);
      if (res.data.session) {
        finishSignIn();
      } else if (mode === "up") {
        markAuthCallbackPending(window.sessionStorage);
        setMsg("Check your email to confirm your account, then sign in.");
      }
    } catch {
      setMsg("Could not connect to sign-in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setBusy(true);
    setMsg(null);
    try {
      markAuthCallbackPending(window.sessionStorage);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: authRedirectUrl(window.location.origin) },
      });
      if (error) {
        cancelAuthCallbackPending(window.sessionStorage);
        setMsg(error.message);
      }
    } catch {
      cancelAuthCallbackPending(window.sessionStorage);
      setMsg("Could not connect to Google sign-in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: "0 16px" }}>
      <div className="co-box" style={{ padding: 28 }}>
        <h1 style={{ fontSize: "1.5rem", margin: "0 0 6px" }}>
          {mode === "in" ? "Sign in" : "Create account"}
        </h1>
        <p className="lx-muted" style={{ margin: "0 0 20px", fontSize: ".9rem" }}>
          Use the same email you ordered with to see your orders.
        </p>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ width: "100%" }}
          disabled={busy}
          onClick={() => void signInWithGoogle()}
        >
          Continue with Google
        </button>
        <div
          className="lx-muted"
          style={{ textAlign: "center", margin: "14px 0", fontSize: ".8rem" }}
        >
          or
        </div>
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              required
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Please wait..." : mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>
        {msg && <p role="status" style={{ marginTop: 12, fontSize: ".9rem" }}>{msg}</p>}
        <button
          type="button"
          className="lx-muted"
          style={{
            marginTop: 14,
            background: "none",
            border: 0,
            textDecoration: "underline",
            cursor: "pointer",
          }}
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
