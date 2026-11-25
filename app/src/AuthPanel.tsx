import { useEffect, useRef, useState } from "react";
import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useSignInWithUsernamePasskey } from "@convex-dev/auth/methods/username-passkey/react";
import { api } from "../convex/_generated/api";
import { Icon } from "./icons";

// Formularul se monteaza doar cand utilizatorul deschide "Intra in cont": cat timp e pe pagina,
// hook-ul de passkey porneste completarea automata, care pe Windows deschide fereastra Windows Hello.
function SignInForm({ onClose }: { onClose: () => void }) {
  const { signIn, pending, autofill } = useSignInWithUsernamePasskey(api.auth);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = await signIn({ username });
    if (result.status !== "complete") setError(String(result.userError.error));
  }

  // autofill.lastError e un obiect { error }; CEREMONY_ABORTED = utilizatorul a inchis fereastra de passkey
  const autofillError = autofill.lastError && autofill.lastError.error !== "CEREMONY_ABORTED" ? autofill.lastError.error : null;
  const message = error ?? autofillError;

  return (
    <form className="auth-popover" onSubmit={submit}>
      <div className="auth-popover-head">
        <h3>Intră în cont</h3>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Închide">
          <Icon name="close" size={16} />
        </button>
      </div>
      <p className="muted">Scrie un username. Dacă e cont nou, se creează o passkey (Windows Hello, PIN sau telefon).</p>
      <input
        className="input"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        autoComplete="username webauthn"
        aria-label="Username"
        autoFocus
        required
      />
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Se conectează..." : "Continuă"}
      </button>
      {message && <div className="error">{message}</div>}
    </form>
  );
}

function SignInButton() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // inchid la Escape sau la click in afara ferestrei
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div className="auth-menu" ref={box}>
      <button className="btn btn-primary" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        Intră în cont
      </button>
      {open && <SignInForm onClose={() => setOpen(false)} />}
    </div>
  );
}

function Profile() {
  const me = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  if (!me) return null;
  const name = me.username ?? "utilizator";
  return (
    <div className="profile">
      <span className="avatar">{name.charAt(0).toUpperCase()}</span>
      <span className="profile-name">{name}</span>
      {me.role === "admin" && <span className="badge">admin</span>}
      <button className="btn btn-ghost" onClick={() => void signOut()}>
        Ieșire
      </button>
    </div>
  );
}

export default function AuthPanel() {
  return (
    <div className="auth">
      <AuthLoading>
        <span className="muted">...</span>
      </AuthLoading>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
      <Authenticated>
        <Profile />
      </Authenticated>
    </div>
  );
}
