import { createFileRoute } from "@tanstack/react-router";

type Body = { prompt?: string; image?: string | null };

export const Route = createFileRoute("/api/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { prompt, image } = (await request.json()) as Body;
        if (!prompt || prompt.trim().length < 3) {
          return new Response(JSON.stringify({ message: "الوصف قصير جدًا" }), { status: 400 });
        }

        const content = image
          ? [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } },
            ]
          : prompt;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image",
            messages: [{ role: "user", content }],
            modalities: ["image", "text"],
          }),
        });

        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          const message =
            upstream.status === 429
              ? "تم تجاوز حد الطلبات، حاول بعد قليل."
              : upstream.status === 402
                ? "انتهى رصيد الذكاء الاصطناعي. يرجى إضافة رصيد."
                : "تعذّر توليد الصورة.";
          return new Response(JSON.stringify({ message, detail: text.slice(0, 400) }), {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        const json = (await upstream.json()) as Record<string, unknown>;
        const url = extractImage(json);
        if (!url) {
          return new Response(JSON.stringify({ message: "لم يتم استلام صورة من النموذج" }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ url }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});

function extractImage(json: Record<string, unknown>): string | null {
  const data = json["data"] as { b64_json?: string; url?: string }[] | undefined;
  if (data?.[0]?.b64_json) return `data:image/png;base64,${data[0].b64_json}`;
  if (data?.[0]?.url) return data[0].url;

  const choices = json["choices"] as
    | { message?: { images?: { image_url?: { url?: string } }[] } }[]
    | undefined;
  const fromChoice = choices?.[0]?.message?.images?.[0]?.image_url?.url;
  return fromChoice ?? null;
}
