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
import { chatComplete } from "@/lib/ai.functions";
import { saveGeneration } from "@/lib/history.functions";

export const Route = createFileRoute("/video")({
  head: () => ({
    meta: [
      { title: "استوديو الفيديو السينمائي (Delvai Cinema) | توليد فيديو بالذكاء الاصطناعي Veo 3.1" },
      {
        name: "description",
        content:
          "استوديو دلفاي للفيديو السينمائي: توليد مشاهد سينمائية مذهلة بنموذج Google Veo 3.1 بدقة تصل إلى 4K، حركة كاميرا ذكية، مؤثرات صوتية محيطية، وتمديد المشاهد.",
      },
      { property: "og:title", content: "استوديو الفيديو السينمائي — Delvai Cinema" },
      {
        property: "og:description",
        content: "حوّل الوصف أو الصورة إلى فيديو سينمائي بالحركة والصوت بجودة 4K ونموذج Veo 3.1 الخارق.",
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
  { id: "google/veo-3.1" as const, label: "Veo 3.1 4K سينمائي", note: "أعلى جودة إخراج وتفاصيل سينمائية فائقة" },
  { id: "google/veo-3.1-fast" as const, label: "Veo 3.1 متوازن", note: "توليد سريع بجودة سينمائية استثنائية" },
  { id: "google/veo-3.1-lite" as const, label: "Veo 3.1 Lite اقتصادي", note: "سريع وخفيف للتجارب والمسودات الفورية" },
];

const RATIOS = [
  { id: "16:9" as const, label: "أفقي 16:9", desc: "يوتيوب وسينما", box: "aspect-video" },
  { id: "9:16" as const, label: "عمودي 9:16", desc: "ريلز وتيك توك", box: "aspect-[9/16]" },
];

const RESOLUTIONS = ["720p", "1080p", "4k"] as const;
const DURATIONS = [4, 6, 8] as const;

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
  {
    title: "طيران درون فوق جبال جليدية في الشفق القطبي",
    desc: "حركة كاميرا درون سريعة وسلسة فوق قمم جبال مثلجة تضيئها أضواء الشفق القطبي الخضراء والبنفسجية الساحرة.",
    style: "drone",
    camera: "tracking",
    light: "neon",
  },
];

const VIDEO_PHASES = [
  "📡 إرسال المشهد إلى محرك Google Veo 3.1…",
  "🧠 تخطيط الحركة والفيزياء البصرية للقطة…",
  "🎨 رندرة الإطارات السينمائية وحساب الإضاءة…",
  "🎵 توليد المؤثرات الصوتية والموسيقى المحيطية…",
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
  const chat = useServerFn(chatComplete);
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
  const [resolution, setResolution] = useState<(typeof RESOLUTIONS)[number]>("720p");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(8);
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
    }, 4500);
    return () => clearInterval(interval);
  }, [busy]);

  const enhance = async () => {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const res = await chat({
        data: {
          system:
            "أنت مخرج سينمائي وخبير في هندسة أوامر الفيديو بالذكاء الاصطناعي (Google Veo 3.1). حوّل فكرة المستخدم إلى سيناريو تصويري سينمائي إنجليزي فائق الدقة (الموضوع، حركة الكاميرا والعدسة، الإضاءة، الحركة، الأجواء، جودة 4K السينمائية) في فقرة واحدة سلسة بدون أي مقدمات.",
          messages: [{ role: "user", content: prompt.trim() }],
          model: "google/gemini-2.5-flash",
        },
      });
      if (res.ok && res.text) {
        setPrompt(res.text.trim());
        toast.success("تم تحسين الوصف السينمائي وتفصيله بالذكاء الاصطناعي 🪄");
      }
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
      if (res.status === "succeeded" && res.videoUrl) {
        setBusy(false);
        setProgress(100);
        const clip: Clip = { id, url: res.videoUrl, prompt: fullPrompt, ratio };
        setClips((prev) => [clip, ...prev.filter((c) => c.id !== id)]);
        setActive(clip);
        toast.success("تم توليد الفيديو السينمائي بنجاح! 🎬");
        if (user) {
          void save({ data: { tool: "فيديو", prompt: fullPrompt, result_url: res.videoUrl } });
        }
        return;
      }
      if (res.status === "failed") {
        setBusy(false);
        setError(res.error || "تعذّر إكمال توليد الفيديو.");
        return;
      }
      if (typeof res.progress === "number") setProgress(Math.max(10, Math.min(95, res.progress)));
      else setProgress((p) => Math.min(92, p + 5));

      timer.current = setTimeout(() => void pollJob(id, fullPrompt), 3000);
    } catch {
      timer.current = setTimeout(() => void pollJob(id, fullPrompt), 3000);
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
    setProgress(5);

    const styleObj = STYLES.find((s) => s.id === style);
    const camObj = CAMERAS.find((c) => c.id === camera);
    const lightObj = LIGHTS.find((l) => l.id === light);

    const finalPrompt = [
      prompt.trim(),
      styleObj ? `Visual Style: ${styleObj.hint}.` : "",
      camObj ? `Camera Motion: ${camObj.hint}.` : "",
      lightObj ? `Lighting & Environment: ${lightObj.hint}.` : "",
      `Masterpiece, 4k resolution, smooth fluid physical motion, cinematic color grade.`,
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

    void pollJob(res.id, finalPrompt);
  };

  return (
    <ToolShell
      title="استوديو الفيديو السينمائي — Delvai Cinema Studio"
      subtitle="عقل الإخراج والتوليد السينمائي لمنصة Delvai — متصل بأحدث نماذج Google Veo 3.1 لتوليد مشاهد سينمائية خارقة بالصوت والحركة بدقة 4K."
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5">
        {/* ================= TOP CYBER HUD BAR ================= */}
        <div className="relative overflow-hidden rounded-3xl glass p-3 sm:p-4 shadow-float border-primary/25 ring-glow">
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {[
                { id: "text" as const, label: "نص إلى فيديو", icon: Film },
                { id: "image" as const, label: "صورة إلى حركة", icon: ImagePlus },
                { id: "extend" as const, label: "تمديد المشهد", icon: Expand },
              ].map((m) => {
                const isSelected = mode === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMode(m.id);
                      setError(null);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.35)] scale-105"
                        : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
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
                    title={m.note}
                  >
                    <Zap className="size-3" />
                    <span>{m.label.split(" ")[0]} {m.label.split(" ")[1]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= MAIN STUDIO GRID ================= */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* ================= LEFT CONTROLS ================= */}
          <div className="flex flex-col gap-4 rounded-3xl glass p-5 sm:p-6 shadow-float border-primary/20 backdrop-blur-xl">
            {/* Mode Specific Prompt Header */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  {mode === "extend"
                    ? "وصف المشهد الإضافي للتمديد"
                    : mode === "image"
                    ? "وصف الحركة والتفاعل للصورة"
                    : "وصف السيناريو والمشهد السينمائي"}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={enhance}
                    disabled={enhancing || !prompt.trim()}
                    className="h-7 rounded-xl text-xs text-primary hover:bg-primary/10 transition-colors font-semibold"
                  >
                    {enhancing ? <DelvaiThinkingLoader size="xs" inline /> : <Wand2 className="size-3.5 me-1" />}
                    تحسين الإخراج
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleVoice}
                    className={`size-7 rounded-xl transition-all ${
                      isListening
                        ? "bg-destructive/20 text-destructive animate-pulse"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                    }`}
                    title="وصف المشهد بالصوت"
                  >
                    {isListening ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
                  </Button>
                </div>
              </div>

              {/* Textarea */}
              <div className="mt-2 relative rounded-2xl border border-border/80 bg-background/80 p-3 shadow-inner focus-within:border-primary/80 focus-within:shadow-[0_0_20px_oklch(0.82_0.14_82/0.2)] transition-all">
                <Textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="مثال: لقطة سينمائية بطيئة لرائد فضاء يكتشف بوابة مضيئة في كوكب فضائي مع حركة كاميرا دائرية وانعكاسات نيون مذهلة…"
                  className="w-full resize-none border-none bg-transparent p-0 text-sm leading-6 placeholder:text-muted-foreground/60 outline-none focus-visible:ring-0"
                />
              </div>
            </div>

            {/* Image to Video Upload Slots */}
            {mode === "image" && (
              <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-3">
                {/* First Frame */}
                <div>
                  <span className="mb-1.5 block text-xs font-bold text-muted-foreground">صورة البداية (إلزامية):</span>
                  <div
                    onClick={() => firstRef.current?.click()}
                    className="cursor-pointer overflow-hidden rounded-2xl border border-dashed border-border/80 bg-card/40 p-3 text-center hover:border-primary/50 transition-colors"
                  >
                    {firstFrame ? (
                      <div className="relative group">
                        <img src={firstFrame.preview} alt="البداية" className="h-20 w-full rounded-xl object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFirstFrame(null);
                          }}
                          className="absolute top-1 end-1 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="py-2 text-xs text-muted-foreground">
                        <Upload className="mx-auto mb-1 size-5 text-primary/70" />
                        <span>اختر صورة البداية</span>
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
                  <span className="mb-1.5 block text-xs font-bold text-muted-foreground">صورة النهاية (اختيارية):</span>
                  <div
                    onClick={() => lastRef.current?.click()}
                    className="cursor-pointer overflow-hidden rounded-2xl border border-dashed border-border/80 bg-card/40 p-3 text-center hover:border-primary/50 transition-colors"
                  >
                    {lastFrame ? (
                      <div className="relative group">
                        <img src={lastFrame.preview} alt="النهاية" className="h-20 w-full rounded-xl object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLastFrame(null);
                          }}
                          className="absolute top-1 end-1 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="py-2 text-xs text-muted-foreground">
                        <Upload className="mx-auto mb-1 size-5 text-primary/70" />
                        <span>انتقال إلى نهاية المشهد</span>
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

            {/* Styles Selector */}
            <div>
              <span className="mb-2 block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                النمط البصري والسينمائي:
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
                      className={`flex items-center gap-2 rounded-2xl border p-2 text-xs font-semibold transition-all ${
                        isSelected
                          ? "border-primary bg-primary/15 text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.25)] font-bold scale-[1.02]"
                          : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Camera Motion & Lighting Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border/40 pt-3">
              {/* Camera Motion */}
              <div>
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <Camera className="size-3.5 text-primary" />
                  حركة الكاميرا:
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
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <Sun className="size-3.5 text-primary" />
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

            {/* Aspect Ratio, Duration & Audio Switches */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3">
              {/* Ratio */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">الإطار:</span>
                {RATIOS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRatio(r.id)}
                    className={`rounded-xl border px-3 py-1 text-xs font-bold transition-all ${
                      ratio === r.id
                        ? "border-primary bg-primary/15 text-primary shadow-sm"
                        : "border-border/70 bg-card/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Duration */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">المدة:</span>
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`rounded-xl border px-2.5 py-1 text-xs font-bold transition-all ${
                      duration === d
                        ? "border-primary bg-primary/15 text-primary shadow-sm"
                        : "border-border/70 bg-card/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {d} ثوانٍ
                  </button>
                ))}
              </div>

              {/* Audio Generation Switch */}
              <div className="flex items-center gap-2">
                <Music className="size-3.5 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">صوت وموسيقى:</span>
                <Switch checked={audio} onCheckedChange={setAudio} />
              </div>
            </div>

            {/* Launch Button */}
            <Button
              onClick={() => void run()}
              disabled={busy || (mode === "text" && !prompt.trim()) || (mode === "image" && !firstFrame)}
              className="mt-2 h-12 w-full rounded-2xl bg-cine text-primary-foreground shadow-glow font-bold text-sm transition-transform hover:scale-[1.01]"
            >
              {busy ? (
                <div className="flex items-center gap-2">
                  <DelvaiThinkingLoader size="xs" inline />
                  <span>{VIDEO_PHASES[phaseIndex]} ({progress}%)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clapperboard className="size-4" />
                  <span>
                    {mode === "extend"
                      ? "بدء تمديد المشهد"
                      : mode === "image"
                      ? "إطلاق تحريك الصورة سينمائياً"
                      : "إطلاق التوليد السينمائي بدقة 4K"}
                  </span>
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
            {/* Viewport Box */}
            <div
              className={`relative flex ${
                (active?.ratio ?? ratio) === "16:9" ? "aspect-video" : "aspect-[9/16]"
              } max-h-[60vh] w-full items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-background/80 shadow-2xl transition-all`}
            >
              {/* Grid Background */}
              <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />

              {busy ? (
                <div className="relative z-10 w-full p-6 text-center max-w-sm">
                  <DelvaiThinkingLoader size="lg" text="دلفاي يخرج المشهد بالذكاء الاصطناعي…" />
                  <p className="mt-3 text-xs text-primary font-mono font-bold animate-pulse">
                    {VIDEO_PHASES[phaseIndex]}
                  </p>
                  <div className="mt-4 w-full">
                    <Progress value={progress} className="h-2 bg-card/60" />
                    <span className="mt-1 block text-[11px] text-muted-foreground font-mono">
                      اكتمال التوليد: {progress}%
                    </span>
                  </div>
                </div>
              ) : active ? (
                <div className="relative size-full">
                  <video
                    src={active.url}
                    controls
                    autoPlay
                    loop
                    className="size-full object-contain"
                  />
                </div>
              ) : (
                <div className="relative z-10 p-6 text-center my-auto">
                  <div className="relative mx-auto mb-3 flex size-16 items-center justify-center">
                    <div className="pointer-events-none absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                    <div
                      className="pointer-events-none absolute size-16 rounded-full border border-dashed border-primary/40 animate-spin"
                      style={{ animationDuration: "7s" }}
                    />
                    <DelvaiLogo className="size-10 drop-shadow-[0_0_15px_oklch(0.82_0.14_82/0.8)]" />
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    استوديو دلفاي <span className="text-shine">للفيديو السينمائي</span>
                  </h3>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                    اختر قالباً إلهامياً أدناه أو اكتب سيناريو المشهد ليبدأ دلفاي بالإخراج فوراً بدقة 4K.
                  </p>
                </div>
              )}
            </div>

            {/* Viewport Actions */}
            {active && !busy && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <a
                  href={active.url}
                  download={`delvai-cinema-${Date.now()}.mp4`}
                  className="w-full"
                >
                  <Button variant="outline" size="sm" className="w-full rounded-xl text-xs gap-1.5">
                    <Download className="size-3.5" /> تنزيل الفيديو 4K
                  </Button>
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMode("extend");
                    toast.info("تم تفعيل نمط التمديد الزمني للفيديو");
                  }}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <Expand className="size-3.5" /> تمديد مدة المشهد
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(active.url);
                    toast.success("تم نسخ رابط الفيديو");
                  }}
                  className="rounded-xl text-xs gap-1.5 col-span-2 sm:col-span-1"
                >
                  <Sparkles className="size-3.5" /> نسخ الرابط
                </Button>
              </div>
            )}

            {/* Inspiration Presets (If No Active Video) */}
            {!active && !busy && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  قوالب إلهامية سينمائية:
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
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
                      <span className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
                        {c.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clips History */}
            {clips.length > 1 && (
              <div className="border-t border-border/40 pt-3">
                <span className="mb-2 block text-[11px] font-bold text-muted-foreground">الفيديوهات المولدة في هذه الجلسة ({clips.length}):</span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {clips.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActive(c)}
                      className={`relative shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                        active?.id === c.id
                          ? "border-primary shadow-[0_0_10px_oklch(0.82_0.14_82/0.4)] scale-105"
                          : "border-border/60 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <video src={c.url} className="size-16 object-cover pointer-events-none" />
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
