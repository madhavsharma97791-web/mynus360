import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "owner" }) => PromiseLike<{ data: boolean | null }> }; userId: string };

async function assertOwner(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" });
  if (!data) throw new Error("Only the owner can do this.");
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
    await supabaseAdmin.from("profiles").upsert({ id, email: data.email, full_name: data.fullName, active: true });
    await supabaseAdmin.from("user_roles").insert({ user_id: id, role: "worker" });
    return { ok: true as const };
  });

export const setWorkerActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context as unknown as Ctx);
    if (data.id === (context as unknown as Ctx).userId) return { ok: false as const, error: "You can't deactivate yourself." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({ active: data.active }).eq("id", data.id);
    await supabaseAdmin.auth.admin.updateUserById(data.id, { ban_duration: data.active ? "none" : "876000h" });
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  });

export const resetWorkerPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), password: z.string().min(8).max(72) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, { password: data.password });
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  });
