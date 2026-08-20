import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LogIn, LogOut, History, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

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
  children,
}: {
  title: string;
  subtitle?: string;
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
        {children}
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        مؤسسة التموين العالي للتجارة — منصة أدوات الذكاء الاصطناعي
      </footer>
    </div>
  );
}

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-5 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <Sparkles className="size-4 text-primary" />
          <span className="text-cine">منصة الذكاء</span>
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
