import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: { rpc: (fn: string, args: { _user_id: string; _role?: "owner" }) => PromiseLike<{ data: boolean | null }> }; userId: string };

async function assertOwner(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" });
  const active = await context.supabase.rpc("is_active_staff", { _user_id: context.userId });
  if (!data || !active.data) throw new Error("Only the active owner can do this.");
}

export const createWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    fullName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(120),
    password: z.string().min(8).max(72),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) return { ok: false as const, error: error?.message ?? "Could not create account" };
    const id = created.user.id;
    const profile = await supabaseAdmin.from("profiles").upsert({ id, email: data.email, full_name: data.fullName, active: true });
    const role = profile.error ? { error: profile.error } : await supabaseAdmin.from("user_roles").insert({ user_id: id, role: "worker" });
    if (role.error) {
      await supabaseAdmin.auth.admin.deleteUser(id);
      return { ok: false as const, error: "Could not create worker access. Please try again." };
    }
    return { ok: true as const };
  });

export const setWorkerActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context as unknown as Ctx);
    if (data.id === (context as unknown as Ctx).userId) return { ok: false as const, error: "You can't deactivate yourself." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const role = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.id);
    if (!role.data?.some(r => r.role === "worker") || role.data.some(r => r.role === "owner")) return { ok: false as const, error: "Only worker accounts can be changed here." };
    const { error } = await supabaseAdmin.from("profiles").update({ active: data.active }).eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    const auth = await supabaseAdmin.auth.admin.updateUserById(data.id, { ban_duration: data.active ? "none" : "876000h" });
    if (auth.error) return { ok: false as const, error: "Staff access updated, but the sign-in restriction could not be updated. Please retry." };
    return { ok: true as const };
  });

export const resetWorkerPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), password: z.string().min(8).max(72) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const role = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.id);
    if (!role.data?.some(r => r.role === "worker") || role.data.some(r => r.role === "owner")) return { ok: false as const, error: "Only worker passwords can be changed here." };
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, { password: data.password });
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  });
