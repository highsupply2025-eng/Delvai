import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";

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

type Msg = { role: "user" | "assistant"; content: string };

function ChatTool() {
  const ask = useServerFn(chatComplete);
  const save = useServerFn(saveGeneration);
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
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
    if (user) void save({ data: { tool: "دردشة", prompt: text, result_text: res.text } });
  };

  return (
    <ToolShell title="المساعد الذكي" subtitle="اسأل عن أي شيء: تحليل، أفكار، ترجمة، أو حل مشكلة عمل.">
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

        <div className="mt-5 flex items-end gap-2">
          <Textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب رسالتك…"
            className="resize-none bg-background/60"
          />
          <Button onClick={() => void send()} disabled={busy || !input.trim()} className="bg-cine text-primary-foreground">
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </ToolShell>
  );
}
