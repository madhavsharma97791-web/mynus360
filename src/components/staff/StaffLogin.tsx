import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOGO_URL } from "@/lib/menu";
import { workerLoginEmail } from "@/lib/staff-login-id";

export function StaffLogin() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"owner" | "worker">("worker");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  return <main className="staff-theme min-h-screen bg-background text-foreground grid place-items-center px-6">
    <div className="w-full max-w-sm py-12">
      <img src={LOGO_URL} alt="Mynus 360" className="mx-auto size-32 object-contain" />
      <h1 className="mt-6 text-center font-display text-4xl">MYNUS 360</h1>
      <p className="mt-2 mb-8 text-center text-muted-foreground">Staff sign in</p>
      <div className="grid grid-cols-2 gap-2 mb-6">{(["worker", "owner"] as const).map(r => <Button key={r} variant={role === r ? "default" : "secondary"} className="h-12 capitalize" onClick={() => setRole(r)}>Login as {r}</Button>)}</div>
      <form className="space-y-5" onSubmit={async e => {
        e.preventDefault(); setBusy(true); setError("");
        try {
          const loginEmail = role === "worker" && !email.includes("@") ? workerLoginEmail(email) : email.trim();
          const result = await supabase.auth.signInWithPassword({ email: loginEmail, password });
          if (result.error) throw result.error;
          if (!result.data.user) throw new Error("Sign in failed.");
          await supabase.rpc("claim_owner");
          const roles = await supabase.from("user_roles").select("role").eq("user_id", result.data.user.id);
          const profile = await supabase.from("profiles").select("active").eq("id", result.data.user.id).single();
          if (!profile.data?.active || !roles.data?.some(r => r.role === role)) {
            await supabase.auth.signOut(); throw new Error(`This account does not have active ${role} access.`);
          }
          await navigate({ to: role === "owner" ? "/staff/overview" : "/staff/orders" });
        } catch (err) { setError(err instanceof Error ? err.message : "Could not sign in."); }
        finally { setBusy(false); }
      }}>
        <label className="block font-semibold">{role === "worker" ? "Staff ID or email" : "Email"}<Input className="mt-2 h-12 bg-card" type={role === "worker" ? "text" : "email"} autoComplete="username" autoCapitalize="none" spellCheck={false} required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label className="block font-semibold">Password<Input className="mt-2 h-12 bg-card" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <Button className="w-full h-12 text-base font-bold" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
    </div>
  </main>;
}