import { useState } from "react";
import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useSignInWithUsernamePasskey } from "@convex-dev/auth/methods/username-passkey/react";
import { api } from "../convex/_generated/api";

const box: React.CSSProperties = {
  position: "absolute", top: 12, right: 12, zIndex: 10, background: "#fff",
  padding: 12, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,.25)", color: "#111", fontSize: 14,
};

function SignInForm() {
  const { signIn, pending, autofill } = useSignInWithUsernamePasskey(api.auth);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = await signIn({ username });
    if (result.status !== "complete") setError(String(result.userError.error));
  }

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: 6 }}>Autentificare / cont nou</div>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="username"
        autoComplete="username webauthn"
        required
      />
      <button type="submit" disabled={pending} style={{ marginLeft: 6 }}>
        {pending ? "..." : "Continua"}
      </button>
      <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
        Cont nou: se creeaza o passkey (Windows Hello / PIN / telefon).
      </div>
      {(error ?? autofill.lastError) && <div style={{ color: "#b91c1c" }}>{error ?? String(autofill.lastError)}</div>}
    </form>
  );
}

function Profile() {
  const me = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  if (!me) return null;
  return (
    <div>
      <b>{me.username ?? "utilizator"}</b> ({me.role})
      <button onClick={() => void signOut()} style={{ marginLeft: 8 }}>Iesire</button>
    </div>
  );
}

export default function AuthPanel() {
  return (
    <div style={box}>
      <AuthLoading>...</AuthLoading>
      <Unauthenticated><SignInForm /></Unauthenticated>
      <Authenticated><Profile /></Authenticated>
    </div>
  );
}
