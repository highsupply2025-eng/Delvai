import { createFileRoute } from "@tanstack/react-router";

const URL_STT = "https://ai.gateway.lovable.dev/v1/audio/transcriptions";
const MODELS = new Set(["openai/gpt-4o-transcribe", "openai/gpt-4o-mini-transcribe"]);

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return json({ message: "خدمة التفريغ غير مهيأة" }, 500);

        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File) || file.size < 1024) {
          return json({ message: "الملف الصوتي فارغ أو غير صالح" }, 400);
        }
        if (file.size > 24 * 1024 * 1024) {
          return json({ message: "حجم الملف كبير جدًا (الحد 24 ميجابايت)" }, 400);
        }

        const model = String(form.get("model") ?? "");
        const language = String(form.get("language") ?? "").trim();
        const prompt = String(form.get("prompt") ?? "").trim();

        const upstream = new FormData();
        upstream.append("model", MODELS.has(model) ? model : "openai/gpt-4o-transcribe");
        upstream.append("file", file, file.name || "recording.wav");
        if (language && language !== "auto") upstream.append("language", language);
        if (prompt) upstream.append("prompt", prompt.slice(0, 800));

        const res = await fetch(URL_STT, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: upstream,
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          const message =
            res.status === 429
              ? "الطلبات كثيرة الآن، حاول بعد قليل."
              : res.status === 402
                ? "انتهى رصيد الذكاء الاصطناعي. يرجى إضافة رصيد."
                : res.status === 404
                  ? "خدمة التفريغ غير مفعّلة لهذا المشروع."
                  : "تعذّر تفريغ الصوت.";
          return json({ message, detail: detail.slice(0, 300) }, res.status);
        }

        const data = (await res.json()) as { text?: string };
        return json({ text: data.text ?? "" }, 200);
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
