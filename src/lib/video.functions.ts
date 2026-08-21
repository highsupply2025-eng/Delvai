import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/videos";

const MODELS = ["google/veo-3.1-lite", "google/veo-3.1-fast", "google/veo-3.1"] as const;

const MediaInput = z.object({
  bytesBase64Encoded: z.string().min(10).max(24_000_000),
  mimeType: z.string().min(3).max(40),
});

const CreateInput = z.object({
  prompt: z.string().min(3).max(4000),
  negativePrompt: z.string().max(1000).optional(),
  model: z.enum(MODELS).default("google/veo-3.1-lite"),
  durationSeconds: z.union([z.literal(4), z.literal(6), z.literal(8)]).default(8),
  resolution: z.enum(["720p", "1080p", "4k"]).default("720p"),
  aspectRatio: z.enum(["16:9", "9:16"]).default("16:9"),
  generateAudio: z.boolean().default(true),
  seed: z.number().int().min(0).max(4294967295).optional(),
  image: MediaInput.optional(),
  lastFrame: MediaInput.optional(),
  // Extension: continue a previously generated clip (fetched server-side from its URL).
  extendFromUrl: z.string().max(200000).optional(),
});

function gatewayMessage(status: number, fallback: string) {
  if (status === 429) return "الطلبات كثيرة الآن أو هناك فيديو قيد التوليد. انتظر قليلًا ثم أعد المحاولة.";
  if (status === 402) return "لا يوجد رصيد كافٍ لتوليد الفيديو. يرجى إضافة رصيد ثم المحاولة.";
  if (status === 401 || status === 403) return "خدمة الفيديو غير مفعّلة لهذا المشروع.";
  return fallback;
}

async function toBase64(url: string): Promise<{ bytesBase64Encoded: string; mimeType: string } | null> {
  try {
    if (url.startsWith("data:")) {
      const [head, b64] = url.split(",");
      if (!b64) return null;
      return { bytesBase64Encoded: b64, mimeType: head?.slice(5).split(";")[0] || "video/mp4" };
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength > 22_000_000) return null;
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
    return { bytesBase64Encoded: btoa(binary), mimeType: "video/mp4" };
  } catch {
    return null;
  }
}

export const createVideoJob = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CreateInput.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, status: 500, message: "خدمة الفيديو غير مهيأة" };

    const instance: Record<string, unknown> = { prompt: data.prompt };
    const parameters: Record<string, unknown> = {
      durationSeconds: data.durationSeconds,
      resolution: data.resolution,
      sampleCount: 1,
      generateAudio: data.generateAudio,
    };

    if (data.negativePrompt?.trim()) parameters["negativePrompt"] = data.negativePrompt.trim();
    if (typeof data.seed === "number") parameters["seed"] = data.seed;

    if (data.extendFromUrl) {
      const media = await toBase64(data.extendFromUrl);
      if (!media) {
        return {
          ok: false as const,
          status: 400,
          message: "تعذّر قراءة الفيديو السابق للتمديد. جرّب توليدًا جديدًا.",
        };
      }
      instance["video"] = media;
      parameters["durationSeconds"] = 7;
    } else if (data.image) {
      instance["image"] = data.image;
      if (data.lastFrame && data.model !== "google/veo-3.1-lite") instance["lastFrame"] = data.lastFrame;
    } else {
      parameters["aspectRatio"] = data.aspectRatio;
    }

    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: data.model, instances: [instance], parameters }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { message?: string } | null;
      return {
        ok: false as const,
        status: res.status,
        message: err?.message ?? gatewayMessage(res.status, "تعذّر بدء توليد الفيديو"),
      };
    }

    const job = (await res.json()) as { id: string; status: string; progress?: number };
    return { ok: true as const, id: job.id, status: job.status, progress: job.progress ?? 0 };
  });

const StatusInput = z.object({ id: z.string().min(1) });

export const getVideoJob = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => StatusInput.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, status: 500, message: "خدمة الفيديو غير مهيأة" };

    const res = await fetch(`${GATEWAY}/${data.id}`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { message?: string } | null;
      return {
        ok: false as const,
        status: res.status,
        message: err?.message ?? gatewayMessage(res.status, "تعذّر جلب حالة المهمة"),
      };
    }

    const job = (await res.json()) as {
      id: string;
      status: string;
      progress?: number;
      error?: { code?: string; message?: string };
    };

    if (job.status === "failed") {
      return {
        ok: false as const,
        status: 200,
        message:
          job.error?.code === "moderation_blocked"
            ? "تم حظر المشهد بواسطة فلاتر الأمان. عدّل الوصف أو الصورة المرجعية ثم أعد المحاولة."
            : (job.error?.message ?? "فشل توليد الفيديو"),
      };
    }

    if (job.status !== "completed") {
      return { ok: true as const, done: false as const, progress: job.progress ?? 0 };
    }

    const contentRes = await fetch(`${GATEWAY}/${job.id}/content`, {
      headers: { Authorization: `Bearer ${key}` },
      redirect: "manual",
    });
    const location = contentRes.headers.get("location");
    if (location) {
      return { ok: true as const, done: true as const, progress: 100, url: location };
    }

    const bytes = new Uint8Array(await contentRes.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
    return {
      ok: true as const,
      done: true as const,
      progress: 100,
      url: `data:video/mp4;base64,${btoa(binary)}`,
    };
  });
