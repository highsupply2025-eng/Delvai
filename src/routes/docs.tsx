import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Languages,
  ListChecks,
  Loader2,
  Mic,
  Send,
  Sparkles,
  Table2,
  Trash2,
  Upload,
  Volume2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToolShell } from "@/components/ToolShell";
import { chatComplete } from "@/lib/ai.functions";
import { saveGeneration } from "@/lib/history.functions";
import { extractFile, toCsvDownload, type ExtractedDoc } from "@/lib/extract";
import { chunkText } from "@/lib/wav";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "استوديو المستندات — تحليل PDF وWord وExcel بالذكاء الاصطناعي" },
      {
        name: "description",
        content:
          "ارفع ملفات PDF وWord وExcel والصور، ولخّصها واستخرج جداولها وقارن بينها واسألها بالمحادثة، ثم استمع إلى الملخص بصوت طبيعي.",
      },
      { property: "og:title", content: "استوديو تحليل المستندات" },
      {
        property: "og:description",
        content: "تلخيص، استخراج جداول CSV، مقارنة مستندات، محادثة مع ملفاتك، وقراءة صوتية.",
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
    label: "ملخص تنفيذي",
    icon: Sparkles,
    prompt: "اكتب ملخصًا تنفيذيًا منظمًا: الفكرة العامة، أهم النقاط، الأرقام الرئيسية، والخلاصة.",
  },
  {
    id: "bullets",
    label: "نقاط وقرارات",
    icon: ListChecks,
    prompt: "استخرج النقاط الرئيسية والقرارات والمهام المطلوبة مع المسؤول والمُدد إن وُجدت.",
  },
  {
    id: "tables",
    label: "استخراج جدول CSV",
    icon: Table2,
    prompt:
      "استخرج كل البيانات الجدولية من المستند وأعدها بصيغة CSV صالحة فقط (سطر عناوين ثم الصفوف)، دون أي شرح أو أسوار كود.",
  },
  {
    id: "insights",
    label: "رؤى ومخاطر",
    icon: BarChart3,
    prompt: "حلّل المحتوى واذكر أهم الرؤى، الفرص، المخاطر، والتوصيات القابلة للتنفيذ.",
  },
  {
    id: "compare",
    label: "مقارنة المستندات",
    icon: FileSpreadsheet,
    prompt:
      "قارن بين المستندات المرفوعة: أوجه التشابه، الاختلافات الجوهرية، والتناقضات في الأرقام أو الشروط، في جدول نصي.",
  },
  {
    id: "translate",
    label: "ترجمة للعربية",
    icon: Languages,
    prompt: "ترجم محتوى المستند إلى عربية فصحى واضحة مع الحفاظ على المصطلحات والأرقام.",
  },
  {
    id: "contract",
    label: "مراجعة عقد",
    icon: FileText,
    prompt:
      "راجع المستند كعقد: الأطراف، الالتزامات، المدة، الغرامات، البنود الخطرة أو غير المتوازنة، والتوصيات.",
  },
  {
    id: "podcast",
    label: "سكربت صوتي",
    icon: Mic,
    prompt:
      "حوّل المستند إلى سكربت صوتي بأسلوب بودكاست عربي قصير (٢-٣ دقائق) بجمل قصيرة صالحة للقراءة الصوتية.",
  },
] as const;

