import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const staffSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const profile = await supabase.from("profiles").select("*").eq("id", userId).single();
    const roles = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!profile.data?.active || !roles.data?.length) throw new Error("This account is not authorised for staff access.");
    const owner = roles.data.some(r => r.role === "owner");
    const orders = [];
    for (let offset = 0; ; offset += 1000) {
      const page = await supabase.from("orders").select("*").order("created_at", { ascending: false }).range(offset, offset + 999);
      if (page.error) throw new Error(page.error.message);
      orders.push(...(page.data ?? []));
      if ((page.data?.length ?? 0) < 1000) break;
    }
    return { profile: profile.data, owner, orders };
  });

export const changeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(d => z.object({ id: z.string().uuid(), status: z.enum(["preparing", "ready", "completed", "cancelled"]), reason: z.string().max(300).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("transition_order", { p_order: data.id, p_to: data.status, ...(data.reason ? { p_reason: data.reason } : {}) });
    if (result.error) throw new Error(result.error.message);
    return result.data;
  });

export const ownerData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const active = await supabase.rpc("is_active_staff", { _user_id: userId });
    const role = await supabase.rpc("has_role", { _user_id: userId, _role: "owner" });
    if (!active.data || !role.data) throw new Error("Only the owner can access this page.");
    const [workers, roles, settings, events] = await Promise.all([
      supabase.from("profiles").select("*"), supabase.from("user_roles").select("*"),
      supabase.from("app_settings").select("*").eq("id", 1).single(),
      supabase.from("order_events").select("*").order("created_at", { ascending: false }).limit(1000),
    ]);
    for (const result of [workers, roles, settings, events]) if (result.error) throw new Error(result.error.message);
    return { workers: workers.data ?? [], roles: roles.data ?? [], settings: settings.data, events: events.data ?? [] };
  });

export const saveStoreName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(d => z.object({ name: z.string().trim().min(1).max(80) }).parse(d))
  .handler(async ({ context, data }) => {
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" });
    const active = await context.supabase.rpc("is_active_staff", { _user_id: context.userId });
    if (!role.data || !active.data) throw new Error("Only the owner can change settings.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.from("app_settings").update({ store_name: data.name, updated_at: new Date().toISOString() }).eq("id", 1);
    if (result.error) throw new Error(result.error.message);
    return { ok: true };
  });