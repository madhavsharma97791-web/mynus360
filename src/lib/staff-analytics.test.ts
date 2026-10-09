import { describe, expect, it } from "bun:test";
import { analytics, localDate, periodBounds } from "./staff-analytics";
import type { StaffOrder } from "./staff-order";

const order = (status: string, total: number, created_at = "2026-10-09T08:00:00Z"): StaffOrder => ({
  id: "test", order_number: 1, client_ref: null, order_type: "Takeaway", table_no: null,
  customer_name: null, customer_phone: null, notes: null,
  lines: [{ name: "Test item", size: "", qty: 2, price: total / 2 }], subtotal: total, total,
  payment_method: "Cash", payment_status: "unpaid", status, acknowledged_at: null,
  accepted_by: null, accepted_by_name: null, accepted_at: null, ready_at: null,
  completed_by: null, completed_by_name: null, completed_at: null,
  cancelled_by: null, cancelled_by_name: null, cancelled_at: null, cancel_reason: null, created_at,
});
describe("Actual-order reporting rules", () => {
  it("excludes cancelled orders from sales", () => {
    const { start, end } = periodBounds("2026-10-09", "daily");
    expect(analytics([order("completed", 200), order("cancelled", 300)], start, end).sales).toBe(200);
  });
  it("excludes cancelled orders from item popularity", () => {
    const { start, end } = periodBounds("2026-10-09", "daily");
    expect(analytics([order("completed", 200), order("cancelled", 300)], start, end).items[0]?.qty).toBe(2);
  });
  it("uses Asia/Kolkata midnight rather than UTC midnight", () => {
    expect(localDate("2026-10-08T19:00:00Z")).toBe("2026-10-09");
    const { start, end } = periodBounds("2026-10-09", "daily");
    expect(start.toISOString()).toBe("2026-10-08T18:30:00.000Z");
    expect(analytics([order("new", 200, "2026-10-08T19:00:00Z")], start, end).total).toBe(1);
  });
  it("covers the whole calendar month across unequal month lengths", () => {
    const { start, end } = periodBounds("2026-02-09", "monthly");
    expect(start.toISOString()).toBe("2026-01-31T18:30:00.000Z");
    expect(end.toISOString()).toBe("2026-02-28T18:30:00.000Z");
  });
  it("uses a seven-day Monday week", () => {
    const { start, end } = periodBounds("2026-10-09", "weekly");
    expect(localDate(start)).toBe("2026-10-05");
    expect((end.getTime() - start.getTime()) / 86400000).toBe(7);
  });
});