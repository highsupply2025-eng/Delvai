import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Loader2, Send, ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToolShell } from "@/components/ToolShell";
import { chatComplete } from "@/lib/ai.functions";
import { saveGeneration } from "@/lib/history.functions";
import { useAuth } from "@/hooks/useAuth";


export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "المساعد الذكي | دردشة ذكاء اصطناعي بالعربية" },
      {
        name: "description",
        content: "مساعد ذكاء اصطناعي بالعربية للإجابة على الأسئلة، التحليل، والمساعدة في مهام العمل.",
      },
      { property: "og:title", content: "المساعد الذكي" },
      { property: "og:description", content: "دردشة ذكية بالعربية لمهام العمل اليومية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatTool,
});

type Msg = { role: "user" | "assistant"; content: string; images?: string[] };

const MAX_IMAGES = 4;
const MAX_SIZE = 5 * 1024 * 1024;

function ChatTool() {
  const ask = useServerFn(chatComplete);
  const save = useServerFn(saveGeneration);
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const send = async () => {
    const text = input.trim();
    if ((!text && images.length === 0) || busy) return;
    const userMsg: Msg = {
      role: "user",
      content: text || "حلّل هذه الصورة.",
      ...(images.length ? { images } : {}),
    };
    const next: Msg[] = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setImages([]);
    setBusy(true);
    setError(null);

    const res = await ask({
      data: {
        system: "أنت مساعد ذكي محترف. أجب بالعربية الفصحى المبسّطة، وبإيجاز ووضوح.",
        messages: next,
        model: "google/gemini-2.5-flash",
      },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessages([...next, { role: "assistant", content: res.text }]);
    if (user) void save({ data: { tool: "دردشة", prompt: userMsg.content, result_text: res.text } });
  };

  return (
    <ToolShell title="المساعد الذكي" subtitle="اسأل عن أي شيء: تحليل، أفكار، ترجمة، أو حل مشكلة عمل — ويمكنك إرفاق صورة.">
      <div className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur">
        <div className="min-h-[280px] space-y-4">
          {messages.length === 0 && (
            <p className="pt-16 text-center text-sm text-muted-foreground">ابدأ المحادثة بسؤالك الأول</p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "ms-auto bg-primary/15 text-foreground"
                  : "me-auto bg-background/70 text-foreground"
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
              {m.content}
            </div>
          ))}
          {busy && <Loader2 className="size-5 animate-spin text-primary" />}
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
            disabled={busy || images.length >= MAX_IMAGES}
            aria-label="إرفاق صورة"
          >
            <ImagePlus className="size-4" />
          </Button>
          <Textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
            placeholder="اكتب رسالتك… أو الصق صورة (Ctrl+V)"
            className="resize-none bg-background/60"
          />

          <Button
            onClick={() => void send()}
            disabled={busy || (!input.trim() && images.length === 0)}
            className="bg-cine text-primary-foreground"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </ToolShell>
  );
}
