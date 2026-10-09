import { queryOptions } from "@tanstack/react-query";
import { staffSnapshot, ownerData } from "./staff-data.functions";
import type { Database } from "@/integrations/supabase/types";

export type StaffOrder = Database["public"]["Tables"]["orders"]["Row"];
export const staffQuery = queryOptions({ queryKey: ["staff-orders"], queryFn: () => staffSnapshot(), refetchInterval: 15000 });
export const ownerQuery = queryOptions({ queryKey: ["owner-data"], queryFn: () => ownerData() });
export function orderLines(order: StaffOrder) {
  const lines = order.lines;
  if (!Array.isArray(lines)) return [];
  return lines.flatMap(line => {
    if (!line || typeof line !== "object" || Array.isArray(line)) return [];
    if (typeof line.name !== "string" || typeof line.qty !== "number" || typeof line.price !== "number") return [];
    return [{ name: line.name, qty: line.qty, price: line.price, size: typeof line.size === "string" ? line.size : "" }];
  });
}