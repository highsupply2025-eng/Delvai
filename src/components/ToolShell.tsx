import { Link } from "@tanstack/react-router";

import delvaiMarkAsset from "@/assets/uniai-mark.png.asset.json";

const delvaiMark = delvaiMarkAsset.url;
import type { ReactNode } from "react";
import { LogIn, LogOut, History, CreditCard, Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/lib/i18n";
import { AccessGate } from "@/components/AccessGate";

function DelvaiLogo({ className }: { className?: string }) {
  return <img src={delvaiMark} alt="Delvai" className={className} loading="eager" />;
}

export const TOOLS = [
  { to: "/chat", label: "المساعد الذكي", desc: "دردشة ذكية للإجابة والتحليل وحل المهام اليومية." },
  { to: "/image", label: "توليد وتحرير الصور", desc: "صور تسويقية وشعارات، أو تعديل صورة موجودة بالوصف." },
  { to: "/write", label: "كتابة المحتوى والإعلانات", desc: "منشورات، أوصاف منتجات، إيميلات ونصوص إعلانية." },
  { to: "/video", label: "الفيديو السينمائي", desc: "حوّل وصف المشهد إلى فيديو قصير بالحركة والصوت." },
  { to: "/voice", label: "الصوت والنص", desc: "تفريغ الصوت إلى نص، وتحويل النص إلى صوت عربي." },
  { to: "/docs", label: "تحليل المستندات", desc: "تلخيص التقارير واستخراج البيانات والأسئلة والأجوبة." },
] as const;

export function ToolShell({
  title,
  subtitle,
  gated = true,
  children,
}: {
  title: string;
  subtitle?: string;
  gated?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stage">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            <span className="text-cine">{title}</span>
          </h1>
          {subtitle && <p className="mt-3 max-w-2xl text-muted-foreground">{subtitle}</p>}
        </header>
        {gated ? <AccessGate>{children}</AccessGate> : children}
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Delvai — منصة أدوات الذكاء الاصطناعي
      </footer>
    </div>
  );
}

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();
  const { lang, toggle } = useLang();

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-5 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold" data-no-translate>
          <DelvaiLogo className="size-7 drop-shadow-[0_0_12px_oklch(0.82_0.14_82/0.5)]" />
          <span className="text-cine text-lg tracking-tight">Delvai</span>
        </Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {TOOLS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              activeProps={{ className: "bg-card text-primary" }}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            data-no-translate
            aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          >
            <Languages className="size-4" /> {lang === "ar" ? "EN" : "ع"}
          </Button>
          <Link to="/pricing">
            <Button variant="ghost" size="sm">
              <CreditCard className="size-4" /> الاشتراك
            </Button>
          </Link>
          {!loading && user ? (
            <>
              <Link to="/history">
                <Button variant="ghost" size="sm">
                  <History className="size-4" /> سجلّي
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => void signOut()}>
                <LogOut className="size-4" /> خروج
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-cine text-primary-foreground">
                <LogIn className="size-4" /> دخول
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
