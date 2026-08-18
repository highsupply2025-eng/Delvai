import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Clapperboard, Download, Loader2, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { createVideoJob, getVideoJob } from "@/lib/video.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "سينماتيك | مولّد الفيديو السينمائي بالذكاء الاصطناعي" },
      {
        name: "description",
        content:
          "حوّل فكرتك إلى مشهد سينمائي قصير بالصوت والحركة عبر الذكاء الاصطناعي، بجودة عالية وخلال دقائق.",
      },
      { property: "og:title", content: "سينماتيك | مولّد الفيديو السينمائي" },
      {
        property: "og:description",
        content: "اكتب وصف المشهد واحصل على فيديو سينمائي مولّد بالذكاء الاصطناعي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STYLES = [
  { id: "epic", label: "ملحمي واسع", hint: "لقطة واسعة سينمائية، إضاءة ذهبية، حركة كاميرا بطيئة" },
  { id: "noir", label: "نوار ليلي", hint: "أجواء نوار، مطر، نيون، تباين عالٍ" },
  { id: "doc", label: "وثائقي واقعي", hint: "كاميرا محمولة، ألوان طبيعية، عمق ميدان ضحل" },
  { id: "dream", label: "حلمي بطيء", hint: "حركة بطيئة، ضباب ناعم، عدسة أنامورفيك" },
];

const RATIOS = [
  { id: "1280x720" as const, label: "أفقي 16:9" },
  { id: "720x1280" as const, label: "عمودي 9:16" },
];

const DURATIONS = ["4", "6", "8"] as const;

function Index() {
  const create = useServerFn(createVideoJob);
  const poll = useServerFn(getVideoJob);

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(STYLES[0]!.id);
  const [size, setSize] = useState<(typeof RATIOS)[number]["id"]>("1280x720");
  const [seconds, setSeconds] = useState<(typeof DURATIONS)[number]>("8");

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const watch = (id: string) => {
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
          setVideoUrl(res.url);
          setBusy(false);
          return;
        }
        setProgress((p) => Math.max(p, Math.min(95, res.progress || p + 4)));
        watch(id);
      } catch {
        setError("انقطع الاتصال أثناء متابعة التوليد. حاول مرة أخرى.");
        setBusy(false);
      }
    }, 7000);
  };

  const onGenerate = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setError(null);
    setVideoUrl(null);
    setProgress(5);

    const styleHint = STYLES.find((s) => s.id === style)?.hint ?? "";
    try {
      const res = await create({
        data: {
          prompt: `Cinematic scene: ${prompt.trim()}. Style: ${styleHint}. Film grain, professional color grading, 24fps cinematic motion.`,
          seconds,
          size,
        },
      });
      if (!res.ok) {
        setError(res.message);
        setBusy(false);
        return;
      }
      setProgress(Math.max(10, res.progress));
      watch(res.id);
    } catch {
      setError("تعذّر بدء التوليد. حاول مجددًا.");
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-stage">
      <div className="mx-auto w-full max-w-5xl px-5 py-14">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            مدعوم بالذكاء الاصطناعي
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-6xl">
            <span className="text-cine">سينماتيك</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            اكتب وصف المشهد، واترك الذكاء الاصطناعي يحوّله إلى فيديو سينمائي قصير بالصوت والحركة.
          </p>
        </header>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_1fr]">
          <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
            <Label htmlFor="prompt" className="text-sm">
              وصف المشهد
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="مثال: صحراء عند الغروب، قافلة إبل تعبر الكثبان، غبار ذهبي في الهواء، كاميرا تتحرك ببطء للأعلى"
              className="mt-2 resize-none bg-background/60 text-base"
            />

            <div className="mt-6 space-y-5">
              <div>
                <Label className="text-sm">النمط السينمائي</Label>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">الأبعاد</Label>
                  <div className="mt-2 flex gap-2">
                    {RATIOS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSize(r.id)}
                        className={`flex-1 rounded-xl border px-2 py-2 text-xs transition-colors ${
                          size === r.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {r.label}
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
                        onClick={() => setSeconds(d)}
                        className={`flex-1 rounded-xl border px-2 py-2 text-xs transition-colors ${
                          seconds === d
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={onGenerate}
              disabled={busy || !prompt.trim()}
              size="lg"
              className="mt-7 w-full bg-cine text-primary-foreground shadow-glow hover:opacity-90"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> جارٍ التوليد…
                </>
              ) : (
                <>
                  <Wand2 className="size-4" /> توليد الفيديو
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
              <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                {error}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
            <div
              className={`flex items-center justify-center overflow-hidden rounded-xl bg-background/70 ${
                size === "720x1280" ? "aspect-[9/16]" : "aspect-video"
              }`}
            >
              {videoUrl ? (
                <video src={videoUrl} controls autoPlay loop className="h-full w-full object-cover" />
              ) : (
                <div className="px-6 text-center text-muted-foreground">
                  <Clapperboard className="mx-auto size-10 text-primary/70" />
                  <p className="mt-3 text-sm">سيظهر مشهدك هنا بعد التوليد</p>
                </div>
              )}
            </div>

            {videoUrl && (
              <a href={videoUrl} download="cinematic.mp4" className="mt-4 block">
                <Button variant="outline" className="w-full">
                  <Download className="size-4" /> تنزيل الفيديو
                </Button>
              </a>
            )}
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          مؤسسة التموين العالي للتجارة — أداة توليد الفيديو السينمائي
        </p>
      </div>
    </main>
  );
}
