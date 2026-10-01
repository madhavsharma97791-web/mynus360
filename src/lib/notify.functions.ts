import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { orderText, type NotifyResult, type Order } from "./order-types";

// Sends new-order notifications to the owner.
// Email: needs RESEND_API_KEY + OWNER_EMAIL (full address) + optional EMAIL_FROM.
// WhatsApp: needs WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID (Meta WhatsApp Cloud API) + OWNER_WHATSAPP.
// Without these, status is "not_configured" — never reported as sent.
const lineSchema = z.object({
  key: z.string(), itemId: z.string(), name: z.string().max(120), size: z.string().max(20),
  price: z.number().nonnegative(), qty: z.number().int().positive().max(99),
});
const orderSchema = z.object({
  number: z.string().max(20), type: z.enum(["Dine In", "Takeaway"]), table: z.string().max(10).optional(),
  customerName: z.string().max(80).optional(), customerPhone: z.string().max(20).optional(),
  lines: z.array(lineSchema).min(1).max(100), subtotal: z.number(), total: z.number(),
  payment: z.enum(["Cash", "UPI"]), createdAt: z.string(),
});

function emailHtml(o: Order) {
  const rows = o.lines.map((l) =>
    `<tr><td>${l.name}</td><td>${l.size || "-"}</td><td align="center">${l.qty}</td><td align="right">₹${l.price * l.qty}</td></tr>`).join("");
  return `<div style="font-family:Arial;max-width:560px"><div style="background:#111;color:#f7c716;padding:16px;font-size:22px;font-weight:bold">MYNUS 360 — NEW ORDER #${o.number}</div>
<p><b>Type:</b> ${o.type}${o.table ? ` · Table ${o.table}` : ""}<br/><b>Customer:</b> ${o.customerName || "-"} ${o.customerPhone || ""}<br/><b>Payment:</b> ${o.payment}<br/><b>Time:</b> ${new Date(o.createdAt).toLocaleString("en-IN")}</p>
<table width="100%" cellpadding="6" style="border-collapse:collapse;border:1px solid #ddd"><tr style="background:#f7c716"><th align="left">Item</th><th>Size</th><th>Qty</th><th align="right">Price</th></tr>${rows}</table>
<p style="font-size:18px"><b>Subtotal:</b> ₹${o.subtotal}<br/><b>Total: ₹${o.total}</b></p></div>`;
}

export const notifyOwner = createServerFn({ method: "POST" })
  .inputValidator((d) => orderSchema.parse(d))
  .handler(async ({ data }): Promise<NotifyResult> => {
    const o = data as Order;
    const result: NotifyResult = { email: "not_configured", whatsapp: "not_configured", errors: [] };

    const resendKey = process.env.RESEND_API_KEY;
    const ownerEmail = process.env.OWNER_EMAIL ?? "madhavsharma@97791"; // TODO: replace with full address
    if (resendKey && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ownerEmail)) {
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM ?? "MYNUS 360 Kiosk <onboarding@resend.dev>",
            to: [ownerEmail], subject: `New order #${o.number} — ₹${o.total}`, html: emailHtml(o),
          }),
        });
        result.email = r.ok ? "sent" : "failed";
        if (!r.ok) result.errors.push(`email: ${r.status} ${await r.text()}`);
      } catch (e) { result.email = "failed"; result.errors.push(`email: ${String(e)}`); }
    }

    const waToken = process.env.WHATSAPP_TOKEN;
    const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (waToken && waPhoneId) {
      try {
        const r = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
          method: "POST",
          headers: { Authorization: `Bearer ${waToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp", to: process.env.OWNER_WHATSAPP ?? "917889194214",
            type: "text", text: { body: orderText(o) },
          }),
        });
        result.whatsapp = r.ok ? "sent" : "failed";
        if (!r.ok) result.errors.push(`whatsapp: ${r.status} ${await r.text()}`);
      } catch (e) { result.whatsapp = "failed"; result.errors.push(`whatsapp: ${String(e)}`); }
    }
    if (result.errors.length) console.error("[notify] order", o.number, result.errors);
    return result;
  });
