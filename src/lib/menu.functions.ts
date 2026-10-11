import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { applyMenuOverrides } from "./menu-catalog";
import { MENU } from "./menu";

export const publicMenu = createServerFn({ method: "GET" }).handler(async () => {
  // Server-only read of non-sensitive catalog columns; direct table access is owner-only.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result = await supabaseAdmin.from("menu_overrides").select("item_id,available,prices");
  if (result.error) throw new Error("Menu is temporarily unavailable.");
  return applyMenuOverrides(result.data ?? []);
});
export const ownerMenu = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({context}) => {
  const role = await context.supabase.rpc("has_role", {_user_id:context.userId,_role:"owner"});
  const active = await context.supabase.rpc("is_active_staff", {_user_id:context.userId});
  if (!role.data || !active.data) throw new Error("Only the active owner can manage the menu.");
  const result = await context.supabase.from("menu_overrides").select("*");
  if (result.error) throw new Error(result.error.message);
  return result.data;
});
export const saveMenuItem = createServerFn({method:"POST"}).middleware([requireSupabaseAuth])
  .inputValidator(d=>z.object({itemId:z.string(),available:z.boolean(),prices:z.record(z.string(),z.number().int().min(0).max(100000))}).parse(d))
  .handler(async ({context,data}) => {
    const role = await context.supabase.rpc("has_role", {_user_id:context.userId,_role:"owner"});
    const active = await context.supabase.rpc("is_active_staff", {_user_id:context.userId});
    if (!role.data || !active.data) throw new Error("Only the active owner can manage the menu.");
    const item = MENU.find(i=>i.id===data.itemId);
    if (!item || Object.keys(data.prices).some(label=>!item.sizes.some(s=>s.label===label))) throw new Error("Unknown menu item or size.");
    const {supabaseAdmin} = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.from("menu_overrides").upsert({item_id:data.itemId,available:data.available,prices:data.prices,updated_at:new Date().toISOString()});
    if (result.error) throw new Error("Could not save this menu item.");
    return {ok:true};
  });