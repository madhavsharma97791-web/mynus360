import { createFileRoute } from "@tanstack/react-router";
import { StaffWorkers } from "@/components/staff/StaffWorkers";
import { ownerQuery } from "@/lib/staff-queries";
export const Route = createFileRoute("/_authenticated/staff/workers")({
  loader: ({ context }) => context.queryClient.ensureQueryData(ownerQuery),
  head: () => ({ meta: [{ title: "Mynus 360 | Worker Management" }, { name: "description", content: "Owner-only staff account management for Mynus 360." }, { property: "og:title", content: "Mynus 360 Workers" }, { property: "og:description", content: "Manage authorised restaurant workers." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: StaffWorkers,
});