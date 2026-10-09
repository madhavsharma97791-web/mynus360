import type { Database } from "@/integrations/supabase/types";
export type StaffOrder = Database["public"]["Tables"]["orders"]["Row"];
export function orderLines(order: StaffOrder) {
  if (!Array.isArray(order.lines)) return [];
  return order.lines.flatMap(line => {
    if (!line || typeof line !== "object" || Array.isArray(line)) return [];
    if (typeof line['name'] !== "string" || typeof line['qty'] !== "number" || typeof line['price'] !== "number") return [];
    return [{ name: line['name'], qty: line['qty'], price: line['price'], size: typeof line['size'] === "string" ? line['size'] : "" }];
  });
}