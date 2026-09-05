import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Languages,
  ListChecks,
  MessageSquare,
  Mic,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Sparkles,
  Square,
  Table2,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ToolShell } from "@/components/ToolShell";
import { DelvaiThinkingLoader, DelvaiLogo } from "@/components/DelvaiThinkingLoader";
import { saveGeneration } from "@/lib/history.functions";
import { extractFile, toCsvDownload, type ExtractedDoc } from "@/lib/extract";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "استوديو تحليل المستندات والبيانات (Delvai Docs) | ذكاء اصطناعي فائق السرعة" },
      {
        name: "description",
        content:
          "تحليل وفحص ملفات PDF وWord وExcel والصور بالذكاء الاصطناعي ببث فوري: تلخيص تنفيذي، استخراج جداول CSV، مراجعة العقود، محادثة وسؤال وجواب مع مستنداتك بسرعة البرق.",
      },
      { property: "og:title", content: "استوديو تحليل المستندات والبيانات — Delvai Docs" },
      {
        property: "og:description",
        content: "تحليل ذكي فوري للمستندات والتقارير المالية والعقود مع استخراج الجداول وقراءة صوتية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocsStudio,
});

const ENGINES = [
  { id: "google/gemini-3.7-flash", label: "Delvai Doc Fast ⚡", tag: "بث فوري ⚡" },
  { id: "google/gemini-3.7-pro", label: "Delvai Doc Deep Analysis 🧠", tag: "تحليل استراتيجي 🧠" },
];

const PRESETS = [
  {
    id: "summary",
    label: "ملخص تنفيذي شامل ⚡",
    icon: Sparkles,
    prompt: "اكتب ملخصاً تنفيذياً دقيقاً ومنظماً: الفكرة العامة، أهم النقاط الرئيسية، الأرقام والإحصائيات، والخلاصة الاستراتيجية.",
  },
  {
    id: "tables",
    label: "استخراج جداول CSV 📊",
    icon: Table2,
    prompt: "استخرج كل البيانات الجدولية والأرقام من المستند وأعدها بصيغة CSV صالحة تماماً فقط (سطر عناوين ثم الصفوف) لتنزيلها مباشرة دون أي شروحات إضافية.",
  },
  {
    id: "insights",
    label: "رؤى ومخاطر استراتيجية 📈",
    icon: BarChart3,
    prompt: "حلّل المحتوى واذكر أهم الرؤى، الفرص الاستثمارية، المخاطر المحتملة، والتوصيات العملية القابلة للتنفيذ الفوري.",
  },
  {
    id: "contract",
    label: "مراجعة وتدقيق العقود 📜",
    icon: FileText,
    prompt: "راجع المستند كخبير قانوني: الأطراف، الالتزامات المالية والزمنية، البنود الخطرة أو غير المتوازنة، التوصيات القانونية.",
  },
  {
    id: "bullets",
    label: "نقاط وقرارات سريعة 📋",
    icon: ListChecks,
    prompt: "استخرج أهم القرارات والمهام المطلوبة مع الجهة المسؤولة والمُدد الزمنية المحددة في نقاط مرتبة.",
  },
  {
    id: "translate",
    label: "ترجمة لفصحى راقية 🌐",
    icon: Languages,
    prompt: "ترجم محتوى المستند بالكامل إلى لغة عربية فصحى احترافية ودقيقة مع الحفاظ التام على الأرقام والمصطلحات التقنية.",
  },
] as const;

