import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, X, ChefHat, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rupee } from "@/lib/menu";
import { staffQuery, orderLines, type StaffOrder } from "@/lib/staff-queries";
import { changeOrder } from "@/lib/staff-data.functions";
import { localTime, localDate } from "@/lib/staff-analytics";

export function exportCsv(rows: Record<string, unknown>[], name: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0] ?? {});
  const cell = (value: unknown) => { let text = String(value ?? ""); if (/^[=+@\-]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"`; };
  const content = [keys.map(cell).join(","), ...rows.map(row => keys.map(k => cell(row[k])).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
export function OrderActions({ order }: { order: StaffOrder }) {
  const change = useServerFn(changeOrder); const qc = useQueryClient();
  const [busy, setBusy] = useState(false); const [cancel, setCancel] = useState(false); const [reason, setReason] = useState(""); const [error, setError] = useState("");
  const update = async (status: "preparing" | "ready" | "completed" | "cancelled") => {
    setBusy(true); setError("");
    try { await change({ data: { id: order.id, status, ...(status === "cancelled" ? { reason } : {}) } }); setCancel(false); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update this order."); }
    finally { await qc.invalidateQueries({ queryKey: ["staff-orders"] }); setBusy(false); }
  };
  if (["completed", "cancelled"].includes(order.status)) return null;
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      <Button disabled={busy} className="h-12 font-bold" onClick={() => void update(order.status === "new" ? "preparing" : order.status === "preparing" ? "ready" : "completed")}><ChefHat />{order.status === "new" ? "Accept order" : order.status === "preparing" ? "Mark ready" : "Complete · payment received"}</Button>
      <Button variant="outline" disabled={busy} className="h-12 text-destructive" onClick={() => setCancel(v => !v)}><X />Cancel</Button>
    </div>
    {cancel && <form className="flex gap-2" onSubmit={e => { e.preventDefault(); void update("cancelled"); }}><Input aria-label="Cancellation reason" required maxLength={300} placeholder="Cancellation reason" value={reason} onChange={e => setReason(e.target.value)} /><Button variant="destructive" disabled={busy || !reason.trim()}><Check />Confirm</Button></form>}
    {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
  </div>;
}
export function StaffOrders() {
  const { data } = useSuspenseQuery(staffQuery);
  const [tab, setTab] = useState("Current Orders"); const [search, setSearch] = useState(""); const [date, setDate] = useState(""); const [status, setStatus] = useState("");
  const filtered = data.orders.filter(o => {
    const current = ["new", "preparing", "ready"].includes(o.status);
    const inTab = data.owner || (tab === "Current Orders" ? current : tab === "Completed Orders" ? o.status === "completed" : !current);
    return inTab && (!status || o.status === status) && (!date || localDate(o.created_at) === date) && `${o.order_number} ${o.table_no ?? ""} ${o.customer_name ?? ""}`.toLowerCase().includes(search.toLowerCase());
  });
  return <>
    <div className="flex justify-between gap-4 items-center mb-6"><h1 className="font-display text-3xl">{data.owner ? "All Orders" : "Orders"}</h1>{data.owner && <Button variant="outline" disabled={!filtered.length} onClick={() => exportCsv(filtered.map(o => ({ order: `M360-${o.order_number}`, date: localDate(o.created_at), table: o.table_no, status: o.status, total: o.total, payment: o.payment_method, payment_status: o.payment_status })), "mynus-orders.csv")}><Download />CSV</Button>}</div>
    {!data.owner && <div className="flex gap-2 mb-6">{["Current Orders", "Past Orders", "Completed Orders"].map(t => <Button className="flex-1 h-12 whitespace-normal" key={t} variant={tab === t ? "default" : "secondary"} onClick={() => setTab(t)}>{t}</Button>)}</div>}
    <div className="flex flex-wrap gap-3 mb-6"><Input className="max-w-sm bg-card h-11" aria-label="Search orders" placeholder="Order number, table or customer" value={search} onChange={e => setSearch(e.target.value)} /><Input className="w-44 bg-card h-11" type="date" aria-label="Order date" value={date} onChange={e => setDate(e.target.value)} /><select className="h-11 rounded-md border bg-card px-3" aria-label="Order status" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{["new","preparing","ready","completed","cancelled"].map(s => <option key={s}>{s}</option>)}</select></div>
    {!filtered.length && <p className="py-16 text-center text-muted-foreground">No orders found.</p>}
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{filtered.map(o => <article key={o.id} className={`rounded-lg border bg-card p-5 ${o.status === "new" ? "border-accent" : ""}`}>
      <div className="flex justify-between gap-2"><strong className="text-xl">M360-{o.order_number}</strong><span className="capitalize font-semibold text-muted-foreground">{o.status}</span></div>
      <div className="mt-3 text-3xl font-display">{o.table_no ? `TABLE ${o.table_no}` : "TAKEAWAY"}</div>
      <p className="text-sm text-muted-foreground mt-1">{localDate(o.created_at)} · {localTime(o.created_at)} · {Math.max(0, Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000))} min</p>
      {o.customer_name && <p className="mt-2 font-semibold">{o.customer_name}{o.customer_phone ? ` · ${o.customer_phone}` : ""}</p>}
      <ul className="my-4 space-y-2 border-y py-4">{orderLines(o).map((l,i) => <li key={i} className="flex justify-between gap-2"><span><strong>{l.qty} ×</strong> {l.name} {l.size && <span className="text-muted-foreground">({l.size})</span>}</span><span>{rupee(l.qty * l.price)}</span></li>)}</ul>
      {o.notes && <p className="mb-4 text-accent font-semibold">{o.notes}</p>}
      <div className="flex justify-between mb-4"><span>{o.payment_method} · {o.payment_status}</span><strong className="text-xl">{rupee(o.total)}</strong></div>
      <OrderActions order={o} />
      {(o.accepted_by_name || o.cancel_reason || o.completed_by_name) && <details className="mt-4 text-sm text-muted-foreground"><summary>Order history</summary><div className="mt-2 space-y-1">{o.accepted_at && <p>Accepted: {o.accepted_by_name} · {localTime(o.accepted_at)}</p>}{o.ready_at && <p>Ready: {localTime(o.ready_at)}</p>}{o.completed_at && <p>Completed: {o.completed_by_name} · {localTime(o.completed_at)}</p>}{o.cancelled_at && <p>Cancelled: {o.cancelled_by_name} · {o.cancel_reason} · {localTime(o.cancelled_at)}</p>}</div></details>}
    </article>)}</div>
  </>;
}