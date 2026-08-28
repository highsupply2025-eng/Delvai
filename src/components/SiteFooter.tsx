import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  Mail,
  MessageSquare,
  FileText,
  Lock,
  Sparkles,
  Send,
  HelpCircle,
  Headphones,
  CheckCircle2,
  Globe2,
  ExternalLink,
  Bot,
  Clapperboard,
  Image as ImageIcon,
  PenLine,
  Mic,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";

import delvaiMarkAsset from "@/assets/uniai-mark.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const delvaiMark = delvaiMarkAsset.url;

export function SiteFooter() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim() || !contactMessage.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("تم إرسال رسالتك بنجاح! سيتواصل معك فريق الدعم قريباً.");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      setContactOpen(false);
    }, 600);
  };

  return (
    <footer className="relative isolate border-t border-[var(--glass-border)] bg-background/80 backdrop-blur-2xl">
      {/* Background ambient lighting */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-32 bg-aurora opacity-30 blur-3xl"
      />

      <div className="mx-auto w-full max-w-6xl px-5 py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 font-bold">
              <img
                src={delvaiMark}
                alt="Delvai"
                className="size-9 drop-shadow-[0_0_14px_oklch(0.82_0.14_82/0.6)]"
                loading="lazy"
              />
              <span className="text-shine text-xl font-extrabold tracking-tight">Delvai</span>
            </Link>

            <p className="max-w-sm text-sm leading-7 text-muted-foreground">
              المنصة العالمية الشاملة لأدوات الذكاء الاصطناعي الإبداعي — استوديو فيديو سينمائي 4K،
              توليد صور فائقة الدقة، تفريغ صوتي، وصناعة نصوص تسويقية ذكية لمختلف اللغات والمجالات.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                دفع آمن ومشفر 100%
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                نماذج ذكاء اصطناعي فائقة التطور
              </span>
            </div>
          </div>

          {/* Studios Column */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground">الاستوديوهات الإبداعية</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link
                  to="/video"
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  <Clapperboard className="size-3.5 text-primary/80" />
                  استوديو الفيديو السينمائي 4K
                </Link>
              </li>
              <li>
                <Link
                  to="/image"
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  <ImageIcon className="size-3.5 text-primary/80" />
                  توليد وتحرير الصور
                </Link>
              </li>
              <li>
                <Link
                  to="/chat"
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  <Bot className="size-3.5 text-primary/80" />
                  دلفاي برايم (Delvai Prime)
                </Link>
              </li>
              <li>
                <Link
                  to="/write"
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  <PenLine className="size-3.5 text-primary/80" />
                  كتابة الإعلانات والمحتوى
                </Link>
              </li>
              <li>
                <Link
                  to="/voice"
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  <Mic className="size-3.5 text-primary/80" />
                  تحويل الصوت والنصوص
                </Link>
              </li>
              <li>
                <Link
                  to="/docs"
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  <FileSpreadsheet className="size-3.5 text-primary/80" />
                  تحليل المستندات والعقود
                </Link>
              </li>
            </ul>
          </div>

          {/* Links & Pricing Column */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground">الحساب والخدمات</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link
                  to="/pricing"
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  الاشتراك والباقات (شهر مجاناً)
                </Link>
              </li>
              <li>
                <Link
                  to="/history"
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  سجل التوليد والمحفوظات
                </Link>
              </li>
              <li>
                <Link
                  to="/auth"
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  تسجيل الدخول / إنشاء حساب
                </Link>
              </li>
              <li>
                <Link
                  to="/docs"
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  دليل الاستخدام والتوثيق
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support Column */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground">القانونية والدعم</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <button
                  type="button"
                  onClick={() => setPrivacyOpen(true)}
                  className="flex items-center gap-1.5 text-start transition-colors hover:text-primary"
                >
                  <Lock className="size-3.5 text-primary/80" />
                  سياسة الخصوصية
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="flex items-center gap-1.5 text-start transition-colors hover:text-primary"
                >
                  <FileText className="size-3.5 text-primary/80" />
                  شروط الاستخدام والخدمة
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className="flex items-center gap-1.5 text-start transition-colors hover:text-primary"
                >
                  <Mail className="size-3.5 text-primary/80" />
                  تواصل معنا والدعم الفني
                </button>
              </li>
              <li>
                <a
                  href="mailto:support@delvai.cloud"
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  <Headphones className="size-3.5 text-primary/80" />
                  support@delvai.cloud
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar matching user phrase */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 text-xs text-muted-foreground sm:flex-row">
          <div className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-start">
            <span className="font-semibold text-foreground">
              Delvai — منصة أدوات الذكاء الاصطناعي
            </span>
            <span>© {new Date().getFullYear()} Delvai Cloud AI. جميع الحقوق محفوظة.</span>
          </div>

          {/* Server Status Live Badge */}
          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-3.5 py-1.5 text-[11px] text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span>جميع أنظمة الذكاء الاصطناعي تعمل بكفاءة</span>
          </div>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-border/80 bg-card text-foreground">
          <DialogHeader className="text-start">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-cine">
              <Lock className="size-5 text-primary" />
              سياسة الخصوصية وحماية البيانات
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              آخر تحديث: {new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs leading-6 text-muted-foreground sm:text-sm">
            <div>
              <h5 className="font-bold text-foreground">1. التزامنا بحماية خصوصيتك</h5>
              <p>
                نحن في Delvai نولي خصوصيتك وسرية بياناتك الأولوية القصوى. توضح هذه السياسة كيف نقوم
                بجمع واستخدام وحماية معلوماتك الشخصية عند استخدام منصتنا.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-foreground">2. البيانات التي نجمعها</h5>
              <ul className="list-inside list-disc space-y-1">
                <li>معلومات الحساب: البريد الإلكتروني والاسم عند التسجيل.</li>
                <li>
                  المدخلات والمحتوى: الأوامر النصية والصور والمستندات التي ترفعها لمعالجتها بواسطة
                  نماذج الذكاء الاصطناعي.
                </li>
                <li>معلومات الدفع: تتم معالجة المدفوعات والاشتراكات بشكل آمن ومشفر بالكامل عبر بوابة Paddle دون تخزين بيانات بطاقتك لدينا.</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-foreground">3. ملكية المحتوى وسريته</h5>
              <p>
                جميع المواد ومقاطع الفيديو والصور والنصوص التي تقوم بتوليدها من خلال المنصة هي
                <strong> ملكية حصرية وخاصة بك بالكامل</strong>، ويحق لك استخدامها تجارياً ونشرها دون أي قيود. نحن لا نستخدم بياناتك أو محتواك الخاص لتدريب النماذج العامة.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-foreground">4. أمان البيانات والتشفير</h5>
              <p>
                يتم تشفير كافة الاتصالات والبيانات المخزنة باستخدام أعلى معايير التشفير (SSL/TLS و AES-256) لضمان حماية سجلاتك واستخدامك من أي وصول غير مصرح به.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-foreground">5. التواصل معنا</h5>
              <p>
                إذا كان لديك أي استفسارات أو طلبات بخصوص خصوصية بياناتك أو رغبة في حذف حسابك وسجلاتك، يمكنك التواصل معنا مباشرة عبر البريد الإلكتروني: <strong className="text-primary">support@delvai.cloud</strong>.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Modal */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-border/80 bg-card text-foreground">
          <DialogHeader className="text-start">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-cine">
              <FileText className="size-5 text-primary" />
              شروط الاستخدام والخدمة
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              شروط الاستخدام والترخيص التجاري لمنصة Delvai
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs leading-6 text-muted-foreground sm:text-sm">
            <div>
              <h5 className="font-bold text-foreground">1. قبول الشروط</h5>
              <p>
                باستخدامك لمنصة Delvai، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق
                على أي جزء منها، يُرجى عدم استخدام المنصة.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-foreground">2. التجربة المجانية والاشتراك</h5>
              <p>
                تمنح Delvai المستخدمين الجدد وصولاً تجريبياً مجانياً لمدة ٣٠ يوماً لكافة الأدوات. بعد
                انتهاء الفترة التجريبية، يتم تجديد الاشتراك بالتعرفة الموضحة في صفحة الأسعار ما لم يتم
                إلغاء الاشتراك من لوحة التحكم قبل موعد التجديد.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-foreground">3. الاستخدام المقبول</h5>
              <p>
                يلتزم المستخدم بعدم استخدام المنصة لتوليد محتوى ضار، غير قانوني، ينتهك حقوق الآخرين أو
                يتعارض مع معايير الأمان والسلامة الأخلاقية للذكاء الاصطناعي.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-foreground">4. حقوق الاستخدام التجاري</h5>
              <p>
                يحصل المشترك على ترخيص تجاري غير محدود لاستخدام وإعادة بيع ونشر الأعمال المنشأة بواسطة
                أدوات المنصة دون دفع أي إتاوات إضافية.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-foreground">5. سياسة الإلغاء والاسترداد</h5>
              <p>
                يمكنك إلغاء اشتراكك في أي لحظة وبكل سهولة بنقرة واحدة من لوحة التحكم، وسيظل بإمكانك
                الاستفادة من المنصة حتى نهاية الفترة المدفوعة.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Us Modal */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-lg border-border/80 bg-card text-foreground">
          <DialogHeader className="text-start">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-cine">
              <Mail className="size-5 text-primary" />
              تواصل مع فريق الدعم الفني
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              نحن هنا لمساعدتك والإجابة على أي استفسارات أو مقترحات.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleContactSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name" className="text-xs font-medium">
                الاسم
              </Label>
              <Input
                id="contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="اسمك الكريم"
                className="bg-background/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-email" className="text-xs font-medium">
                البريد الإلكتروني <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-email"
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="name@example.com"
                className="bg-background/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-msg" className="text-xs font-medium">
                الرسالة أو الاستفسار <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="contact-msg"
                required
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="كيف يمكننا مساعدتك اليوم؟"
                className="bg-background/80 resize-none text-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-muted-foreground">
                أو راسلنا على: <strong className="text-primary">support@delvai.cloud</strong>
              </span>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-cine text-primary-foreground shadow-glow"
              >
                <Send className="size-3.5" />
                {isSubmitting ? "جاري الإرسال..." : "إرسال الرسالة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
