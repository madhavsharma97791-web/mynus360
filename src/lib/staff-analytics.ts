import { orderLines, type StaffOrder } from "./staff-order";

export const localDate = (value: string | Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
export const localTime = (value: string) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
export function periodBounds(date: string, period: "daily" | "weekly" | "monthly") {
  const start = new Date(`${period === "monthly" ? date.slice(0, 7) + "-01" : date}T00:00:00+05:30`);
  if (period === "weekly") start.setUTCDate(start.getUTCDate() - (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7);
  const end = new Date(start);
  if (period === "monthly") {
    const next = new Date(`${date.slice(0, 7)}-01T12:00:00Z`);
    next.setUTCMonth(next.getUTCMonth() + 1);
    end.setTime(new Date(`${next.toISOString().slice(0, 10)}T00:00:00+05:30`).getTime());
  }
  else end.setUTCDate(end.getUTCDate() + (period === "weekly" ? 7 : 1));
  return { start, end };
}
export function analytics(orders: StaffOrder[], start: Date, end: Date) {
  const rows = orders.filter(o => new Date(o.created_at) >= start && new Date(o.created_at) < end);
  const salesOrders = rows.filter(o => o.status !== "cancelled");
  const sales = salesOrders.reduce((s, o) => s + o.total, 0);
  const items = new Map<string, { name: string; qty: number; sales: number }>();
  const trend = new Map<string, { date: string; orders: number; sales: number }>();
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour: `${hour}:00`, orders: 0 }));
  const payments = new Map<string, { method: string; orders: number; sales: number }>();
  for (const o of rows) {
    const date = localDate(o.created_at);
    const day = trend.get(date) ?? { date, orders: 0, sales: 0 };
    day.orders++; if (o.status !== "cancelled") day.sales += o.total; trend.set(date, day);
    const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hourCycle: "h23" }).format(new Date(o.created_at)));
    const bucket = hours[hour]; if (bucket) bucket.orders++;
    if (o.status === "cancelled") continue;
    const pay = payments.get(o.payment_method) ?? { method: o.payment_method, orders: 0, sales: 0 };
    pay.orders++; pay.sales += o.total; payments.set(o.payment_method, pay);
    for (const line of orderLines(o)) {
      const name = `${line.name}${line.size ? ` (${line.size})` : ""}`;
      const item = items.get(name) ?? { name, qty: 0, sales: 0 };
      item.qty += line.qty; item.sales += line.price * line.qty; items.set(name, item);
    }
  }
  const cancelled = rows.filter(o => o.status === "cancelled").length;
  return { rows, sales, total: rows.length, completed: rows.filter(o => o.status === "completed").length, cancelled,
    pending: rows.filter(o => ["new", "preparing", "ready"].includes(o.status)).length,
    average: salesOrders.length ? sales / salesOrders.length : 0,
    cancellationRate: rows.length ? cancelled / rows.length * 100 : 0,
    items: [...items.values()].sort((a, b) => b.qty - a.qty), days: [...trend.values()].sort((a,b) => a.date.localeCompare(b.date)), hours, payments: [...payments.values()] };
}