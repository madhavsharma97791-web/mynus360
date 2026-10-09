import { createFileRoute } from "@tanstack/react-router";
import { StaffOrders } from "@/components/staff/StaffOrders";
export const Route = createFileRoute("/_authenticated/_staff/staff/orders")({
  head: () => ({ meta: [{ title: "Mynus 360 | Staff Orders" }, { name: "description", content: "Current and past restaurant orders for Mynus 360 staff." }, { property: "og:title", content: "Mynus 360 Orders" }, { property: "og:description", content: "Live restaurant order management." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: StaffOrders,
});