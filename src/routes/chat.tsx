import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  Brain,
  Check,
  Compass,
  Copy,
  Cpu,
  FileCode2,
  ImagePlus,
  Lightbulb,
  MessageSquarePlus,
  RefreshCw,
  Rocket,
  Send,
  Sparkles,
  Square,
  Trash2,
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
      "أنت مهندس برمجيات خبير. أجب بكود صحيح وموجز مع شرح قصير وأفضل الممارسات والأمان.",
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
  "أنت 'دلفاي برايم' (Delvai Prime)، المساعد الذكي الخارق لمنصة Delvai، مبني بأحدث محركات الذكاء الاصطناعي اللحظية. تمتلك ذكاءً فائقاً وقدرة على التفكير المنطقي العميق وحل أصعب المسائل بجميع لغات العالم. نسّق إجاباتك بتنسيق Markdown احترافي، مباشر، ومبهر.";

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
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, streaming]);

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

    const systemPrompt = `${PERSONAS.find((p) => p.id === persona)!.system}\n${BASE_RULES}`;
    let acc = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          system: systemPrompt,
          model: "google/gemini-3.7-flash",
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
        {/* ================= PERSONA SELECTION & HEADER HUD ================= */}
        <div className="relative overflow-hidden rounded-2xl glass p-3 sm:p-4 shadow-float border-primary/25 ring-glow">
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

          <div className="relative flex min-h-[380px] max-h-[58vh] flex-col space-y-5 overflow-y-auto pe-2 sm:pe-3">
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
                    <div className="relative flex size-8 items-center justify-center rounded-full bg-cine text-primary-foreground shadow-glow">
                      <DelvaiLogo className="size-5" />
                    </div>
                  ) : (
                    <div className="flex size-8 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-xs font-bold text-primary">
                      أنت
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`group relative max-w-[85%] sm:max-w-[80%] rounded-3xl p-4 text-sm leading-7 shadow-sm ${
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
                          className="size-28 rounded-xl border border-border/80 object-cover shadow-sm"
                        />
                      ))}
                    </div>
                  )}

                  {/* Message Text or Thinking State */}
                  {m.content ? (
                    <div className="whitespace-pre-wrap font-sans text-sm">{m.content}</div>
                  ) : streaming && i === messages.length - 1 ? (
                    <div className="py-1">
                      <DelvaiThinkingLoader size="sm" text="دلفاي برايم يفكّر ويبحث في البيانات…" inline />
                    </div>
                  ) : null}

                  {/* Assistant Footer Actions */}
                  {m.role === "assistant" && m.content && !(streaming && i === messages.length - 1) && (
                    <div className="mt-3 flex items-center gap-1 border-t border-border/40 pt-2 text-xs text-muted-foreground opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => void copy(m.content, i)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-card hover:text-foreground transition-colors"
                        aria-label="نسخ الرد"
                      >
                        {copiedIndex === i ? (
                          <Check className="size-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                        <span className="text-[11px]">{copiedIndex === i ? "تم النسخ" : "نسخ"}</span>
                      </button>

                      {i === messages.length - 1 && (
                        <button
                          type="button"
                          onClick={() => void regenerate()}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-card hover:text-foreground transition-colors"
                          aria-label="إعادة التفكير والتوليد"
                        >
                          <RefreshCw className="size-3.5" />
                          <span className="text-[11px]">إعادة التوليد</span>
                        </button>
                      )}

                      <span className="ms-auto text-[10px] text-muted-foreground/60 font-mono">
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

            {/* Input & Action Bar */}
            <div className="flex items-end gap-2.5">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void addFiles(e.target.files)}
              />
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
