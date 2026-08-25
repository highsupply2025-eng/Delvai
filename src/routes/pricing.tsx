import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, CreditCard, Gift, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { ToolShell, TOOLS } from "@/components/ToolShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "الاشتراك والأسعار — Delvai" },
      {
        name: "description",
        content:
          "اشترك في منصة أدوات الذكاء الاصطناعي: شهر أول مجاني ثم ٦ دولار شهريًا مع تجديد تلقائي وإمكانية الإلغاء في أي وقت.",
      },
      { property: "og:title", content: "الاشتراك والأسعار — Delvai" },
      {
        property: "og:description",
        content: "شهر مجاني كامل، ثم ٦ دولار شهريًا لوصول غير محدود لجميع أدوات الذكاء الاصطناعي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

const BENEFITS = [
  "شهر أول مجاني بالكامل — بدون خصم في البداية",
  "وصول غير محدود لجميع الأدوات الست",
  "سجلّ محفوظ لكل نتائجك",
  "تجديد تلقائي ٦ دولار شهريًا، وتلغيه متى شئت",
  "دفع آمن عبر Paddle (بطاقة، Apple Pay، PayPal)",
];

function PricingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();

  const handleSubscribe = async () => {
    if (!user) {
      toast.info("سجّل الدخول أولًا لبدء الشهر المجاني");
      void navigate({ to: "/auth" });
      return;
    }
    try {
      await openCheckout({
        priceId: "pro_monthly",
        customerEmail: user.email ?? undefined,
        customData: { userId: user.id },
        successUrl: `${window.location.origin}/?checkout=success`,
      });
    } catch {
      toast.error("تعذّر فتح صفحة الدفع، حاول مرة أخرى");
    }
  };

  return (
    <>
      <PaymentTestModeBanner />
      <ToolShell
        title="الاشتراك والأسعار"
        subtitle="خطة واحدة بسيطة تفتح لك كل أدوات المنصة. الشهر الأول مجاني، ثم يتجدد الاشتراك تلقائيًا."
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section className="rounded-2xl border border-primary/40 bg-card p-7 shadow-glow">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1 text-xs text-primary">
              <Gift className="size-3.5" /> الشهر الأول مجاني
            </div>

            <div className="mt-5 flex items-end gap-2">
              <span className="text-5xl font-extrabold text-cine">٠$</span>
              <span className="pb-2 text-muted-foreground">لأول ٣٠ يومًا</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              بعد انتهاء الشهر المجاني يتجدد الاشتراك تلقائيًا بمبلغ{" "}
              <span className="font-semibold text-foreground">٦ دولار شهريًا</span> ما لم تقم
              بالإلغاء.
            </p>

            <ul className="mt-6 space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <Button
              className="mt-7 w-full"
              size="lg"
              onClick={() => void handleSubscribe()}
              disabled={checkoutLoading || loading}
            >
              <CreditCard className="size-4" />
              {checkoutLoading ? "جارٍ فتح الدفع…" : "ابدأ الشهر المجاني عبر Paddle"}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              تُطلب بطاقة للتحقق فقط، ولن يتم أي خصم قبل انتهاء الشهر المجاني.
            </p>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <RefreshCw className="size-4 text-primary" /> كيف يعمل التجديد؟
              </h2>
              <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>
                  <span className="font-semibold text-foreground">١. اليوم:</span> تفعيل الاشتراك
                  بدون أي رسوم، ووصول فوري لكل الأدوات.
                </li>
                <li>
                  <span className="font-semibold text-foreground">٢. بعد ٣٠ يومًا:</span> يتم أول
                  خصم بقيمة ٦ دولار، ثم يتكرر شهريًا في نفس التاريخ.
                </li>
                <li>
                  <span className="font-semibold text-foreground">٣. الإلغاء:</span> يمكنك الإلغاء
                  في أي وقت، ويستمر وصولك حتى نهاية الفترة المدفوعة.
                </li>
              </ol>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <ShieldCheck className="size-4 text-primary" /> ما الذي يشمله الاشتراك؟
              </h2>
              <ul className="mt-4 grid gap-2 text-sm">
                {TOOLS.map((t) => (
                  <li key={t.to}>
                    <Link
                      to={t.to}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                    >
                      <Check className="size-3.5 text-primary" />
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </ToolShell>
    </>
  );
}
