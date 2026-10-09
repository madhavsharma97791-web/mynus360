import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { UserPlus, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ownerQuery, staffQuery } from "@/lib/staff-queries";
import { createWorker, setWorkerActive, resetWorkerPassword } from "@/lib/staff.functions";
import { saveStoreName } from "@/lib/staff-data.functions";

export function StaffWorkers() {
  const { data } = useSuspenseQuery(ownerQuery); const { data: staff } = useSuspenseQuery(staffQuery);
  const qc = useQueryClient(); const create = useServerFn(createWorker); const active = useServerFn(setWorkerActive); const reset = useServerFn(resetWorkerPassword);
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const [resetId, setResetId] = useState(""); const [newPassword, setNewPassword] = useState("");
  const run = async (action: () => Promise<{ ok: boolean; error?: string }>, success: string) => { setBusy(true); setMessage(""); try { const result = await action(); setMessage(result.ok ? success : result.error ?? "Could not save."); } catch (err) { setMessage(err instanceof Error ? err.message : "Could not save."); } finally { await qc.invalidateQueries({ queryKey: ["owner-data"] }); setBusy(false); } };
  const workers = data.workers.filter(w => data.roles.some(r => r.user_id === w.id && r.role === "worker"));
  return <><h1 className="font-display text-3xl mb-6">Workers</h1>
    <form className="flex flex-wrap gap-3 border-b pb-6 mb-6" onSubmit={e => { e.preventDefault(); const form = e.currentTarget; const values = new FormData(form); void run(async () => { const result = await create({ data: { fullName: String(values.get("name")), email: String(values.get("email")), password: String(values.get("password")) } }); if (result.ok) form.reset(); return result; }, "Worker created."); }}>
      <Input className="max-w-xs h-11 bg-card" name="name" placeholder="Full name" aria-label="Worker name" required maxLength={80} />
      <Input className="max-w-xs h-11 bg-card" name="email" type="email" placeholder="Email" aria-label="Worker email" required />
      <Input className="max-w-xs h-11 bg-card" name="password" type="password" placeholder="Temporary password" aria-label="Worker password" autoComplete="new-password" minLength={8} required />
      <Button className="h-11" disabled={busy}><UserPlus />Create worker</Button>
    </form>
    {message && <p role="status" className="mb-4 font-semibold">{message}</p>}
    <div className="space-y-4">{workers.map(w => <article className="border rounded-lg bg-card p-5" key={w.id}>
      <div className="flex flex-wrap justify-between gap-4"><div><strong className="text-lg">{w.full_name}</strong><p className="text-muted-foreground">{w.email}</p><p className="mt-2 text-sm">{staff.orders.filter(o => o.accepted_by === w.id).length} accepted · {staff.orders.filter(o => o.completed_by === w.id).length} completed</p></div>
      <div className="flex gap-3 items-center"><label className="flex items-center gap-2"><input type="checkbox" checked={w.active} disabled={busy} onChange={e => void run(() => active({ data: { id: w.id, active: e.target.checked } }), "Account updated.")} />Active</label><Button variant="outline" disabled={busy} onClick={() => setResetId(resetId === w.id ? "" : w.id)}><KeyRound />Reset password</Button></div></div>
      {resetId === w.id && <form className="mt-4 flex gap-3" onSubmit={e => { e.preventDefault(); void run(async () => { const result = await reset({ data: { id: w.id, password: newPassword } }); if (result.ok) { setResetId(""); setNewPassword(""); } return result; }, "Password updated."); }}><Input aria-label="New worker password" type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={e => setNewPassword(e.target.value)} /><Button disabled={busy}>Save</Button></form>}
    </article>)}</div>{!workers.length && <p className="py-12 text-muted-foreground">No workers yet.</p>}
  </>;
}
export function StaffSettings() {
  const { data } = useSuspenseQuery(ownerQuery); const save = useServerFn(saveStoreName); const qc = useQueryClient();
  const [name, setName] = useState(data.settings?.store_name ?? "MYNUS 360"); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  return <><h1 className="font-display text-3xl mb-6">Settings</h1><form className="max-w-lg space-y-5" onSubmit={async e => { e.preventDefault(); setBusy(true); try { await save({ data: { name } }); await qc.invalidateQueries({ queryKey: ["owner-data"] }); setMessage("Saved."); } catch (err) { setMessage(err instanceof Error ? err.message : "Could not save."); } finally { setBusy(false); } }}><label className="block font-semibold">Store name<Input className="mt-2 h-12 bg-card" required maxLength={80} value={name} onChange={e => setName(e.target.value)} /></label><p>Owner email: {data.settings?.owner_email ?? "Not configured"}</p><p className="text-muted-foreground">Asia/Kolkata · Indian rupee (₹)</p><Button disabled={busy}>Save settings</Button>{message && <p role="status">{message}</p>}</form></>;
}