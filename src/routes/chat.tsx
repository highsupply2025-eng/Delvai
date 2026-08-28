import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  Copy,
  ImagePlus,
  Loader2,
  RefreshCw,
  Send,
  Square,
  Trash2,
  X,
  Zap,
  Brain,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToolShell } from "@/components/ToolShell";
import { saveGeneration } from "@/lib/history.functions";
import { useAuth } from "@/hooks/useAuth";

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

const MODES = [
  {
    id: "balanced",
    label: "Gemini 3.7 اللحظي",
    icon: Zap,
    model: "google/gemini-3.7-flash",
    hint: "بث فوري فائق السرعة مع أحدث المعارف اللحظية",
  },
  {
    id: "deep",
    label: "Gemini 3.7 تفكير عميق",
    icon: Brain,
    model: "google/gemini-3.7-pro",
    hint: "تفكير منطقي وتحليل عميق لحل أصعب المسائل والأسئلة المعقدة",
  },
  {
    id: "pro",
    label: "Gemini Pro المتقدم",
    icon: Sparkles,
    model: "google/gemini-2.5-pro",
    hint: "دقة استثنائية في البرمجة والأبحاث والتحليل",
  },
] as const;

const PERSONAS = [
  { id: "general", label: "مساعد عام", system: "أنت مساعد ذكي محترف وودود، دقيق ومباشر وموسوعي المعرفة." },
  {
    id: "business",
    label: "مستشار أعمال",
    system:
      "أنت مستشار أعمال خبير. حلّل بأرقام وخطوات عملية، واذكر المخاطر والفرص وخطة تنفيذ مختصرة.",
  },
  {
    id: "marketing",
    label: "خبير تسويق",
    system:
      "أنت خبير تسويق رقمي. قدّم أفكارًا إعلانية قابلة للتنفيذ مع زوايا رسائل وجمهور مستهدف.",
  },
  {
    id: "dev",
    label: "مهندس برمجيات",
    system:
      "أنت مهندس برمجيات خبير. أجب بكود صحيح وموجز مع شرح قصير وأفضل الممارسات والأمان.",
  },
  {
    id: "tutor",
    label: "معلّم مبسّط",
    system: "أنت معلّم صبور. اشرح بخطوات مبسّطة وأمثلة من الحياة اليومية، ثم اختبر الفهم بسؤال.",
  },
  {
    id: "writer",
    label: "كاتب محترف",
    system: "أنت كاتب محترف. اكتب بأسلوب سلس بلا حشو، مع عناية بالإيقاع واختيار الكلمة.",
  },
] as const;

const SUGGESTIONS = [
  "اشرح لي فكرة معقّدة وحللها خطوة بخطوة",
  "ما هي أحدث التطورات العلمية والتقنية اليوم؟",
  "اكتب خطة عمل متكاملة لمشروع عالمي",
  "حلل هذا الكود واقترح تحسينات لأدائه وأمانه",
];

const BASE_RULES =
  "أنت مساعد الذكاء الاصطناعي العالمي فائق الذكاء، مدعوم بأحدث محركات Gemini 3.7 اللحظية. لديك قدرة فائقة على تقديم إجابات فورية عميقة وموسوعية لأي سؤال مهما كانت صعوبته. أجب باللغة التي يطلبها المستخدم بدقة وتنسيق منظم واحترافي.";

function ChatTool() {
  const { q } = Route.useSearch();
  const save = useServerFn(saveGeneration);
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState(q ?? "");
  const [images, setImages] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("balanced");
  const [persona, setPersona] = useState<(typeof PERSONAS)[number]["id"]>("general");
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

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
          model: MODES.find((m) => m.id === mode)!.model,
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

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  };

  const activeMode = MODES.find((m) => m.id === mode)!;

  return (
    <ToolShell
      title="دلفاي برايم — Delvai Prime"
      subtitle="عقل الذكاء الاصطناعي لمنصة Delvai — إجابات فورية بالبث المباشر، تفكير عميق، تحليل صور ومستندات، وحل أصعب المسائل بلحظات."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/60 p-3 backdrop-blur">
          <div className="flex gap-1 rounded-xl bg-background/60 p-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                title={m.hint}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition ${
                  mode === m.id
                    ? "bg-primary/20 text-primary shadow-glow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <m.icon className="size-3.5" />
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersona(p.id)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  persona === p.id
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="ms-auto text-xs text-muted-foreground"
              onClick={() => {
                stop();
                setMessages([]);
                setError(null);
              }}
            >
              <Trash2 className="me-1 size-3.5" /> محادثة جديدة
            </Button>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur">
          <div className="max-h-[52vh] min-h-[280px] space-y-4 overflow-y-auto pe-1">
            {messages.length === 0 && (
              <div className="pt-10 text-center">
                <p className="text-sm text-muted-foreground">
                  ابدأ المحادثة — الوضع الحالي: {activeMode.label}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-start" : "flex justify-end"}>
                <div
                  className={`group max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${
                    m.role === "user"
                      ? "bg-primary/15 text-foreground"
                      : "bg-background/70 text-foreground"
                  }`}
                >
                  {m.images && m.images.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {m.images.map((src, j) => (
                        <img
                          key={j}
                          src={src}
                          alt="صورة مرفقة"
                          className="size-24 rounded-lg border border-border object-cover"
                        />
                      ))}
                    </div>
                  )}
                  {m.content ||
                    (streaming && i === messages.length - 1 ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : null)}
                  {m.role === "assistant" && m.content && !(streaming && i === messages.length - 1) && (
                    <div className="mt-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => void copy(m.content)}
                        className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                        aria-label="نسخ الرد"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      {i === messages.length - 1 && (
                        <button
                          type="button"
                          onClick={() => void regenerate()}
                          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                          aria-label="إعادة توليد الرد"
                        >
                          <RefreshCw className="size-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {error && (
            <p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
              {error}
            </p>
          )}

          {images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    alt="معاينة الصورة"
                    className="size-20 rounded-lg border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -top-2 -end-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                    aria-label="إزالة الصورة"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-end gap-2">
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
              aria-label="إرفاق صورة"
            >
              <ImagePlus className="size-4" />
            </Button>
            <Textarea
              rows={2}
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
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
                  f.type.startsWith("image/"),
                );
                if (files.length > 0) {
                  e.preventDefault();
                  void addFiles(files);
                }
              }}
              placeholder="اكتب رسالتك… Enter للإرسال، Shift+Enter لسطر جديد"
              className="resize-none bg-background/60"
            />

            {streaming ? (
              <Button variant="outline" onClick={stop} aria-label="إيقاف">
                <Square className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={() => void send()}
                disabled={!input.trim() && images.length === 0}
                className="bg-cine text-primary-foreground"
              >
                <Send className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
