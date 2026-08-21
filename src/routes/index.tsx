import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  Clapperboard,
  FileText,
  Gift,
  Image as ImageIcon,
  Mic,
  PenLine,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState, type ComponentType } from "react";

import { SiteHeader, TOOLS } from "@/components/ToolShell";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/useReveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منصة الذكاء — كل أدوات الذكاء الاصطناعي بالعربية" },
      {
        name: "description",
        content:
          "منصة عربية واحدة تجمع أقوى أدوات الذكاء الاصطناعي: مساعد فوري، استوديو صور، كتابة إعلانات، فيديو سينمائي، صوت ونص، وتحليل مستندات. شهر أول مجاني.",
      },
      { property: "og:title", content: "منصة الذكاء — كل أدوات الذكاء الاصطناعي بالعربية" },
      {
        property: "og:description",
        content:
          "ستة استوديوهات ذكاء اصطناعي في مكان واحد، بتصميم عربي سريع واحترافي. ابدأ شهرك المجاني الآن.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const TOOL_META: Record<string, { icon: ComponentType<{ className?: string }>; tag: string }> = {
  "/chat": { icon: Bot, tag: "بث فوري" },
  "/image": { icon: ImageIcon, tag: "استوديو صور" },
  "/write": { icon: PenLine, tag: "أطر إعلانية" },
  "/video": { icon: Clapperboard, tag: "فيديو + صوت" },
  "/voice": { icon: Mic, tag: "١٠ أصوات" },
  "/docs": { icon: FileText, tag: "PDF · Word · Excel" },
};

const SUGGESTIONS = [
  "اكتب لي إعلان انستقرام لمتجر تموين",
  "صمّم شعارًا فاخرًا بخط عربي",
  "لخّص هذا العقد في ٥ نقاط",
  "أنشئ مشهدًا سينمائيًا للصحراء ليلًا",
];

const MARQUEE = [
  "بث حرفًا بحرف",
  "تحليل الصور",
  "تفريغ صوتي",
  "تعليق صوتي عربي",
  "فيديو سينمائي",
  "استخراج جداول",
  "تحسين SEO",
  "ترجمة تسويقية",
  "تمديد المشاهد",
  "دفع آمن",
];

const STATS = [
  { value: "٦", label: "استوديوهات متكاملة" },
  { value: "٣٠", label: "يومًا مجانًا" },
  { value: "<١ث", label: "زمن أول حرف" },
  { value: "٢٤/٧", label: "جاهزة دائمًا" },
];

