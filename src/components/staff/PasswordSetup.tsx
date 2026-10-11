import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOGO_URL } from "@/lib/menu";

export function PasswordSetup() {
  const [valid,setValid] = useState(false); const [busy,setBusy] = useState(false);
  const [password,setPassword] = useState(""); const [confirm,setConfirm] = useState("");
  const [message,setMessage] = useState(""); const [done,setDone] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const type = params.get("type");
    const access_token = params.get("access_token"); const refresh_token = params.get("refresh_token");
    if ((type === "recovery" || type === "invite") && access_token && refresh_token) {
      void supabase.auth.setSession({access_token,refresh_token}).then(({error})=>{
        setValid(!error); if(error) setMessage("This link has expired. Request a new password email.");
        window.history.replaceState(null,"",window.location.pathname);
      });
    } else { setMessage("Open the password setup or recovery link from your email."); }
  },[]);
  return <main className="staff-theme min-h-svh grid place-items-center bg-background text-foreground px-5">
    <div className="w-full max-w-sm py-10"><img src={LOGO_URL} alt="Mynus 360" className="size-24 object-contain mx-auto" />
      <h1 className="font-display text-3xl text-center my-6">Set your password</h1>
      {valid && !done && <form className="space-y-5" onSubmit={async e=>{
        e.preventDefault(); if(password!==confirm){setMessage("Passwords do not match.");return;}
        setBusy(true);setMessage("");
        try { const result=await supabase.auth.updateUser({password});if(result.error) throw result.error;
          await supabase.rpc("claim_owner");setDone(true);setMessage("Password saved. You can now sign in.");
        }catch {setMessage("Could not save. Use a stronger password or request a new email link.");}finally{setBusy(false);}
      }}>
        <label className="block">New password<Input className="mt-2 h-12" type="password" minLength={8} maxLength={72} autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
        <label className="block">Confirm password<Input className="mt-2 h-12" type="password" minLength={8} autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)} /></label>
        <Button className="w-full h-12" disabled={busy}>Save password</Button>
      </form>}
      {message && <p role="status" className="my-5">{message}</p>}
      <Button asChild variant="outline" className="mt-4 w-full h-12"><Link to="/staff">Staff sign in</Link></Button>
    </div>
  </main>;
}