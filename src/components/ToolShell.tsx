import { Link } from "@tanstack/react-router";

import delvaiMarkAsset from "@/assets/uniai-mark.png.asset.json";

const delvaiMark = delvaiMarkAsset.url;
import type { ReactNode } from "react";
import { LogIn, LogOut, History, CreditCard, Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES, useLang } from "@/lib/i18n";
import { AccessGate } from "@/components/AccessGate";
import { SiteFooter } from "@/components/SiteFooter";
import { DelvaiLogo } from "@/components/DelvaiThinkingLoader";

export const TOOLS = [
  { to: "/chat", label: "دلفاي برايم", desc: "المساعد الذكي الخارق للإجابة والتحليل وحل أعقد المسائل بلحظات." },
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
    <div className="min-h-screen bg-stage flex flex-col justify-between">
      <div>
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
      </div>
      <SiteFooter />
    </div>
  );
}

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();
  const { lang, setLang, toggle } = useLang();

  return (
    <div className="sticky top-0 z-30">
      {/* ambient aurora glow behind the bar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-16 h-40 bg-aurora opacity-[0.18] blur-2xl"
      />
      <div className="relative border-b border-[var(--glass-border)] bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-2.5">
          <Link
            to="/"
            className="group flex items-center gap-2 font-bold"
            data-no-translate
          >
            <DelvaiLogo className="size-8 transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_12px_oklch(0.82_0.14_82/0.55)]" />
            <span className="text-shine text-lg font-extrabold tracking-tight">Delvai</span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
            {TOOLS.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className="group relative rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-all duration-300 hover:text-foreground"
                activeProps={{ className: "text-primary" }}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-transparent bg-transparent transition-all duration-300 group-hover:border-[var(--glass-border)] group-hover:bg-card/60 group-hover:shadow-[0_0_24px_-10px_oklch(0.82_0.14_82/0.7)]"
                />
                <span className="relative">{t.label}</span>
                <span
                  aria-hidden
                  className="absolute inset-x-3 -bottom-0.5 h-px scale-x-0 bg-cine opacity-0 transition-all duration-300 group-hover:scale-x-100 group-hover:opacity-100"
                />
              </Link>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  data-no-translate
                  className="rounded-full glass gap-1.5 px-3"
                  aria-label="Select Language"
                >
                  <Languages className="size-4 text-primary" />
                  <span className="font-semibold text-xs">
                    {SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.nativeName ?? "English"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border-border/80 min-w-[11.5rem] p-1.5 shadow-float z-50">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onSelect={() => setLang(l.code)}
                    onClick={() => setLang(l.code)}
                    data-no-translate
                    className={`flex items-center justify-between gap-3 text-xs cursor-pointer rounded-lg px-2.5 py-1.5 my-0.5 transition-colors ${
                      lang === l.code ? "bg-primary text-primary-foreground font-bold" : "text-foreground hover:bg-primary/10"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold rounded bg-muted/60 px-1.5 py-0.5 text-foreground/80">
                        {l.code.toUpperCase()}
                      </span>
                      <span className="font-medium">{l.nativeName}</span>
                    </span>
                    <span className="text-[10px] opacity-70">{l.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/pricing" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="rounded-full">
                <CreditCard className="size-4" /> الاشتراك
              </Button>
            </Link>
            {!loading && user ? (
              <>
                <Link to="/history">
                  <Button variant="ghost" size="sm" className="rounded-full">
                    <History className="size-4" /> سجلّي
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => void signOut()}
                >
                  <LogOut className="size-4" /> خروج
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button
                  size="sm"
                  className="rounded-full bg-cine text-primary-foreground shadow-glow transition-transform duration-300 hover:scale-105"
                >
                  <LogIn className="size-4" /> دخول
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
