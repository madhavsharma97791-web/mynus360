import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MENU } from "./menu";

// Public: the kiosk places orders here. Prices and totals are recomputed from the
// trusted menu on the server; client_ref makes a retried submit idempotent.
const input = z.object({
  clientRef: z.string().min(8).max(64),
  type: z.enum(["Dine In", "Takeaway"]),
  table: z.string().max(10).optional(),
  customerName: z.string().max(80).optional(),
  customerPhone: z.string().max(20).optional(),
  notes: z.string().max(300).optional(),
  payment: z.enum(["Cash", "UPI"]),
  lines: z.array(z.object({
    itemId: z.string().max(80), size: z.string().max(20), qty: z.number().int().min(1).max(50),
  })).min(1).max(60),
});

export type PlacedOrder = { ok: true; number: string; total: number } | { ok: false; error: string };

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data }): Promise<PlacedOrder> => {
    const lines = [];
    for (const l of data.lines) {
      const item = MENU.find((m) => m.id === l.itemId);
      const size = item?.sizes.find((s) => s.label === l.size);
      if (!item || !size) return { ok: false, error: "An item in your order is no longer available." };
      lines.push({ itemId: item.id, name: item.name, size: size.label, price: size.price, qty: l.qty });
    }
    if (data.type === "Dine In" && !data.table) return { ok: false, error: "Please choose a table." };
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const existing = await supabaseAdmin.from("orders").select("order_number,total").eq("client_ref", data.clientRef).maybeSingle();
    if (existing.data) return { ok: true, number: `M360-${existing.data.order_number}`, total: existing.data.total };

    const { data: row, error } = await supabaseAdmin.from("orders").insert({
      client_ref: data.clientRef,
      order_type: data.type,
      table_no: data.type === "Dine In" ? data.table ?? null : null,
      customer_name: data.customerName?.trim() || null,
      customer_phone: data.customerPhone?.trim() || null,
      notes: data.notes?.trim() || null,
      lines, subtotal, total: subtotal,
      payment_method: data.payment,
    }).select("order_number,total").single();
    if (error || !row) {
      console.error("[placeOrder]", error);
      return { ok: false, error: "Could not send your order. Please try again." };
    }
    return { ok: true, number: `M360-${row.order_number}`, total: row.total };
  });
