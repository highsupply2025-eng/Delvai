import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  Clapperboard,
  Download,
  Film,
  ImagePlus,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ToolShell } from "@/components/ToolShell";
import { useAuth } from "@/hooks/useAuth";
import { createVideoJob, getVideoJob } from "@/lib/video.functions";
import { DelvaiThinkingLoader } from "@/components/DelvaiThinkingLoader";
import { chatComplete } from "@/lib/ai.functions";
import { saveGeneration } from "@/lib/history.functions";

export const Route = createFileRoute("/video")({
  head: () => ({
    meta: [
      { title: "استوديو الفيديو السينمائي بالذكاء الاصطناعي" },
      {
        name: "description",
        content:
          "استوديو فيديو متكامل: نص إلى فيديو، صورة إلى فيديو، تمديد المشاهد، حركة كاميرا وإضاءة وصوت — بجودة حتى 4K.",
      },
      { property: "og:title", content: "استوديو الفيديو السينمائي" },
      {
        property: "og:description",
        content: "حوّل الوصف أو الصورة إلى فيديو سينمائي بالحركة والصوت، ومدّد المشهد لمدة أطول.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VideoTool,
});

type Mode = "text" | "image" | "extend";

const STYLES = [
  { id: "cinematic", label: "سينمائي", hint: "cinematic film look, anamorphic lens, film grain, professional color grading" },
  { id: "epic", label: "ملحمي", hint: "epic wide establishing shot, golden hour light, sweeping scale" },
  { id: "noir", label: "نوار ليلي", hint: "film noir, rain, neon reflections, high contrast shadows" },
  { id: "doc", label: "وثائقي", hint: "handheld documentary camera, natural colors, shallow depth of field" },
  { id: "dream", label: "حلمي", hint: "dreamy slow motion, soft haze, bloom highlights" },
  { id: "commercial", label: "إعلاني", hint: "high-end commercial product shot, glossy lighting, macro details" },
  { id: "anime", label: "أنمي", hint: "anime style animation, expressive cel shading, dynamic motion lines" },
  { id: "3d", label: "ثري دي", hint: "stylized 3D animation, ray traced lighting, pixar-like rendering" },
  { id: "drone", label: "تصوير جوي", hint: "aerial drone footage, smooth flight path, vast landscape" },
  { id: "vintage", label: "كلاسيكي 16mm", hint: "vintage 16mm film, halation, warm faded palette" },
];

const CAMERAS = [
  { id: "static", label: "ثابتة", hint: "locked-off static camera" },
  { id: "dolly", label: "دولّي أمامي", hint: "slow dolly-in push toward the subject" },
  { id: "orbit", label: "دوران حول", hint: "smooth 180 degree orbit around the subject" },
  { id: "crane", label: "كرين علوي", hint: "crane shot rising up to reveal the scene" },
  { id: "tracking", label: "تتبّع جانبي", hint: "lateral tracking shot following the subject" },
  { id: "handheld", label: "محمولة", hint: "subtle handheld camera shake" },
  { id: "zoom", label: "زووم بطيء", hint: "slow telephoto zoom" },
];

const LIGHTS = [
  { id: "golden", label: "ساعة ذهبية", hint: "golden hour sunlight, warm rim light" },
  { id: "blue", label: "ساعة زرقاء", hint: "blue hour, cool ambient light" },
  { id: "studio", label: "استوديو", hint: "soft studio key light with fill" },
  { id: "neon", label: "نيون", hint: "neon practical lights, colored gels" },
  { id: "moody", label: "درامي", hint: "low key dramatic lighting, deep shadows" },
  { id: "natural", label: "طبيعي", hint: "overcast natural daylight" },
];

const MODELS = [
  { id: "google/veo-3.1" as const, label: "Veo 3.1 4K سينمائي", note: "أعلى جودة إخراج وتفاصيل سينمائية" },
  { id: "google/veo-3.1-fast" as const, label: "Veo 3.1 متوازن", note: "توليد سريع بجودة سينمائية ممتازة" },
  { id: "google/veo-3.1-lite" as const, label: "Veo 3.1 Lite اقتصادي", note: "سريع وخفيف للتجارب والمسودات" },
];

const RATIOS = [
  { id: "16:9" as const, label: "أفقي 16:9" },
  { id: "9:16" as const, label: "عمودي 9:16" },
];

const RESOLUTIONS = ["720p", "1080p", "4k"] as const;
const DURATIONS = [4, 6, 8] as const;

type Clip = {
  id: string;
  url: string;
  prompt: string;
  ratio: "16:9" | "9:16";
};

function readFile(file: File): Promise<{ bytesBase64Encoded: string; mimeType: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const b64 = url.split(",")[1] ?? "";
      resolve({ bytesBase64Encoded: b64, mimeType: file.type || "image/png", preview: url });
    };
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

function VideoTool() {
  const create = useServerFn(createVideoJob);
  const poll = useServerFn(getVideoJob);
  const chat = useServerFn(chatComplete);
  const save = useServerFn(saveGeneration);
  const { user } = useAuth();

  const [mode, setMode] = useState<Mode>("text");
  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState("");
  const [style, setStyle] = useState(STYLES[0]!.id);
  const [camera, setCamera] = useState(CAMERAS[1]!.id);
  const [light, setLight] = useState(LIGHTS[0]!.id);
  const [model, setModel] = useState<(typeof MODELS)[number]["id"]>("google/veo-3.1-lite");
  const [ratio, setRatio] = useState<"16:9" | "9:16">("16:9");
  const [resolution, setResolution] = useState<(typeof RESOLUTIONS)[number]>("720p");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(8);
  const [audio, setAudio] = useState(true);
  const [seed, setSeed] = useState("");

  const [firstFrame, setFirstFrame] = useState<{ bytesBase64Encoded: string; mimeType: string; preview: string } | null>(null);
  const [lastFrame, setLastFrame] = useState<{ bytesBase64Encoded: string; mimeType: string; preview: string } | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [active, setActive] = useState<Clip | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const lockedDuration = resolution !== "720p";
  const effectiveDuration = mode === "extend" ? 7 : lockedDuration ? 8 : duration;
  const effectiveResolution = model === "google/veo-3.1-lite" && resolution === "4k" ? "1080p" : resolution;

  const buildPrompt = () => {
    const parts = [
      prompt.trim(),
      STYLES.find((s) => s.id === style)?.hint,
      CAMERAS.find((c) => c.id === camera)?.hint,
      LIGHTS.find((l) => l.id === light)?.hint,
      "24fps cinematic motion, highly detailed, coherent physics",
    ];
    return parts.filter(Boolean).join(". ");
  };

  const onEnhance = async () => {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const res = await chat({
        data: {
          system:
            "You are a cinematography prompt engineer for AI video models. Rewrite the user's idea into one vivid English paragraph (max 90 words) describing subject, action, environment, camera movement, lens, lighting and mood. Output only the paragraph.",
          messages: [{ role: "user", content: prompt.trim() }],
        },
      });
      if (res.ok && res.text) setPrompt(res.text.trim());
    } finally {
      setEnhancing(false);
    }
  };

  const watch = (id: string, meta: { prompt: string; ratio: "16:9" | "9:16" }) => {
    timer.current = setTimeout(async () => {
      try {
        const res = await poll({ data: { id } });
        if (!res.ok) {
          setError(res.message);
          setBusy(false);
          return;
        }
        if (res.done) {
          setProgress(100);
          const clip: Clip = { id, url: res.url, prompt: meta.prompt, ratio: meta.ratio };
          setClips((c) => [clip, ...c]);
          setActive(clip);
          setBusy(false);
          if (user) void save({ data: { tool: "فيديو", prompt: meta.prompt, result_url: res.url } });
          return;
        }
        setProgress((p) => Math.max(p, Math.min(95, res.progress || p + 4)));
        watch(id, meta);
      } catch {
        setError("انقطع الاتصال أثناء متابعة التوليد. حاول مرة أخرى.");
        setBusy(false);
      }
    }, 7000);
  };

  const onGenerate = async () => {
    if (busy) return;
    if (mode === "extend" && !active) {
      setError("اختر مقطعًا من المعرض لتمديده أولًا.");
      return;
    }
    if (mode === "image" && !firstFrame) {
      setError("ارفع صورة البداية أولًا.");
      return;
    }
    if (mode !== "extend" && !prompt.trim()) return;

    setBusy(true);
    setError(null);
    setProgress(5);

    const finalPrompt = buildPrompt();
    const seedNum = seed.trim() ? Number(seed.trim()) : undefined;

    try {
      const res = await create({
        data: {
          prompt: finalPrompt || "Continue the scene naturally.",
          negativePrompt: negative.trim() || undefined,
          model,
          durationSeconds: (mode === "extend" ? 8 : effectiveDuration) as 4 | 6 | 8,
          resolution: effectiveResolution,
          aspectRatio: ratio,
          generateAudio: audio,
          seed: Number.isFinite(seedNum) ? seedNum : undefined,
          image: mode === "image" && firstFrame
            ? { bytesBase64Encoded: firstFrame.bytesBase64Encoded, mimeType: firstFrame.mimeType }
            : undefined,
          lastFrame: mode === "image" && lastFrame
            ? { bytesBase64Encoded: lastFrame.bytesBase64Encoded, mimeType: lastFrame.mimeType }
            : undefined,
          extendFromUrl: mode === "extend" ? (active?.url ?? undefined) : undefined,
        },
      });
      if (!res.ok) {
        setError(res.message);
        setBusy(false);
        return;
      }
      setProgress(Math.max(10, res.progress));
      watch(res.id, { prompt: finalPrompt, ratio: mode === "extend" ? (active?.ratio ?? ratio) : ratio });
    } catch {
      setError("تعذّر بدء التوليد. حاول مجددًا.");
      setBusy(false);
    }
  };

  const pillClass = (on: boolean) =>
    `rounded-xl border px-3 py-2 text-xs transition-colors ${
      on
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
    }`;

  return (
    <ToolShell
      title="استوديو الفيديو السينمائي"
      subtitle="نص إلى فيديو، صورة إلى فيديو، وتمديد المشاهد — مع تحكم كامل في الكاميرا والإضاءة والصوت والجودة."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {([
          { id: "text" as const, label: "نص إلى فيديو", icon: Wand2 },
          { id: "image" as const, label: "صورة إلى فيديو", icon: ImagePlus },
          { id: "extend" as const, label: "تمديد المشهد (+7 ث)", icon: Plus },
        ]).map((t) => (
          <button key={t.id} type="button" onClick={() => setMode(t.id)} className={pillClass(mode === t.id)}>
            <span className="flex items-center gap-1.5">
              <t.icon className="size-3.5" /> {t.label}
            </span>
          </button>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
          {mode === "extend" ? (
            <div className="rounded-xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
              {active
                ? "سيتم إكمال المقطع المحدد بـ ٧ ثوانٍ إضافية بنفس الأجواء. اكتب وصف الاستمرارية بالأسفل."
                : "اختر مقطعًا من المعرض بالأسفل ليتم تمديده."}
            </div>
          ) : null}

          {mode === "image" && (
            <div className="mb-5 grid grid-cols-2 gap-3">
              {[
                { key: "first" as const, label: "صورة البداية", value: firstFrame, set: setFirstFrame, ref: firstRef },
                { key: "last" as const, label: "صورة النهاية (اختياري)", value: lastFrame, set: setLastFrame, ref: lastRef },
              ].map((slot) => (
                <div key={slot.key}>
                  <Label className="text-xs">{slot.label}</Label>
                  <input
                    ref={slot.ref}
                    type="file"
                    accept="image/png,image/jpeg"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) slot.set(await readFile(file));
                      e.target.value = "";
                    }}
                  />
                  {slot.value ? (
                    <div className="relative mt-2 overflow-hidden rounded-xl border border-border">
                      <img src={slot.value.preview} alt={slot.label} className="h-28 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => slot.set(null)}
                        className="absolute left-1.5 top-1.5 rounded-full bg-background/80 p-1"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => slot.ref.current?.click()}
                      className="mt-2 flex h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-primary/50"
                    >
                      <ImagePlus className="size-5" />
                      رفع صورة
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="prompt" className="text-sm">
              {mode === "extend" ? "وصف استمرار المشهد" : "وصف المشهد"}
            </Label>
            <Button variant="ghost" size="sm" onClick={onEnhance} disabled={enhancing || !prompt.trim()}>
              {enhancing ? <DelvaiThinkingLoader size="xs" /> : <Sparkles className="size-3.5" />}
              تحسين الوصف
            </Button>
          </div>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="مثال: صحراء عند الغروب، قافلة إبل تعبر الكثبان، غبار ذهبي يتطاير في الهواء"
            className="mt-2 resize-none bg-background/60 text-base"
          />

          <div className="mt-4">
            <Label htmlFor="neg" className="text-sm">
              استبعاد (Negative)
            </Label>
            <Input
              id="neg"
              value={negative}
              onChange={(e) => setNegative(e.target.value)}
              placeholder="نصوص، شعارات، تشوّه الوجوه، اهتزاز مفرط"
              className="mt-2 bg-background/60"
            />
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <Label className="text-sm">النمط البصري</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button key={s.id} type="button" onClick={() => setStyle(s.id)} className={pillClass(style === s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm">حركة الكاميرا</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {CAMERAS.map((c) => (
                  <button key={c.id} type="button" onClick={() => setCamera(c.id)} className={pillClass(camera === c.id)}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm">الإضاءة</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {LIGHTS.map((l) => (
                  <button key={l.id} type="button" onClick={() => setLight(l.id)} className={pillClass(light === l.id)}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm">مستوى الجودة</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {MODELS.map((m) => (
                  <button key={m.id} type="button" onClick={() => setModel(m.id)} className={pillClass(model === m.id)}>
                    <span className="block font-semibold">{m.label}</span>
                    <span className="block text-[10px] opacity-70">{m.note}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-sm">الأبعاد</Label>
                <div className="mt-2 flex gap-2">
                  {RATIOS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      disabled={mode !== "text"}
                      onClick={() => setRatio(r.id)}
                      className={`flex-1 disabled:opacity-40 ${pillClass(ratio === r.id)}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm">الدقة</Label>
                <div className="mt-2 flex gap-2">
                  {RESOLUTIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      disabled={r === "4k" && model === "google/veo-3.1-lite"}
                      onClick={() => setResolution(r)}
                      className={`flex-1 disabled:opacity-40 ${pillClass(resolution === r)}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm">المدة (ثانية)</Label>
                <div className="mt-2 flex gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={lockedDuration || mode === "extend"}
                      onClick={() => setDuration(d)}
                      className={`flex-1 disabled:opacity-40 ${pillClass(effectiveDuration === d)}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch id="audio" checked={audio} onCheckedChange={setAudio} />
                <Label htmlFor="audio" className="text-sm">
                  توليد الصوت والمؤثرات
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="seed" className="text-sm">
                  البذرة (ثبات النتائج)
                </Label>
                <Input
                  id="seed"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="اختياري"
                  className="h-9 w-32 bg-background/60"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={onGenerate}
            disabled={busy || (mode !== "extend" && !prompt.trim())}
            size="lg"
            className="mt-7 w-full bg-cine text-primary-foreground shadow-glow hover:opacity-90"
          >
            {busy ? (
              <DelvaiThinkingLoader size="sm" text="جارٍ التفكير والتوليد السينمائي…" inline />
            ) : (
              <>
                <Film className="size-4" /> {mode === "extend" ? "تمديد المشهد" : "توليد الفيديو"}
              </>
            )}
          </Button>

          {busy && (
            <div className="mt-4">
              <Progress value={progress} />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                عادةً ما يستغرق التوليد من دقيقة إلى ثلاث دقائق
              </p>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
            <div
              className={`flex items-center justify-center overflow-hidden rounded-xl bg-background/70 ${
                (active?.ratio ?? ratio) === "9:16" ? "aspect-[9/16]" : "aspect-video"
              }`}
            >
              {active ? (
                <video src={active.url} controls autoPlay loop className="h-full w-full object-cover" />
              ) : (
                <div className="px-6 text-center text-muted-foreground">
                  <Clapperboard className="mx-auto size-10 text-primary/70" />
                  <p className="mt-3 text-sm">سيظهر مشهدك هنا بعد التوليد</p>
                </div>
              )}
            </div>

            {active && (
              <div className="mt-4 flex gap-2">
                <a href={active.url} download="cinematic.mp4" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Download className="size-4" /> تنزيل
                  </Button>
                </a>
                <Button variant="outline" className="flex-1" onClick={() => setMode("extend")}>
                  <Plus className="size-4" /> تمديد المشهد
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
            <p className="mb-3 text-sm font-semibold">معرض المشاهد</p>
            {clips.length === 0 ? (
              <p className="text-xs text-muted-foreground">كل ما تولّده في هذه الجلسة سيظهر هنا.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {clips.map((c) => (
                  <div
                    key={c.id}
                    className={`group relative overflow-hidden rounded-xl border ${
                      active?.id === c.id ? "border-primary" : "border-border"
                    }`}
                  >
                    <video
                      src={c.url}
                      muted
                      className="h-24 w-full cursor-pointer object-cover"
                      onClick={() => setActive(c)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setClips((list) => list.filter((x) => x.id !== c.id));
                        if (active?.id === c.id) setActive(null);
                      }}
                      className="absolute left-1.5 top-1.5 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </ToolShell>
  );
}
