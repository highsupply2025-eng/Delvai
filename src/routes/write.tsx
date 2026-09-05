import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import {
  Check,
  Copy,
  Cpu,
  Download,
  Languages,
  Mic,
  MicOff,
  PenLine,
  RefreshCcw,
  Rocket,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  Wand2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ToolShell } from "@/components/ToolShell";
import { saveGeneration } from "@/lib/history.functions";
import { useAuth } from "@/hooks/useAuth";
import { DelvaiThinkingLoader, DelvaiLogo } from "@/components/DelvaiThinkingLoader";

export const Route = createFileRoute("/write")({
  head: () => ({
    meta: [
      { title: "استوديو كتابة المحتوى وصناعة الإعلانات (Delvai Copy) | سرعة فائقة وبث فوري" },
      {
        name: "description",
        content:
          "استوديو كتابة متكامل فائق السرعة: صياغة إعلانات تسويقية فيروسية، مقالات SEO، أوصاف منتجات، خطابات بريد إلكتروني، تدقيق لغوي وتحليل معدل التحويل ببث لحظي فوري.",
      },
      { property: "og:title", content: "استوديو كتابة المحتوى وصناعة الإعلانات — Delvai Copy" },
      {
        property: "og:description",
        content: "محتوى تسويقي فائق التأثير والسرعة بالعربية بأحدث أطر الإعلانات العالمية AIDA و PAS و 4P.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WriteTool,
});

const TABS = [
  { id: "generate", label: "توليد المحتوى والإعلانات", icon: PenLine },
  { id: "rewrite", label: "إعادة الصياغة الذكية", icon: RefreshCcw },
  { id: "polish", label: "تدقيق لغوي وبلاغي", icon: ShieldCheck },
  { id: "seo", label: "تحسين محركات البحث SEO", icon: Search },
  { id: "translate", label: "ترجمة تسويقية متقنة", icon: Languages },
  { id: "score", label: "تحليل قوة الإقناع والتحويل", icon: Sparkles },
] as const;
type TabId = (typeof TABS)[number]["id"];

const ENGINES = [
  { id: "google/gemini-3.7-flash", label: "Delvai Copy Instant ⚡", tag: "بث فوري لحظي" },
  { id: "google/gemini-2.5-flash", label: "Delvai Copy Pro ✍️", tag: "توليد سريع متقن" },
  { id: "google/gemini-3.7-pro", label: "Delvai Strategic Copy 🧠", tag: "تحليل واستراتيجية" },
];

const KINDS = [
  { id: "ad", label: "إعلان ممول عالي التحويل 🚀" },
  { id: "social", label: "منشور سوشيال ميديا فيروسي 🔥" },
  { id: "script", label: "سيناريو فيديو / ريلز وتيك توك 🎬" },
  { id: "product", label: "وصف منتج لمتجر إلكتروني 🛍️" },
  { id: "landing", label: "نص صفحة هبوط كاملة 💎" },
  { id: "email", label: "إيميل تسويقي مقنع 📩" },
  { id: "article", label: "مقال متوافق مع SEO 📑" },
  { id: "headline", label: "عناوين وسلوجان خاطف للأنظار 🎯" },
] as const;

const TONES = ["مقنع وجذاب", "فاخر وراقي", "مباشر وقوي", "حماسي وفيروسي", "احترافي رسمي", "قصصي ومؤثر", "تعليمي مبسط"];
const PLATFORMS = ["عام", "إنستغرام", "تيك توك", "إكس (تويتر)", "لينكدإن", "سناب شات", "يوتيوب", "متجر إلكتروني"];
const FRAMEWORKS = [
  { id: "auto", label: "تلقائي ذكي" },
  { id: "aida", label: "نموذج AIDA (انتباه، اهتمام، رغبة، إجراء)" },
  { id: "pas", label: "نموذج PAS (مشكلة، تهييج، حل)" },
  { id: "fab", label: "نموذج FAB (ميزة، فائدة، منفعة)" },
  { id: "4p", label: "نموذج 4P (صورة، وعد، إثبات، دفع)" },
];
const DIALECTS = ["فصحى تسويقية راقية", "لهجة سعودية / خليجية", "لهجة مصرية جذابة", "عربي + مصطلحات إنجليزية"];
const REWRITE_MODES = [
  "إعادة صياغة باحترافية تسويقية أعلى",
  "جعله أكثر إقناعاً وقوة للتحويل",
  "تبسيط الفكرة واختصارها",
  "توسيع النص بأمثلة وحجج قوية",
  "تحويله لأسلوب قصصي مشوق",
];
const LANGS = ["الإنجليزية", "الفرنسية", "الإسبانية", "التركية", "الألمانية", "الصينية"];

const INSPIRATION_COPY = [
  {
    title: "خطة إعلان ممول لزيادة المبيعات",
    topic: "إطلاق تشكيلة ساعات ذكية جديدة فاخرة مقاومة للماء مع بطارية تدوم أسبوعين.",
    kind: "ad",
    tone: "فاخر وراقي",
  },
  {
    title: "منشور فيروسي لـ LinkedIn",
    topic: "5 أخطاء يقع فيها 90% من رواد الأعمال في أول سنة وكيف تتجنبها لبناء مشروع ناجح.",
    kind: "social",
    tone: "احترافي رسمي",
  },
  {
    title: "سيناريو ريلز جذاب لـ TikTok",
    topic: "طريقة سحرية لمضاعفة تركيزك وإنتاجيتك اليومية في 3 خطوات بسيطة.",
    kind: "script",
    tone: "حماسي وفيروسي",
  },
  {
    title: "وصف منتج جذاب لمتجر شوبيفاي",
    topic: "قهوة عربية مختصة مع حبوب الهيل والزعفران الطبيعي بنكهة أصيلة تفوح في الأرجاء.",
    kind: "product",
    tone: "مقنع وجذاب",
  },
];

const SEP = "-----";

function WriteTool() {
  const save = useServerFn(saveGeneration);
  const { user } = useAuth();

  const [tab, setTab] = useState<TabId>("generate");
  const [model, setModel] = useState(ENGINES[0].id);

  // Generate controls
  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState<string>(KINDS[0].id);
  const [tone, setTone] = useState(TONES[0]!);
  const [platform, setPlatform] = useState(PLATFORMS[0]!);
  const [framework, setFramework] = useState("auto");
  const [dialect, setDialect] = useState(DIALECTS[0]!);
  const [audience, setAudience] = useState("");
  const [brand, setBrand] = useState("");
  const [keywords, setKeywords] = useState("");
  const [cta, setCta] = useState("");
  const [emoji, setEmoji] = useState(true);
  const [variants, setVariants] = useState(2);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Shared source for other tabs
  const [source, setSource] = useState("");
  const [rewriteMode, setRewriteMode] = useState(REWRITE_MODES[0]!);
  const [targetLang, setTargetLang] = useState(LANGS[0]!);
  const [seoKeyword, setSeoKeyword] = useState("");

  const [streamingText, setStreamingText] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [activeVariant, setActiveVariant] = useState(0);
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stop = () => {
    abortRef.current?.abort();
    setBusy(false);
  };

  const toggleSpeak = (text: string) => {
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      return;
    }
    if (!window.speechSynthesis) {
      toast.error("القراءة الصوتية غير مدعومة في جهازك");
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[\*#`_~]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ar";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("تم نسخ المحتوى");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = (text: string) => {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `delvai-copy-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل المحتوى كملف Markdown");
  };

  const applyStarter = (s: (typeof INSPIRATION_COPY)[number]) => {
    setTopic(s.topic);
    setKind(s.kind);
    setTone(s.tone);
    toast.success(`تم اختيار قالب: ${s.title}`);
  };

  const run = async () => {
    if (busy) return;
    const needsSource = tab !== "generate";
    if (needsSource && !source.trim()) {
      setError("يرجى إدخال النص المصدر أولاً.");
      return;
    }
    if (!needsSource && !topic.trim()) {
      setError("يرجى كتابة موضوع أو تفاصيل المحتوى المطلوب.");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    setResults([]);
    setStreamingText("");

    let system = "";
    let userPrompt = "";

    if (tab === "generate") {
      const selectedKind = KINDS.find((k) => k.id === kind)?.label ?? kind;
      const selectedFw = FRAMEWORKS.find((f) => f.id === framework)?.label ?? "";
      system = `أنت كبير مسؤولي التسويق وصناع الإعلانات (Chief Copywriter) في منصة Delvai. صياغتك عبقرية، مقنعة جداً، خالية من الحشو والابتذال، وتستخدم علم النفس التسويقي لمضاعفة المبيعات والتفاعل.
مهمتك كتابة ${variants} نسخ تسويقية مختلفة ومبتكرة. افصل بين كل نسخة وأخرى تماماً بسطر يحتوي على "${SEP}" فقط.`;

      userPrompt = `المطلوب: ${selectedKind}
الموضوع والمنتج: ${topic}
النبرة: ${tone}
المنصة: ${platform}
إطار العمل التسويقي: ${selectedFw}
اللهجة: ${dialect}
${brand ? `اسم العلامة التجارية: ${brand}` : ""}
${audience ? `الجمهور المستهدف: ${audience}` : ""}
${keywords ? `الكلمات المفتاحية: ${keywords}` : ""}
${cta ? `الدعوة لاتخاذ إجراء (CTA): ${cta}` : ""}
${emoji ? "استخدم رموزاً تعبيرية مناسبة وجذابة." : "بدون رموز تعبيرية."}
اكتب الآن ${variants} نسخ تسويقية فريدة وافصل بينها بـ "${SEP}".`;
    } else if (tab === "rewrite") {
      system = "أنت محرر تسويقي محترف. أعد صياغة النص المعطى بأعلى مستويات الجودة والتأثير.";
      userPrompt = `النمط المطلوب: ${rewriteMode}\n\nالنص الأصلي:\n${source}`;
    } else if (tab === "polish") {
      system = "أنت مدقق لغوي وبلاغي خبير. دقّق النص نحوياً وإملائياً وبلاغياً واذكر قائمة التحسينات التي قمت بها ثم قدّم النسخة المنقحة النهائية.";
      userPrompt = `دقّق وحسّن هذا النص:\n${source}`;
    } else if (tab === "seo") {
      system = "أنت خبير سيو (SEO Specialist). حسّن النص ليتصدر نتائج البحث في Google مع الحفاظ على القراءة الطبيعية الجذابة.";
      userPrompt = `الكلمة المفتاحية المستهدفة: ${seoKeyword || "تلقائي حسب النص"}\n\nالنص:\n${source}`;
    } else if (tab === "translate") {
      system = `أنت مترجم تسويقي خبير (Localization Copywriter). ترجم النص إلى ${targetLang} مع تكييف الصياغة لتكون طبيعية ومقنعة جداً للجمهور المحلي.`;
      userPrompt = `ترجم إلى ${targetLang}:\n\n${source}`;
    } else if (tab === "score") {
      system = "أنت مستشار تسويق وخبير معدلات تحويل (CRO Expert). حلّل النص وقدّم تقييماً رقمياً من 100 لقوة الإقناع مع تفصيل نقاط القوة ونقاط الضعف واقتراحات محددة لمضاعفة التأثير.";
      userPrompt = `حلّل قوة هذا النص التسويقي:\n\n${source}`;
    }

    let acc = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          system,
          model,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!res.ok || !res.body) {
        const msg = (await res.text().catch(() => "")) || "تعذّر إتمام توليد المحتوى، حاول مجدداً.";
        setError(msg);
        setBusy(false);
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
              acc += delta;
              setStreamingText(acc);
            }
          } catch {
            /* ignore partial json */
          }
        }
      }

      if (!acc.trim()) {
        setError("لم يتم استلام محتوى من النموذج، يرجى المحاولة مرة أخرى.");
        setBusy(false);
        return;
      }

      const parts =
        tab === "generate"
          ? acc.split(SEP).map((p) => p.trim()).filter(Boolean)
          : [acc.trim()];

      setResults(parts.length > 0 ? parts : [acc.trim()]);
      setActiveVariant(0);
      toast.success("تم إتمام صياغة المحتوى فائق السرعة! ⚡");
      if (user) {
        void save({ data: { tool: "كتابة", prompt: topic || source, result_text: acc } });
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") {
        if (acc.trim()) {
          const parts = tab === "generate" ? acc.split(SEP).map((p) => p.trim()).filter(Boolean) : [acc.trim()];
          setResults(parts);
        }
        return;
      }
      setError("حدث خطأ في الاتصال، يرجى المحاولة مجدداً.");
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const displayedContent = busy
    ? streamingText
    : results.length > 0
    ? results[activeVariant]
    : "";

  return (
    <ToolShell
      title="استوديو كتابة المحتوى وصناعة الإعلانات — Delvai Copy"
      subtitle="عقل الكتابة والتسويق لمنصة Delvai — صياغة إعلانات فيروسية فائقة السرعة، خطط محتوى، مقالات SEO، وتحليل معدل التحويل ببث لحظي فوري."
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5">
        {/* ================= TOP CYBER HUD BAR ================= */}
        <div className="relative overflow-hidden rounded-3xl glass p-3 sm:p-4 shadow-float border-primary/25 ring-glow">
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            {/* Tab Switchers */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {TABS.map((t) => {
                const isSelected = tab === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTab(t.id);
                      setError(null);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.35)] scale-105"
                        : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Model Engine Selector */}
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
                    className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm font-bold scale-105"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Zap className="size-3" />
                    <span>{e.label.split(" ")[0]} {e.label.split(" ")[1]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= MAIN STUDIO CANVAS ================= */}
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ================= LEFT CONTROLS ================= */}
          <div className="flex flex-col gap-4 rounded-3xl glass p-5 sm:p-6 shadow-float border-primary/20 backdrop-blur-xl">
            {tab === "generate" ? (
              <>
                {/* Content Kind */}
                <div>
                  <span className="mb-2 block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    نوع المحتوى التسويقي المطلوب:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {KINDS.map((k) => {
                      const isSelected = kind === k.id;
                      return (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => setKind(k.id)}
                          className={`flex items-center gap-2 rounded-2xl border p-2.5 text-xs font-semibold text-start transition-all ${
                            isSelected
                              ? "border-primary bg-primary/15 text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.25)] font-bold scale-[1.02]"
                              : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                        >
                          <span className="truncate">{k.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Topic / Prompt */}
                <div>
                  <span className="mb-1.5 block text-xs font-bold text-foreground">
                    موضوع المحتوى أو وصف المنتج والمشروع:
                  </span>
                  <div className="rounded-2xl border border-border/80 bg-background/80 p-3 shadow-inner focus-within:border-primary/80 focus-within:shadow-[0_0_20px_oklch(0.82_0.14_82/0.2)] transition-all">
                    <Textarea
                      rows={3}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="مثال: إطلاق خدمة ذكاء اصطناعي جديدة للأعمال توفر 80% من وقت صناعة المحتوى وتحليل السوق…"
                      className="w-full resize-none border-none bg-transparent p-0 text-sm leading-6 placeholder:text-muted-foreground/60 outline-none focus-visible:ring-0"
                    />
                  </div>
                </div>

                {/* Tone, Platform & Framework */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 border-t border-border/40 pt-3">
                  {/* Tone */}
                  <div>
                    <span className="mb-1 block text-xs font-bold text-muted-foreground">النبرة:</span>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-background/80 px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary/80"
                    >
                      {TONES.map((t) => (
                        <option key={t} value={t} className="bg-card text-foreground">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Platform */}
                  <div>
                    <span className="mb-1 block text-xs font-bold text-muted-foreground">المنصة:</span>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-background/80 px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary/80"
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p} className="bg-card text-foreground">
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Framework */}
                  <div>
                    <span className="mb-1 block text-xs font-bold text-muted-foreground">إطار العمل:</span>
                    <select
                      value={framework}
                      onChange={(e) => setFramework(e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-background/80 px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary/80"
                    >
                      {FRAMEWORKS.map((f) => (
                        <option key={f.id} value={f.id} className="bg-card text-foreground">
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Variants & Advanced Drawer */}
                <div className="flex items-center justify-between border-t border-border/40 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">النسخ المقترحة:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setVariants(n)}
                          className={`size-7 rounded-xl border text-xs font-bold transition-all ${
                            variants === n
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border/70 bg-card/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <span>تفاصيل الجمهور والـ CTA</span>
                  </button>
                </div>

                {/* Advanced Fields */}
                {showAdvanced && (
                  <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-border/60 bg-background/50 p-3 text-xs">
                    <div>
                      <label className="mb-1 block text-muted-foreground">اسم العلامة التجارية:</label>
                      <Input
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="مثال: متجر دلفاي"
                        className="h-8 rounded-xl bg-background/70 text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-muted-foreground">الجمهور المستهدف:</label>
                      <Input
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        placeholder="مثال: رواد الأعمال وأصحاب المتاجر"
                        className="h-8 rounded-xl bg-background/70 text-xs"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Other Tabs: Rewrite, Polish, SEO, Translate, Score */
              <div className="space-y-3">
                <div>
                  <span className="mb-1.5 block text-xs font-bold text-foreground">
                    النص المصدر المراد معالجته:
                  </span>
                  <div className="rounded-2xl border border-border/80 bg-background/80 p-3 shadow-inner focus-within:border-primary/80 focus-within:shadow-[0_0_20px_oklch(0.82_0.14_82/0.2)] transition-all">
                    <Textarea
                      rows={6}
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="الصق نصك التسويقي هنا للتدقيق والتحسين وإعادة الصياغة بالذكاء الاصطناعي…"
                      className="w-full resize-none border-none bg-transparent p-0 text-sm leading-6 placeholder:text-muted-foreground/60 outline-none focus-visible:ring-0"
                    />
                  </div>
                </div>

                {tab === "rewrite" && (
                  <div>
                    <span className="mb-1 block text-xs font-bold text-muted-foreground">أسلوب إعادة الصياغة:</span>
                    <select
                      value={rewriteMode}
                      onChange={(e) => setRewriteMode(e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground outline-none"
                    >
                      {REWRITE_MODES.map((m) => (
                        <option key={m} value={m} className="bg-card text-foreground">
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {tab === "translate" && (
                  <div>
                    <span className="mb-1 block text-xs font-bold text-muted-foreground">اللغة المستهدفة:</span>
                    <select
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground outline-none"
                    >
                      {LANGS.map((l) => (
                        <option key={l} value={l} className="bg-card text-foreground">
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {tab === "seo" && (
                  <div>
                    <span className="mb-1 block text-xs font-bold text-muted-foreground">الكلمة المفتاحية المستهدفة:</span>
                    <Input
                      value={seoKeyword}
                      onChange={(e) => setSeoKeyword(e.target.value)}
                      placeholder="مثال: أفضل متجر إلكتروني، تصميم مواقع"
                      className="rounded-xl bg-background/70 text-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Launch Action */}
            <div className="flex items-center gap-2">
              {busy ? (
                <Button
                  onClick={stop}
                  className="mt-2 h-12 w-full rounded-2xl bg-destructive/15 border border-destructive/40 text-destructive hover:bg-destructive/25 font-bold text-sm"
                >
                  <Square className="size-4 me-2" /> إيقاف التوليد
                </Button>
              ) : (
                <Button
                  onClick={() => void run()}
                  disabled={busy || (tab === "generate" ? !topic.trim() : !source.trim())}
                  className="mt-2 h-12 w-full rounded-2xl bg-cine text-primary-foreground shadow-glow font-bold text-sm transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4" />
                    <span>إطلاق الصياغة بالبث اللحظي الفوري ⚡</span>
                  </div>
                </Button>
              )}
            </div>

            {error && (
              <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </p>
            )}
          </div>

          {/* ================= RIGHT / OUTPUT VIEWPORT ================= */}
          <div className="flex flex-col gap-4 rounded-3xl glass p-5 sm:p-6 shadow-float border-primary/20 backdrop-blur-xl">
            {/* Variants Switcher (If multiple versions) */}
            {results.length > 1 && !busy && (
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-xs font-bold text-muted-foreground">النسخ المقترحة ({results.length}):</span>
                <div className="flex gap-1.5">
                  {results.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveVariant(i)}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                        activeVariant === i
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/70 bg-card/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      النسخة #{i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Output Display Box with Live Streaming */}
            <div className="relative min-h-[380px] max-h-[60vh] overflow-y-auto rounded-2xl border border-border/80 bg-background/80 p-5 shadow-inner leading-7 text-sm">
              {busy && !streamingText ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center my-auto">
                  <DelvaiThinkingLoader size="lg" text="دلفاي يبدأ البث اللحظي السريع…" />
                </div>
              ) : displayedContent ? (
                <div className="whitespace-pre-wrap font-sans text-foreground/95 space-y-2">
                  {displayedContent}
                  {busy && (
                    <span className="inline-block size-2 animate-ping rounded-full bg-primary align-middle ms-1" />
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center my-auto">
                  <div className="relative mx-auto mb-3 flex size-16 items-center justify-center">
                    <div className="pointer-events-none absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                    <div
                      className="pointer-events-none absolute size-16 rounded-full border border-dashed border-primary/40 animate-spin"
                      style={{ animationDuration: "7s" }}
                    />
                    <DelvaiLogo className="size-10 drop-shadow-[0_0_15px_oklch(0.82_0.14_82/0.8)]" />
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    استوديو دلفاي <span className="text-shine">لكتابة المحتوى والإعلانات</span>
                  </h3>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                    اختر قالباً تسويقياً أدناه أو اكتب فكرتك وسيبدأ دلفاي بالبث اللحظي لكلماته فوراً.
                  </p>
                </div>
              )}
            </div>

            {/* Output Actions Toolbar */}
            {displayedContent && !busy && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void copyText(displayedContent)}
                  className="rounded-xl text-xs gap-1.5"
                >
                  {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  <span>{copied ? "تم النسخ" : "نسخ النص"}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSpeak(displayedContent)}
                  className={`rounded-xl text-xs gap-1.5 ${
                    speaking ? "bg-primary/20 text-primary animate-pulse font-bold" : ""
                  }`}
                >
                  {speaking ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                  <span>{speaking ? "إيقاف الصوت" : "قراءة صوتية"}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadText(displayedContent)}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <Download className="size-3.5" /> تنزيل .md
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void run()}
                  className="rounded-xl text-xs gap-1.5"
                >
                  <RefreshCcw className="size-3.5" /> إعادة صياغة
                </Button>
              </div>
            )}

            {/* Inspiration Presets (When Empty) */}
            {!displayedContent && !busy && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  قوالب إلهامية جاهزة:
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {INSPIRATION_COPY.map((c, idx) => (
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
                        {c.topic}
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
