import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  Aperture,
  Brain,
  Camera,
  Check,
  ChevronDown,
  Copy,
  Cpu,
  Download,
  Eraser,
  Expand,
  Eye,
  Film,
  Image as ImageIcon,
  ImagePlus,
  Layers,
  Maximize2,
  Mic,
  MicOff,
  Palette,
  Radio,
  RefreshCw,
  Rocket,
  Sliders,
  Sparkles,
  Sun,
  Upload,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ToolShell } from "@/components/ToolShell";
import { saveGeneration } from "@/lib/history.functions";
import { chatComplete } from "@/lib/ai.functions";
import { useAuth } from "@/hooks/useAuth";
import { DelvaiThinkingLoader, DelvaiLogo } from "@/components/DelvaiThinkingLoader";

export const Route = createFileRoute("/image")({
  head: () => ({
    meta: [
      { title: "استوديو الصور الفائق (Delvai Image Studio) | توليد صور بدقة 4K" },
      {
        name: "description",
        content:
          "استوديو دلفاي للصور الفائقة: توليد صور واقعية وسينمائية بأحدث تقنيات المعالجة البصرية، إضاءات ذكية، وعدسات تصوير احترافية بدقة 4K.",
      },
      { property: "og:title", content: "استوديو الصور الفائق — Delvai Image Studio" },
      {
        property: "og:description",
        content: "توليد وتحرير الصور باحترافية استثنائية بدقة 4K وأنماط سينمائية مستقبلية متصلة بأحدث محركات المعالجة البصرية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImageTool,
});

/* ================= AI ENGINES & PROVIDERS ================= */
const ENGINES = [
  {
    id: "google/gemini-3-pro-image",
    name: "Delvai Ultra Vision 4K 🎨",
    tag: "دقة 4K فائقة",
    badge: "الأقوى عالمياً",
    hint: "أعلى دقة وواقعية سينمائية، تفاصيل دقيقة، معالجة استثنائية للإضاءة والتكستشر",
  },
  {
    id: "google/gemini-3.1-flash-image",
    name: "Delvai Vision Fast ⚡",
    tag: "بث لحظي فائق السرعة",
    badge: "سرعة البرق",
    hint: "توليد فوري بأحدث معمارية لحظية مع سرعة فائقة وجودة ممتازة",
  },
  {
    id: "google/gemini-2.5-flash-image",
    name: "Delvai Creative Pulse 💡",
    tag: "كفاءة وتوازن",
    badge: "متوازن",
    hint: "توليد سريع ومتوازن ومثالي للمسودات والتصميمات السريعة",
  },
] as const;

const STYLES = [
  { id: "photo", label: "تصوير واقعي", icon: Camera, hint: "photorealistic, 50mm lens, natural daylight, ultra detailed skin texture, raw photo, 8k" },
  { id: "cinematic", label: "سينمائي", icon: Film, hint: "cinematic still, anamorphic lens, dramatic rim lighting, film grain, teal and orange color grade, blockbuster aesthetic" },
  { id: "product", label: "صورة منتج فاخرة", icon: Sparkles, hint: "luxury commercial product photography, seamless studio backdrop, soft diffused shadows, crisp reflections, advertising quality" },
  { id: "3d", label: "ثلاثي الأبعاد", icon: Layers, hint: "3d render, octane render, subsurface scattering, soft global illumination, blender masterpiece" },
  { id: "art", label: "رسم رقمي", icon: Palette, hint: "digital illustration, rich vibrant colors, dynamic painterly brushwork, artistic masterpiece" },
  { id: "anime", label: "أنمي ومانغا", icon: Zap, hint: "anime key visual, makoto shinkai style, exquisite lighting, vivid skies, expressive details" },
  { id: "minimal", label: "مينيمال راقٍ", icon: Sliders, hint: "minimalist editorial composition, negative space, elegant muted palette, luxury magazine layout" },
  { id: "logo", label: "شعار وأيقونة", icon: Rocket, hint: "flat vector logo mark, modern minimalist icon, high contrast, clean vector curves" },
] as const;

const LIGHTING_MODES = [
  { id: "auto", label: "إضاءة تلقائية ذكية", hint: "natural balanced studio lighting" },
  { id: "golden", label: "شروق/غروب ذهبي", hint: "golden hour sunlight, warm atmospheric glow, soft long shadows" },
  { id: "studio", label: "سوفت بوكس استوديو", hint: "high-end commercial studio softbox lighting, perfectly balanced exposure" },
  { id: "cyber", label: "نيون سايبربانك", hint: "vibrant neon rim light, purple and cyan backlight, reflective futuristic glow" },
  { id: "dramatic", label: "درامي مظلم", hint: "dramatic chiaroscuro lighting, moody high contrast, subtle deep shadows" },
] as const;

const CAMERA_MODES = [
  { id: "auto", label: "زاوية تلقائية", hint: "cinematic medium shot" },
  { id: "portrait", label: "بورتريه 85mm", hint: "85mm f/1.4 portrait lens, beautiful bokeh, shallow depth of field" },
  { id: "wide", label: "عدسة عريضة 24mm", hint: "24mm wide angle lens, expansive perspective, dramatic field of view" },
  { id: "macro", label: "ماكرو دقيق 100mm", hint: "100mm macro lens, extreme close-up, microscopic crisp details" },
  { id: "drone", label: "لقطة درون علوية", hint: "aerial drone photography, bird's eye view, vast landscape scale" },
] as const;

const RATIOS = [
  { id: "1:1", label: "مربّع 1:1", desc: "سوشيال ميديا", box: "aspect-square" },
  { id: "16:9", label: "عريض 16:9", desc: "يوتيوب وشاشات", box: "aspect-video" },
  { id: "9:16", label: "طولي 9:16", desc: "ريلز وستوري", box: "aspect-[9/16]" },
  { id: "4:5", label: "إنستغرام 4:5", desc: "منشورات عمودية", box: "aspect-[4/5]" },
  { id: "3:2", label: "كلاسيكي 3:2", desc: "كاميرا فوتوغرافية", box: "aspect-[3/2]" },
  { id: "21:9", label: "سينما 21:9", desc: "شاشة بانورامية", box: "aspect-[21/9]" },
] as const;

const EDIT_ACTIONS = [
  { id: "bg-remove", label: "إزالة الخلفية", icon: Eraser, prompt: "Remove the background completely and place the subject on a pure solid transparent/white studio background with ultra-clean sharp edges. Keep the subject pixel-identical." },
  { id: "bg-replace", label: "استبدال الخلفية", icon: ImagePlus, prompt: "Replace the background with a clean luxurious modern studio backdrop with soft warm lighting. Keep the subject completely unchanged and match lighting realistically." },
  { id: "upscale", label: "رفع الدقة 4K", icon: Sparkles, prompt: "Upscale and enhance this image to ultra-high 4k resolution: sharpen fine details, remove noise, recover crisp natural textures." },
  { id: "product-shot", label: "صورة منتج تجارية", icon: Camera, prompt: "Transform this image into a premium commercial advertising shot: seamless podium, soft shadows, studio lighting, magazine quality." },
  { id: "outpaint", label: "توسيع الإطار", icon: Expand, prompt: "Expand the canvas outward (outpainting), seamlessly continuing the scene, lighting, atmosphere and perspective beyond original borders." },
  { id: "retouch", label: "تنقيح استوديو", icon: Wand2, prompt: "Professional studio color grading and retouching: balance exposure, enhance vibrant tones, clean finish while preserving identity." },
] as const;

const INSPIRATION_STARTERS = [
  {
    title: "صورة منتج فاخر بإضاءة استوديو",
    desc: "زجاجة عطر ذهبية راقية على قاعدة رخامية سوداء مع انعكاسات مائية ناعمة وإضاءة درامية.",
    style: "product",
    ratio: "4:5",
    lighting: "studio",
  },
  {
    title: "شخصية خيال علمي في مدينة نيوم",
    desc: "رائد فضاء يرتدي بذلة سايبر متطورة ذات خطوط نيون ذهبية ينظر إلى أفق مدينة مستقبلية ليلاً بدقة 8K.",
    style: "cinematic",
    ratio: "16:9",
    lighting: "cyber",
  },
  {
    title: "شعار ثلاثي الأبعاد لشركة ذكاء اصطناعي",
    desc: "شعار معدني ذهبي ومضيء على شكل نواة عصبية ثلاثية الأبعاد يطفو على خلفية داكنة فاخرة.",
    style: "3d",
    ratio: "1:1",
    lighting: "dramatic",
  },
  {
    title: "مشهد طبيعي ساحر وقت الغروب",
    desc: "جبال شاهقة مغطاة بالضباب مع بحيرة كريستالية تعكس ألوان شفق الغروب البنفسجية والذهبية.",
    style: "photo",
    ratio: "16:9",
    lighting: "golden",
  },
];

type Tab = "generate" | "edit";
type Shot = { url: string; prompt: string; ratio?: string };

const GENERATION_PHASES = [
  "📡 استقبال وتحليل الوصف وهندسته بالذكاء الاصطناعي…",
  "🧠 بناء الشبكة البصرية وضبط المنظور والعدسة…",
  "🎨 توزيع الإضاءة السينمائية ورسم تفاصيل 4K…",
  "✨ المعالجة النهائية وضبط الألوان والتصدير…",
];

function ImageTool() {
  const save = useServerFn(saveGeneration);
  const enhanceFn = useServerFn(chatComplete);
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const speechRef = useRef<any>(null);

  const [tab, setTab] = useState<Tab>("generate");
  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [model, setModel] = useState<string>(ENGINES[0].id);
  const [style, setStyle] = useState<string>(STYLES[0].id);
  const [lighting, setLighting] = useState<string>("auto");
  const [camera, setCamera] = useState<string>("auto");
  const [ratio, setRatio] = useState<string>(RATIOS[0].id);
  const [count, setCount] = useState(1);
  const [action, setAction] = useState<string>(EDIT_ACTIONS[0].id);

  const [refs, setRefs] = useState<string[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [active, setActive] = useState<Shot | null>(null);
  const [busy, setBusy] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [enhancing, setEnhancing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const ratioBox = RATIOS.find((r) => r.id === (active?.ratio ?? ratio))?.box ?? "aspect-square";

  // Cycle through live progress phases during generation
  useEffect(() => {
    if (!busy) {
      setPhaseIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % GENERATION_PHASES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [busy]);

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
            "أنت خبير فائق في هندسة وتوليد أوامر الصور بالذكاء الاصطناعي. حوّل وصف المستخدم إلى وصف إنجليزي فائق الاحترافية والدقة (تفاصيل المشهد، نوع العدسة والإضاءة، التكوين، المواد، الجودة القصوى) في فقرة واحدة سلسة بدون أي مقدمات أو علامات تنسيق.",
          messages: [{ role: "user", content: prompt.trim() }],
          model: "google/gemini-2.5-flash",
        },
      });
      if (res.ok && res.text) {
        setPrompt(res.text.trim());
        toast.success("تم تحسين الوصف وتفصيله بالذكاء الاصطناعي 🪄");
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
        toast.info("تحدث الآن لوصف الصورة…");
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

  const applyStarter = (starter: (typeof INSPIRATION_STARTERS)[number]) => {
    setPrompt(starter.desc);
    setStyle(starter.style);
    setRatio(starter.ratio);
    if (starter.lighting) setLighting(starter.lighting);
    toast.success(`تم اختيار قالب: ${starter.title}`);
  };

  const generateVariations = async () => {
    if (!active || busy) return;
    setRefs([active.url]);
    toast.info("جارٍ توليد 4 تنويعات بصرية من الصورة…");
    setCount(4);
    await run(active.prompt);
  };

  const run = async (overridePrompt?: string) => {
    if (busy) return;
    const isEdit = tab === "edit";
    if (isEdit && refs.length === 0) {
      setError("يرجى إرفاق صورة أولاً لتطبيق التعديل عليها.");
      return;
    }
    const currentPrompt = overridePrompt ?? prompt;
    if (!isEdit && !currentPrompt.trim()) {
      setError("يرجى كتابة وصف الصورة التي ترغب في توليدها.");
      return;
    }

    const styleHint = STYLES.find((s) => s.id === style)?.hint ?? "";
    const lightHint = LIGHTING_MODES.find((l) => l.id === lighting)?.hint ?? "";
    const camHint = CAMERA_MODES.find((c) => c.id === camera)?.hint ?? "";
    const editPrompt = EDIT_ACTIONS.find((a) => a.id === action)?.prompt ?? "";

    const finalPrompt = isEdit
      ? `${editPrompt}${currentPrompt.trim() ? ` Additional specs: ${currentPrompt.trim()}.` : ""}`
      : `${currentPrompt.trim()}. Style: ${styleHint}.`;

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
              lighting: lightHint,
              camera: camHint,
              negative: negative.trim() || undefined,
              quality: "4k ultra high fidelity",
              model,
            }),
          }).then(async (r) => (await r.json()) as { url?: string; message?: string }),
        ),
      );

      const ok = results
        .filter((r) => r.url)
        .map((r) => ({ url: r.url as string, prompt: currentPrompt || editPrompt, ratio }));
      if (ok.length === 0) {
        setError(results[0]?.message ?? "تعذّر توليد الصورة، حاول مجدداً.");
        return;
      }
      setShots((p) => [...ok, ...p].slice(0, 24));
      setActive(ok[0]!);
      toast.success("تم توليد الصورة بنجاح!");
      if (user)
        ok.forEach((s) =>
          void save({ data: { tool: "صورة", prompt: currentPrompt || editPrompt, result_url: s.url } }),
        );
    } catch {
      setError("تعذّر الاتصال بخادم التوليد. حاول مجددًا.");
    } finally {
      setBusy(false);
    }
  };

  const activeEngine = ENGINES.find((e) => e.id === model) || ENGINES[0];

  return (
    <ToolShell
      title="استوديو الصور الفائق — Delvai Image Studio"
      subtitle="عقل التوليد والتصميم البصري لمنصة Delvai — معالجة بصرية فائقة الدقة بدقة 4K وعدسات تصوير وإضاءات سينمائية."
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5">
        {/* ================= AI ENGINES & PROVIDERS HUD ================= */}
        <div className="relative overflow-hidden rounded-3xl glass p-3 sm:p-4 shadow-float border-primary/25 ring-glow">
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            {/* Mode Switcher */}
            <div className="flex items-center gap-2">
              {(["generate", "edit"] as const).map((t) => {
                const activeMode = tab === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTab(t);
                      setError(null);
                    }}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                      activeMode
                        ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.35)] scale-105"
                        : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {t === "generate" ? <Sparkles className="size-3.5" /> : <Wand2 className="size-3.5" />}
                    <span>{t === "generate" ? "توليد صورة بالذكاء الاصطناعي" : "تعديل وتحرير صورة"}</span>
                  </button>
                );
              })}
            </div>

            {/* AI Model Engine Selector */}
            <div className="ms-auto flex items-center gap-1.5 rounded-2xl border border-primary/30 bg-card/60 p-1">
              <span className="ps-2 pe-1 text-[10px] font-bold text-muted-foreground font-mono uppercase">
                المحرك:
              </span>
              {ENGINES.map((e) => {
                const isSelected = model === e.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setModel(e.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm font-bold scale-105"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={e.hint}
                  >
                    <Zap className="size-3" />
                    <span>{e.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= MAIN STUDIO CANVAS ================= */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* ================= LEFT / CONTROLS DECK ================= */}
          <div className="flex flex-col gap-4 rounded-3xl glass p-5 sm:p-6 shadow-float border-primary/20 backdrop-blur-xl">
            {/* Prompt Header & Magic Actions */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  {tab === "edit" ? "تفاصيل التعديل المطلوب" : "وصف الصورة الإبداعية"}
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
                    تحسين الوصف
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
                    title="وصف الصورة بالصوت"
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
                  placeholder={
                    tab === "edit"
                      ? "مثال: اجعل الخلفية رخام أبيض فخم، وأضف ظلالاً ناعمة وإضاءة ذهبية دافئة…"
                      : "مثال: منتج عطر فاخر من الكريستال الذهبي على صخرة بركانية سوداء مع إضاءة سينمائية ساحرة…"
                  }
                  className="w-full resize-none border-none bg-transparent p-0 text-sm leading-6 placeholder:text-muted-foreground/60 outline-none focus-visible:ring-0"
                />
              </div>
            </div>

            {/* Quick Edit Actions (If Tab === 'edit') */}
            {tab === "edit" && (
              <div>
                <span className="mb-2 block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  نوع التعديل الذكي:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EDIT_ACTIONS.map((a) => {
                    const isSelected = action === a.id;
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAction(a.id)}
                        className={`flex items-center gap-2 rounded-2xl border p-2.5 text-xs font-semibold transition-all ${
                          isSelected
                            ? "border-primary bg-primary/15 text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.25)] font-bold scale-[1.02]"
                            : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Style Selector (If Tab === 'generate') */}
            {tab === "generate" && (
              <div>
                <span className="mb-2 block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  النمط الفني والتصويري:
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
                        className={`flex items-center gap-2 rounded-2xl border p-2.5 text-xs font-semibold transition-all ${
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
            )}

            {/* AI Lighting & Camera Lenses HUD */}
            {tab === "generate" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border/40 pt-3">
                {/* Lighting Mode */}
                <div>
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <Sun className="size-3.5 text-primary" />
                    الإضاءة والأجواء:
                  </span>
                  <select
                    value={lighting}
                    onChange={(e) => setLighting(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground outline-none focus:border-primary/80"
                  >
                    {LIGHTING_MODES.map((l) => (
                      <option key={l.id} value={l.id} className="bg-card text-foreground">
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Camera Framing */}
                <div>
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <Aperture className="size-3.5 text-primary" />
                    العدسة والمنظور:
                  </span>
                  <select
                    value={camera}
                    onChange={(e) => setCamera(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground outline-none focus:border-primary/80"
                  >
                    {CAMERA_MODES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-card text-foreground">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Aspect Ratio Selector (If Tab === 'generate') */}
            {tab === "generate" && (
              <div>
                <span className="mb-2 block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  نسبة الأبعاد والإطار:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {RATIOS.map((r) => {
                    const isSelected = ratio === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRatio(r.id)}
                        className={`flex flex-col items-center justify-center rounded-2xl border p-2 text-center transition-all ${
                          isSelected
                            ? "border-primary bg-primary/15 text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.25)] font-bold scale-105"
                            : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        <span className="text-xs font-bold">{r.label}</span>
                        <span className="text-[10px] text-muted-foreground/80 scale-90">{r.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Number of Outputs & Advanced Drawer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3">
              {tab === "generate" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">عدد النسخ:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCount(n)}
                        className={`size-7 rounded-xl border text-xs font-bold transition-all ${
                          count === n
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border/70 bg-card/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="ms-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <span>إعدادات متقدمة وخلفيات</span>
                <ChevronDown className={`size-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Advanced Settings Drawer */}
            {showAdvanced && (
              <div className="space-y-3 rounded-2xl border border-border/60 bg-background/50 p-3 text-xs">
                {tab === "generate" && (
                  <div>
                    <label className="mb-1 block font-semibold text-muted-foreground">
                      ما لا تريده في الصورة (Negative Prompt):
                    </label>
                    <Input
                      value={negative}
                      onChange={(e) => setNegative(e.target.value)}
                      placeholder="نص مشوّه، أصابع غير طبيعية، ضبابية، علامات مائية"
                      className="h-8 rounded-xl bg-background/60 text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block font-semibold text-muted-foreground">
                    {tab === "edit" ? "الصورة المراد تعديلها:" : "صور مرجعية (اختياري حتى 4):"}
                  </label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      addFiles(e.dataTransfer.files);
                    }}
                    onClick={() => fileRef.current?.click()}
                    className="cursor-pointer rounded-2xl border border-dashed border-border/80 bg-card/40 p-4 text-center text-xs text-muted-foreground hover:border-primary/50 transition-colors"
                  >
                    <Upload className="mx-auto mb-1 size-5 text-primary/70" />
                    <span>اسحب الصور هنا أو اضغط للاختيار من جهازك</span>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />

                  {refs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {refs.map((src, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={src}
                            alt="مرجع"
                            className="size-14 rounded-xl border border-primary/40 object-cover shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setRefs((p) => p.filter((_, x) => x !== i))}
                            className="absolute -top-1.5 -end-1.5 rounded-full bg-destructive p-1 text-destructive-foreground shadow hover:scale-110 transition-transform"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Launch Button */}
            <Button
              onClick={() => void run()}
              disabled={busy || (tab === "generate" ? !prompt.trim() : refs.length === 0)}
              className="mt-2 h-12 w-full rounded-2xl bg-cine text-primary-foreground shadow-glow font-bold text-sm transition-transform hover:scale-[1.01]"
            >
              {busy ? (
                <div className="flex items-center gap-2">
                  <DelvaiThinkingLoader size="xs" inline />
                  <span>{GENERATION_PHASES[phaseIndex]}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {tab === "edit" ? <Wand2 className="size-4" /> : <Rocket className="size-4" />}
                  <span>{tab === "edit" ? "تطبيق التعديل الذكي" : "إطلاق توليد الصورة بدقة 4K"}</span>
                </div>
              )}
            </Button>

            {error && (
              <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </p>
            )}
          </div>

          {/* ================= RIGHT / CINEMATIC VIEWPORT ================= */}
          <div className="flex flex-col gap-4 rounded-3xl glass p-5 sm:p-6 shadow-float border-primary/20 backdrop-blur-xl">
            {/* Viewport Frame */}
            <div
              className={`relative flex ${ratioBox} max-h-[60vh] w-full items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-background/80 shadow-2xl transition-all`}
            >
              {/* Grid Background */}
              <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />

              {busy ? (
                <div className="relative z-10 p-6 text-center">
                  <DelvaiThinkingLoader size="lg" text="دلفاي يفكّر ويرسم بدقة فائقة…" />
                  <p className="mt-3 text-xs text-primary font-mono font-bold animate-pulse">
                    {GENERATION_PHASES[phaseIndex]}
                  </p>
                </div>
              ) : active ? (
                <div className="relative group size-full">
                  <img
                    src={active.url}
                    alt={active.prompt}
                    className="size-full object-contain transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                    onClick={() => setFullscreenImage(active.url)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end pointer-events-none">
                    <p className="text-xs text-white/90 line-clamp-2">{active.prompt}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFullscreenImage(active.url)}
                    className="absolute top-3 end-3 rounded-full bg-black/60 p-2 text-white/80 hover:text-white backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
                    title="تكبير الصورة كاملة"
                  >
                    <Maximize2 className="size-4" />
                  </button>
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
                    استوديو دلفاي <span className="text-shine">للصور الفائقة</span>
                  </h3>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                    اختر قالباً ملهماً أدناه أو اكتب وصفك وسيقوم دلفاي برسمه لك بدقة سينمائية 4K.
                  </p>
                </div>
              )}
            </div>

            {/* Viewport Action Controls */}
            {active && !busy && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <a
                  href={active.url}
                  download={`delvai-image-${Date.now()}.png`}
                  className="w-full"
                >
                  <Button variant="outline" size="sm" className="w-full rounded-xl text-xs gap-1.5">
                    <Download className="size-3.5" /> تنزيل 4K
                  </Button>
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRefs([active.url]);
                    setTab("edit");
                    toast.info("تم نقل الصورة إلى لوحة التعديل والتحرير");
                  }}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <Wand2 className="size-3.5" /> تحرير
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateVariations}
                  className="rounded-xl text-xs gap-1.5"
                  title="توليد تنويعات بصرية جديدة"
                >
                  <Sparkles className="size-3.5 text-primary" /> تنويعات
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(active.url);
                    toast.success("تم نسخ رابط الصورة");
                  }}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <Copy className="size-3.5" /> نسخ الرابط
                </Button>
              </div>
            )}

            {/* Inspiration Presets (If No Image Yet) */}
            {!active && !busy && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  نماذج إلهامية مقترحة:
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {INSPIRATION_STARTERS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyStarter(s)}
                      className="group flex flex-col items-start rounded-2xl border border-border/70 bg-card/40 p-2.5 text-start transition-all hover:border-primary/50 hover:bg-card/80 hover:shadow-sm"
                    >
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {s.title}
                      </span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
                        {s.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Shots History Strip */}
            {shots.length > 1 && (
              <div className="border-t border-border/40 pt-3">
                <span className="mb-2 block text-[11px] font-bold text-muted-foreground">الصور المولدة في هذه الجلسة ({shots.length}):</span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {shots.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActive(s)}
                      className={`relative shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                        active?.url === s.url
                          ? "border-primary shadow-[0_0_10px_oklch(0.82_0.14_82/0.4)] scale-105"
                          : "border-border/60 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={s.url} alt="نتيجة" className="size-14 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Lightbox Modal */}
        {fullscreenImage && (
          <div
            onClick={() => setFullscreenImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-zoom-out"
          >
            <button
              type="button"
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 end-4 rounded-full bg-card p-2 text-foreground"
            >
              <X className="size-6" />
            </button>
            <img
              src={fullscreenImage}
              alt="معاينة كاملة"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        )}
      </div>
    </ToolShell>
  );
}
