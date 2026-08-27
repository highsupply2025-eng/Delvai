import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  CheckCircle2,
  Clapperboard,
  Compass,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Gift,
  Globe2,
  Headphones,
  Image as ImageIcon,
  Layers,
  Lock,
  Mic,
  PenLine,
  Play,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Volume2,
  Wand2,
  X,
  Zap,
  HelpCircle,
} from "lucide-react";
import { useState, type ComponentType } from "react";

import { SiteHeader, TOOLS } from "@/components/ToolShell";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useReveal } from "@/hooks/useReveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Delvai — كل أدوات الذكاء الاصطناعي في منصة واحدة" },
      {
        name: "description",
        content:
          "منصة عربية واحدة تجمع أقوى أدوات الذكاء الاصطناعي: استوديو فيديو سينمائي 4K، توليد صور، كتابة إعلانات، صوت ونصوص، وتحليل مستندات. شهر أول مجاني.",
      },
      { property: "og:title", content: "Delvai — كل أدوات الذكاء الاصطناعي في منصة واحدة" },
      {
        property: "og:description",
        content:
          "ستة استوديوهات ذكاء اصطناعي في مكان واحد، بتصميم عربي مستقبلي وسريع. ابدأ شهرك المجاني الآن.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const TOOL_META: Record<
  string,
  { icon: ComponentType<{ className?: string }>; tag: string; highlight: string }
> = {
  "/video": { icon: Clapperboard, tag: "فيديو سينمائي 4K", highlight: "فيديو سينمائي مع حركة كاميرا وصوت متزامن" },
  "/image": { icon: ImageIcon, tag: "استوديو الصور", highlight: "صور فائقة الواقعية بدقة وإضاءة احترافية" },
  "/chat": { icon: Bot, tag: "المساعد الفوري", highlight: "مساعد ذكي يحلل ويفكر خطوة بخطوة بلحظات" },
  "/write": { icon: PenLine, tag: "أطر تسويقية AIDA", highlight: "صياغة إعلانات مقنعة وتدوينات ترفع المبيعات" },
  "/voice": { icon: Mic, tag: "١٠ أصوات طبيعية", highlight: "تفريغ التسجيلات وتحويل النصوص إلى صوت عربي مبهر" },
  "/docs": { icon: FileSpreadsheet, tag: "PDF · Word · Excel", highlight: "استخراج الجداول وتلخيص العقود والبيانات المعقدة" },
};

const SUGGESTIONS = [
  { text: "أنشئ مشهد فيديو سينمائي لغروب الشمس في الصحراء", tool: "/video" },
  { text: "صمّم شعاراً فاخراً لعلامة تجارية بخط عربي ذهبي", tool: "/image" },
  { text: "اكتب لي خطة حملة إعلانية كاملة لمتجر إلكتروني", tool: "/write" },
  { text: "لخّص هذا الملف واستخرج أهم خمس توصيات", tool: "/docs" },
];

const MARQUEE = [
  "فيديو سينمائي 4K",
  "تحليل فوري للمستندات",
  "بث حرفاً بحرف",
  "تفريغ صوتي عالي الدقة",
  "تعليق صوتي طبيعي",
  "توليد صور إعلانية",
  "أطر تسويقية معتمدة",
  "دفع مشفر وآمن",
  "ترخيص تجاري كامل",
  "دعم كامل للغة العربية",
];

const STATS = [
  { value: "٦", label: "استوديوهات متكاملة", note: "في اشتراك واحد" },
  { value: "٣٠", label: "يوماً تجربة مجانية", note: "وصول غير محدود" },
  { value: "4K", label: "دقة وجودة سينمائية", note: "جاهزة للنشر الفوري" },
  { value: "<١ث", label: "سرعة استجابة فائقة", note: "بدون انتظار" },
];

const FAQS = [
  {
    q: "ما الذي يميز منصة Delvai عن باقي أدوات الذكاء الاصطناعي؟",
    a: "تجمع Delvai أقوى نماذج الذكاء الاصطناعي العالمية (مثل Veo 3.1 للفيديو السينمائي و Gemini 3.7 Thinking للمحادثة والمحتوى) في منصة موحدة مخصصة كلياً للمستخدم العربي، مما يغنيك عن دفع اشتراكات متعددة تتجاوز 100$ شهرياً.",
  },
  {
    q: "كيف تعمل فترة التجربة المجانية لمدة ٣٠ يوماً؟",
    a: "تحصل فور تسجيلك على شهر كامل مجاناً مع وصول شامل لكافة الاستوديوهات والأدوات. يمكنك تجربة كل الميزات وإنتاج محتواك بحرية تامة، وبعد انتهاء الشهر يكون الاشتراك بـ 6$ فقط شهرياً مع إمكانية الإلغاء في أي وقت بنقرة واحدة.",
  },
  {
    q: "هل المحتوى الناتج من فيديوهات وصور ونصوص ملكي تجارياً؟",
    a: "نعم 100%. جميع المواد المنتجة من خلال المنصة مملوكة لك بالكامل وتمنحك ترخيصاً تجارياً شاملاً لاستخدامها في إعلاناتك، أعمالك، ومشاريع عملائك دون أي قيود أو حقوق ملكية لطرف ثالث.",
  },
  {
    q: "هل تدعم المنصة اللهجات العربية وتوليد الصوت الطبيعي؟",
    a: "نعم، تم تدريب واجهات وأدوات المنصة على فهم مختلف اللهجات العربية والسياق الثقافي، مع توفير أكثر من 10 خامات صوتية طبيعية عربية للتسجيل والتعليق الصوتي.",
  },
  {
    q: "هل بياناتي ومستنداتي آمنة ومحمية؟",
    a: "نعم، نحن نطبق أعلى معايير التشفير (SSL/TLS و AES-256). ملفاتك وسجلاتك ومستنداتك خاصة بك وحدك ولا يتم استخدامها لتدريب النماذج العامة أو مشاركتها مع أي جهة.",
  },
];

function Home() {
  useReveal();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<"video" | "image" | "chat" | "voice" | "docs">("video");

  const go = (text?: string, targetTool?: string) => {
    const value = (text ?? prompt).trim();
    const dest = targetTool ?? "/chat";
    void navigate({ to: dest, search: value ? { q: value } : {} });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-stage text-foreground flex flex-col justify-between">
      <div>
        <SiteHeader />

        {/* ================= HERO SECTION ================= */}
        <section className="relative isolate overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-aurora opacity-75 animate-drift" />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-grid" />
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-cine opacity-70" />

          <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-16 sm:pt-24">
            <div className="reveal flex justify-center" data-reveal>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-card/60 px-4 py-1.5 text-xs text-muted-foreground shadow-[0_0_20px_oklch(0.82_0.14_82/0.2)] backdrop-blur-md">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                <span>الجيل القادم من الذكاء الاصطناعي الإبداعي</span>
              </div>
            </div>

            <h1
              className="reveal mt-8 text-center text-4xl font-black leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl"
              data-reveal
              data-reveal-delay="70"
            >
              <span className="text-shine">ذكاء اصطناعي</span>
              <br />
              <span className="text-cine">يعمل بلغتك، وبسرعة الخيال</span>
            </h1>

            <p
              className="reveal mx-auto mt-6 max-w-2xl text-center text-base leading-8 text-muted-foreground sm:text-lg"
              data-reveal
              data-reveal-delay="140"
            >
              منصة عربية مستقبلية توفر ستة استوديوهات متطورة: فيديو سينمائي بدقة 4K، توليد صور إعلانية،
              كتابة محتوى، صوت طبيعي، وتحليل عقود ومستندات — كل ما تحتاجه في مكان واحد.
            </p>

            <div
              className="reveal mx-auto mt-10 max-w-3xl"
              data-reveal
              data-reveal-delay="200"
            >
              <div className="relative rounded-3xl glass p-2.5 shadow-float ring-glow transition-all duration-300 hover:border-primary/40">
                <div className="pointer-events-none absolute inset-y-4 start-0 w-px overflow-hidden">
                  <span className="block h-1/3 w-px bg-cine animate-beam" />
                </div>
                <div className="flex flex-col gap-2 p-2 sm:flex-row sm:items-end">
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
                    placeholder="اكتب فكرتك أو مشروعك بالعربية… مثال: أنشئ مشهداً سينمائياً لمدينة مستقبلية ليلية"
                    className="min-h-16 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60 sm:text-base"
                    aria-label="اكتب طلبك"
                  />
                  <Button
                    onClick={() => go()}
                    size="lg"
                    className="shrink-0 bg-cine text-primary-foreground shadow-glow transition-all hover:scale-105"
                  >
                    <Send className="size-4" />
                    ابدأ التوليد
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border/40 px-3 pb-2 pt-3">
                  <span className="text-[11px] font-medium text-muted-foreground/80 self-center">
                    أفكار جاهزة:
                  </span>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.text}
                      type="button"
                      onClick={() => go(s.text, s.tool)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:text-foreground"
                    >
                      <Sparkles className="size-3 text-primary/80" />
                      {s.text}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link to="/pricing">
                  <Button size="lg" className="bg-cine text-primary-foreground shadow-glow font-bold px-8">
                    <Gift className="size-4" /> ابدأ شهرك المجاني الآن
                  </Button>
                </Link>
                <Link to="/video">
                  <Button size="lg" variant="outline" className="border-primary/40 hover:bg-card/70">
                    <Play className="size-4 text-primary" /> تجربة استوديو الفيديو
                  </Button>
                </Link>
              </div>
            </div>

            <dl className="reveal mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4" data-reveal>
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="group relative overflow-hidden rounded-2xl glass p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/50"
                >
                  <dt className="text-3xl font-black text-cine sm:text-4xl">{s.value}</dt>
                  <dd className="mt-2 text-xs font-semibold text-foreground">{s.label}</dd>
                  <dd className="mt-1 text-[11px] text-muted-foreground">{s.note}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ================= MARQUEE TICKER ================= */}
        <div className="relative overflow-hidden border-y border-border/60 bg-background/50 py-4 backdrop-blur-md">
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span
                key={`${m}-${i}`}
                className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground"
              >
                <Zap className="size-3.5 text-primary" />
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* ================= INTERACTIVE SHOWCASE SECTION ================= */}
        <section className="mx-auto w-full max-w-6xl px-5 py-24">
          <div className="reveal text-center max-w-3xl mx-auto" data-reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              استعراض حي للقدرات
            </span>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-5xl">
              شاهد قوة <span className="text-cine">Delvai</span> في العمل
            </h2>
            <p className="mt-4 text-muted-foreground text-sm sm:text-base">
              اختر أحد الاستوديوهات لتشاهد كيف تتحول الكلمات والأفكار إلى إنتاج واقعي واحترافي.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {[
                { id: "video", label: "استوديو الفيديو", icon: Clapperboard },
                { id: "image", label: "توليد الصور", icon: ImageIcon },
                { id: "chat", label: "المساعد الفوري", icon: Bot },
                { id: "voice", label: "الصوتيات", icon: Mic },
                { id: "docs", label: "المستندات", icon: FileSpreadsheet },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      active
                        ? "bg-cine text-primary-foreground shadow-glow"
                        : "glass text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="reveal mt-12 rounded-3xl glass p-4 sm:p-8 shadow-float ring-glow border-primary/30" data-reveal>
            {activeTab === "video" && (
              <div className="grid gap-8 lg:grid-cols-2 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-xs text-primary font-bold">
                    <Clapperboard className="size-3.5" />
                    محرك Veo 3.1 السينمائي
                  </div>
                  <h3 className="text-2xl font-black">تحويل النص إلى فيديو فائق الواقعية</h3>
                  <p className="text-sm leading-7 text-muted-foreground">
                    أنشئ مشاهد إعلانية، لقطات سينمائية، أو مقاطع لشبكات التواصل مع تحكم كامل بزوايا الكاميرا ومؤثرات صوتية متزامنة بجودة تصل إلى 4K.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-xl border border-border/80 bg-card/60 p-3">
                      <div className="text-xs font-bold text-foreground">حركة الكاميرا</div>
                      <div className="text-[11px] text-muted-foreground mt-1">زووم، تتبع، دوران، وتصوير جوي</div>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-card/60 p-3">
                      <div className="text-xs font-bold text-foreground">صوت متزامن</div>
                      <div className="text-[11px] text-muted-foreground mt-1">توليد مؤثرات صوتية تلقائية</div>
                    </div>
                  </div>
                  <Link to="/video" className="inline-block pt-2">
                    <Button className="bg-cine text-primary-foreground shadow-glow">
                      فتح استوديو الفيديو الآن <ArrowLeft className="size-4" />
                    </Button>
                  </Link>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-black/70 aspect-video flex flex-col justify-between p-4 group">
                  <div className="flex items-center justify-between z-10">
                    <span className="rounded-md bg-black/60 px-2.5 py-1 text-[11px] font-mono text-primary border border-primary/30">
                      REC · 4K 60FPS
                    </span>
                    <span className="rounded-md bg-black/60 px-2.5 py-1 text-[11px] text-muted-foreground">
                      Veo 3.1 Fast
                    </span>
                  </div>
                  <div className="my-auto text-center space-y-2 z-10">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/50 group-hover:scale-110 transition-transform">
                      <Play className="size-6 fill-primary" />
                    </div>
                    <p className="text-xs text-foreground/90 font-medium max-w-xs mx-auto">
                      "لقطة سينمائية بطيئة لخيول عربية تركض وقت الغروب، إضاءة ذهبية وغبار متطاير"
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground z-10">
                    <span>نسبة العرض: 16:9</span>
                    <span>جاهز للتصدير</span>
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>
              </div>
            )}

            {activeTab === "image" && (
              <div className="grid gap-8 lg:grid-cols-2 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-xs text-primary font-bold">
                    <ImageIcon className="size-3.5" />
                    استوديو الصور الفائق
                  </div>
                  <h3 className="text-2xl font-black">تصاميم وشعارات وصور منتجات مذهلة</h3>
                  <p className="text-sm leading-7 text-muted-foreground">
                    توليد وتعديل الصور بدقة فائقة مع إمكانية استخدام صور مرجعية، تغيير الخلفيات، وتحديد الأنماط الفنية المناسبة لعلامتك التجارية.
                  </p>
                  <Link to="/image" className="inline-block pt-2">
                    <Button className="bg-cine text-primary-foreground shadow-glow">
                      تجربة استوديو الصور <ArrowLeft className="size-4" />
                    </Button>
                  </Link>
                </div>
                <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-3">
                  <div className="text-xs text-muted-foreground font-mono">الأمر: "صورة إعلانية فاخرة لعطر عربي على قاعدة رخامية سوداء، إضاءة درامية ناعمة"</div>
                  <div className="rounded-xl border border-border/80 bg-background/80 p-6 text-center text-xs text-muted-foreground space-y-2">
                    <Sparkles className="size-8 text-primary mx-auto" />
                    <div className="text-foreground font-bold">تم إنتاج الصورة بدقة فائقة 2048x2048</div>
                    <div className="text-[11px] text-muted-foreground">ألوان مشبعة، تدرجات حقيقية، وتحكم في الإضاءة</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "chat" && (
              <div className="grid gap-8 lg:grid-cols-2 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-xs text-primary font-bold">
                    <Bot className="size-3.5" />
                    Gemini 3.7 Thinking
                  </div>
                  <h3 className="text-2xl font-black">مساعد ذكي يعالج أعقد المسائل بلحظات</h3>
                  <p className="text-sm leading-7 text-muted-foreground">
                    دردشة ذكية تبث الإجابات حرفاً بحرف، قادرة على كتابة الأكواد، تحليل البيانات، وتقديم استشارات تسويقية وتقنية موثوقة.
                  </p>
                  <Link to="/chat" className="inline-block pt-2">
                    <Button className="bg-cine text-primary-foreground shadow-glow">
                      بدء المحادثة الآن <ArrowLeft className="size-4" />
                    </Button>
                  </Link>
                </div>
                <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-3 font-sans text-xs">
                  <div className="ms-auto w-fit max-w-[85%] rounded-xl bg-secondary/80 px-3.5 py-2">
                    كيف أصيغ عرضاً تسويقياً لا يُرفض لمتجري؟
                  </div>
                  <div className="w-fit max-w-[90%] rounded-xl bg-card/90 border border-border/70 px-3.5 py-2.5 leading-6 text-foreground">
                    ✨ <strong>إليك استراتيجية العرض المغري:</strong>
                    <br />1. حدد النتيجة الحلمية للعميل.
                    <br />2. قدّم ضماناً قوياً (استرجاع مجاني خلال 14 يوماً).
                    <br />3. قلل المجهود والوقت المطلوب من العميل…
                  </div>
                </div>
              </div>
            )}

            {activeTab === "voice" && (
              <div className="grid gap-8 lg:grid-cols-2 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-xs text-primary font-bold">
                    <Mic className="size-3.5" />
                    استوديو الصوتيات الذكي
                  </div>
                  <h3 className="text-2xl font-black">تفريغ التسجيلات وتحويل النصوص إلى صوت طبيعي</h3>
                  <p className="text-sm leading-7 text-muted-foreground">
                    حوّل المقالات والنصوص الإعلانية إلى تسجيلات صوتية بخامات عربية بشرية طبيعية، أو فرّغ التسجيلات والاجتماعات بنقرة واحدة.
                  </p>
                  <Link to="/voice" className="inline-block pt-2">
                    <Button className="bg-cine text-primary-foreground shadow-glow">
                      فتح استوديو الصوت <ArrowLeft className="size-4" />
                    </Button>
                  </Link>
                </div>
                <div className="rounded-2xl border border-border/80 bg-card/60 p-6 text-center space-y-4">
                  <div className="flex items-center justify-center gap-1.5 h-12">
                    {[40, 65, 85, 30, 95, 60, 80, 45, 90, 70, 50, 85, 40].map((h, idx) => (
                      <span
                        key={idx}
                        className="w-1.5 bg-primary/80 rounded-full animate-pulse"
                        style={{ height: `${h}%`, animationDelay: `${idx * 80}ms` }}
                      />
                    ))}
                  </div>
                  <div className="text-xs font-semibold text-foreground">خامات صوتية احترافية: نبرة وثائقية، إعلانية، وإخبارية</div>
                </div>
              </div>
            )}

            {activeTab === "docs" && (
              <div className="grid gap-8 lg:grid-cols-2 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-xs text-primary font-bold">
                    <FileSpreadsheet className="size-3.5" />
                    محلل المستندات والجداول
                  </div>
                  <h3 className="text-2xl font-black">قراءة وتحليل ملفات PDF و Word و Excel</h3>
                  <p className="text-sm leading-7 text-muted-foreground">
                    ارفع أي ملف أو عقد واستخرج منه أهم النقاط والبنود والأرقام بسرعة فائقة، مع إمكانية طرح الأسئلة مباشرة على محتوى الملف.
                  </p>
                  <Link to="/docs" className="inline-block pt-2">
                    <Button className="bg-cine text-primary-foreground shadow-glow">
                      تحليل المستندات الآن <ArrowLeft className="size-4" />
                    </Button>
                  </Link>
                </div>
                <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-3 text-xs">
                  <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                    <FileText className="size-4 text-primary" />
                    <span className="font-bold">عقد_توريد_وشراكة.pdf</span>
                    <span className="ms-auto text-[10px] text-muted-foreground">تم التحليل بنجاح</span>
                  </div>
                  <div className="text-muted-foreground leading-6">
                    • <strong>مدة العقد:</strong> ١٢ شهراً قابلة للتجديد تلقائياً.
                    <br />• <strong>شروط الدفع:</strong> خلال ٣٠ يوماً من استلام الفاتورة.
                    <br />• <strong>الشرط الجزائي:</strong> 5% في حال التأخر عن الموعد المحدد.
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================= 6 STUDIOS BENTO GRID ================= */}
        <section className="mx-auto w-full max-w-6xl px-5 py-24">
          <div className="reveal max-w-2xl" data-reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
              <Layers className="size-3.5" />
              المنظومة الكاملة
            </span>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">
              <span className="text-cine">ستة استوديوهات</span> تغنيك عن عشرات الاشتراكات
            </h2>
            <p className="mt-4 text-muted-foreground leading-7 text-sm sm:text-base">
              كل استوديو مصمم ليكون الأفضل في مجاله، بواجهات سهلة وسريعة لخدمة رواد الأعمال، المسوقين، وصناع المحتوى.
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
                  data-reveal-delay={i * 60}
                  className="reveal group relative overflow-hidden rounded-3xl glass p-7 transition-all duration-300 hover:-translate-y-2 hover:border-primary/60 hover:shadow-float"
                >
                  <span className="pointer-events-none absolute -end-16 -top-16 size-40 rounded-full bg-cine opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-35" />
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-cine text-primary-foreground shadow-glow transition-transform duration-300 group-hover:scale-110">
                      <Icon className="size-6" />
                    </span>
                    {meta && (
                      <span className="rounded-full border border-border/80 bg-card/80 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                        {meta.tag}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-foreground">{t.label}</h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">{t.desc}</p>
                  {meta?.highlight && (
                    <p className="mt-3 text-[11px] font-medium text-primary/90 border-t border-border/40 pt-3">
                      ✦ {meta.highlight}
                    </p>
                  )}
                  <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all group-hover:text-primary-foreground">
                    دخول الاستوديو
                    <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ================= 3-STEP PIPELINE ================= */}
        <section className="relative isolate overflow-hidden py-24 bg-card/30 border-y border-border/60">
          <div className="mx-auto w-full max-w-6xl px-5">
            <div className="reveal text-center max-w-2xl mx-auto" data-reveal>
              <h2 className="text-3xl font-black sm:text-4xl">
                كيف تبدأ العمل في <span className="text-cine">٣ خطوات بسيطة</span>
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                تجربة فورية وسلسة تتيح لك الانتقال من الفكرة إلى الإنتاج النهائي في ثوانٍ معدودة.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "٠١",
                  title: "اختر الاستوديو المناسب",
                  desc: "حدد نوع الإنتاج المطلوب: فيديو سينمائي، تصميم صور، كتابة إعلانية، أو صوتيات.",
                  icon: Compass,
                },
                {
                  step: "٠٢",
                  title: "صف فكرتك بالعربية",
                  desc: "اكتب وصف المشهد أو الطلب بلهجتك الطبيعية أو ارفع ملفاتك المرجعية.",
                  icon: Wand2,
                },
                {
                  step: "٠٣",
                  title: "استلم إنتاجاً سينمائياً جاهزاً",
                  desc: "حمّل عملك بأعلى دقة واستخدمه في حملاتك وأعمالك مع ترخيص تجاري كامل.",
                  icon: CheckCircle2,
                },
              ].map((item, idx) => (
                <div
                  key={item.step}
                  data-reveal
                  data-reveal-delay={idx * 80}
                  className="reveal relative rounded-3xl glass p-6 transition-all duration-300 hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold">
                      <item.icon className="size-5" />
                    </span>
                    <span className="text-2xl font-black text-muted-foreground/30">{item.step}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= VALUE COMPARISON ================= */}
        <section className="mx-auto w-full max-w-6xl px-5 py-24">
          <div className="reveal rounded-3xl glass p-8 sm:p-12 shadow-float ring-glow" data-reveal>
            <div className="text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
                <CreditCard className="size-3.5" />
                وفر أكثر من 90% من التكاليف
              </span>
              <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                لماذا تشترك في عشرات الأدوات بينما يمكنك الحصول على <span className="text-cine">Delvai</span>؟
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">الاشتراكات المنفصلة التقليدية</h3>
                  <span className="text-lg font-extrabold text-destructive font-mono">+120$/شهرياً</span>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <X className="size-4 text-destructive shrink-0" />
                    اشتراك منفصل لكل أداة (فيديو + شات + صور + صوت + مستندات)
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="size-4 text-destructive shrink-0" />
                    واجهات معقدة وغير متوافقة كلياً مع اللغة العربية
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="size-4 text-destructive shrink-0" />
                    تشتت الحسابات والفواتير والبطاقات الائتمانية
                  </li>
                </ul>
              </div>

              <div className="relative rounded-2xl border border-primary/50 bg-primary/10 p-6 space-y-4 shadow-[0_0_30px_oklch(0.82_0.14_82/0.15)]">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">منصة Delvai الموحدة</h3>
                  <span className="text-lg font-extrabold text-primary font-mono">شهر مجاناً ثم 6$ فقط</span>
                </div>
                <ul className="space-y-2.5 text-xs text-foreground/90 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    ستة استوديوهات ذكاء اصطناعي رائدة تحت حساب واحد
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    واجهة عربية سريعة ومصممة بأحدث تقنيات المستقبل
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    ٣٠ يوماً تجربة مجانية كاملة وإلغاء في أي وقت بنقرة واحدة
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FAQ SECTION ================= */}
        <section className="mx-auto w-full max-w-4xl px-5 pb-24">
          <div className="reveal text-center max-w-2xl mx-auto" data-reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
              <HelpCircle className="size-3.5" />
              إجابات مباشرة
            </span>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              الأسئلة <span className="text-cine">الشائعة</span>
            </h2>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              كل ما تود معرفته حول الاشتراك، التراخيص التجارية، والأدوات.
            </p>
          </div>

          <div className="reveal mt-10 rounded-3xl glass p-6 shadow-float" data-reveal>
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="border-border/60">
                  <AccordionTrigger className="text-start font-bold text-sm sm:text-base hover:text-primary">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm leading-7 text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ================= FINAL CTA ================= */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-24">
          <div
            className="reveal relative overflow-hidden rounded-[2.5rem] glass px-6 py-16 text-center shadow-float border-primary/40 ring-glow"
            data-reveal
          >
            <span className="pointer-events-none absolute inset-0 -z-10 bg-aurora opacity-70" />
            <h2 className="text-3xl font-black sm:text-5xl lg:text-6xl">
              <span className="text-shine">ابدأ صناعة المستقبل اليوم</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-muted-foreground leading-7">
              انضم إلى آلاف المسوقين وصناع المحتوى العرب واستفد من 30 يوماً وصولاً كاملاً مجاناً.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/pricing">
                <Button size="lg" className="bg-cine text-primary-foreground shadow-glow font-bold px-8">
                  <Gift className="size-4" /> فعّل الشهر المجاني الآن
                </Button>
              </Link>
              <Link to="/chat">
                <Button size="lg" variant="outline" className="border-primary/40">
                  تحدث مع المساعد الذكي
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
