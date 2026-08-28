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
  Table2,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ToolShell } from "@/components/ToolShell";
import { DelvaiThinkingLoader, DelvaiLogo } from "@/components/DelvaiThinkingLoader";
import { chatComplete } from "@/lib/ai.functions";
import { saveGeneration } from "@/lib/history.functions";
import { extractFile, toCsvDownload, type ExtractedDoc } from "@/lib/extract";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "استوديو تحليل المستندات والبيانات (Delvai Docs) | ذكاء اصطناعي فائق" },
      {
        name: "description",
        content:
          "تحليل وفحص ملفات PDF وWord وExcel والصور بالذكاء الاصطناعي: تلخيص تنفيذي، استخراج جداول CSV، مراجعة العقود، محادثة وسؤال وجواب مع مستنداتك.",
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

const KIND_LABEL: Record<ExtractedDoc["kind"], string> = {
  pdf: "PDF",
  word: "Word",
  sheet: "Excel / جدول",
  text: "نص",
  image: "صورة OCR",
};

type ChatMsg = { role: "user" | "assistant"; content: string };

function DocsStudio() {
  const ask = useServerFn(chatComplete);
  const save = useServerFn(saveGeneration);

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
    } finally {
      setLoadingFiles(false);
    }
  };

  const removeDoc = (idx: number) => {
    setDocs((p) => p.filter((_, i) => i !== idx));
  };

  const buildContext = () => {
    const parts: string[] = [];
    docs.forEach((d) => {
      if (d.text) parts.push(`--- بداية مستند: ${d.name} (${KIND_LABEL[d.kind]}) ---\n${d.text}\n--- نهاية المستند ---`);
    });
    if (pasted.trim()) {
      parts.push(`--- نص مدخل يدويًا ---\n${pasted.trim()}\n--- نهاية النص ---`);
    }
    return parts.join("\n\n");
  };

  const runPreset = async (p: (typeof PRESETS)[number]) => {
    if (!hasContent || busy) return;
    setActivePreset(p.id);
    setBusy(true);
    setOut("");

    const context = buildContext();
    const system =
      "أنت خبير فائق في تحليل الوثائق والبيانات المالية والقانونية والتقارير في منصة Delvai. قدّم تحليلاً دقيقاً، واضحاً، منسقاً بعناوين ونقاط، واعتمد فقط على البيانات الموجودة في المستندات المرفقة.";

    try {
      const res = await ask({
        data: {
          system,
          messages: [{ role: "user", content: `${p.prompt}\n\nالمستندات:\n${context}` }],
          model: "google/gemini-3.7-flash",
        },
      });

      if (!res.ok || !res.text) {
        toast.error(res.error || "تعذّر إتمام التحليل، حاول مجدداً.");
        return;
      }

      setOut(res.text.trim());
      toast.success(`تم إتمام تحليل: ${p.label}`);
    } catch {
      toast.error("تعذّر الاتصال بخادم الذكاء الاصطناعي.");
    } finally {
      setBusy(false);
    }
  };

  const askDoc = async () => {
    if (!question.trim() || !hasContent || busy) return;
    const q = question.trim();
    setQuestion("");
    const newMsgs: ChatMsg[] = [...messages, { role: "user", content: q }];
    setMessages(newMsgs);
    setBusy(true);

    const context = buildContext();
    const system =
      "أنت مساعد تحليلي ذكي لمستندات المستخدم في منصة Delvai. أجب بدقة وموضوعية اعتماداً على محتوى المستندات المرفقة مع ذكر أرقام الصفحات أو الأقسام إن وُجدت.";

    try {
      const history = newMsgs.map((m) => ({ role: m.role, content: m.content }));
      const res = await ask({
        data: {
          system: `${system}\n\nمحتوى المستندات:\n${context}`,
          messages: history,
          model: "google/gemini-3.7-flash",
        },
      });

      if (!res.ok || !res.text) {
        toast.error("تعذّر استلام الإجابة");
        return;
      }

      setMessages([...newMsgs, { role: "assistant", content: res.text.trim() }]);
    } catch {
      toast.error("حدث خطأ أثناء المحادثة مع المستند.");
    } finally {
      setBusy(false);
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

  return (
    <ToolShell
      title="استوديو تحليل المستندات والبيانات — Delvai Docs"
      subtitle="عقل التحليل واستخراج البيانات لمنصة Delvai — تحليل ملفات PDF وWord وExcel، استخراج الجداول، مراجعة العقود، ومحادثة ذكية مع مستنداتك."
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5">
        {/* ================= TOP CYBER HUD BAR ================= */}
        <div className="relative overflow-hidden rounded-3xl glass p-3 sm:p-4 shadow-float border-primary/25 ring-glow">
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            {/* Live Status Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3.5 py-1 text-xs font-bold text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.25)]">
                <Sparkles className="size-3.5 animate-pulse" />
                <span>محرك Multimodal Gemini 3.7 Pro لتحليل الوثائق متصل</span>
              </span>
            </div>

            {/* Document Counter */}
            <div className="ms-auto flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span>المستندات المحملة: {docs.length}</span>
              <span>·</span>
              <span>{totalChars.toLocaleString("ar-EG")} حرف</span>
            </div>
          </div>
        </div>

        {/* ================= MAIN STUDIO CANVAS ================= */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
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
                  <DelvaiThinkingLoader size="sm" text="جارٍ استخراج نصوص المستندات…" inline />
                ) : (
                  <>
                    <Upload className="mx-auto mb-2 size-7 text-primary/70" />
                    <p className="font-bold text-foreground text-xs sm:text-sm">
                      اسحب الملفات هنا أو اضغط للاختيار من جهازك
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      يدعم حتى 8 ملفات بحجم يصل إلى 25 ميجابايت لكل ملف
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
                  المستندات في الجلسة:
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
                          ? "border-primary bg-primary/15 text-primary shadow-sm font-bold"
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
              {busy ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center my-auto">
                  <DelvaiThinkingLoader size="lg" text="دلفاي يحلل المستندات ويستخرج البيانات بدقة…" />
                  <p className="mt-3 text-xs text-muted-foreground animate-pulse">
                    مطابقة الأرقام والبنود والتفاصيل القانونية والمالية…
                  </p>
                </div>
              ) : out ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="font-bold text-primary">نتيجة التحليل الذكي:</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void navigator.clipboard.writeText(out);
                          toast.success("تم نسخ التحليل");
                        }}
                        className="h-7 text-xs gap-1"
                      >
                        <Copy className="size-3" /> نسخ
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSpeak(out)}
                        className="h-7 text-xs gap-1"
                      >
                        {speaking ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
                        <span>{speaking ? "إيقاف" : "استماع"}</span>
                      </Button>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-foreground/95">{out}</div>
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
                      <p className="whitespace-pre-wrap">{m.content}</p>
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
                    استوديو <span className="text-shine">تحليل المستندات الفائق</span>
                  </h3>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                    ارفع ملفك أو اختر أحد التحليلات الفورية ليقوم دلفاي بقراءته وتلخيصه واستخراج جداوله بدقة متناهية.
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
                <Button
                  onClick={() => void askDoc()}
                  disabled={!question.trim() || !hasContent || busy}
                  size="sm"
                  className="h-9 rounded-xl bg-cine text-primary-foreground shadow-glow"
                >
                  <Send className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
