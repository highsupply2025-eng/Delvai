import { createFileRoute } from "@tanstack/react-router";

const CHAT_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

type InMsg = {
  role: "user" | "assistant";
  content: string;
  images?: string[];
};

type Body = {
  system?: string;
  model?: string;
  messages?: InMsg[];
};

const ALLOWED = new Set([
  "google/gemini-3.7-flash",
  "google/gemini-3.1-flash-lite",
  "google/gemini-3.1-pro-preview",
]);

/** بث محادثة الذكاء الاصطناعي (SSE) لعرض الإجابة كلمة بكلمة. */
export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("مفتاح الذكاء الاصطناعي غير مهيأ", { status: 500 });

        const body = (await request.json().catch(() => null)) as Body | null;
        const msgs = body?.messages;
        if (!Array.isArray(msgs) || msgs.length === 0) {
          return new Response("رسائل غير صالحة", { status: 400 });
        }
        const model = body?.model && ALLOWED.has(body.model) ? body.model : "google/gemini-3.7-flash";

        const upstream = await fetch(CHAT_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            stream: true,
            messages: [
              ...(body?.system ? [{ role: "system", content: body.system }] : []),
              ...msgs.slice(-24).map((m) =>
                m.images && m.images.length > 0
                  ? {
                      role: m.role,
                      content: [
                        { type: "text", text: m.content },
                        ...m.images.slice(0, 4).map((url) => ({
                          type: "image_url",
                          image_url: { url },
                        })),
                      ],
                    }
                  : { role: m.role, content: m.content },
              ),
            ],
          }),
          signal: request.signal,
        });

        if (!upstream.ok || !upstream.body) {
          const raw = (await upstream.json().catch(() => null)) as
            | { error?: { message?: string }; message?: string }
            | null;
          const fallback =
            upstream.status === 429
              ? "تم تجاوز حد الطلبات، حاول بعد قليل."
              : upstream.status === 402
                ? "انتهى رصيد الذكاء الاصطناعي. يرجى إضافة رصيد."
                : "تعذّر إتمام الطلب.";
          return new Response(raw?.error?.message ?? raw?.message ?? fallback, {
            status: upstream.status || 500,
          });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
