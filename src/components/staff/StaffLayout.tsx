import { useEffect, useState } from "react";
import { Outlet, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { BellRing, ClipboardList, BarChart3, Users, Settings, LogOut, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LOGO_URL, rupee } from "@/lib/menu";
import { staffQuery } from "@/lib/staff-queries";
import { startStaffAlarm } from "@/lib/staff-alarm";
import { OrderActions } from "./StaffOrders";

export function StaffLayout() {
  const { data } = useSuspenseQuery(staffQuery); const qc = useQueryClient();
  const [sound, setSound] = useState(false); const [connected, setConnected] = useState("Connecting");
  const fresh = data.orders.filter(o => o.status === "new" && !o.acknowledged_at);
  const alarm = fresh.length > 0;
  useEffect(() => {
    const channel = supabase.channel("staff-order-feed").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { void qc.invalidateQueries({ queryKey: ["staff-orders"] }); }).subscribe(status => {
      setConnected(status === "SUBSCRIBED" ? "Live" : "Reconnecting");
      if (status === "SUBSCRIBED") void qc.invalidateQueries({ queryKey: ["staff-orders"] });
    });
    const focus = () => { void qc.invalidateQueries({ queryKey: ["staff-orders"] }); };
    window.addEventListener("online", focus);
    return () => { void supabase.removeChannel(channel); window.removeEventListener("online", focus); };
  }, [qc]);
  useEffect(() => { if (sound && alarm) return startStaffAlarm(); return undefined; }, [sound, alarm]);
  const links = data.owner ? [
    { to: "/staff/overview" as const, label: "Overview", Icon: BarChart3 },
    { to: "/staff/orders" as const, label: "All Orders", Icon: ClipboardList },
    { to: "/staff/analytics" as const, label: "Analytics", Icon: BarChart3 },
    { to: "/staff/workers" as const, label: "Workers", Icon: Users },
    { to: "/staff/settings" as const, label: "Settings", Icon: Settings },
  ] : [{ to: "/staff/orders" as const, label: "Orders", Icon: ClipboardList }];
  return <div className="staff-theme min-h-screen bg-background text-foreground">
    <header className="flex items-center gap-3 border-b bg-card px-4 py-3 md:px-8">
      <img src={LOGO_URL} alt="" className="size-12 object-contain" /><span className="font-display text-2xl">MYNUS 360</span>
      <span className="ml-auto text-sm text-muted-foreground" role="status">{connected}</span>
      <Button variant={sound ? "default" : "outline"} onClick={() => setSound(v => !v)} aria-pressed={sound} title="Order alarm"><Volume2 /><span className="hidden sm:inline">{sound ? "Sound on" : "Enable sound"}</span></Button>
      <Button variant="ghost" size="icon" title="Sign out" onClick={() => void supabase.auth.signOut()}><LogOut /></Button>
    </header>
    <div className="md:grid md:grid-cols-[200px_1fr]">
      <nav className="fixed bottom-0 inset-x-0 z-20 flex justify-around border-t bg-card md:static md:flex-col md:justify-start md:border-t-0 md:border-r md:p-4 md:gap-2" aria-label="Staff navigation">
        {links.map(({ to, label, Icon }) => <Link key={to} to={to} className="flex flex-col md:flex-row items-center gap-1 md:gap-3 px-2 py-3 text-xs md:text-base" activeProps={{ className: "bg-primary text-primary-foreground rounded-md font-bold" }}><Icon className="size-5" />{label}</Link>)}
        <div className="hidden md:block mt-8 text-sm text-muted-foreground">{data.profile.full_name || data.profile.email}<br />{data.owner ? "Owner" : "Worker"}</div>
      </nav>
      <main className="min-w-0 px-4 py-6 pb-28 md:p-8">
        {alarm && <section role="alert" className="mb-6 border-l-4 border-accent bg-primary/20 p-4">
          <div className="flex items-center gap-3 font-bold text-lg"><BellRing className="text-accent" />{fresh.length} new {fresh.length === 1 ? "order" : "orders"}</div>
          {fresh.map(o => <div key={o.id} className="mt-3 flex flex-wrap items-center justify-between gap-3"><strong>M360-{o.order_number} · {o.table_no ? `Table ${o.table_no}` : "Takeaway"} · {rupee(o.total)}</strong><OrderActions order={o} /></div>)}
        </section>}
        <Outlet />
      </main>
    </div>
  </div>;
}