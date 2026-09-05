import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  Brain,
  Check,
  Compass,
  Copy,
  Cpu,
  Download,
  FileCode2,
  ImagePlus,
  Lightbulb,
  Mic,
  MicOff,
  RefreshCw,
  Rocket,
  Send,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  VolumeX,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToolShell } from "@/components/ToolShell";
import { saveGeneration } from "@/lib/history.functions";
import { useAuth } from "@/hooks/useAuth";
import { DelvaiThinkingLoader, DelvaiLogo } from "@/components/DelvaiThinkingLoader";

export const Route = createFileRoute("/chat")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" ? { q: search["q"] } : {},
  head: () => ({
    meta: [
      { title: "دلفاي برايم (Delvai Prime) | مساعد الذكاء الاصطناعي الفائق" },
      {
        name: "description",
        content:
          "دلفاي برايم: المساعد الذكي الخارق لمنصة Delvai. إجابات فورية بالبث المباشر، أنماط تفكير عميق لحل المسائل المعقدة، وتحليل صور ومستندات.",
      },
      { property: "og:title", content: "دلفاي برايم (Delvai Prime) — عقل الذكاء الاصطناعي الفائق" },
      {
        property: "og:description",
        content: "إجابات فورية بالبث المباشر مع تفكير عميق لحل أعقد المسائل بلحظات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatTool,
});

type Msg = { role: "user" | "assistant"; content: string; images?: string[] };

const MAX_IMAGES = 4;
const MAX_SIZE = 5 * 1024 * 1024;

const PERSONAS = [
  { id: "general", label: "مساعد عام", icon: Cpu, system: "أنت مساعد ذكي محترف وودود، دقيق ومباشر وموسوعي المعرفة." },
  {
    id: "business",
    label: "مستشار أعمال",
    icon: Rocket,
    system:
      "أنت مستشار أعمال خبير. حلّل بأرقام وخطوات عملية، واذكر المخاطر والفرص وخطة تنفيذ مختصرة.",
  },
  {
    id: "marketing",
    label: "خبير تسويق",
    icon: Sparkles,
    system:
      "أنت خبير تسويق رقمي. قدّم أفكارًا إعلانية قابلة للتنفيذ مع زوايا رسائل وجمهور مستهدف.",
  },
  {
    id: "dev",
    label: "مهندس برمجيات",
    icon: FileCode2,
    system:
      "أنت مهندس برمجيات خبير. أجب بكود برمجي صحيح وموجز مع شرح قصير وأفضل الممارسات والأمان.",
  },
  {
    id: "tutor",
    label: "معلّم مبسّط",
    icon: Lightbulb,
    system: "أنت معلّم صبور. اشرح بخطوات مبسّطة وأمثلة من الحياة اليومية، ثم اختبر الفهم بسؤال.",
  },
  {
    id: "writer",
    label: "كاتب محترف",
    icon: Compass,
    system: "أنت كاتب محترف. اكتب بأسلوب سلس بلا حشو، مع عناية بالإيقاع واختيار الكلمة.",
  },
] as const;

const QUICK_STARTERS = [
  {
    title: "خطة نمو تسويقية مضاعفة",
    desc: "صياغة استراتيجية تسويق رقمي تضاعف المبيعات لمتجر أو تطبيق.",
    prompt: "ضع لي خطة عمل تسويقية شاملة لزيادة المبيعات بنسبة 300% خلال 90 يوماً مع تحديد القنوات الإعلانية.",
    icon: Rocket,
    badge: "تسويق ونمو",
  },
  {
    title: "تفكير عميق وتحليل مسألة معقدة",
    desc: "تحليل منطقي خطوة بخطوة مع استنتاج الحلول والبدائل.",
    prompt: "اشرح لي بالتفصيل والمنطق كيف تعمل الحواسيب الكمية وكيف ستغير مستقبل التشفير والذكاء الاصطناعي؟",
    icon: Brain,
    badge: "تحليل منطقي",
  },
  {
    title: "مراجعة وهندسة كود برمجي",
    desc: "تحليل كود، كشف الثغرات، وتحسين الأداء والأمان.",
    prompt: "اكتب لي كود تطبيق ويب حديث ومتجاوب باستخدام TypeScript و React مع معالجة الأخطاء والتحميل.",
    icon: FileCode2,
    badge: "برمجة وهندسة",
  },
  {
    title: "صياغة محتوى إبداعي استثنائي",
    desc: "كتابة نصوص ترويجية وسيناريوهات مؤثرة بأسلوب عالمي.",
    prompt: "اكتب لي سيناريو إعلان فيديو تشويقي مدته 30 ثانية لمنتج فاخر يجذب الانتباه من الثانية الأولى.",
    icon: Sparkles,
    badge: "إبداع وتأليف",
  },
];

const BASE_RULES =
  "أنت 'دلفاي برايم' (Delvai Prime)، المساعد الذكي الخارق لمنصة Delvai. قدم إجابات واضحة، منسقة بشكل جذاب باستخدام Markdown (عناوين، نقاط، خط عريض، قوالب كود واضحة)، بدون حشو زائد وبأعلى مستويات الذكاء والاحترافية.";

/* ================= CYBER CODE BLOCK COMPONENT ================= */
function CodeSnippet({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("تم نسخ الكود");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-border/80 bg-black/60 shadow-lg" dir="ltr">
      <div className="flex items-center justify-between border-b border-border/50 bg-card/60 px-4 py-2 text-xs text-muted-foreground">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
          {lang || "CODE"}
        </span>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs hover:bg-card hover:text-foreground transition-colors"
        >
          {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          <span>{copied ? "تم النسخ" : "نسخ الكود"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs text-emerald-300 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ================= RICH MARKDOWN RENDERER ================= */
function RichMarkdown({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  if (!text) return null;

  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-sm leading-7">
      {parts.map((part, idx) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const firstLineEnd = part.indexOf("\n");
          const lang = part.slice(3, firstLineEnd > 0 ? firstLineEnd : undefined).trim();
          const code = firstLineEnd > 0 ? part.slice(firstLineEnd + 1, -3) : part.slice(3, -3);
          return <CodeSnippet key={idx} code={code.trim()} lang={lang} />;
        }

        // Parse paragraphs and bullet lines
        const lines = part.split("\n");
        return (
          <div key={idx} className="space-y-1.5">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lineIdx} className="h-1" />;

              // Horizontal Rule
              if (/^---$|^___$|^\*\*\*$/.test(trimmed)) {
                return <hr key={lineIdx} className="my-3 border-border/50" />;
              }

              // Headers
              if (trimmed.startsWith("### ")) {
                return (
                  <h4 key={lineIdx} className="pt-2 text-base font-bold text-primary">
                    {renderInline(trimmed.slice(4))}
                  </h4>
                );
              }
              if (trimmed.startsWith("## ")) {
                return (
                  <h3 key={lineIdx} className="pt-3 text-lg font-extrabold text-primary">
                    {renderInline(trimmed.slice(3))}
                  </h3>
                );
              }
              if (trimmed.startsWith("# ")) {
                return (
                  <h2 key={lineIdx} className="pt-4 text-xl font-black text-primary">
                    {renderInline(trimmed.slice(2))}
                  </h2>
                );
              }

              // Bullet List Item
              if (/^[\*\-•]\s+/.test(trimmed)) {
                const bulletContent = trimmed.replace(/^[\*\-•]\s+/, "");
                return (
                  <div key={lineIdx} className="flex items-start gap-2 ps-2">
                    <span className="mt-2 flex size-1.5 shrink-0 rounded-full bg-primary shadow-glow" />
                    <p className="flex-1">{renderInline(bulletContent)}</p>
                  </div>
                );
              }

              // Numbered List Item
              const numMatch = /^(\d+)[\.\)]\s+(.*)/.exec(trimmed);
              if (numMatch) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2.5 ps-2">
                    <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                      {numMatch[1]}
                    </span>
                    <p className="flex-1">{renderInline(numMatch[2])}</p>
                  </div>
                );
              }

              // Normal paragraph line
              return (
                <p key={lineIdx} className="text-foreground/95">
                  {renderInline(line)}
                </p>
              );
            })}
          </div>
        );
      })}
      {isStreaming && (
        <span className="inline-block size-2 animate-ping rounded-full bg-primary align-middle ms-1" />
      )}
    </div>
  );
}

