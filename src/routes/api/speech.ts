import { createFileRoute } from "@tanstack/react-router";

const URL_TTS = "https://ai.gateway.lovable.dev/v1/audio/speech";
const VOICES = new Set([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
]);

type Body = {
  text?: string;
  voice?: string;
  speed?: number;
  instructions?: string;
};

export const Route = createFileRoute("/api/speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return json({ message: "خدمة الصوت غير مهيأة" }, 500);

        const body = (await request.json()) as Body;
        const text = (body.text ?? "").trim();
        if (text.length < 1) return json({ message: "النص فارغ" }, 400);
        if (text.length > 4000) return json({ message: "النص طويل جدًا، قسّمه إلى مقاطع." }, 400);

        const upstream = await fetch(URL_TTS, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice: body.voice && VOICES.has(body.voice) ? body.voice : "alloy",
            response_format: "mp3",
            ...(typeof body.speed === "number" && body.speed >= 0.25 && body.speed <= 4
              ? { speed: body.speed }
              : {}),
            ...(body.instructions?.trim()
              ? { instructions: body.instructions.trim().slice(0, 600) }
              : {}),
          }),
        });

        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          const message =
            upstream.status === 429
              ? "الطلبات كثيرة الآن، حاول بعد قليل."
              : upstream.status === 402
                ? "انتهى رصيد الذكاء الاصطناعي. يرجى إضافة رصيد."
                : upstream.status === 404
                  ? "خدمة تحويل النص إلى صوت غير مفعّلة لهذا المشروع."
                  : "تعذّر توليد الصوت.";
          return json({ message, detail: detail.slice(0, 300) }, upstream.status);
        }

        return new Response(upstream.body, {
          headers: { "Content-Type": "audio/mpeg" },
        });
      },
    },
  },
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
