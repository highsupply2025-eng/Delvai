import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, Lock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/useAccess";

/** يحجب الأدوات بعد انتهاء الشهر المجاني (المرتبط بعنوان الإنترنت) ما لم يكن هناك اشتراك فعّال. */
export function AccessGate({ children }: { children: ReactNode }) {
  const { status, loading } = useAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> جارٍ التحقق من صلاحية الوصول…
      </div>
    );
  }

  if (status && !status.allowed) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-primary/40 bg-card p-8 text-center shadow-glow">
        <Lock className="mx-auto size-8 text-primary" />
        <h2 className="mt-4 text-2xl font-bold">انتهى الشهر المجاني</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          لقد استفدت من شهر مجاني كامل على هذا الاتصال. لتفعيل جميع الأدوات من جديد، اشترك بمبلغ ٦
          دولار شهريًا — ويمكنك الإلغاء في أي وقت.
        </p>
        <Link to="/pricing" className="mt-6 inline-block">
          <Button size="lg">اشترك الآن لتفعيل الخدمات</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {status?.reason === "trial" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4 text-primary" />
            الشهر المجاني فعّال — متبقٍّ {status.daysLeft} يومًا
          </span>
          <Link to="/pricing">
            <Button size="sm" variant="outline">
              فعّل الاشتراك
            </Button>
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
