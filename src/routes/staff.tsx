import { createFileRoute } from "@tanstack/react-router";
import { StaffLogin } from "@/components/staff/StaffLogin";
export const Route = createFileRoute("/staff")({
  head: () => ({ meta: [{ title: "Mynus 360 | Staff Sign In" }, { name: "description", content: "Secure staff sign in for Mynus 360 order management." }, { property: "og:title", content: "Mynus 360 Staff" }, { property: "og:description", content: "Staff sign in for restaurant orders." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: StaffLogin,
});