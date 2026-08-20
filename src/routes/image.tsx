import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Download, ImageIcon, Loader2, Upload, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolShell } from "@/components/ToolShell";
import { saveGeneration } from "@/lib/history.functions";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/image")({
  head: () => ({
    meta: [
      { title: "توليد وتحرير الصور بالذكاء الاصطناعي" },
      {
        name: "description",
        content: "أنشئ صورًا تسويقية عالية الجودة من وصف نصي، أو عدّل صورة موجودة بالذكاء الاصطناعي.",
      },
      { property: "og:title", content: "توليد وتحرير الصور" },
      { property: "og:description", content: "صور احترافية من وصف نصي خلال ثوانٍ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImageTool,
});

const STYLES = [
  { id: "photo", label: "تصوير واقعي", hint: "photorealistic, studio lighting, 50mm lens, high detail" },
  { id: "product", label: "صورة منتج", hint: "clean product photography on seamless background, soft shadows" },
  { id: "art", label: "رسم فني", hint: "digital illustration, rich colors, artistic composition" },
  { id: "3d", label: "ثلاثي الأبعاد", hint: "3d render, octane, soft global illumination" },
];

function ImageTool() {
  const save = useServerFn(saveGeneration);
  const { user } = useAuth();

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(STYLES[0]!.id);
  const [source, setSource] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSource(String(reader.result));
    reader.readAsDataURL(file);
  };

  const run = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    const hint = STYLES.find((s) => s.id === style)?.hint ?? "";
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: source
            ? `${prompt.trim()}. Keep the subject of the provided image. Style: ${hint}`
            : `${prompt.trim()}. Style: ${hint}`,
          image: source,
        }),
      });
      const json = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !json.url) {
        setError(json.message ?? "تعذّر توليد الصورة");
        return;
      }
      setResult(json.url);
      if (user) void save({ data: { tool: "صورة", prompt, result_url: json.url } });
    } catch {
      setError("تعذّر الاتصال بالخدمة. حاول مجددًا.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolShell
      title="توليد وتحرير الصور"
      subtitle="اكتب وصف الصورة، أو ارفع صورة موجودة واطلب التعديل عليها."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
          <Label htmlFor="p">وصف الصورة</Label>
          <Textarea
            id="p"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="مثال: عبوة أرز فاخرة على طاولة خشبية مع إضاءة دافئة وخلفية نظيفة"
            className="mt-2 resize-none bg-background/60"
          />

          <Label className="mt-6 block">النمط</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  style === s.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <Label htmlFor="src" className="mt-6 flex items-center gap-2">
            <Upload className="size-4" /> صورة للتعديل (اختياري)
          </Label>
          <Input
            id="src"
            type="file"
            accept="image/*"
            className="mt-2 bg-background/60"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {source && (
            <button
              type="button"
              onClick={() => setSource(null)}
              className="mt-2 text-xs text-muted-foreground hover:text-primary"
            >
              إزالة الصورة المرفوعة
            </button>
          )}

          <Button
            onClick={() => void run()}
            disabled={busy || !prompt.trim()}
            className="mt-7 w-full bg-cine text-primary-foreground shadow-glow"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            {source ? "تعديل الصورة" : "توليد الصورة"}
          </Button>

          {error && (
            <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
              {error}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-background/70">
            {result ? (
              <img src={result} alt={prompt} className="h-full w-full object-contain" />
            ) : (
              <div className="px-6 text-center text-muted-foreground">
                <ImageIcon className="mx-auto size-10 text-primary/70" />
                <p className="mt-3 text-sm">ستظهر صورتك هنا</p>
              </div>
            )}
          </div>
          {result && (
            <a href={result} download="image.png" className="mt-4 block">
              <Button variant="outline" className="w-full">
                <Download className="size-4" /> تنزيل الصورة
              </Button>
            </a>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
