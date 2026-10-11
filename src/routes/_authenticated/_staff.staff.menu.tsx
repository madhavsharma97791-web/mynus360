import { createFileRoute } from "@tanstack/react-router";
import { StaffMenu, ownerMenuQuery } from "@/components/staff/StaffMenu";
export const Route=createFileRoute("/_authenticated/_staff/staff/menu")({
  loader:({context})=>context.queryClient.ensureQueryData(ownerMenuQuery),
  head:()=>({meta:[{title:"Mynus 360 | Owner Menu"},{name:"description",content:"Manage existing Mynus 360 menu prices and availability."},{property:"og:title",content:"Mynus 360 Menu Management"},{property:"og:description",content:"Owner-only menu price and availability settings."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),component:StaffMenu,
});