const SAMPLES = [
  {
    title: "عقد استشاري تجاري",
    desc: "نموذج اتفاقية خدمات تقنية مع بنود سداد وغرامات تأخير والتزامات أطراف.",
    text: `اتفاقية تقديم خدمات استشارية وتقنية
الطرف الأول: شركة دلفاي للحلول الذكية (المزود)
الطرف الثاني: شركة الأفق للتجارة (العميل)

المادة الأولى: موضوع العقد
يقوم المزود بتطوير ونشر منصة ذكاء اصطناعي مخصصة لإدارة العمليات التجارية للعميل.

المادة الثانية: القيمة المالية وطريقة السداد
إجمالي قيمة العقد 150,000 ريال سعودي، تُدفع على 3 دفعات متساوية:
1. دفعة أولى 30% عند توقيع العقد.
2. دفعة ثانية 40% عند تسليم النسخة التجريبية.
3. دفعة أخيرة 30% بعد الإطلاق الرسمي والقبول النهائي.

المادة الثالثة: المدة الزمنية وغرامات التأخير
مدة تنفيذ المشروع 90 يوماً تقويمياً. في حال تأخر المزود عن التسليم، تُفرض غرامة تأخير قدرها 1,000 ريال عن كل يوم تأخير بحد أقصى 10% من إجمالي قيمة العقد.

المادة الرابعة: السرية وحقوق الملكية
تؤول كافة حقوق الملكية الفكرية والشفرة البرمجية المخصصة للطرف الثاني بعد استيفاء كامل المستحقات المالية.`,
  },
  {
    title: "تقرير أداء مالي فصلي",
    desc: "بيانات إيرادات وتكاليف وهوامش ربح مع مقارنة أداء ربع سنوي.",
    text: `تقرير الأداء المالي للربع الثاني - 2026

1. الإيرادات الإجمالية:
- مبيعات الاشتراكات السحابية: 850,000 دولار (+24% مقارنة بالربع الأول)
- الخدمات الاستشارية المباشرة: 320,000 دولار (+15%)
- مبيعات الرخص المؤسسية: 430,000 دولار (+30%)
إجمالي الإيرادات: 1,600,000 دولار

2. التكاليف التشغيلية (OPEX):
- الخوادم والبنية السحابية GPU: 210,000 دولار
- الرواتب والمكافآت: 540,000 دولار
- التسويق واكتساب العملاء: 180,000 دولار
- مصاريف إدارية وعمومية: 90,000 دولار
إجمالي التكاليف: 1,020,000 دولار

3. صافي الأرباح وهوامش الربحية:
- صافي الربح التشغيلي (EBITDA): 580,000 دولار
- هامش الربح التشغيلي: 36.25%
- معدل بقاء العملاء السنوي (Retention Rate): 94.5%`,
  },
  {
    title: "دراسة جدوى إطلاق منتج",
    desc: "تحليل السوق، الجمهور المستهدف، المزايا التنافسية، وخطة التسعير.",
    text: `دراسة جدوى وخطة إطلاق: منصة Delvai Copy الذكية

1. الفرصة السوقية:
تزايد الطلب على أدوات صناعة المحتوى العربي بنسبة 140% سنوياً مع نقص في الأدوات المتخصصة في التسويق المحلي واللهجات الخليجية والمصرية.

2. الجمهور المستهدف:
- المتاجر الإلكترونية ورواد أعمال الدروب شيبينغ.
- وكالات الإعلانات والتسويق الرقمي.
- صناع المحتوى واليوتيوبرز والمدونون.

3. الميزة التنافسية:
- توليد إعلانات بنماذج AIDA و PAS بنقرة واحدة.
- بث لحظي سريع بدون انتظار.
- دمج التعليق الصوتي العصبي مع النصوص في حزمة واحدة.

4. خطة التسعير المقترحة:
- الخطة المجانية: 50 عملية شهرياً للتجربة.
- خطة المحترفين: 29 دولار/شهرياً لعمليات غير محدودة.
- خطة الشركات: 99 دولار/شهرياً مع واجهات API ودعم فني مخصص.`,
  },
];

const KIND_LABEL: Record<ExtractedDoc["kind"], string> = {
  pdf: "PDF",
  word: "Word",
  sheet: "Excel / جدول",
  text: "نص",
  image: "صورة OCR",
};

type ChatMsg = { role: "user" | "assistant"; content: string };

