import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { staffQuery, ownerQuery } from "@/lib/staff-queries";
import { analytics, localDate, periodBounds } from "@/lib/staff-analytics";
import { rupee } from "@/lib/menu";
import { exportCsv } from "./StaffOrders";

export function StaffReports({ overview = false }: { overview?: boolean }) {
  useSuspenseQuery(ownerQuery);
  const { data } = useSuspenseQuery(staffQuery);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [date, setDate] = useState(localDate(new Date())); const [search, setSearch] = useState("");
  const { start, end } = periodBounds(date, period);
  const report = analytics(data.orders, start, end);
  const prevEnd = start;
  const prevAnchor = new Date(start.getTime() - 86400000);
  const prevBounds = periodBounds(localDate(prevAnchor), period);
  const previous = analytics(data.orders, prevBounds.start, prevEnd);
  const items = report.items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const weeks = new Map<string, { date: string; orders: number; sales: number }>();
  for (const day of report.days) {
    const week = localDate(periodBounds(day.date, "weekly").start);
    const value = weeks.get(week) ?? { date: week, orders: 0, sales: 0 };
    value.orders += day.orders; value.sales += day.sales; weeks.set(week, value);
  }
  return <>
    <h1 className="font-display text-3xl mb-6">{overview ? "Overview" : "Analytics"}</h1>
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {!overview && <div className="flex gap-2">{(["daily", "weekly", "monthly"] as const).map(p => <Button key={p} variant={period === p ? "default" : "secondary"} onClick={() => setPeriod(p)} className="capitalize h-11">{p}</Button>)}</div>}
      <Input type="date" aria-label="Report date" className="w-44 h-11 bg-card" value={date} onChange={e => { if (e.target.value) setDate(e.target.value); }} />
      <Button variant="outline" disabled={!report.rows.length} onClick={() => exportCsv(report.rows.map(o => ({ order: `M360-${o.order_number}`, date: localDate(o.created_at), status: o.status, total: o.total, method: o.payment_method, payment_status: o.payment_status })), `mynus-${period}-${date}.csv`)}><Download />Export</Button>
    </div>
    <p className="mb-5 text-sm text-muted-foreground">{localDate(start)} — {localDate(new Date(end.getTime() - 1))} · Asia/Kolkata</p>
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">{[
      ["Total orders", report.total], ["Completed", report.completed], ["Cancelled", report.cancelled], ["Pending", report.pending], ["Order sales", rupee(report.sales)], ["Average order", rupee(Math.round(report.average))],
    ].map(([label, value]) => <div key={label} className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><strong className="block mt-2 text-2xl">{value}</strong></div>)}</div>
    {previous.total > 0 && period !== "daily" && <p className="mb-6">Previous {period === "weekly" ? "week" : "month"}: {previous.total} orders · {rupee(previous.sales)} sales{previous.sales > 0 ? ` · ${((report.sales - previous.sales) / previous.sales * 100).toFixed(1)}% change` : ""}</p>}
    <p className="mb-6 text-sm text-muted-foreground">Cancellation rate: {report.cancellationRate.toFixed(1)}% · Sales exclude cancelled orders. Payment collected: {rupee(report.rows.filter(o => o.status !== "cancelled" && o.payment_status === "paid").reduce((sum,o) => sum + o.total, 0))}</p>
    {!report.total ? <p className="py-16 text-center text-muted-foreground">No orders in this period.</p> : <>
      <h2 className="font-bold text-xl mb-4">{period === "daily" ? "Hourly orders" : "Daily orders"}</h2>
      <div className="h-64 mb-8 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={period === "daily" ? report.hours : report.days}><XAxis dataKey={period === "daily" ? "hour" : "date"} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)" }} /><Tooltip /><Bar dataKey="orders" fill="var(--chart-1)" /></BarChart></ResponsiveContainer></div>
      {period !== "daily" && <><h2 className="text-xl font-bold mb-3">Daily breakdown</h2><Breakdown rows={report.days} />{period === "monthly" && <><h2 className="text-xl font-bold mb-3 mt-6">Weekly breakdown</h2><Breakdown rows={[...weeks.values()]} /></>}</>}
      <h2 className="font-bold text-xl mt-8 mb-4">Food sales</h2>
      <div className="flex flex-wrap gap-6 text-sm mb-4"><p>Most ordered: <strong>{report.items[0]?.name ?? "—"}</strong></p><p>Least ordered: <strong>{report.items.at(-1)?.name ?? "—"}</strong></p></div>
      <div className="flex gap-3 mb-4"><Input aria-label="Search food sales" placeholder="Search food" className="bg-card max-w-sm" value={search} onChange={e => setSearch(e.target.value)} /><Button variant="outline" disabled={!items.length} onClick={() => exportCsv(items, "mynus-food-sales.csv")}><Download />CSV</Button></div>
      <div className="overflow-x-auto"><table className="w-full text-left"><thead className="border-b text-muted-foreground"><tr><th className="py-3">Item</th><th>Quantity</th><th>Sales</th></tr></thead><tbody>{items.map(i => <tr key={i.name} className="border-b"><td className="py-3 pr-4">{i.name}</td><td>{i.qty}</td><td>{rupee(i.sales)}</td></tr>)}</tbody></table></div>
      <h2 className="font-bold text-xl mt-8 mb-4">Payment methods</h2><div className="flex flex-wrap gap-8">{report.payments.map(p => <div key={p.method}><strong>{p.method}</strong><p>{p.orders} orders · {rupee(p.sales)}</p></div>)}</div>
    </>}
  </>;
}
function Breakdown({ rows }: { rows: { date: string; orders: number; sales: number }[] }) {
  return <div className="overflow-x-auto"><table className="w-full text-left"><thead className="border-b text-muted-foreground"><tr><th className="py-2">Date</th><th>Orders</th><th>Sales</th></tr></thead><tbody>{rows.map(r => <tr className="border-b" key={r.date}><td className="py-2">{r.date}</td><td>{r.orders}</td><td>{rupee(r.sales)}</td></tr>)}</tbody></table></div>;
}