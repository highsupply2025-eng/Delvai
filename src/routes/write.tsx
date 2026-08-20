import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ToolShell } from "@/components/ToolShell";
import { chatComplete } from "@/lib/ai.functions";
import { saveGeneration } from "@/lib/history.functions";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/write")({
  head: () => ({
    meta: [
      { title: "كتابة المحتوى والإعلانات بالذكاء الاصطناعي" },
      {
        name: "description",
        content: "ولّد منشورات سوشيال ميديا وأوصاف منتجات ونصوص إعلانية وإيميلات احترافية بالعربية.",
      },
      { property: "og:title", content: "كتابة المحتوى والإعلانات" },
      { property: "og:description", content: "محتوى تسويقي جاهز بالعربية خلال ثوانٍ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WriteTool,
});

const KINDS = [
  { id: "social", label: "منشور سوشيال ميديا" },
  { id: "product", label: "وصف منتج" },
  { id: "ad", label: "نص إعلاني" },
  { id: "email", label: "إيميل تسويقي" },
];

const TONES = ["احترافي", "ودود", "فاخر", "مباشر وقوي"];

function WriteTool() {
  const ask = useServerFn(chatComplete);
  const save = useServerFn(saveGeneration);
  const { user } = useAuth();

  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState(KINDS[0]!.id);
  const [tone, setTone] = useState(TONES[0]!);
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!topic.trim() || busy) return;
    setBusy(true);
    setError(null);
    setOut("");
    const kindLabel = KINDS.find((k) => k.id === kind)?.label ?? "";
    const res = await ask({
      data: {
        system:
          "أنت كاتب محتوى تسويقي عربي محترف. اكتب نصًا جاهزًا للنشر، بلغة عربية سليمة، بدون مقدمات أو شروح.",
        messages: [
          {
            role: "user",
            content: `اكتب ${kindLabel} بنبرة ${tone} عن: ${topic.trim()}. أضف عنوانًا جذابًا، ونقاطًا مختصرة، ودعوة لاتخاذ إجراء، وهاشتاقات مناسبة إن كان منشورًا.`,
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
    if (user) void save({ data: { tool: "محتوى", prompt: topic, result_text: res.text } });
  };

  return (
    <ToolShell title="كتابة المحتوى والإعلانات" subtitle="اكتب الموضوع واختر النوع والنبرة، واحصل على نص جاهز.">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
          <Label htmlFor="topic">الموضوع</Label>
          <Textarea
            id="topic"
            rows={4}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="مثال: عرض خاص على مواد التموين للمطاعم خلال شهر رمضان"
            className="mt-2 resize-none bg-background/60"
          />

          <Label className="mt-6 block">نوع المحتوى</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  kind === k.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          <Label className="mt-6 block">النبرة</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  tone === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <Button
            onClick={() => void run()}
            disabled={busy || !topic.trim()}
            className="mt-7 w-full bg-cine text-primary-foreground"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />}
            توليد النص
          </Button>

          {error && (
            <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
              {error}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
          {out ? (
            <>
              <p className="whitespace-pre-wrap text-sm leading-7">{out}</p>
              <Button
                variant="outline"
                className="mt-5 w-full"
                onClick={() => {
                  void navigator.clipboard.writeText(out);
                  toast.success("تم النسخ");
                }}
              >
                <Copy className="size-4" /> نسخ النص
              </Button>
            </>
          ) : (
            <p className="py-20 text-center text-sm text-muted-foreground">سيظهر النص الناتج هنا</p>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
