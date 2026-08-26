import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

type PaddleEvent = {
  event_type?: string;
  data?: {
    id?: string;
    customer_id?: string;
    status?: string;
    scheduled_change?: { action?: string } | null;
    current_billing_period?: { starts_at?: string; ends_at?: string } | null;
    custom_data?: { userId?: string } | null;
    items?: Array<{
      price?: {
        id?: string;
        import_meta?: { external_id?: string } | null;
        product?: { import_meta?: { external_id?: string } | null; id?: string } | null;
        product_id?: string;
      } | null;
    }>;
  };
};

function verify(signatureHeader: string | null, body: string, secret: string): boolean {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(";").map((p) => p.split("=") as [string, string]),
  );
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;
  const expected = createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex");
  const a = Buffer.from(h1);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/paddle-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = url.searchParams.get("env") === "live" ? "live" : "sandbox";
        const secret =
          env === "live"
            ? process.env["PAYMENTS_LIVE_WEBHOOK_SECRET"]
            : process.env["PAYMENTS_SANDBOX_WEBHOOK_SECRET"];
        if (!secret) return new Response("Webhook not configured", { status: 500 });

        const body = await request.text();
        if (!verify(request.headers.get("paddle-signature"), body, secret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const event = JSON.parse(body) as PaddleEvent;
        if (!event.event_type?.startsWith("subscription.")) return new Response("ok");

        const d = event.data;
        const userId = d?.custom_data?.userId;
        const subscriptionId = d?.id;
        const item = d?.items?.[0]?.price;
        const priceId = item?.import_meta?.external_id;
        const productId = item?.product?.import_meta?.external_id;
        if (!userId || !subscriptionId || !priceId || !productId) {
          console.warn("paddle webhook: missing userId or importMeta.externalId");
          return new Response("ok");
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: userId,
            paddle_subscription_id: subscriptionId,
            paddle_customer_id: d?.customer_id ?? "",
            product_id: productId,
            price_id: priceId,
            status: d?.status ?? "active",
            current_period_start: d?.current_billing_period?.starts_at ?? null,
            current_period_end: d?.current_billing_period?.ends_at ?? null,
            cancel_at_period_end: d?.scheduled_change?.action === "cancel",
            environment: env,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "paddle_subscription_id" },
        );
        if (error) {
          console.error("paddle webhook upsert failed", error.message);
          return new Response("error", { status: 500 });
        }
        return new Response("ok");
      },
    },
  },
});
