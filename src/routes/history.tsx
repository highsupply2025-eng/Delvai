import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ToolShell } from "@/components/ToolShell";
import { useAuth } from "@/hooks/useAuth";
import { deleteGeneration, listGenerations } from "@/lib/history.functions";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "سجلّي | منصة أدوات الذكاء الاصطناعي" },
      { name: "description", content: "استعرض كل ما ولّدته من نصوص وصور وفيديو داخل المنصة." },
      { property: "og:title", content: "سجلّ أعمالي" },
      { property: "og:description", content: "كل نتائجك محفوظة في مكان واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { user, loading } = useAuth();
  const list = useServerFn(listGenerations);
  const remove = useServerFn(deleteGeneration);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["history"],
    queryFn: () => list(),
    enabled: !!user,
  });

  if (!loading && !user) {
    return (
      <ToolShell gated={false} title="سجلّي" subtitle="سجّل الدخول لعرض نتائجك المحفوظة.">
        <Link to="/auth">
          <Button className="bg-cine text-primary-foreground">تسجيل الدخول</Button>
        </Link>
      </ToolShell>
    );
  }

  return (
    <ToolShell gated={false} title="سجلّي" subtitle="كل ما ولّدته عبر أدوات المنصة.">
      <div className="space-y-3">
        {(data?.items ?? []).map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-card/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                {item.tool}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleString("ar")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await remove({ data: { id: item.id } });
                    void qc.invalidateQueries({ queryKey: ["history"] });
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            {item.prompt && <p className="mt-3 text-sm text-muted-foreground">{item.prompt}</p>}
            {item.result_text && (
              <p className="mt-2 whitespace-pre-wrap text-sm">{item.result_text.slice(0, 600)}</p>
            )}
            {item.result_url && (
              <a
                href={item.result_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-primary underline"
              >
                فتح الملف الناتج
              </a>
            )}
          </div>
        ))}
        {data && data.items.length === 0 && (
          <p className="text-sm text-muted-foreground">لا توجد نتائج محفوظة بعد.</p>
        )}
      </div>
    </ToolShell>
  );
}
