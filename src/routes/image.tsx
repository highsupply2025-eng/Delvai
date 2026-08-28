import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import {
  Download,
  Eraser,
  ImageIcon,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolShell } from "@/components/ToolShell";
import { saveGeneration } from "@/lib/history.functions";
import { chatComplete } from "@/lib/ai.functions";
import { useAuth } from "@/hooks/useAuth";
import { DelvaiThinkingLoader } from "@/components/DelvaiThinkingLoader";

export const Route = createFileRoute("/image")({
  head: () => ({
    meta: [
      { title: "استوديو الصور بالذكاء الاصطناعي — توليد وتحرير احترافي" },
      {
        name: "description",
        content:
          "استوديو صور متكامل: توليد صور واقعية، إزالة الخلفية، تحسين الدقة، توسيع الإطار، نص داخل الصورة، ونِسب أبعاد متعددة.",
      },
      { property: "og:title", content: "استوديو الصور بالذكاء الاصطناعي" },
      {
        property: "og:description",
        content: "توليد وتحرير الصور باحترافية: خلفيات، دقة عالية، أنماط سينمائية ونصوص داخل الصورة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImageTool,
});

const STYLES = [
  { id: "photo", label: "تصوير واقعي", hint: "photorealistic, 50mm lens, natural light, ultra detailed skin and texture" },
  { id: "cinematic", label: "سينمائي", hint: "cinematic still, anamorphic lens, dramatic rim lighting, film grain, teal and orange grade" },
  { id: "product", label: "صورة منتج", hint: "commercial product photography, seamless studio background, soft shadows, crisp reflections" },
  { id: "typography", label: "نص داخل الصورة", hint: "poster design with clean legible typography, perfect letterforms, balanced kerning" },
  { id: "art", label: "رسم رقمي", hint: "digital illustration, rich colors, painterly brushwork, artistic composition" },
  { id: "anime", label: "أنمي", hint: "anime key visual, cel shading, expressive eyes, vibrant palette" },
  { id: "3d", label: "ثلاثي الأبعاد", hint: "3d render, octane, subsurface scattering, soft global illumination" },
  { id: "minimal", label: "مينيمال", hint: "minimalist composition, negative space, muted palette, editorial layout" },
  { id: "logo", label: "شعار / أيقونة", hint: "flat vector logo mark, geometric, high contrast, centered on clean background" },
  { id: "arch", label: "عمارة وديكور", hint: "architectural visualization, wide angle, golden hour light, realistic materials" },
  { id: "food", label: "طعام", hint: "food photography, appetizing, shallow depth of field, natural window light" },
  { id: "fantasy", label: "خيالي ملحمي", hint: "epic fantasy concept art, volumetric light, highly detailed matte painting" },
] as const;

const RATIOS = [
  { id: "1:1", label: "مربّع 1:1", box: "aspect-square" },
  { id: "16:9", label: "عريض 16:9", box: "aspect-video" },
  { id: "9:16", label: "طولي 9:16", box: "aspect-[9/16]" },
  { id: "4:5", label: "إنستغرام 4:5", box: "aspect-[4/5]" },
  { id: "3:2", label: "كلاسيكي 3:2", box: "aspect-[3/2]" },
  { id: "21:9", label: "سينما 21:9", box: "aspect-[21/9]" },
] as const;

const QUALITY = [
  { id: "fast", label: "سريع", model: "google/gemini-3.1-flash-image", hint: "fast draft render" },
  { id: "pro", label: "احترافي", model: "google/gemini-3-pro-image", hint: "maximum fidelity, 4k detail, professional finish" },
] as const;

const EDIT_ACTIONS = [
  { id: "bg-remove", label: "إزالة الخلفية", prompt: "Remove the background completely and place the subject on a pure solid white background with clean precise edges. Keep the subject pixel-identical." },
  { id: "bg-replace", label: "استبدال الخلفية", prompt: "Replace the background with a clean professional studio backdrop with soft gradient lighting. Keep the subject unchanged and match the lighting realistically." },
  { id: "upscale", label: "تحسين الدقة", prompt: "Upscale and restore this image: sharpen fine details, remove noise and compression artifacts, recover realistic texture. Do not change composition or content." },
  { id: "retouch", label: "تنقيح احترافي", prompt: "Professional retouch: color grade, balance exposure, natural skin retouching, remove blemishes and dust. Keep identity and composition unchanged." },
  { id: "object-remove", label: "إزالة عنصر", prompt: "Remove the unwanted objects described below and reconstruct the background seamlessly." },
  { id: "outpaint", label: "توسيع الإطار", prompt: "Expand the canvas outward (outpainting), naturally continuing the scene, lighting and perspective beyond the original edges." },
  { id: "restyle", label: "تغيير النمط", prompt: "Restyle this image according to the description below while preserving the subject layout and proportions." },
  { id: "product-shot", label: "صورة منتج تجارية", prompt: "Turn this into a premium commercial product shot: seamless studio background, soft shadow, subtle reflection, advertising quality lighting." },
] as const;

type Tab = "generate" | "edit";
type Shot = { url: string; prompt: string };

function ImageTool() {
  const save = useServerFn(saveGeneration);
  const enhanceFn = useServerFn(chatComplete);
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("generate");
  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState("");
  const [style, setStyle] = useState<string>(STYLES[0].id);
  const [ratio, setRatio] = useState<string>(RATIOS[0].id);
  const [quality, setQuality] = useState<string>("pro");
  const [count, setCount] = useState(1);
  const [action, setAction] = useState<string>(EDIT_ACTIONS[0].id);

  const [refs, setRefs] = useState<string[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [active, setActive] = useState<Shot | null>(null);
  const [busy, setBusy] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ratioBox = RATIOS.find((r) => r.id === ratio)?.box ?? "aspect-square";

  const addFiles = (files: FileList | File[] | null | undefined) => {
    if (!files) return;
    Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 4)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => setRefs((p) => [...p, String(reader.result)].slice(0, 4));
        reader.readAsDataURL(file);
      });
  };

  const enhance = async () => {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const res = await enhanceFn({
        data: {
          system:
            "أنت خبير في هندسة أوامر توليد الصور. حوّل وصف المستخدم إلى وصف إنجليزي احترافي مفصّل (موضوع، تكوين، إضاءة، عدسة، ألوان، مزاج، جودة) في فقرة واحدة قصيرة دون مقدمات أو علامات تنسيق.",
          messages: [{ role: "user", content: prompt.trim() }],
          model: "google/gemini-2.5-flash",
        },
      });
      if (res.ok && res.text) setPrompt(res.text.trim());
    } finally {
      setEnhancing(false);
    }
  };

  const run = async () => {
    if (busy) return;
    const isEdit = tab === "edit";
    if (isEdit && refs.length === 0) {
      setError("ارفع صورة أولًا لتحريرها");
      return;
    }
    if (!isEdit && !prompt.trim()) return;

    const styleHint = STYLES.find((s) => s.id === style)?.hint ?? "";
    const q = QUALITY.find((x) => x.id === quality) ?? QUALITY[1];
    const editPrompt = EDIT_ACTIONS.find((a) => a.id === action)?.prompt ?? "";

    const finalPrompt = isEdit
      ? `${editPrompt}${prompt.trim() ? ` Details: ${prompt.trim()}.` : ""} ${q.hint}.`
      : `${prompt.trim()}. Style: ${styleHint}. ${q.hint}.`;

    setBusy(true);
    setError(null);
    try {
      const n = isEdit ? 1 : count;
      const results = await Promise.all(
        Array.from({ length: n }, () =>
          fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: finalPrompt,
              images: refs,
              aspect: isEdit ? undefined : ratio,
              negative: negative.trim() || undefined,
              quality: q.label,
              model: q.model,
            }),
          }).then(async (r) => (await r.json()) as { url?: string; message?: string }),
        ),
      );

      const ok = results.filter((r) => r.url).map((r) => ({ url: r.url as string, prompt: finalPrompt }));
      if (ok.length === 0) {
        setError(results[0]?.message ?? "تعذّر توليد الصورة");
        return;
      }
      setShots((p) => [...ok, ...p].slice(0, 24));
      setActive(ok[0]!);
      if (user)
        ok.forEach((s) =>
          void save({ data: { tool: "صورة", prompt: prompt || editPrompt, result_url: s.url } }),
        );
    } catch {
      setError("تعذّر الاتصال بالخدمة. حاول مجددًا.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolShell
      title="استوديو الصور"
      subtitle="توليد وتحرير احترافي: أنماط متعددة، نِسب أبعاد، تحسين الوصف تلقائيًا، إزالة خلفية، رفع دقة، توسيع إطار وصور مرجعية."
    >
      <div className="mb-6 inline-flex rounded-xl border border-border bg-card/70 p-1">
        {(["generate", "edit"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
              tab === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "generate" ? "توليد صورة" : "تحرير صورة"}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <Label htmlFor="p">{tab === "edit" ? "تفاصيل التعديل (اختياري)" : "وصف الصورة"}</Label>
            <Button variant="ghost" size="sm" onClick={() => void enhance()} disabled={enhancing || !prompt.trim()}>
              {enhancing ? <DelvaiThinkingLoader size="xs" /> : <Sparkles className="size-4" />}
              تحسين الوصف
            </Button>
          </div>
          <Textarea
            id="p"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              tab === "edit"
                ? "مثال: اجعل الخلفية رخام أبيض وأضف ظلًا ناعمًا"
                : "مثال: عبوة أرز فاخرة على طاولة خشبية مع إضاءة دافئة وخلفية نظيفة"
            }
            className="mt-2 resize-none bg-background/60"
          />

          {tab === "generate" ? (
            <>
              <Label htmlFor="neg" className="mt-5 flex items-center gap-2">
                <Eraser className="size-4" /> ما لا تريده في الصورة (Negative)
              </Label>
              <Input
                id="neg"
                value={negative}
                onChange={(e) => setNegative(e.target.value)}
                placeholder="نص مشوّه، أيادٍ غير طبيعية، ضبابية، علامات مائية"
                className="mt-2 bg-background/60"
              />

              <Label className="mt-6 block">النمط</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={`rounded-xl border px-3 py-2 text-xs transition-colors ${
                      style === s.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <Label className="mt-6 block">نسبة الأبعاد</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {RATIOS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRatio(r.id)}
                    className={`rounded-xl border px-2 py-2 text-xs transition-colors ${
                      ratio === r.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <Label className="block">الجودة</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {QUALITY.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setQuality(q.id)}
                        className={`rounded-xl border px-2 py-2 text-xs transition-colors ${
                          quality === q.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="block">عدد النسخ</Label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCount(n)}
                        className={`rounded-xl border py-2 text-xs transition-colors ${
                          count === n
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Label className="mt-6 block">نوع التعديل</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {EDIT_ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAction(a.id)}
                    className={`rounded-xl border px-3 py-2 text-xs transition-colors ${
                      action === a.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <Label className="mt-6 flex items-center gap-2">
            <Upload className="size-4" />
            {tab === "edit" ? "الصورة المراد تحريرها" : "صور مرجعية (اختياري — حتى ٤)"}
          </Label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
            className="mt-2 cursor-pointer rounded-xl border border-dashed border-border bg-background/40 px-4 py-6 text-center text-xs text-muted-foreground hover:border-primary/50"
          >
            اسحب الصور هنا أو اضغط للاختيار
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {refs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {refs.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="مرجع" className="size-16 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setRefs((p) => p.filter((_, x) => x !== i))}
                    className="absolute -top-2 -end-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={() => void run()}
            disabled={busy || (tab === "generate" ? !prompt.trim() : refs.length === 0)}
            className="mt-7 w-full bg-cine text-primary-foreground shadow-glow"
          >
            {busy ? <DelvaiThinkingLoader size="xs" /> : <Wand2 className="size-4" />}
            {tab === "edit" ? "تطبيق التعديل" : "توليد الصورة"}
          </Button>

          {error && (
            <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
              {error}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
          <div
            className={`flex ${tab === "generate" ? ratioBox : "aspect-square"} items-center justify-center overflow-hidden rounded-xl bg-background/70`}
          >
            {busy && !active ? (
              <div className="text-center text-muted-foreground p-6">
                <DelvaiThinkingLoader size="lg" />
                <p className="mt-4 text-sm font-medium animate-pulse text-foreground/90">دلفاي يفكّر ويرسم بالذكاء الاصطناعي…</p>
              </div>
            ) : active ? (
              <img src={active.url} alt={active.prompt} className="h-full w-full object-contain" />
            ) : (
              <div className="px-6 text-center text-muted-foreground">
                <ImageIcon className="mx-auto size-10 text-primary/70" />
                <p className="mt-3 text-sm">ستظهر صورتك هنا</p>
              </div>
            )}
          </div>

          {active && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href={active.url} download="image.png">
                <Button variant="outline" className="w-full">
                  <Download className="size-4" /> تنزيل
                </Button>
              </a>
              <Button
                variant="outline"
                onClick={() => {
                  setRefs([active.url]);
                  setTab("edit");
                }}
              >
                <Wand2 className="size-4" /> تحرير هذه الصورة
              </Button>
            </div>
          )}

          {shots.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {shots.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(s)}
                  className={`overflow-hidden rounded-lg border ${
                    active?.url === s.url ? "border-primary" : "border-border"
                  }`}
                >
                  <img src={s.url} alt="نتيجة" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
