import { createFileRoute } from "@tanstack/react-router";
import { StaffReports } from "@/components/staff/StaffReports";
import { ownerQuery } from "@/lib/staff-queries";
export const Route = createFileRoute("/_authenticated/staff/overview")({
  loader: ({ context }) => context.queryClient.ensureQueryData(ownerQuery),
  head: () => ({ meta: [{ title: "Mynus 360 | Owner Overview" }, { name: "description", content: "Owner overview of Mynus 360 orders and sales." }, { property: "og:title", content: "Mynus 360 Owner Overview" }, { property: "og:description", content: "Restaurant order totals and performance." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <StaffReports overview />,
});