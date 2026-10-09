import { createFileRoute } from "@tanstack/react-router";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { staffQuery } from "@/lib/staff-queries";
export const Route = createFileRoute("/_authenticated/staff")({
  loader: ({ context }) => context.queryClient.ensureQueryData(staffQuery),
  component: StaffLayout,
});