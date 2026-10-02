export type CartLine = { key: string; itemId: string; name: string; size: string; price: number; qty: number };
export type Order = {
  number: string;
  type: "Dine In" | "Takeaway";
  table?: string | undefined;
  customerName?: string | undefined;
  customerPhone?: string | undefined;
  lines: CartLine[];
  subtotal: number;
  total: number;
  payment: "Cash" | "UPI";
  createdAt: string;
};
export type NotifyStatus = "sent" | "not_configured" | "failed";
export type NotifyResult = { email: NotifyStatus; whatsapp: NotifyStatus; errors: string[] };

export const OWNER_WHATSAPP = "917889194214";

export function orderText(o: Order) {
  const items = o.lines
    .map((l) => `${l.qty} × ${l.name}${l.size ? ` (${l.size})` : ""} — ₹${l.price * l.qty}`)
    .join("\n");
  return [
    `🔔 NEW ORDER — MYNUS 360`, ``, `Order #${o.number}`, `Order Type: ${o.type}`,
    o.table ? `Table: ${o.table}` : "", o.customerName ? `Name: ${o.customerName}` : "",
    o.customerPhone ? `Phone: ${o.customerPhone}` : "", ``, `Items:`, items, ``,
    `Subtotal: ₹${o.subtotal}`, `Total: ₹${o.total}`, `Payment: ${o.payment}`,
    `Time: ${new Date(o.createdAt).toLocaleString("en-IN")}`,
  ].filter((l) => l !== "" || true).join("\n").replace(/\n{3,}/g, "\n\n");
}