function renderInline(str: string) {
  // Bold **text**
  const boldParts = str.split(/(\*\*.*?\*\*)/g);
  return boldParts.map((bChunk, bIdx) => {
    if (bChunk.startsWith("**") && bChunk.endsWith("**")) {
      const inner = bChunk.slice(2, -2);
      return (
        <strong key={bIdx} className="font-bold text-primary drop-shadow-[0_0_8px_oklch(0.82_0.14_82/0.25)]">
          {inner}
        </strong>
      );
    }

    // Inline `code`
    const codeParts = bChunk.split(/(`.*?`)/g);
    return codeParts.map((cChunk, cIdx) => {
      if (cChunk.startsWith("`") && cChunk.endsWith("`")) {
        return (
          <code
            key={cIdx}
            className="mx-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary"
          >
            {cChunk.slice(1, -1)}
          </code>
        );
      }
      return cChunk;
    });
  });
}

function ChatTool() {
  const { q } = Route.useSearch();
  const save = useServerFn(saveGeneration);
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState(q ?? "");
  const [images, setImages] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<(typeof PERSONAS)[number]["id"]>("general");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [deepThinking, setDeepThinking] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const speechRef = useRef<any>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, streaming]);

  // Track scroll position to show/hide "scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 120;
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  };

  // Speech Recognition (Voice Input)
  const toggleVoiceInput = () => {
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
        toast.info("تحدث الآن، المساعد يستمع إليك…");
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error("تعذر التقاط الصوت، يرجى المحاولة مرة أخرى.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Text to Speech (Voice Readout)
  const toggleSpeak = (text: string, idx: number) => {
    if (speakingIndex === idx) {
      window.speechSynthesis?.cancel();
      setSpeakingIndex(null);
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
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Magic Prompt Enhancer
  const enhancePrompt = () => {
    if (!input.trim()) {
      toast.info("اكتب فكرة قصيرة أولاً لنقوم بتحسينها");
      return;
    }
    const enhanced = `أريد تحليلاً شاملاً ومتعمقاً خطوة بخطوة حول: "${input.trim()}". يرجى تقديم أمثلة تطبيقية، خطة عمل تنفيذية، ومراعاة أفضل الممارسات المعتمدة عالمياً.`;
    setInput(enhanced);
    toast.success("تم تحسين صياغة الأمر وتفصيله بالذكاء الاصطناعي 🪄");
  };

  // Export Conversation
  const exportConversation = (content: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `delvai-prime-response-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل المحتوى كملف Markdown");
  };

  const addFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const picked = Array.from(files).slice(0, MAX_IMAGES - images.length);
    const encoded: string[] = [];
    for (const f of picked) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_SIZE) {
        setError("حجم الصورة كبير جدًا (الحد ٥ ميجابايت)");
        continue;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read"));
        reader.readAsDataURL(f);
      });
      encoded.push(dataUrl);
    }
    if (encoded.length) setImages((prev) => [...prev, ...encoded].slice(0, MAX_IMAGES));
    if (fileRef.current) fileRef.current.value = "";
  };

  /** يبثّ رد المساعد على المحادثة المعطاة ويحدّث آخر رسالة تدريجيًا. */
  const streamAnswer = async (history: Msg[]) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    setError(null);
    setMessages([...history, { role: "assistant", content: "" }]);

    const deepDirective = deepThinking
      ? "\n[توجيه التفكير العميق: قم بالتفكير والتحليل المنطقي المتسلسل بخطوات دقيقة وقدم استنتاجات مدعمة بالأسباب قبل الرد النهائي]."
      : "";

    const systemPrompt = `${PERSONAS.find((p) => p.id === persona)!.system}\n${BASE_RULES}${deepDirective}`;
    let acc = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          system: systemPrompt,
          model: deepThinking ? "google/gemini-3.7-pro" : "google/gemini-3.7-flash",
          messages: history,
        }),
      });

      if (!res.ok || !res.body) {
        const message = (await res.text().catch(() => "")) || "تعذّر إتمام الطلب.";
        setMessages(history);
        setError(message);
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
              setMessages([...history, { role: "assistant", content: acc }]);
            }
          } catch {
            /* أجزاء غير مكتملة تُتجاهل */
          }
        }
      }

      if (!acc.trim()) {
        setMessages(history);
        setError("لم يصل رد من المساعد، حاول مرة أخرى.");
        return;
      }
      const lastUser = [...history].reverse().find((m) => m.role === "user");
      if (user && lastUser) {
        void save({ data: { tool: "دردشة", prompt: lastUser.content, result_text: acc } });
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") {
        if (!acc.trim()) setMessages(history);
        return;
      }
      setMessages(history);
      setError("حدث خطأ في الاتصال، حاول مرة أخرى.");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const send = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if ((!text && images.length === 0) || streaming) return;
    const userMsg: Msg = {
      role: "user",
      content: text || "حلّل هذه الصورة.",
      ...(images.length ? { images } : {}),
    };
    setInput("");
    setImages([]);
    await streamAnswer([...messages, userMsg]);
  };

  const regenerate = async () => {
    if (streaming) return;
    const idx = messages.map((m) => m.role).lastIndexOf("user");
    if (idx === -1) return;
    await streamAnswer(messages.slice(0, idx + 1));
  };

  const stop = () => abortRef.current?.abort();

  const copy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success("تم نسخ الإجابة");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const activePersona = PERSONAS.find((p) => p.id === persona)!;

  return (
    <ToolShell
      title="دلفاي برايم — Delvai Prime"
      subtitle="عقل الذكاء الاصطناعي الفائق لمنصة Delvai — إجابات لحظية بالبث المباشر، تفكير عميق، وتحليل صور لحل أصعب المسائل."
    >
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-4">
        {/* ================= PERSONA SELECTION & CONTROLS ================= */}
        <div className="relative overflow-hidden rounded-2xl glass p-3 shadow-float border-primary/25 ring-glow">
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            {/* Persona Chips */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="pe-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                التخصص:
              </span>
              {PERSONAS.map((p) => {
                const active = persona === p.id;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPersona(p.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                      active
                        ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.35)] font-bold scale-105"
                        : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>

            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="ms-auto rounded-full text-xs text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
                onClick={() => {
                  stop();
                  window.speechSynthesis?.cancel();
                  setMessages([]);
                  setError(null);
                  toast.info("تم بدء محادثة جديدة");
                }}
              >
                <Trash2 className="size-3.5 me-1" /> مسح المحادثة
              </Button>
            )}
          </div>
        </div>

        {/* ================= CHAT CONVERSATION CANVAS ================= */}
        <div className="relative overflow-hidden rounded-3xl glass p-4 sm:p-6 shadow-float border-primary/20 backdrop-blur-xl">
          {/* Subtle neural grid pattern in canvas */}
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />

          {/* Floating Scroll to Bottom Button */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={scrollToBottom}
              className="absolute bottom-6 end-6 z-20 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow hover:scale-110 transition-transform animate-bounce"
              aria-label="التمرير إلى أحدث رسالة"
              title="الانتقال إلى أسفل المحادثة"
            >
              <ArrowDown className="size-4" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="relative flex min-h-[380px] max-h-[58vh] flex-col space-y-5 overflow-y-auto pe-2 sm:pe-3"
          >
            {messages.length === 0 && (
              <div className="my-auto py-6 sm:py-8 text-center">
                {/* Futuristic Logo Aura */}
                <div className="relative mx-auto mb-4 flex size-20 items-center justify-center">
                  <div className="pointer-events-none absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                  <div
                    className="pointer-events-none absolute size-20 rounded-full border border-dashed border-primary/40 animate-spin"
                    style={{ animationDuration: "6s" }}
                  />
                  <DelvaiLogo className="size-12 drop-shadow-[0_0_20px_oklch(0.82_0.14_82/0.85)]" />
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-4 py-1 text-xs font-bold text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.2)]">
                  <Sparkles className="size-3.5 animate-pulse" />
                  <span>دلفاي برايم متصل · جاهز للإجابة والبث المباشر</span>
                </div>

                <h2 className="mt-4 text-2xl font-black sm:text-3xl lg:text-4xl text-foreground tracking-tight">
                  كيف يمكنني <span className="text-shine">مساعدتك اليوم</span>؟
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  اختر أحد المحاور الاستراتيجية أو اكتب أي سؤال أو فكرة لتوليد تحليل فوري عميق.
                </p>

                {/* Quick starter cards */}
                <div className="mt-7 grid gap-3 sm:grid-cols-2 text-start">
                  {QUICK_STARTERS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => void send(item.prompt)}
                        className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:bg-card/90 hover:shadow-glow"
                      >
                        <div className="flex items-start gap-3.5">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110 shadow-sm">
                            <Icon className="size-5" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                {item.title}
                              </h3>
                              <span className="text-[10px] rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground font-mono shrink-0">
                                {item.badge}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "justify-start flex-row-reverse" : "justify-start"}`}
              >
                {/* Avatar */}
                <div className="shrink-0 pt-1">
                  {m.role === "assistant" ? (
                    <div className="relative flex size-9 items-center justify-center rounded-2xl bg-cine text-primary-foreground shadow-glow">
                      <DelvaiLogo className="size-5 drop-shadow" />
                    </div>
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-2xl border border-primary/40 bg-primary/15 text-xs font-bold text-primary shadow-sm">
                      أنت
                    </div>
                  )}
                </div>

                {/* Message Bubble Card */}
                <div
                  className={`group relative max-w-[88%] sm:max-w-[82%] rounded-3xl p-4 sm:p-5 text-sm leading-7 shadow-sm transition-all ${
                    m.role === "user"
                      ? "rounded-tr-sm bg-primary/20 text-foreground border border-primary/40"
                      : "rounded-tl-sm bg-card/90 text-foreground border border-border/80 shadow-float"
                  }`}
                >
                  {/* Attached Images */}
                  {m.images && m.images.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {m.images.map((src, j) => (
                        <img
                          key={j}
                          src={src}
                          alt="صورة مرفقة"
                          className="size-28 rounded-2xl border border-border/80 object-cover shadow-sm"
                        />
                      ))}
                    </div>
                  )}

                  {/* Message Rich Text or Thinking State */}
                  {m.content ? (
                    <RichMarkdown
                      text={m.content}
                      isStreaming={streaming && i === messages.length - 1}
                    />
                  ) : streaming && i === messages.length - 1 ? (
                    <div className="py-2">
                      <DelvaiThinkingLoader size="sm" text="دلفاي برايم يفكّر ويبحث في البيانات…" inline />
                    </div>
                  ) : null}

                  {/* Assistant Toolbar Actions */}
                  {m.role === "assistant" && m.content && !(streaming && i === messages.length - 1) && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-border/40 pt-2.5 text-xs text-muted-foreground opacity-85 group-hover:opacity-100 transition-opacity">
                      {/* Copy */}
                      <button
                        type="button"
                        onClick={() => void copy(m.content, i)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-card hover:text-foreground transition-colors"
                        aria-label="نسخ الرد"
                        title="نسخ النص"
                      >
                        {copiedIndex === i ? (
                          <Check className="size-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                        <span className="text-[11px]">{copiedIndex === i ? "تم النسخ" : "نسخ"}</span>
                      </button>

                      {/* Text-to-speech Reader */}
                      <button
                        type="button"
                        onClick={() => toggleSpeak(m.content, i)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 transition-colors ${
                          speakingIndex === i
                            ? "bg-primary/20 text-primary animate-pulse font-bold"
                            : "hover:bg-card hover:text-foreground"
                        }`}
                        aria-label="قراءة صوتية"
                        title="استماع للإجابة بصوت دلفاي"
                      >
                        {speakingIndex === i ? (
                          <VolumeX className="size-3.5" />
                        ) : (
                          <Volume2 className="size-3.5" />
                        )}
                        <span className="text-[11px]">{speakingIndex === i ? "إيقاف الصوت" : "استماع"}</span>
                      </button>

                      {/* Export file */}
                      <button
                        type="button"
                        onClick={() => exportConversation(m.content)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-card hover:text-foreground transition-colors"
                        aria-label="تنزيل الرد"
                        title="تنزيل كملف Markdown"
                      >
                        <Download className="size-3.5" />
                        <span className="text-[11px]">تنزيل</span>
                      </button>

                      {/* Regenerate if last message */}
                      {i === messages.length - 1 && (
                        <button
                          type="button"
                          onClick={() => void regenerate()}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-card hover:text-foreground transition-colors"
                          aria-label="إعادة التفكير والتوليد"
                          title="إعادة التوليد"
                        >
                          <RefreshCw className="size-3.5" />
                          <span className="text-[11px]">إعادة التوليد</span>
                        </button>
                      )}

                      <span className="ms-auto text-[10px] text-muted-foreground/70 font-mono">
                        دلفاي برايم · {activePersona.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {error && (
            <div className="mt-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive flex items-center justify-between">
              <span>{error}</span>
              <Button size="sm" variant="ghost" onClick={() => void regenerate()} className="text-xs h-7">
                إعادة المحاولة
              </Button>
            </div>
          )}

          {/* ================= HIGH-TECH COMMAND INPUT DOCK ================= */}
          <div className="mt-4 rounded-3xl border border-border/90 bg-background/85 p-3 shadow-float backdrop-blur-2xl transition-all focus-within:border-primary/80 focus-within:shadow-[0_0_30px_oklch(0.82_0.14_82/0.25)]">
            {/* Uploaded Images Preview */}
            {images.length > 0 && (
              <div className="mb-2.5 flex flex-wrap gap-2 border-b border-border/40 pb-2 px-2">
                {images.map((src, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={src}
                      alt="معاينة الصورة"
                      className="size-16 rounded-xl border border-primary/40 object-cover shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -end-1.5 rounded-full bg-destructive p-1 text-destructive-foreground shadow hover:scale-110 transition-transform"
                      aria-label="إزالة الصورة"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick AI Assist Bar */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-border/30 pb-2 px-1 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Deep Thinking Mode Pill */}
                <button
                  type="button"
                  onClick={() => {
                    setDeepThinking(!deepThinking);
                    toast.info(
                      !deepThinking
                        ? "تم تفعيل نمط التفكير المنطقي العميق 🧠"
                        : "تم تعطيل التفكير العميق والعودة للنمط السريع ⚡",
                    );
                  }}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all ${
                    deepThinking
                      ? "bg-primary/20 text-primary border border-primary shadow-[0_0_10px_oklch(0.82_0.14_82/0.3)]"
                      : "bg-card text-muted-foreground border border-border/60 hover:text-foreground"
                  }`}
                >
                  <Brain className={`size-3 ${deepThinking ? "animate-pulse" : ""}`} />
                  <span>تفكير عميق</span>
                </button>

                {/* Magic Prompt Enhancer */}
                <button
                  type="button"
                  onClick={enhancePrompt}
                  disabled={!input.trim() || streaming}
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-all disabled:opacity-50"
                  title="تحسين وتفصيل صياغة الأمر بالذكاء الاصطناعي"
                >
                  <Wand2 className="size-3 text-primary/80" />
                  <span>تحسين الأمر</span>
                </button>
              </div>

              {/* Voice Dictation Status */}
              {isListening && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 border border-destructive/40 px-2.5 py-0.5 text-[11px] font-bold text-destructive animate-pulse">
                  <span className="size-2 rounded-full bg-destructive animate-ping" />
                  <span>جارٍ الاستماع لصوتك…</span>
                </div>
              )}
            </div>

            {/* Input & Action Bar */}
            <div className="flex items-end gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void addFiles(e.target.files)}
              />

              {/* Image Upload Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileRef.current?.click()}
                disabled={streaming || images.length >= MAX_IMAGES}
                className="size-10 rounded-2xl border-border/80 bg-card/60 text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all shrink-0"
                aria-label="إرفاق صورة للتحليل"
                title="إرفاق صور للتحليل"
              >
                <ImagePlus className="size-4.5" />
              </Button>

              {/* Voice Input Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleVoiceInput}
                disabled={streaming}
                className={`size-10 rounded-2xl border-border/80 bg-card/60 transition-all shrink-0 ${
                  isListening
                    ? "border-destructive bg-destructive/20 text-destructive shadow-[0_0_12px_oklch(0.6_0.21_27/0.5)] animate-pulse"
                    : "text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                }`}
                aria-label="التحدث بالصوت"
                title={isListening ? "إيقاف التسجيل الصوتي" : "تحدث بصوتك بدل الكتابة"}
              >
                {isListening ? <MicOff className="size-4.5" /> : <Mic className="size-4.5" />}
              </Button>

              <Textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                onPaste={(e) => {
                  const files = Array.from(e.clipboardData?.items ?? [])
                    .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
                    .map((it) => it.getAsFile())
                    .filter((f): f is File => Boolean(f));
                  if (files.length > 0) {
                    e.preventDefault();
                    void addFiles(files);
                  }
                }}
                placeholder="اسأل دلفاي برايم أي شيء… (Enter للإرسال، Shift+Enter لسطر جديد)"
                className="min-h-12 max-h-40 flex-1 resize-none bg-transparent px-3 py-3 text-sm sm:text-base outline-none border-none focus-visible:ring-0 placeholder:text-muted-foreground/60 leading-6"
              />

              {streaming ? (
                <Button
                  variant="outline"
                  onClick={stop}
                  aria-label="إيقاف التفكير"
                  className="h-10 rounded-2xl border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 shrink-0 font-bold px-4"
                >
                  <Square className="size-4 me-1.5" /> إيقاف
                </Button>
              ) : (
                <Button
                  onClick={() => void send()}
                  disabled={!input.trim() && images.length === 0}
                  className="size-10 rounded-2xl bg-cine text-primary-foreground shadow-glow shrink-0 transition-transform hover:scale-105"
                  aria-label="إرسال"
                >
                  <Send className="size-4.5" />
                </Button>
              )}
            </div>

            {/* Input Dock Bottom Status */}
            <div className="mt-2 flex items-center justify-between px-2 pt-1 border-t border-border/30 text-[11px] text-muted-foreground/70">
              <span className="hidden sm:inline">اضغط Enter للإرسال · Shift+Enter لسطر جديد</span>
              <span className="ms-auto font-mono">
                {activePersona.label} · جاهز للبث المباشر
              </span>
            </div>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
