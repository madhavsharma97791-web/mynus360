import { createFileRoute } from "@tanstack/react-router";
import { StaffReports } from "@/components/staff/StaffReports";
import { ownerQuery } from "@/lib/staff-queries";
export const Route = createFileRoute("/_authenticated/_staff/staff/analytics")({
  loader: ({ context }) => context.queryClient.ensureQueryData(ownerQuery),
  head: () => ({ meta: [{ title: "Mynus 360 | Sales Analytics" }, { name: "description", content: "Daily, weekly and monthly Mynus 360 sales reports." }, { property: "og:title", content: "Mynus 360 Analytics" }, { property: "og:description", content: "Real restaurant order and food sales reports." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: StaffReports,
});