function DocsStudio() {
  const save = useServerFn(saveGeneration);

  const [model, setModel] = useState(ENGINES[0].id);
  const [docs, setDocs] = useState<ExtractedDoc[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [pasted, setPasted] = useState("");
  const [out, setOut] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [question, setQuestion] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const totalChars = useMemo(
    () => docs.reduce((n, d) => n + d.chars, 0) + pasted.length,
    [docs, pasted],
  );
  const hasContent = totalChars > 20 || docs.some((d) => d.kind === "image");

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setLoadingFiles(true);
    try {
      for (const file of Array.from(list).slice(0, 8)) {
        if (file.size > 25 * 1024 * 1024) {
          toast.error(`${file.name}: الحجم أكبر من 25 ميجابايت`);
          continue;
        }
        try {
          const doc = await extractFile(file);
          if (!doc.text && doc.kind !== "image") {
            toast.error(`${file.name}: لم يُعثر على نص قابل للقراءة`);
            continue;
          }
          setDocs((prev) => [...prev, doc]);
        } catch {
          toast.error(`تعذّر استخراج محتوى ${file.name}`);
        }
      }
      toast.success("تم تحميل واستخراج محتوى المستند بنجاح!");
    } finally {
      setLoadingFiles(false);
    }
  };

  const removeDoc = (idx: number) => {
    setDocs((p) => p.filter((_, i) => i !== idx));
  };

  const loadSample = (sample: (typeof SAMPLES)[number]) => {
    setPasted(sample.text);
    toast.success(`تم اختيار نموذج: ${sample.title}`);
  };

  const buildContext = () => {
    const parts: string[] = [];
    docs.forEach((d) => {
      if (d.text) parts.push(`--- بداية مستند: ${d.name} (${KIND_LABEL[d.kind]}) ---\n${d.text}\n--- نهاية المستند ---`);
    });
    if (pasted.trim()) {
      parts.push(`--- نص المستند / المدخلات ---\n${pasted.trim()}\n--- نهاية النص ---`);
    }
    return parts.join("\n\n");
  };

  const stop = () => {
    abortRef.current?.abort();
    setBusy(false);
  };

  const streamFromAi = async (system: string, userPrompt: string, onChunk: (text: string) => void) => {
    const controller = new AbortController();
    abortRef.current = controller;
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
        toast.error("تعذّر الاتصال بخادم الذكاء الاصطناعي.");
        return "";
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
              onChunk(acc);
            }
          } catch {
            /* ignore partial */
          }
        }
      }
      return acc.trim();
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return acc.trim();
      toast.error("حدث خطأ في الاتصال، حاول مجدداً.");
      return "";
    } finally {
      abortRef.current = null;
    }
  };

  const runPreset = async (p: (typeof PRESETS)[number]) => {
    if (!hasContent || busy) return;
    setActivePreset(p.id);
    setBusy(true);
    setOut("");

    const context = buildContext();
    const system =
      "أنت خبير فائق في تحليل الوثائق والبيانات المالية والقانونية والتقارير في منصة Delvai. قدّم تحليلاً دقيقاً، واضحاً، منسقاً بعناوين ونقاط، واعتمد فقط على البيانات الموجودة في المستندات المرفقة.";

    const fullResult = await streamFromAi(system, `${p.prompt}\n\nالمستندات:\n${context}`, (chunk) => {
      setOut(chunk);
    });

    setBusy(false);
    if (fullResult) {
      toast.success(`تم إتمام تحليل: ${p.label} ⚡`);
      void save({ data: { tool: "مستندات", prompt: p.label, result_text: fullResult } });
    }
  };

  const askDoc = async () => {
    if (!question.trim() || !hasContent || busy) return;
    const q = question.trim();
    setQuestion("");
    const newMsgs: ChatMsg[] = [...messages, { role: "user", content: q }, { role: "assistant", content: "" }];
    setMessages(newMsgs);
    setBusy(true);

    const context = buildContext();
    const system =
      "أنت مساعد تحليلي ذكي لمستندات المستخدم في منصة Delvai. أجب بدقة وموضوعية اعتماداً على محتوى المستندات المرفقة مع ذكر أرقام الصفحات أو الأقسام إن وُجدت.";

    const historyPrompt = `المستندات:\n${context}\n\nالسؤال:\n${q}`;

    const fullResult = await streamFromAi(system, historyPrompt, (chunk) => {
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = { role: "assistant", content: chunk };
        }
        return updated;
      });
    });

    setBusy(false);
    if (!fullResult) {
      setMessages((prev) => prev.slice(0, -1));
    }
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

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("تم نسخ التحليل");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsMarkdown = (text: string) => {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `delvai-docs-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل التحليل بصيغة Markdown");
  };

  return (
    <ToolShell
      title="استوديو تحليل المستندات والبيانات — Delvai Docs"
      subtitle="عقل التحليل واستخراج البيانات لمنصة Delvai — فحص ملفات PDF وWord وExcel بالبث اللحظي الفوري، استخراج الجداول، مراجعة العقود، ومحادثة ذكية مع مستنداتك."
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5">
        {/* ================= TOP CYBER HUD BAR ================= */}
        <div className="relative overflow-hidden rounded-3xl glass p-3 sm:p-4 shadow-float border-primary/25 ring-glow">
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            {/* Live Status Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3.5 py-1 text-xs font-bold text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.25)]">
                <Sparkles className="size-3.5 animate-pulse" />
                <span>محرك Delvai Quantum لتحليل الوثائق والبيانات متصل ⚡</span>
              </span>
            </div>

            {/* Model Selector & Document Counter */}
            <div className="ms-auto flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-2xl border border-primary/30 bg-card/60 p-1">
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

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <span>{docs.length} مستند</span>
                <span>·</span>
                <span>{totalChars.toLocaleString("ar-EG")} حرف</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= MAIN STUDIO CANVAS ================= */}
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ================= LEFT / DOCUMENT VAULT & ACTIONS ================= */}
          <div className="flex flex-col gap-4 rounded-3xl glass p-5 sm:p-6 shadow-float border-primary/20 backdrop-blur-xl">
            {/* Upload Box */}
            <div>
              <span className="mb-2 block text-xs font-bold text-foreground flex items-center gap-1.5">
                <Upload className="size-3.5 text-primary" />
                رفع المستندات (PDF, Word, Excel, CSV, صور OCR):
              </span>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void addFiles(e.dataTransfer.files);
                }}
                onClick={() => fileRef.current?.click()}
                className="cursor-pointer rounded-2xl border border-dashed border-border/80 bg-background/60 p-6 text-center text-xs text-muted-foreground hover:border-primary/50 transition-colors"
              >
                {loadingFiles ? (
                  <DelvaiThinkingLoader size="sm" text="جارٍ استخراج نصوص وبيانات المستندات…" inline />
                ) : (
                  <>
                    <Upload className="mx-auto mb-2 size-7 text-primary/70" />
                    <p className="font-bold text-foreground text-xs sm:text-sm">
                      اسحب الملفات هنا أو اضغط للاختيار من جهازك
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      يدعم حتى 8 ملفات (PDF, Word, Excel, CSV, صور) بحجم يصل إلى 25MB لكل ملف
                    </p>
                  </>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,image/*"
                hidden
                onChange={(e) => void addFiles(e.target.files)}
              />
            </div>

            {/* Uploaded Document Badges */}
            {docs.length > 0 && (
              <div className="space-y-1.5">
                <span className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  المستندات المحملة في الجلسة:
                </span>
                <div className="flex flex-wrap gap-2">
                  {docs.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-foreground"
                    >
                      <FileText className="size-3.5 text-primary" />
                      <span className="max-w-[140px] truncate font-medium">{d.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">({KIND_LABEL[d.kind]})</span>
                      <button
                        type="button"
                        onClick={() => removeDoc(i)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Text Paste Fallback */}
            <div>
              <span className="mb-1.5 block text-xs font-bold text-muted-foreground">
                أو الصق نص المستند مباشرة:
              </span>
              <div className="rounded-2xl border border-border/80 bg-background/80 p-2.5 shadow-inner">
                <Textarea
                  rows={3}
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  placeholder="الصق أي تقرير، دراسة جدوى، أو عقد هنا للتحليل الفوري…"
                  className="w-full resize-none border-none bg-transparent p-0 text-xs leading-5 placeholder:text-muted-foreground/60 outline-none focus-visible:ring-0"
                />
              </div>
            </div>

            {/* Sample Templates Demo (When No Document) */}
            {docs.length === 0 && !pasted && (
              <div className="space-y-1.5 border-t border-border/40 pt-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  أو جرّب أحد النماذج الجاهزة فوراً:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLES.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => loadSample(s)}
                      className="flex flex-col items-start rounded-2xl border border-border/70 bg-card/40 p-2.5 text-start hover:border-primary/50 hover:bg-card/80 transition-all"
                    >
                      <span className="text-xs font-bold text-foreground hover:text-primary transition-colors">
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

            {/* Instant AI Action Presets */}
            <div className="border-t border-border/40 pt-3">
              <span className="mb-2 block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                التحليلات الذكية الفورية:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => {
                  const Icon = p.icon;
                  const isCurrent = activePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={!hasContent || busy}
                      onClick={() => void runPreset(p)}
                      className={`flex items-center gap-2 rounded-2xl border p-2.5 text-start text-xs font-semibold transition-all ${
                        isCurrent
                          ? "border-primary bg-primary/15 text-primary shadow-sm font-bold scale-[1.02]"
                          : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                      }`}
                    >
                      <Icon className="size-4 shrink-0 text-primary" />
                      <span className="truncate">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ================= RIGHT / RESULTS & CHAT CANVAS ================= */}
          <div className="flex flex-col gap-4 rounded-3xl glass p-5 sm:p-6 shadow-float border-primary/20 backdrop-blur-xl">
            {/* Output & Q&A Box */}
            <div className="relative min-h-[380px] max-h-[58vh] overflow-y-auto rounded-2xl border border-border/80 bg-background/80 p-5 text-xs sm:text-sm leading-7 shadow-inner">
              {busy && !out && messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center my-auto">
                  <DelvaiThinkingLoader size="lg" text="دلفاي يحلل المستند بالبث اللحظي السريع…" />
                </div>
              ) : out ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="font-bold text-primary">نتيجة التحليل الذكي:</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(out)}
                        className="h-7 text-xs gap-1"
                      >
                        {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                        <span>{copied ? "تم النسخ" : "نسخ"}</span>
                      </Button>

                      {activePreset === "tables" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toCsvDownload(out, `delvai-table-${Date.now()}.csv`)}
                          className="h-7 text-xs gap-1 text-primary"
                        >
                          <Download className="size-3" /> تنزيل CSV
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadAsMarkdown(out)}
                        className="h-7 text-xs gap-1"
                      >
                        <Download className="size-3" /> .md
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSpeak(out)}
                        className={`h-7 text-xs gap-1 ${speaking ? "text-primary animate-pulse font-bold" : ""}`}
                      >
                        {speaking ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
                        <span>{speaking ? "إيقاف" : "استماع"}</span>
                      </Button>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-foreground/95">
                    {out}
                    {busy && (
                      <span className="inline-block size-2 animate-ping rounded-full bg-primary align-middle ms-1" />
                    )}
                  </div>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl p-3.5 leading-6 ${
                        m.role === "user"
                          ? "bg-primary/20 border border-primary/30 text-foreground ms-6"
                          : "bg-card border border-border text-foreground me-6 shadow-sm"
                      }`}
                    >
                      <span className="block text-[10px] font-bold text-muted-foreground mb-1">
                        {m.role === "user" ? "سؤالك:" : "إجابة دلفاي:"}
                      </span>
                      <p className="whitespace-pre-wrap">
                        {m.content}
                        {busy && i === messages.length - 1 && (
                          <span className="inline-block size-2 animate-ping rounded-full bg-primary align-middle ms-1" />
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center my-auto">
                  <div className="relative mx-auto mb-3 flex size-16 items-center justify-center">
                    <div className="pointer-events-none absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                    <DelvaiLogo className="size-10 drop-shadow-[0_0_15px_oklch(0.82_0.14_82/0.8)]" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    استوديو <span className="text-shine">تحليل المستندات والبيانات</span>
                  </h3>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                    ارفع ملفك أو اختر أحد التحليلات الفورية أو النماذج الجاهزة وسيبدأ دلفاي بقراءته وتلخيصه ببث لحظي فائق السرعة.
                  </p>
                </div>
              )}
            </div>

            {/* Interactive Q&A Dock */}
            <div className="border-t border-border/40 pt-3">
              <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-background/90 p-2 shadow-inner focus-within:border-primary/80 focus-within:shadow-[0_0_15px_oklch(0.82_0.14_82/0.2)] transition-all">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void askDoc();
                    }
                  }}
                  disabled={!hasContent || busy}
                  placeholder={
                    hasContent
                      ? "اسأل أي سؤال محدد حول المستند المرفوع…"
                      : "ارفع مستنداً أولاً لطرح الأسئلة حوله…"
                  }
                  className="h-9 flex-1 border-none bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus-visible:ring-0"
                />
                {busy ? (
                  <Button
                    onClick={stop}
                    size="sm"
                    className="h-9 rounded-xl bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive/30"
                  >
                    <Square className="size-3.5" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => void askDoc()}
                    disabled={!question.trim() || !hasContent || busy}
                    size="sm"
                    className="h-9 rounded-xl bg-cine text-primary-foreground shadow-glow"
                  >
                    <Send className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
