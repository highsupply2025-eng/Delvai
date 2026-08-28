import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Languages, PenLine, RefreshCcw, Search, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolShell } from "@/components/ToolShell";
import { chatComplete } from "@/lib/ai.functions";
import { saveGeneration } from "@/lib/history.functions";
import { useAuth } from "@/hooks/useAuth";
import { DelvaiThinkingLoader } from "@/components/DelvaiThinkingLoader";

export const Route = createFileRoute("/write")({
  head: () => ({
    meta: [
      { title: "استوديو الكتابة والإعلانات بالذكاء الاصطناعي" },
      {
        name: "description",
        content:
          "استوديو كتابة متكامل: منشورات وإعلانات وأوصاف منتجات وإيميلات ومقالات SEO، مع إعادة صياغة وتدقيق لغوي وترجمة وتحليل قوة النص.",
      },
      { property: "og:title", content: "استوديو الكتابة والإعلانات" },
      {
        property: "og:description",
        content: "محتوى تسويقي احترافي بالعربية: أطر إعلانية، نسخ متعددة، SEO، تدقيق وإعادة صياغة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WriteTool,
});

const TABS = [
  { id: "generate", label: "توليد المحتوى", icon: PenLine },
  { id: "rewrite", label: "إعادة الصياغة", icon: RefreshCcw },
  { id: "polish", label: "تدقيق وتحسين", icon: ShieldCheck },
  { id: "seo", label: "تحسين SEO", icon: Search },
  { id: "translate", label: "ترجمة", icon: Languages },
  { id: "score", label: "تحليل قوة النص", icon: Sparkles },
] as const;
type TabId = (typeof TABS)[number]["id"];

const KINDS = [
  { id: "social", label: "منشور سوشيال ميديا" },
  { id: "ad", label: "نص إعلاني مدفوع" },
  { id: "product", label: "وصف منتج" },
  { id: "email", label: "إيميل تسويقي" },
  { id: "landing", label: "صفحة هبوط" },
  { id: "article", label: "مقال SEO" },
  { id: "script", label: "سكربت فيديو / ريلز" },
  { id: "headline", label: "عناوين وسلوجان" },
  { id: "bio", label: "نبذة تعريفية / Bio" },
  { id: "whatsapp", label: "رسالة واتساب / SMS" },
  { id: "press", label: "بيان صحفي" },
  { id: "reply", label: "ردّ على عميل" },
] as const;

const TONES = ["احترافي", "ودود", "فاخر", "مباشر وقوي", "مرح", "تعليمي", "عاطفي", "رسمي"];

const PLATFORMS = ["عام", "انستغرام", "تيك توك", "إكس (تويتر)", "لينكدإن", "سناب شات", "يوتيوب", "متجر إلكتروني"];

const LENGTHS = [
  { id: "short", label: "قصير" },
  { id: "medium", label: "متوسط" },
  { id: "long", label: "طويل" },
];

const FRAMEWORKS = [
  { id: "auto", label: "تلقائي", hint: "" },
  { id: "aida", label: "AIDA", hint: "استخدم إطار AIDA: انتباه، اهتمام، رغبة، إجراء." },
  { id: "pas", label: "PAS", hint: "استخدم إطار PAS: مشكلة، تهييج، حل." },
  { id: "fab", label: "FAB", hint: "استخدم إطار FAB: ميزة، فائدة، منفعة للعميل." },
  { id: "bab", label: "BAB", hint: "استخدم إطار Before-After-Bridge." },
  { id: "4p", label: "4P", hint: "استخدم إطار 4P: Picture, Promise, Prove, Push." },
];

const DIALECTS = ["فصحى", "سعودي", "خليجي", "مصري", "إنجليزي", "عربي + إنجليزي"];

const REWRITE_MODES = [
  "إعادة صياغة بنفس المعنى",
  "تبسيط اللغة",
  "جعله أكثر احترافية",
  "جعله أقصر وأقوى",
  "توسيع النص بتفاصيل",
  "تحويله لنبرة إعلانية",
];

const LANGS = ["الإنجليزية", "العربية", "الفرنسية", "الإسبانية", "التركية", "الأردية", "الصينية"];

const SEP = "-----";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

function WriteTool() {
  const ask = useServerFn(chatComplete);
  const save = useServerFn(saveGeneration);
  const { user } = useAuth();

  const [tab, setTab] = useState<TabId>("generate");

  // generate
  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState<string>(KINDS[0].id);
  const [tone, setTone] = useState(TONES[0]!);
  const [platform, setPlatform] = useState(PLATFORMS[0]!);
  const [length, setLength] = useState("medium");
  const [framework, setFramework] = useState("auto");
  const [dialect, setDialect] = useState(DIALECTS[0]!);
  const [audience, setAudience] = useState("");
  const [brand, setBrand] = useState("");
  const [keywords, setKeywords] = useState("");
  const [cta, setCta] = useState("");
  const [emoji, setEmoji] = useState(true);
  const [hashtags, setHashtags] = useState(true);
  const [variants, setVariants] = useState(2);

  // shared source text
  const [source, setSource] = useState("");
  const [rewriteMode, setRewriteMode] = useState(REWRITE_MODES[0]!);
  const [targetLang, setTargetLang] = useState(LANGS[0]!);
  const [seoKeyword, setSeoKeyword] = useState("");

  const [results, setResults] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (busy) return;
    const needsSource = tab !== "generate";
    if (needsSource && !source.trim()) return;
    if (!needsSource && !topic.trim()) return;

    setBusy(true);
    setError(null);
    setResults([]);

    const system =
      "أنت كاتب محتوى تسويقي ومحرر عربي محترف بخبرة وكالات إعلانية. اكتب نصًا جاهزًا للنشر بلغة سليمة وبدون أي مقدمات أو شروح أو علامات ماركداون زائدة.";

    let prompt = "";
    let n = 1;

    if (tab === "generate") {
      n = variants;
      const kindLabel = KINDS.find((k) => k.id === kind)?.label ?? "";
      const lengthLabel = LENGTHS.find((l) => l.id === length)?.label ?? "";
      const fw = FRAMEWORKS.find((f) => f.id === framework)?.hint ?? "";
      prompt = [
        `اكتب ${kindLabel} بنبرة ${tone} وبلغة ${dialect}.`,
        `الموضوع: ${topic.trim()}`,
        platform !== "عام" ? `المنصة المستهدفة: ${platform} (التزم بأسلوبها وطول نصوصها).` : "",
        `الطول: ${lengthLabel}.`,
        audience.trim() ? `الجمهور المستهدف: ${audience.trim()}.` : "",
        brand.trim() ? `اسم العلامة التجارية: ${brand.trim()} (اذكرها بشكل طبيعي).` : "",
        keywords.trim() ? `أدرج هذه الكلمات المفتاحية بسلاسة: ${keywords.trim()}.` : "",
        cta.trim() ? `دعوة الإجراء: ${cta.trim()}.` : "أنهِ بدعوة واضحة لاتخاذ إجراء.",
        fw,
        emoji ? "استخدم إيموجي بشكل متوازن." : "لا تستخدم أي إيموجي.",
        hashtags ? "أضف هاشتاقات مناسبة في النهاية." : "لا تضف هاشتاقات.",
        n > 1
          ? `اكتب ${n} نسخ مختلفة تمامًا في الزاوية والصياغة، وافصل بين كل نسخة والأخرى بسطر يحتوي فقط على ${SEP}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    } else if (tab === "rewrite") {
      n = variants;
      prompt = [
        `أعد كتابة النص التالي: ${rewriteMode}. بنبرة ${tone} وبلغة ${dialect}.`,
        n > 1 ? `قدّم ${n} صياغات مختلفة مفصولة بسطر يحتوي فقط على ${SEP}` : "",
        "\nالنص:\n" + source.trim(),
      ]
        .filter(Boolean)
        .join("\n");
    } else if (tab === "polish") {
      prompt = `دقّق النص التالي لغويًا وإملائيًا ونحويًا وحسّن أسلوبه مع الحفاظ على المعنى. أعد أولًا النص المصحّح جاهزًا، ثم بعد سطر يحتوي فقط على ${SEP} اذكر قائمة مختصرة بأهم التعديلات.\n\nالنص:\n${source.trim()}`;
    } else if (tab === "seo") {
      prompt = `حسّن النص التالي لمحركات البحث${seoKeyword.trim() ? ` مستهدفًا الكلمة المفتاحية: ${seoKeyword.trim()}` : ""}.\nأعد النتيجة بهذا الترتيب: عنوان SEO (أقل من 60 حرفًا)، وصف Meta (أقل من 155 حرفًا)، عناوين فرعية H2 مقترحة، النص المحسّن، كلمات مفتاحية ثانوية.\n\nالنص:\n${source.trim()}`;
    } else if (tab === "translate") {
      prompt = `ترجم النص التالي إلى ${targetLang} ترجمة تسويقية طبيعية (Transcreation) وليست حرفية، مع الحفاظ على النبرة وقوة الرسالة. أعد الترجمة فقط.\n\nالنص:\n${source.trim()}`;
    } else {
      prompt = `حلّل النص الإعلاني التالي كخبير أداء تسويقي. أعطِ:\n1) درجة من 100 للوضوح، الإقناع، قوة العنوان، دعوة الإجراء، والملاءمة للمنصة.\n2) الدرجة الإجمالية.\n3) أهم ٣ نقاط ضعف مع اقتراح بديل مباشر لكل نقطة.\n4) نسخة محسّنة جاهزة للنشر.\n\nالنص:\n${source.trim()}`;
    }

    const res = await ask({
      data: { system, messages: [{ role: "user", content: prompt }], model: "google/gemini-2.5-flash" },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    const parts = res.text
      .split(new RegExp(`^\\s*${SEP}\\s*$`, "m"))
      .map((p) => p.trim())
      .filter(Boolean);
    setResults(parts.length > 0 ? parts : [res.text]);
    if (user)
      void save({
        data: { tool: "محتوى", prompt: tab === "generate" ? topic : source.slice(0, 500), result_text: res.text },
      });
  };

  const canRun = tab === "generate" ? topic.trim().length > 0 : source.trim().length > 0;

  return (
    <ToolShell
      title="استوديو الكتابة والإعلانات"
      subtitle="توليد محتوى بأطر إعلانية احترافية، إعادة صياغة، تدقيق لغوي، تحسين SEO، ترجمة تسويقية، وتحليل قوة النص."
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setResults([]);
              setError(null);
            }}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-colors ${
              tab === t.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card/60 text-muted-foreground hover:border-primary/40"
            }`}
          >
            <t.icon className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
          {tab === "generate" ? (
            <>
              <Label htmlFor="topic">الموضوع أو المنتج</Label>
              <Textarea
                id="topic"
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="مثال: عرض خاص على مواد التموين للمطاعم خلال شهر رمضان"
                className="mt-2 resize-none bg-background/60"
              />

              <Label className="mt-6 block">نوع المحتوى</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKind(k.id)}
                    className={`rounded-xl border px-3 py-2 text-xs transition-colors ${
                      kind === k.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background/40 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>

              <Label className="mt-6 block">المنصة</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <Chip key={p} active={platform === p} onClick={() => setPlatform(p)}>
                    {p}
                  </Chip>
                ))}
              </div>

              <Label className="mt-6 block">الإطار الإعلاني</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {FRAMEWORKS.map((f) => (
                  <Chip key={f.id} active={framework === f.id} onClick={() => setFramework(f.id)}>
                    {f.label}
                  </Chip>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="aud">الجمهور المستهدف</Label>
                  <Input
                    id="aud"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="أصحاب المطاعم والمقاهي"
                    className="mt-2 bg-background/60"
                  />
                </div>
                <div>
                  <Label htmlFor="brand">اسم العلامة</Label>
                  <Input
                    id="brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="التموين العالي"
                    className="mt-2 bg-background/60"
                  />
                </div>
                <div>
                  <Label htmlFor="kw">كلمات مفتاحية</Label>
                  <Input
                    id="kw"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="جملة، توصيل، أسعار الجملة"
                    className="mt-2 bg-background/60"
                  />
                </div>
                <div>
                  <Label htmlFor="cta">دعوة الإجراء</Label>
                  <Input
                    id="cta"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    placeholder="اطلب عرض سعر الآن"
                    className="mt-2 bg-background/60"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Chip active={emoji} onClick={() => setEmoji((v) => !v)}>
                  إيموجي {emoji ? "✓" : "✕"}
                </Chip>
                <Chip active={hashtags} onClick={() => setHashtags((v) => !v)}>
                  هاشتاقات {hashtags ? "✓" : "✕"}
                </Chip>
              </div>
            </>
          ) : (
            <>
              <Label htmlFor="src">النص</Label>
              <Textarea
                id="src"
                rows={8}
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="ألصق النص هنا..."
                className="mt-2 resize-none bg-background/60"
              />
              {tab === "rewrite" && (
                <>
                  <Label className="mt-6 block">أسلوب إعادة الصياغة</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {REWRITE_MODES.map((m) => (
                      <Chip key={m} active={rewriteMode === m} onClick={() => setRewriteMode(m)}>
                        {m}
                      </Chip>
                    ))}
                  </div>
                </>
              )}
              {tab === "seo" && (
                <div className="mt-6">
                  <Label htmlFor="seokw">الكلمة المفتاحية المستهدفة</Label>
                  <Input
                    id="seokw"
                    value={seoKeyword}
                    onChange={(e) => setSeoKeyword(e.target.value)}
                    placeholder="مواد تموينية بالجملة"
                    className="mt-2 bg-background/60"
                  />
                </div>
              )}
              {tab === "translate" && (
                <>
                  <Label className="mt-6 block">اللغة الهدف</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {LANGS.map((l) => (
                      <Chip key={l} active={targetLang === l} onClick={() => setTargetLang(l)}>
                        {l}
                      </Chip>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {(tab === "generate" || tab === "rewrite") && (
            <>
              <Label className="mt-6 block">النبرة واللهجة</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <Chip key={t} active={tone === t} onClick={() => setTone(t)}>
                    {t}
                  </Chip>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {DIALECTS.map((d) => (
                  <Chip key={d} active={dialect === d} onClick={() => setDialect(d)}>
                    {d}
                  </Chip>
                ))}
              </div>

              {tab === "generate" && (
                <>
                  <Label className="mt-6 block">الطول</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {LENGTHS.map((l) => (
                      <Chip key={l.id} active={length === l.id} onClick={() => setLength(l.id)}>
                        {l.label}
                      </Chip>
                    ))}
                  </div>
                </>
              )}

              <Label className="mt-6 block">عدد النسخ</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((v) => (
                  <Chip key={v} active={variants === v} onClick={() => setVariants(v)}>
                    {v}
                  </Chip>
                ))}
              </div>
            </>
          )}

          <Button
            onClick={() => void run()}
            disabled={busy || !canRun}
            className="mt-7 w-full bg-cine text-primary-foreground"
          >
            {busy ? <DelvaiThinkingLoader size="xs" /> : <PenLine className="size-4" />}
            {busy ? "دلفاي يفكّر ويكتب…" : "تنفيذ"}
          </Button>

          {error && (
            <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
              {error}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {results.length > 0 ? (
            results.map((r, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
                {results.length > 1 && (
                  <p className="mb-3 text-xs font-semibold text-primary">النسخة {i + 1}</p>
                )}
                <p className="whitespace-pre-wrap text-sm leading-7">{r}</p>
                <div className="mt-5 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      void navigator.clipboard.writeText(r);
                      toast.success("تم النسخ");
                    }}
                  >
                    <Copy className="size-4" /> نسخ
                  </Button>
                  {tab !== "generate" ? null : (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSource(r);
                        setTab("polish");
                        setResults([]);
                      }}
                    >
                      <ShieldCheck className="size-4" /> تحسين
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
              <p className="py-20 text-center text-sm text-muted-foreground">ستظهر النتائج هنا</p>
            </div>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
