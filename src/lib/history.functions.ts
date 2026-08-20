import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SaveInput = z.object({
  tool: z.string().min(1).max(40),
  prompt: z.string().max(8000).optional(),
  result_text: z.string().max(20000).optional(),
  result_url: z.string().max(200000).optional(),
});

export const saveGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SaveInput.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("generations").insert({
      user_id: context.userId,
      tool: data.tool,
      prompt: data.prompt ?? null,
      result_text: data.result_text ?? null,
      result_url: data.result_url ?? null,
    });
    return { ok: !error };
  });

export const listGenerations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("generations")
      .select("id, tool, prompt, result_text, result_url, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return { ok: false as const, items: [] };
    return { ok: true as const, items: data ?? [] };
  });

const DeleteInput = z.object({ id: z.string().uuid() });

export const deleteGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => DeleteInput.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("generations").delete().eq("id", data.id);
    return { ok: !error };
  });
