import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export type AccessStatus = {
  allowed: boolean;
  reason: "subscribed" | "trial" | "expired";
  trialEndsAt: string | null;
  daysLeft: number;
};

function clientIp(req: Request): string {
  const h = req.headers;
  const raw =
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";
  return raw.trim().toLowerCase();
}

async function hashIp(ip: string): Promise<string> {
  const salt = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "delvai";
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** يمنح كل جهاز/عنوان إنترنت شهرًا مجانيًا واحدًا، ثم يتطلب اشتراكًا فعّالًا. */
export const getAccessStatus = createServerFn({ method: "GET" })
  .inputValidator((data: { userId?: string | null; environment?: "sandbox" | "live" } | undefined) => data ?? {})
  .handler(async ({ data }): Promise<AccessStatus> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const env = data.environment === "live" ? "live" : "sandbox";

    if (data.userId) {
      const { data: subs } = await supabaseAdmin
        .from("subscriptions")
        .select("status,current_period_end")
        .eq("user_id", data.userId)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1);
      const sub = subs?.[0];
      if (sub) {
        const end = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;
        const future = end === null || end > Date.now();
        const active =
          (["active", "trialing", "past_due"].includes(sub.status) && future) ||
          (sub.status === "canceled" && end !== null && end > Date.now());
        if (active) {
          return { allowed: true, reason: "subscribed", trialEndsAt: null, daysLeft: 0 };
        }
      }
    }

    const ipHash = await hashIp(clientIp(getRequest()));

    const { data: existing } = await supabaseAdmin
      .from("trials")
      .select("expires_at")
      .eq("ip_hash", ipHash)
      .maybeSingle();

    let expiresAt = existing?.expires_at ?? null;
    if (!expiresAt) {
      const next = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: inserted } = await supabaseAdmin
        .from("trials")
        .insert({ ip_hash: ipHash, user_id: data.userId ?? null, expires_at: next })
        .select("expires_at")
        .maybeSingle();
      expiresAt = inserted?.expires_at ?? next;
    } else if (data.userId) {
      await supabaseAdmin.from("trials").update({ user_id: data.userId }).eq("ip_hash", ipHash);
    }

    const remainingMs = new Date(expiresAt).getTime() - Date.now();
    return {
      allowed: remainingMs > 0,
      reason: remainingMs > 0 ? "trial" : "expired",
      trialEndsAt: expiresAt,
      daysLeft: Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000))),
    };
  });
