import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolShell } from "@/components/ToolShell";
import { chatComplete } from "@/lib/ai.functions";
import { saveGeneration } from "@/lib/history.functions";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "تحليل المستندات والبيانات بالذكاء الاصطناعي" },
      {
        name: "description",
        content: "الصق نص التقرير أو ارفع ملفًا نصيًا للحصول على تلخيص، استخراج بيانات، وإجابات دقيقة.",
      },
      { property: "og:title", content: "تحليل المستندات والبيانات" },
      { property: "og:description", content: "تلخيص التقارير واستخراج الجداول والأرقام تلقائيًا." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocsTool,
});

const MODES = [
  { id: "summary", label: "تلخيص", instruction: "لخّص المستند في نقاط واضحة مع أهم الأرقام والقرارات." },
  { id: "extract", label: "استخراج بيانات", instruction: "استخرج البيانات المهمة ورتّبها في جدول نصي منظم." },
  { id: "insights", label: "تحليل ورؤى", instruction: "حلّل المحتوى واذكر أهم الرؤى والمخاطر والتوصيات." },
  { id: "qa", label: "سؤال وجواب", instruction: "أجب عن سؤال المستخدم اعتمادًا على المستند فقط." },
];

function DocsTool() {
  const ask = useServerFn(chatComplete);
  const save = useServerFn(saveGeneration);
  const { user } = useAuth();

  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState(MODES[0]!.id);
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const content = await file.text();
    setText(content.slice(0, 50000));
  };

  const run = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    setOut("");
    const instruction = MODES.find((m) => m.id === mode)?.instruction ?? "";
    const res = await ask({
      data: {
        system: "أنت محلل بيانات ومستندات دقيق. أجب بالعربية واعتمد على المحتوى المُعطى فقط.",
        messages: [
          {
            role: "user",
            content: `${instruction}${mode === "qa" ? `\nالسؤال: ${question}` : ""}\n\nالمستند:\n${text.slice(0, 50000)}`,
          },
        ],
        model: "google/gemini-2.5-flash",
      },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setOut(res.text);
    if (user)
      void save({
        data: { tool: "تحليل مستند", prompt: mode === "qa" ? question : instruction, result_text: res.text },
      });
  };

  return (
    <ToolShell
      title="تحليل المستندات والبيانات"
      subtitle="الصق النص أو ارفع ملفًا نصيًا (txt / csv / md) ثم اختر نوع التحليل."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
          <Label htmlFor="file" className="flex items-center gap-2 text-sm">
            <Upload className="size-4" /> رفع ملف نصي
          </Label>
          <Input
            id="file"
            type="file"
            accept=".txt,.csv,.md,.json"
            className="mt-2 bg-background/60"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />

          <Label htmlFor="content" className="mt-6 block">
            محتوى المستند
          </Label>
          <Textarea
            id="content"
            rows={9}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="الصق نص التقرير أو البيانات هنا…"
            className="mt-2 resize-none bg-background/60"
          />

          <div className="mt-6 grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  mode === m.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode === "qa" && (
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="اكتب سؤالك عن المستند"
              className="mt-4 bg-background/60"
            />
          )}

          <Button
            onClick={() => void run()}
            disabled={busy || !text.trim()}
            className="mt-6 w-full bg-cine text-primary-foreground"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            تحليل
          </Button>

          {error && (
            <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
              {error}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
          {out ? (
            <p className="whitespace-pre-wrap text-sm leading-7">{out}</p>
          ) : (
            <p className="py-20 text-center text-sm text-muted-foreground">ستظهر نتيجة التحليل هنا</p>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
