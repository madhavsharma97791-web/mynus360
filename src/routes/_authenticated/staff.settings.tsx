import { createFileRoute } from "@tanstack/react-router";
import { StaffSettings } from "@/components/staff/StaffWorkers";
import { ownerQuery } from "@/lib/staff-queries";
export const Route = createFileRoute("/_authenticated/staff/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(ownerQuery),
  head: () => ({ meta: [{ title: "Mynus 360 | Owner Settings" }, { name: "description", content: "Restaurant settings for the authorised Mynus 360 owner." }, { property: "og:title", content: "Mynus 360 Settings" }, { property: "og:description", content: "Owner-only restaurant settings." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: StaffSettings,
});