const KIND_LABEL: Record<ExtractedDoc["kind"], string> = {
  pdf: "PDF",
  word: "Word",
  sheet: "جدول",
  text: "نص",
  image: "صورة",
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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name}: الحجم أكبر من ٢٠ ميجابايت`);
          continue;
        }
        try {
          const doc = await extractFile(file);
          if (!doc.text && doc.kind !== "image") {
            toast.error(`${file.name}: لم يُعثر على نص قابل للقراءة (قد يكون ملفًا ممسوحًا ضوئيًا).`);
            continue;
          }
          setDocs((prev) => [...prev, doc]);
        } catch {
          toast.error(`تعذّر قراءة ${file.name}`);
        }
      }
    } finally {
      setLoadingFiles(false);
    }
  };

  const buildContext = (limit = 90000) => {
    const parts: string[] = [];
    for (const d of docs) {
      if (d.kind === "image" || !d.text) continue;
      parts.push(`### المستند: ${d.name} (${KIND_LABEL[d.kind]})\n${d.text}`);
    }
    if (pasted.trim()) parts.push(`### نص ملصوق\n${pasted.trim()}`);
    return parts.join("\n\n").slice(0, limit);
  };

  const images = useMemo(
    () => docs.filter((d) => d.image).map((d) => d.image!) as string[],
    [docs],
  );

  const runPreset = async (preset: (typeof PRESETS)[number]) => {
    if (!hasContent || busy) return;
    setBusy(true);
    setActivePreset(preset.id);
    setOut("");
    try {
      const context = buildContext();
      const res = await ask({
        data: {
          system:
            "أنت محلل مستندات خبير. اعتمد حصرًا على المحتوى المُعطى (بما فيه الصور المرفقة)، واذكر اسم المستند ورقم الصفحة عند الاستناد إلى معلومة. إن كانت المعلومة غير موجودة فقل ذلك صريحًا.",
          messages: [
            {
              role: "user",
              content: `${preset.prompt}\n\n${context || "(المحتوى في الصور المرفقة)"}`,
              ...(images.length > 0 ? { images: images.slice(0, 4) } : {}),
            },
          ],
        },
      });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      setOut(res.text);
      void save({
        data: {
          tool: "تحليل مستند",
          prompt: preset.label,
          result_text: res.text.slice(0, 20000),
        },
      }).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  const sendQuestion = async () => {
    const q = question.trim();
    if (!q || busy || !hasContent) return;
    setQuestion("");
    const next: ChatMsg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setBusy(true);
    try {
      const context = buildContext(70000);
      const res = await ask({
        data: {
          system: `أنت مساعد للأسئلة والأجوبة على مستندات المستخدم. أجب بالعربية بدقة واستند إلى المستندات التالية فقط، مع ذكر اسم المستند والصفحة. إن لم تتوفر المعلومة فاذكر ذلك.\n\n${context}`,
          messages: next.slice(-10).map((m, i, arr) =>
            i === arr.length - 1 && images.length > 0
              ? { role: m.role, content: m.content, images: images.slice(0, 4) }
              : { role: m.role, content: m.content },
          ),
        },
      });
      if (!res.ok) {
        toast.error(res.message);
        setMessages(next);
        return;
      }
      setMessages([...next, { role: "assistant", content: res.text }]);
    } finally {
      setBusy(false);
    }
  };

  const listen = async () => {
    const value = out.trim();
    if (!value) return;
    setSpeaking(true);
    try {
      const blobs: Blob[] = [];
      for (const part of chunkText(value.slice(0, 6000))) {
        const res = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: part,
            voice: "sage",
            instructions: "Read as a calm, professional Arabic narrator.",
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { message?: string } | null;
          toast.error(data?.message ?? "تعذّر توليد الصوت");
          return;
        }
        blobs.push(await res.blob());
      }
      const url = URL.createObjectURL(new Blob(blobs, { type: "audio/mpeg" }));
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);
      void new Audio(url).play().catch(() => {});
    } finally {
      setSpeaking(false);
    }
  };

  const looksLikeCsv = out.includes(",") && out.split("\n").length > 2 && activePreset === "tables";

  return (
    <ToolShell
      title="استوديو المستندات"
      subtitle="ارفع PDF أو Word أو Excel أو صورًا — ثم لخّص، استخرج الجداول، قارن، اسأل بالمحادثة، واستمع إلى النتيجة بصوت طبيعي."
    >
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* مكتبة المستندات */}
        <div className="space-y-4 rounded-2xl border border-border bg-card/70 p-5 backdrop-blur">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-xl border border-dashed border-border bg-background/50 px-4 py-8 text-center transition-colors hover:border-primary/50"
          >
            {loadingFiles ? (
              <Loader2 className="mx-auto size-5 animate-spin text-primary" />
            ) : (
              <Upload className="mx-auto size-5 text-primary" />
            )}
            <p className="mt-2 text-sm font-medium">اسحب الملفات أو اضغط للرفع</p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF · DOCX · XLSX · CSV · TXT · صور — حتى ٢٠MB للملف
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.tsv,.txt,.md,.json,image/*"
            className="hidden"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {docs.length > 0 && (
            <div className="space-y-2">
              {docs.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background/50 px-3 py-2"
                >
                  {d.kind === "image" ? (
                    <ImageIcon className="size-4 shrink-0 text-primary" />
                  ) : d.kind === "sheet" ? (
                    <FileSpreadsheet className="size-4 shrink-0 text-primary" />
                  ) : (
                    <FileText className="size-4 shrink-0 text-primary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{d.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {KIND_LABEL[d.kind]}
                      {d.pages ? ` · ${d.pages} صفحة` : ""}
                      {d.chars ? ` · ${d.chars.toLocaleString("en")} حرف` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => setDocs((prev) => prev.filter((x) => x.id !== d.id))}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="حذف"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setDocs([])}>
                <Trash2 className="size-3.5" /> إفراغ المكتبة
              </Button>
            </div>
          )}

          <div>
            <Label htmlFor="pasted" className="text-xs text-muted-foreground">
              أو الصق نصًا مباشرة
            </Label>
            <Textarea
              id="pasted"
              rows={5}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder="الصق نص التقرير أو البيانات…"
              className="mt-2 resize-none bg-background/60"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            إجمالي المحتوى: {totalChars.toLocaleString("en")} حرف
            {docs.some((d) => d.kind === "image") ? " + صور" : ""}
          </p>
        </div>

        {/* لوحة العمل */}
        <Tabs defaultValue="analyze">
          <TabsList className="mb-5 w-full">
            <TabsTrigger value="analyze" className="flex-1">
              <Sparkles className="size-4" /> تحليل جاهز
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex-1">
              <Send className="size-4" /> اسأل مستنداتك
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-5">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  disabled={!hasContent || busy}
                  onClick={() => void runPreset(p)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-start text-xs transition-colors disabled:opacity-50 ${
                    activePreset === p.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {busy && activePreset === p.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin" />
                  ) : (
                    <p.icon className="size-4 shrink-0" />
                  )}
                  {p.label}
                </button>
              ))}
            </div>

            <div className="min-h-[320px] rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
              {out ? (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void navigator.clipboard.writeText(out);
                        toast.success("تم النسخ");
                      }}
                    >
                      <Copy className="size-3.5" /> نسخ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([out], { type: "text/plain;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "analysis.txt";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="size-3.5" /> تنزيل
                    </Button>
                    {looksLikeCsv && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toCsvDownload(out.replace(/```[a-z]*|```/g, "").trim(), "table.csv")}
                      >
                        <Table2 className="size-3.5" /> تنزيل CSV
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="bg-cine text-primary-foreground"
                      disabled={speaking}
                      onClick={() => void listen()}
                    >
                      {speaking ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Volume2 className="size-3.5" />
                      )}
                      استماع
                    </Button>
                  </div>
                  {audioUrl && <audio src={audioUrl} controls className="mb-4 w-full" />}
                  <p className="whitespace-pre-wrap text-sm leading-7">{out}</p>
                </>
              ) : (
                <p className="py-24 text-center text-sm text-muted-foreground">
                  {hasContent
                    ? "اختر نوع التحليل من الأعلى"
                    : "ارفع مستندًا أو الصق نصًا للبدء"}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <div className="min-h-[380px] space-y-3 rounded-2xl border border-border bg-card/70 p-5 backdrop-blur">
              {messages.length === 0 && (
                <p className="py-24 text-center text-sm text-muted-foreground">
                  اسأل أي سؤال عن مستنداتك، وسأجيب بالاستناد إليها مع ذكر المصدر.
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                    m.role === "user"
                      ? "ms-auto bg-primary/15 text-foreground"
                      : "me-auto border border-border bg-background/60"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
              {busy && (
                <p className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 className="size-4 animate-spin" /> جارٍ البحث في المستندات…
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendQuestion();
                  }
                }}
                placeholder={hasContent ? "اكتب سؤالك عن المستندات…" : "ارفع مستندًا أولًا"}
                disabled={!hasContent}
                className="bg-background/60"
              />
              <Button
                onClick={() => void sendQuestion()}
                disabled={!question.trim() || busy || !hasContent}
                className="bg-cine text-primary-foreground"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ToolShell>
  );
}