function Home() {
  useReveal();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const go = (text?: string) => {
    const value = (text ?? prompt).trim();
    void navigate({ to: "/chat", search: value ? { q: value } : undefined });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-stage">
      <SiteHeader />

      {/* ================= HERO ================= */}
      <section className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-aurora opacity-70 animate-drift" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-cine opacity-60" />

        <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-20 sm:pt-28">
          <div className="reveal" data-reveal>
            <span className="mx-auto flex w-fit items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              الجيل الجديد من أدوات الذكاء الاصطناعي العربية
            </span>
          </div>

          <h1
            className="reveal mt-8 text-center text-[2.6rem] font-extrabold leading-[1.1] tracking-tight sm:text-7xl"
            data-reveal
            data-reveal-delay="80"
          >
            <span className="text-shine">ذكاء اصطناعي</span>
            <br />
            <span className="text-cine">يعمل بلغتك، وبسرعة الخيال</span>
          </h1>

          <p
            className="reveal mx-auto mt-6 max-w-2xl text-center text-base leading-8 text-muted-foreground sm:text-lg"
            data-reveal
            data-reveal-delay="160"
          >
            منصة واحدة تجمع ستة استوديوهات: مساعد فوري، صور، محتوى وإعلانات، فيديو سينمائي، صوت ونص،
            وتحليل مستندات — بواجهة عربية أنيقة وتجربة سلسة من أول ثانية.
          </p>

          {/* Prompt console */}
          <div
            className="reveal mx-auto mt-10 max-w-3xl"
            data-reveal
            data-reveal-delay="220"
          >
            <div className="relative rounded-3xl glass p-2 shadow-float ring-glow">
              <div className="pointer-events-none absolute inset-y-4 start-0 w-px overflow-hidden">
                <span className="block h-1/3 w-px bg-cine animate-beam" />
              </div>
              <div className="flex items-end gap-2 p-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      go();
                    }
                  }}
                  rows={2}
                  placeholder="اكتب ما تريد تنفيذه… مثال: أنشئ حملة إعلانية كاملة لمتجري"
                  className="min-h-16 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 sm:text-base"
                  aria-label="اكتب طلبك"
                />
                <Button
                  onClick={() => go()}
                  size="lg"
                  className="shrink-0 bg-cine text-primary-foreground shadow-glow"
                >
                  <Send className="size-4" />
                  ابدأ
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 px-3 pb-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => go(s)}
                    className="rounded-full border border-border/70 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="border-primary/40">
                  <Gift className="size-4 text-primary" /> شهر أول مجاني
                </Button>
              </Link>
              <Link to="/video">
                <Button size="lg" variant="ghost">
                  <Play className="size-4" /> شاهد الاستوديو السينمائي
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <dl className="reveal mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4" data-reveal>
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl glass px-4 py-5 text-center">
                <dt className="text-2xl font-extrabold text-cine sm:text-3xl">{s.value}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ================= MARQUEE ================= */}
      <div className="relative overflow-hidden border-y border-border/60 py-4">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span
              key={`${m}-${i}`}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Zap className="size-3.5 text-primary" />
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* ================= TOOLS ================= */}
      <section className="mx-auto w-full max-w-6xl px-5 py-24">
        <div className="reveal max-w-2xl" data-reveal>
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            <span className="text-cine">ستة استوديوهات</span> تغني عن عشرات الاشتراكات
          </h2>
          <p className="mt-4 text-muted-foreground">
            كل أداة مبنية لسوق العمل العربي: نتائج جاهزة للنشر، تحكم دقيق، وسجل محفوظ لكل ما تنتجه.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t, i) => {
            const meta = TOOL_META[t.to];
            const Icon = meta?.icon ?? Sparkles;
            return (
              <Link
                key={t.to}
                to={t.to}
                data-reveal
                data-reveal-delay={i * 70}
                className="reveal group relative overflow-hidden rounded-3xl glass p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-float"
              >
                <span className="pointer-events-none absolute -end-16 -top-16 size-40 rounded-full bg-cine opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30" />
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-cine text-primary-foreground shadow-glow">
                    <Icon className="size-5" />
                  </span>
                  {meta && (
                    <span className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground">
                      {meta.tag}
                    </span>
                  )}
                </div>
                <h3 className="mt-5 text-lg font-bold">{t.label}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{t.desc}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm text-primary">
                  افتح الأداة
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ================= EXPERIENCE ================= */}
      <section className="relative isolate overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-aurora opacity-40 animate-drift" />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <div className="reveal" data-reveal>
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              تجربة <span className="text-cine">من المستقبل</span>، بلا تعقيد
            </h2>
            <ul className="mt-8 space-y-5">
              {[
                {
                  icon: Zap,
                  title: "سرعة فورية",
                  body: "الإجابة تُبنى أمامك حرفًا بحرف، مع إمكانية الإيقاف وإعادة التوليد.",
                },
                {
                  icon: BadgeCheck,
                  title: "جودة احترافية",
                  body: "أطر إعلانية، أنماط بصرية، وتحكم كامل في النبرة والجمهور والأبعاد.",
                },
                {
                  icon: ShieldCheck,
                  title: "خصوصية وأمان",
                  body: "حسابك محمي، وسجلّك خاص بك وحدك، ودفع آمن عبر Paddle.",
                },
              ].map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl glass">
                    <f.icon className="size-5 text-primary" />
                  </span>
                  <div>
                    <h3 className="font-bold">{f.title}</h3>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Mock interface */}
          <div className="reveal animate-floaty" data-reveal data-reveal-delay="120">
            <div className="rounded-3xl glass p-4 shadow-float">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <span className="size-2.5 rounded-full bg-primary/80" />
                <span className="size-2.5 rounded-full bg-accent/70" />
                <span className="size-2.5 rounded-full bg-muted" />
                <span className="ms-auto text-[11px] text-muted-foreground">منصة الذكاء</span>
              </div>
              <div className="space-y-3 pt-4">
                <div className="ms-auto w-fit max-w-[80%] rounded-2xl rounded-se-sm bg-secondary/70 px-4 py-2.5 text-sm">
                  اكتب لي إعلان قصير لعرض تموين رمضان
                </div>
                <div className="w-fit max-w-[88%] rounded-2xl rounded-ss-sm bg-card/80 px-4 py-3 text-sm leading-7">
                  عرض رمضان من مؤسسة التموين العالي: سلة كاملة بأسعار الجملة، توصيل خلال ٢٤ ساعة،
                  والكمية محدودة…
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {["نسخة أطول", "نبرة رسمية", "صيغة إنستقرام"].map((c) => (
                    <span
                      key={c}
                      className="rounded-xl border border-border/70 bg-card/40 px-2 py-2 text-center text-[11px] text-muted-foreground"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-24">
        <div
          className="reveal relative overflow-hidden rounded-[2rem] glass px-6 py-14 text-center shadow-float"
          data-reveal
        >
          <span className="pointer-events-none absolute inset-0 -z-10 bg-aurora opacity-50" />
          <h2 className="text-3xl font-extrabold sm:text-5xl">
            <span className="text-shine">ابدأ شهرك المجاني الآن</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            وصول كامل لجميع الأدوات لمدة ٣٠ يومًا، ثم ٦ دولار شهريًا فقط — وتلغي متى شئت.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/pricing">
              <Button size="lg" className="bg-cine text-primary-foreground shadow-glow">
                <Gift className="size-4" /> فعّل الشهر المجاني
              </Button>
            </Link>
            <Link to="/chat">
              <Button size="lg" variant="outline">
                جرّب المساعد أولًا
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        مؤسسة التموين العالي للتجارة — منصة أدوات الذكاء الاصطناعي
      </footer>
    </div>
  );
}
