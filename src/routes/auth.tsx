import { createFileRoute } from "@tanstack/react-router";
import { StaffLogin } from "@/components/staff/StaffLogin";
export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Mynus 360 | Account Sign In" }, { name: "description", content: "Sign in to your authorised Mynus 360 staff account." }, { property: "og:title", content: "Mynus 360 Account" }, { property: "og:description", content: "Secure access to Mynus 360 staff accounts." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: StaffLogin,
});