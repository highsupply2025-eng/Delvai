import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  Aperture,
  Camera,
  Clapperboard,
  Download,
  Expand,
  Film,
  ImagePlus,
  Layers,
  Maximize2,
  Mic,
  MicOff,
  Music,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Rocket,
  Sliders,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Video,
  Volume2,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ToolShell } from "@/components/ToolShell";
import { useAuth } from "@/hooks/useAuth";
import { createVideoJob, getVideoJob } from "@/lib/video.functions";
import { DelvaiThinkingLoader, DelvaiLogo } from "@/components/DelvaiThinkingLoader";
import { saveGeneration } from "@/lib/history.functions";

export const Route = createFileRoute("/video")({
  head: () => ({
    meta: [
      { title: "استوديو الفيديو السينمائي الفائق — Delvai Cinema Quantum | جودة 4K" },
      {
        name: "description",
        content:
          "استوديو دلفاي للفيديو السينمائي: توليد مشاهد سينمائية مذهلة فائقة السرعة بدقة تصل إلى 4K مع حركة كاميرا ذكية ومؤثرات صوتية محيطية وتمديد المشاهد.",
      },
      { property: "og:title", content: "استوديو الفيديو السينمائي — Delvai Cinema Quantum" },
      {
        property: "og:description",
        content: "حوّل الوصف أو الصورة إلى فيديو سينمائي بالحركة والصوت فائق السرعة بجودة 4K.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VideoTool,
});

type Mode = "text" | "image" | "extend";

const STYLES = [
  { id: "cinematic", label: "سينمائي هوليوودي", icon: Film, hint: "cinematic film look, anamorphic lens, subtle film grain, professional blockbuster color grading" },
  { id: "epic", label: "ملحمي واسع", icon: Sparkles, hint: "epic wide establishing shot, golden hour lighting, sweeping scale, atmospheric depth" },
  { id: "noir", label: "نوار ونيون", icon: Layers, hint: "cyberpunk film noir, rain-slicked asphalt, neon reflections, high contrast moody shadows" },
  { id: "commercial", label: "إعلاني فاخر", icon: Rocket, hint: "premium commercial product shot, flawless studio lighting, crisp reflections, advertising finish" },
  { id: "anime", label: "أنمي سينمائي", icon: Zap, hint: "makoto shinkai anime visual style, expressive lighting, vivid sky, dynamic camera movement" },
  { id: "3d", label: "ثلاثي الأبعاد", icon: Clapperboard, hint: "stylized 3D cinematic animation, ray traced global illumination, pixar-level rendering" },
  { id: "drone", label: "تصوير جوي درون", icon: Aperture, hint: "aerial drone sweep, smooth panoramic flight path, majestic vast landscape scale" },
  { id: "doc", label: "وثائقي واقعي", icon: Camera, hint: "handheld documentary camera, hyper-realistic textures, natural color balance" },
];

const CAMERAS = [
  { id: "dolly", label: "دولي أمامي 🎥", hint: "slow smooth dolly-in push toward the focal subject" },
  { id: "orbit", label: "دوران 180° 🔄", hint: "smooth continuous 180 degree orbit around the subject" },
  { id: "crane", label: "كرين علوي 🏗️", hint: "crane shot smoothly rising up to reveal the grand scene" },
  { id: "tracking", label: "تتبّع جانبي 🏃", hint: "lateral cinematic tracking shot following subject movement" },
  { id: "handheld", label: "كاميرا محمولة 📹", hint: "subtle dynamic handheld camera movement" },
  { id: "zoom", label: "زووم سينمائي 🔍", hint: "slow deliberate telephoto zoom" },
];

const LIGHTS = [
  { id: "golden", label: "شروق / غروب ذهبي 🌅", hint: "golden hour sunlight, warm glowing rim light" },
  { id: "neon", label: "نيون سايبر 🔮", hint: "futuristic neon lighting, cyan and magenta glow" },
  { id: "studio", label: "استوديو احترافي 💡", hint: "soft commercial studio key light with fill" },
  { id: "moody", label: "درامي مظلم 🌑", hint: "low key dramatic chiaroscuro lighting, deep shadows" },
  { id: "natural", label: "طبيعي ناصع ☀️", hint: "crisp natural outdoor daylight" },
];

const MODELS = [
  { id: "google/veo-3.1-lite" as const, label: "Delvai Cinema Lite 🚀", note: "أسرع رندرة وتوليد فوري للمشاهد" },
  { id: "google/veo-3.1-fast" as const, label: "Delvai Cinema Fluid ⚡", note: "سرعة عالية وجودة سينمائية مذهلة" },
  { id: "google/veo-3.1" as const, label: "Delvai Cinema 4K 🎬", note: "أعلى دقة إخراج وتفاصيل سينمائية قصوى" },
];

const RATIOS = [
  { id: "16:9" as const, label: "أفقي 16:9", desc: "يوتيوب وسينما", box: "aspect-video" },
  { id: "9:16" as const, label: "عمودي 9:16", desc: "ريلز وتيك توك", box: "aspect-[9/16]" },
];

const RESOLUTIONS = [
  { id: "720p" as const, label: "720p (فائق السرعة ⚡)" },
  { id: "1080p" as const, label: "1080p (عالي الدقة FHD)" },
  { id: "4k" as const, label: "4K (فائق الوضوح UHD)" },
];

const DURATIONS = [
  { sec: 4 as const, label: "4 ثوانٍ (الأسرع ⚡)" },
  { sec: 6 as const, label: "6 ثوانٍ (متوازن 🌟)" },
  { sec: 8 as const, label: "8 ثوانٍ (مشهد كامل 🎬)" },
];

type Clip = {
  id: string;
  url: string;
  prompt: string;
  ratio: "16:9" | "9:16";
};

const INSPIRATION_CLIPS = [
  {
    title: "إعلان سيارة كهربائية فائقة في مدينة مستقبلية",
    desc: "لقطة سينمائية لسيارة رياضية سوداء تسير بسرعة في شوارع مدينة مضيئة بالنيون والمطر ينعكس على هيكلها المصقول.",
    style: "cinematic",
    camera: "dolly",
    light: "neon",
  },
  {
    title: "رائد فضاء يكتشف واحة كريستالية فضائية",
    desc: "رائد فضاء يخطو ببطء نحو بحيرة من البلورات المضيئة في كوكب غريب مع دوران الكاميرا حوله وانعكاس النجوم.",
    style: "epic",
    camera: "orbit",
    light: "golden",
  },
  {
    title: "إعلان عطر فاخر مع قطرات ماء ذهبية",
    desc: "لقطة ماكرو بطيئة جداً لزجاجة عطر ذهبية تخرج من سائل داكن مع رذاذ مضيء وإضاءة استوديو متلألئة.",
    style: "commercial",
    camera: "zoom",
    light: "studio",
  },
];

const VIDEO_PHASES = [
  "📡 تهيئة المشهد في محرك Delvai Cinema Quantum…",
  "🧠 تخطيط مسار الكاميرا والحركة والفيزياء البصرية…",
  "🎨 رندرة الإطارات السينمائية وحساب الإضاءة والظلال…",
  "🎵 توليد المؤثرات الصوتية والموسيقى التصويرية المحيطية…",
  "✨ التجميع النهائي وضبط ألوان 4K والتصدير…",
];

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
  const save = useServerFn(saveGeneration);
  const { user } = useAuth();

  const [mode, setMode] = useState<Mode>("text");
  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState("");
  const [style, setStyle] = useState(STYLES[0]!.id);
  const [camera, setCamera] = useState(CAMERAS[0]!.id);
  const [light, setLight] = useState(LIGHTS[0]!.id);
  const [model, setModel] = useState<(typeof MODELS)[number]["id"]>("google/veo-3.1-lite");
  const [ratio, setRatio] = useState<"16:9" | "9:16">("16:9");
  const [resolution, setResolution] = useState<(typeof RESOLUTIONS)[number]["id"]>("720p");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]["sec"]>(4);
  const [audio, setAudio] = useState(true);
  const [seed, setSeed] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [firstFrame, setFirstFrame] = useState<{ bytesBase64Encoded: string; mimeType: string; preview: string } | null>(null);
  const [lastFrame, setLastFrame] = useState<{ bytesBase64Encoded: string; mimeType: string; preview: string } | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<HTMLInputElement>(null);
  const speechRef = useRef<any>(null);

  const [busy, setBusy] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [active, setActive] = useState<Clip | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Live generation phases ticker
  useEffect(() => {
    if (!busy) {
      setPhaseIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % VIDEO_PHASES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [busy]);

  // Smooth simulated progress when waiting for updates
  useEffect(() => {
    if (!busy) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        return p + 1.2;
      });
    }, 700);
    return () => clearInterval(interval);
  }, [busy]);

  // Fast Prompt Enhancer with Real-time Streaming
  const enhance = async () => {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    let enhancedAcc = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system:
            "أنت مخرج سينمائي وخبير في هندسة أوامر الفيديو السينمائي ثلاثي الأبعاد. حوّل فكرة المستخدم إلى سيناريو تصويري سينمائي إنجليزي فائق الدقة (الموضوع، حركة الكاميرا والعدسة، الإضاءة، الحركة، الأجواء، جودة 4K السينمائية) في فقرة واحدة سلسة بدون أي مقدمات.",
          model: "google/gemini-3.7-flash",
          messages: [{ role: "user", content: prompt.trim() }],
        }),
      });

      if (!res.ok || !res.body) {
        toast.error("تعذّر تحسين الوصف");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload) as {
              choices?: { delta?: { content?: string } }[];
            };
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              enhancedAcc += delta;
              setPrompt(enhancedAcc);
            }
          } catch {
            /* ignore partial */
          }
        }
      }

      toast.success("تم تحسين الوصف السينمائي وتفصيله بالذكاء الاصطناعي 🪄");
    } finally {
      setEnhancing(false);
    }
  };

  // Speech to text
  const toggleVoice = () => {
    if (isListening) {
      speechRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("الإدخال الصوتي غير مدعوم في هذا المتصفح");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "ar-SA";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("تحدث الآن لوصف المشهد السينمائي…");
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error("تعذر التقاط الصوت، حاول مجدداً.");
      };

      recognition.onend = () => setIsListening(false);
      speechRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const applyStarter = (s: (typeof INSPIRATION_CLIPS)[number]) => {
    setPrompt(s.desc);
    setStyle(s.style);
    setCamera(s.camera);
    setLight(s.light);
    toast.success(`تم اختيار قالب: ${s.title}`);
  };

  const pollJob = async (id: string, fullPrompt: string) => {
    try {
      const res = await poll({ data: { id } });
      if (!res.ok) {
        setBusy(false);
        setError(res.message);
        return;
      }
      const videoResultUrl = (res as any).url || (res as any).videoUrl;
      if (res.done && videoResultUrl) {
        setBusy(false);
        setProgress(100);
        const clip: Clip = { id, url: videoResultUrl, prompt: fullPrompt, ratio };
        setClips((prev) => [clip, ...prev.filter((c) => c.id !== id)]);
        setActive(clip);
        toast.success("تم إنتاج وتصدير الفيديو السينمائي بنجاح! 🎬");
        if (user) {
          void save({ data: { tool: "فيديو", prompt: fullPrompt, result_url: videoResultUrl } });
        }
        return;
      }
      if ((res as any).status === "failed") {
        setBusy(false);
        setError((res as any).error || (res as any).message || "تعذّر إكمال توليد الفيديو.");
        return;
      }
      if (typeof res.progress === "number") {
        setProgress(Math.max(15, Math.min(95, res.progress)));
      }

      // Fast polling at 1.5s
      timer.current = setTimeout(() => void pollJob(id, fullPrompt), 1500);
    } catch {
      timer.current = setTimeout(() => void pollJob(id, fullPrompt), 1500);
    }
  };

  const run = async () => {
    if (busy) return;
    if (!prompt.trim() && mode === "text") {
      setError("يرجى كتابة وصف للمشهد السينمائي أولاً.");
      return;
    }
    if (mode === "image" && !firstFrame) {
      setError("يرجى رفع صورة البداية لتحريكها بالذكاء الاصطناعي.");
      return;
    }
    if (mode === "extend" && !active) {
      setError("اختر فيديو سابق لتمديد مدته الزمنية.");
      return;
    }

    setBusy(true);
    setError(null);
    setProgress(10);

    const styleObj = STYLES.find((s) => s.id === style);
    const camObj = CAMERAS.find((c) => c.id === camera);
    const lightObj = LIGHTS.find((l) => l.id === light);

    const finalPrompt = [
      prompt.trim(),
      styleObj ? `Visual Style: ${styleObj.hint}.` : "",
      camObj ? `Camera Motion: ${camObj.hint}.` : "",
      lightObj ? `Lighting & Environment: ${lightObj.hint}.` : "",
      `Masterpiece, high definition, smooth fluid physical motion, cinematic color grade.`,
    ]
      .filter(Boolean)
      .join(" ");

    const seedNum = seed.trim() && Number.isInteger(Number(seed)) ? Number(seed) : undefined;

    const res = await create({
      data: {
        prompt: finalPrompt,
        negativePrompt: negative.trim() || undefined,
        model,
        durationSeconds: duration,
        resolution,
        aspectRatio: ratio,
        generateAudio: audio,
        seed: seedNum,
        image: firstFrame ? { bytesBase64Encoded: firstFrame.bytesBase64Encoded, mimeType: firstFrame.mimeType } : undefined,
        lastFrame: lastFrame ? { bytesBase64Encoded: lastFrame.bytesBase64Encoded, mimeType: lastFrame.mimeType } : undefined,
        extendFromUrl: mode === "extend" ? active?.url : undefined,
      },
    });

    if (!res.ok) {
      setBusy(false);
      setError(res.message);
      return;
    }

    toast.info("بدأت معالجة المشهد في محرك Delvai Cinema…");
    timer.current = setTimeout(() => void pollJob(res.id, finalPrompt), 1500);
  };

  return (
    <ToolShell
      title="استوديو الفيديو السينمائي — Delvai Cinema Quantum"
      subtitle="محرك الإنتاج البصري لمنصة Delvai — توليد مشاهد سينمائية فائقة السرعة والدقة بدقة تصل إلى 4K مع حركة كاميرا ومؤثرات صوتية محيطية."
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5">
        {/* ================= TOP CYBER HUD BAR ================= */}
        <div className="relative overflow-hidden rounded-3xl glass p-3 sm:p-4 shadow-float border-primary/25 ring-glow">
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            {/* Mode Switchers */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setMode("text")}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                  mode === "text"
                    ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.35)] scale-105"
                    : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <Video className="size-3.5" />
                <span>نص إلى فيديو 🎬</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("image")}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                  mode === "image"
                    ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.35)] scale-105"
                    : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <ImagePlus className="size-3.5" />
                <span>صورة إلى حركة 🖼️</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("extend")}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                  mode === "extend"
                    ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.35)] scale-105"
                    : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <Expand className="size-3.5" />
                <span>تمديد المشهد ⏳</span>
              </button>
            </div>

            {/* Model Engine Selector */}
            <div className="ms-auto flex items-center gap-1.5 rounded-2xl border border-primary/30 bg-card/60 p-1">
              <span className="ps-2 pe-1 text-[10px] font-bold text-muted-foreground font-mono uppercase">
                المحرك:
              </span>
              {MODELS.map((m) => {
                const isSelected = model === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModel(m.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm font-bold scale-105"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Zap className="size-3" />
                    <span>{m.label.split(" ")[0]} {m.label.split(" ")[1]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= MAIN STUDIO CANVAS ================= */}
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ================= LEFT / CONTROLS ================= */}
          <div className="flex flex-col gap-4 rounded-3xl glass p-5 sm:p-6 shadow-float border-primary/20 backdrop-blur-xl">
            {/* Mode: Image Uploads */}
            {mode === "image" && (
              <div className="grid grid-cols-2 gap-3">
                {/* First Frame */}
                <div>
                  <span className="mb-1.5 block text-xs font-bold text-foreground">
                    صورة البداية (إلزامي):
                  </span>
                  <div
                    onClick={() => firstRef.current?.click()}
                    className={`relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed transition-all ${
                      firstFrame
                        ? "border-primary/80 bg-background"
                        : "border-border/80 bg-background/60 hover:border-primary/50"
                    }`}
                  >
                    {firstFrame ? (
                      <>
                        <img
                          src={firstFrame.preview}
                          alt="First Frame"
                          className="size-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFirstFrame(null);
                          }}
                          className="absolute end-1.5 top-1.5 rounded-full bg-background/80 p-1 text-foreground hover:text-destructive"
                        >
                          <X className="size-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground p-2 text-center">
                        <Upload className="size-5 text-primary/70" />
                        <span>ارفع صورة البداية</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={firstRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setFirstFrame(await readFile(f));
                    }}
                  />
                </div>

                {/* Last Frame */}
                <div>
                  <span className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    صورة النهاية (اختياري):
                  </span>
                  <div
                    onClick={() => lastRef.current?.click()}
                    className={`relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed transition-all ${
                      lastFrame
                        ? "border-primary/80 bg-background"
                        : "border-border/80 bg-background/60 hover:border-primary/50"
                    }`}
                  >
                    {lastFrame ? (
                      <>
                        <img
                          src={lastFrame.preview}
                          alt="Last Frame"
                          className="size-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLastFrame(null);
                          }}
                          className="absolute end-1.5 top-1.5 rounded-full bg-background/80 p-1 text-foreground hover:text-destructive"
                        >
                          <X className="size-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground p-2 text-center">
                        <Plus className="size-5 text-muted-foreground/60" />
                        <span>نهاية الحركة</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={lastRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setLastFrame(await readFile(f));
                    }}
                  />
                </div>
              </div>
            )}

            {/* Prompt Textarea */}
            <div className="relative">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Film className="size-3.5 text-primary" />
                  وصف المشهد السينمائي والحركة:
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs transition-colors ${
                      isListening
                        ? "border-destructive bg-destructive/10 text-destructive animate-pulse"
                        : "border-border/60 bg-background/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isListening ? <MicOff className="size-3" /> : <Mic className="size-3" />}
                    <span>{isListening ? "استماع…" : "إملاء"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void enhance()}
                    disabled={enhancing || !prompt.trim()}
                    className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    <Wand2 className={`size-3 ${enhancing ? "animate-spin" : ""}`} />
                    <span>{enhancing ? "تحسين سريع…" : "تحسين سينمائي"}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-background/80 p-3 shadow-inner focus-within:border-primary/80 focus-within:shadow-[0_0_20px_oklch(0.82_0.14_82/0.2)] transition-all">
                <Textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="مثال: سيارة رياضية سوداء تسير في شوارع مدينة مضيئة بالنيون والمطر ينعكس على هيكلها المصقول مع حركة كاميرا درامية…"
                  className="w-full resize-none border-none bg-transparent p-0 text-sm leading-6 placeholder:text-muted-foreground/60 outline-none focus-visible:ring-0"
                />
              </div>
            </div>

            {/* Visual Style Presets */}
            <div>
              <span className="mb-2 block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                النمط البصري (Visual Style):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STYLES.map((s) => {
                  const isSelected = style === s.id;
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStyle(s.id)}
                      className={`flex items-center gap-2 rounded-2xl border p-2.5 text-xs font-semibold text-start transition-all ${
                        isSelected
                          ? "border-primary bg-primary/15 text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.25)] font-bold scale-[1.02]"
                          : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Camera Motion & Lighting Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border/40 pt-3">
              {/* Camera Motion */}
              <div>
                <span className="mb-1.5 block text-xs font-bold text-muted-foreground">
                  حركة الكاميرا والعدسة:
                </span>
                <select
                  value={camera}
                  onChange={(e) => setCamera(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground outline-none focus:border-primary/80"
                >
                  {CAMERAS.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card text-foreground">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lighting */}
              <div>
                <span className="mb-1.5 block text-xs font-bold text-muted-foreground">
                  الإضاءة والأجواء:
                </span>
                <select
                  value={light}
                  onChange={(e) => setLight(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground outline-none focus:border-primary/80"
                >
                  {LIGHTS.map((l) => (
                    <option key={l.id} value={l.id} className="bg-card text-foreground">
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Duration & Speed Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 border-t border-border/40 pt-3">
              {/* Duration */}
              <div>
                <span className="mb-1 block text-xs font-bold text-muted-foreground">المدة الزمنية:</span>
                <div className="flex gap-1">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.sec}
                      type="button"
                      onClick={() => setDuration(d.sec)}
                      className={`flex-1 rounded-xl border py-1.5 text-xs font-bold transition-all ${
                        duration === d.sec
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border/70 bg-card/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d.sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              <div>
                <span className="mb-1 block text-xs font-bold text-muted-foreground">الجودة:</span>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as any)}
                  className="w-full rounded-xl border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs text-foreground outline-none"
                >
                  {RESOLUTIONS.map((r) => (
                    <option key={r.id} value={r.id} className="bg-card text-foreground">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aspect Ratio */}
              <div>
                <span className="mb-1 block text-xs font-bold text-muted-foreground">الأبعاد:</span>
                <div className="flex gap-1">
                  {RATIOS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRatio(r.id)}
                      className={`flex-1 rounded-xl border py-1.5 text-xs font-bold transition-all ${
                        ratio === r.id
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border/70 bg-card/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Drawer Toggle */}
            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <div className="flex items-center gap-2">
                <Switch id="audio-toggle" checked={audio} onCheckedChange={setAudio} />
                <label htmlFor="audio-toggle" className="text-xs text-foreground font-medium cursor-pointer">
                  توليد صوت وموسيقى تصويرية محيطية 🎵
                </label>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Sliders className="size-3" />
                <span>إعدادات إضافية</span>
              </button>
            </div>

            {/* Advanced Drawer */}
            {showAdvanced && (
              <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-border/60 bg-background/50 p-3 text-xs">
                <div>
                  <label className="mb-1 block text-muted-foreground">الوصف السلبي (Negative Prompt):</label>
                  <Input
                    value={negative}
                    onChange={(e) => setNegative(e.target.value)}
                    placeholder="blurry, distorted, low quality"
                    className="h-8 rounded-xl bg-background/70 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-muted-foreground">Seed (رقم البذرة للتكرار):</label>
                  <Input
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="عشوائي"
                    className="h-8 rounded-xl bg-background/70 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* Launch Action */}
            <Button
              onClick={() => void run()}
              disabled={busy}
              className="mt-2 h-12 w-full rounded-2xl bg-cine text-primary-foreground shadow-glow font-bold text-sm transition-transform hover:scale-[1.01]"
            >
              {busy ? (
                <div className="flex items-center gap-2">
                  <DelvaiThinkingLoader size="xs" inline />
                  <span>دلفاي يرندر المشهد السينمائي الفائق…</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4" />
                  <span>إطلاق الإنتاج السينمائي الفوري ⚡</span>
                </div>
              )}
            </Button>

            {error && (
              <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </p>
            )}
          </div>

          {/* ================= RIGHT / CINEMA VIEWPORT ================= */}
          <div className="flex flex-col gap-4 rounded-3xl glass p-5 sm:p-6 shadow-float border-primary/20 backdrop-blur-xl">
            {/* Live Progress HUD Bar */}
            {busy && (
              <div className="space-y-2 rounded-2xl border border-primary/30 bg-primary/10 p-4">
                <div className="flex items-center justify-between text-xs font-bold text-primary">
                  <span className="flex items-center gap-1.5">
                    <Radio className="size-3.5 animate-pulse" />
                    <span>{VIDEO_PHASES[phaseIndex]}</span>
                  </span>
                  <span className="font-mono">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 rounded-full bg-primary/20" />
              </div>
            )}

            {/* Cinema Video Viewport */}
            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-background/80 shadow-inner">
              {active ? (
                <video
                  key={active.url}
                  src={active.url}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="size-full object-contain"
                />
              ) : busy ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <DelvaiThinkingLoader size="lg" text="رندرة المشهد ومطابقة حركة الكاميرا والفيزياء…" />
                  <p className="mt-3 text-xs text-muted-foreground animate-pulse">
                    إنتاج سينمائي فائق السرعة عبر محرك Delvai Cinema Quantum
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="relative mx-auto mb-3 flex size-16 items-center justify-center">
                    <div className="pointer-events-none absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                    <div
                      className="pointer-events-none absolute size-16 rounded-full border border-dashed border-primary/40 animate-spin"
                      style={{ animationDuration: "7s" }}
                    />
                    <DelvaiLogo className="size-10 drop-shadow-[0_0_15px_oklch(0.82_0.14_82/0.8)]" />
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    شاشة العرض <span className="text-shine">السينمائية فائقة السرعة</span>
                  </h3>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                    اكتب وصف المشهد أو اختر أحد القوالب الإلهامية بالأسفل وسيبدأ الإنتاج فوراً.
                  </p>
                </div>
              )}
            </div>

            {/* Active Video Actions */}
            {active && !busy && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
                <a href={active.url} download={`delvai-cinema-${active.id}.mp4`} className="flex-1 sm:flex-initial">
                  <Button variant="outline" size="sm" className="w-full rounded-xl text-xs gap-1.5">
                    <Download className="size-3.5" /> تنزيل الفيديو MP4
                  </Button>
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMode("extend");
                    toast.info("تم تفعيل نمط تمديد هذا المشهد");
                  }}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <Expand className="size-3.5" /> تمديد مدة هذا المشهد
                </Button>
              </div>
            )}

            {/* Gallery of Generated Clips */}
            {clips.length > 1 && (
              <div className="space-y-2 border-t border-border/40 pt-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  المشاهد المنتجة في الجلسة:
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {clips.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActive(c)}
                      className={`relative aspect-video w-24 shrink-0 overflow-hidden rounded-xl border transition-all ${
                        active?.id === c.id
                          ? "border-primary ring-2 ring-primary/40 scale-105"
                          : "border-border/70 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <video src={c.url} className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inspiration Starter Presets (When Empty) */}
            {clips.length === 0 && !busy && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  قوالب سينمائية جاهزة:
                </span>
                <div className="grid gap-2 sm:grid-cols-3">
                  {INSPIRATION_CLIPS.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyStarter(c)}
                      className="group flex flex-col items-start rounded-2xl border border-border/70 bg-card/40 p-2.5 text-start transition-all hover:border-primary/50 hover:bg-card/80 hover:shadow-sm"
                    >
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {c.title}
                      </span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">
                        {c.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
