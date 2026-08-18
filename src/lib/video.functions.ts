import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/videos";

const CreateInput = z.object({
  prompt: z.string().min(3).max(2000),
  seconds: z.enum(["4", "6", "8"]).default("8"),
  size: z.enum(["1280x720", "720x1280"]).default("1280x720"),
});

export const createVideoJob = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CreateInput.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/veo-3.1-lite",
        prompt: data.prompt,
        seconds: data.seconds,
        size: data.size,
      }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { message?: string } | null;
      return {
        ok: false as const,
        status: res.status,
        message: err?.message ?? "تعذّر بدء توليد الفيديو",
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
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch(`${GATEWAY}/${data.id}`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { message?: string } | null;
      return {
        ok: false as const,
        status: res.status,
        message: err?.message ?? "تعذّر جلب حالة المهمة",
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
        message: job.error?.message ?? "فشل توليد الفيديو",
      };
    }

    if (job.status !== "completed") {
      return {
        ok: true as const,
        done: false as const,
        progress: job.progress ?? 0,
      };
    }

    // Completed: resolve the short-lived signed download URL for playback.
    const contentRes = await fetch(`${GATEWAY}/${job.id}/content`, {
      headers: { Authorization: `Bearer ${key}` },
      redirect: "manual",
    });
    const location = contentRes.headers.get("location");
    if (location) {
      return { ok: true as const, done: true as const, progress: 100, url: location };
    }

    // Fallback: inline the bytes as a data URL.
    const bytes = new Uint8Array(await contentRes.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
    const base64 = btoa(binary);
    return {
      ok: true as const,
      done: true as const,
      progress: 100,
      url: `data:video/mp4;base64,${base64}`,
    };
  });
