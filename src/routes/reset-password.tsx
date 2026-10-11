import { createFileRoute } from "@tanstack/react-router";
import { PasswordSetup } from "@/components/staff/PasswordSetup";
export const Route = createFileRoute("/reset-password")({
  head:()=>({meta:[{title:"Mynus 360 | Password Setup"},{name:"description",content:"Securely set or recover your Mynus 360 account password."},{property:"og:title",content:"Mynus 360 Password Setup"},{property:"og:description",content:"Private account password setup and recovery."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),
  component:PasswordSetup,
});