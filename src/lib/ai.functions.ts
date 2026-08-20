import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CHAT_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const ChatInput = z.object({
  system: z.string().max(4000).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(60000),
        images: z.array(z.string().max(8_000_000)).max(4).optional(),
      }),
    )
    .min(1)
    .max(40),
  model: z.string().default("google/gemini-2.5-flash"),
});


export const chatComplete = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ChatInput.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, message: "مفتاح الذكاء الاصطناعي غير مهيأ" };

    const res = await fetch(CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: data.model,
        messages: [
          ...(data.system ? [{ role: "system", content: data.system }] : []),
          ...data.messages,
        ],
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: { message?: string };
        message?: string;
      } | null;
      const fallback =
        res.status === 429
          ? "تم تجاوز حد الطلبات، حاول بعد قليل."
          : res.status === 402
            ? "انتهى رصيد الذكاء الاصطناعي. يرجى إضافة رصيد."
            : "تعذّر إتمام الطلب.";
      return {
        ok: false as const,
        message: body?.error?.message ?? body?.message ?? fallback,
      };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return { ok: true as const, text: json.choices?.[0]?.message?.content ?? "" };
  });
