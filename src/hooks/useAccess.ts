import { useEffect, useState } from "react";
import { getAccessStatus, type AccessStatus } from "@/lib/access.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import { useAuth } from "@/hooks/useAuth";

export function useAccess() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);
    getAccessStatus({ data: { userId: user?.id ?? null, environment: getPaddleEnvironment() } })
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  return { status, loading: loading || authLoading };
}
