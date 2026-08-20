import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteHeader, TOOLS } from "@/components/ToolShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منصة أدوات الذكاء الاصطناعي للأعمال" },
      {
        name: "description",
        content:
          "منصة عربية تجمع أدوات الذكاء الاصطناعي المطلوبة في سوق العمل: دردشة ذكية، صور، محتوى تسويقي، فيديو، صوت، وتحليل مستندات.",
      },
      { property: "og:title", content: "منصة أدوات الذكاء الاصطناعي للأعمال" },
      {
        property: "og:description",
        content: "كل أدوات الذكاء الاصطناعي التي يحتاجها عملك في مكان واحد وبالعربية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-stage">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-5 py-16">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            ستة أدوات ذكاء اصطناعي في منصة واحدة
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-6xl">
            <span className="text-cine">منصة الذكاء للأعمال</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            أدوات الذكاء الاصطناعي الأكثر طلبًا في سوق العمل — دردشة، صور، محتوى تسويقي، فيديو سينمائي،
            صوت، وتحليل مستندات — كلها بالعربية ومن مكان واحد.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/chat">
              <Button size="lg" className="bg-cine text-primary-foreground shadow-glow">
                ابدأ الآن
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                إنشاء حساب
              </Button>
            </Link>
          </div>
        </header>

        <section className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group rounded-2xl border border-border bg-card/70 p-6 backdrop-blur transition-colors hover:border-primary/50"
            >
              <h2 className="text-lg font-bold text-foreground">{t.label}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                افتح الأداة
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              </span>
            </Link>
          ))}
        </section>

        <p className="mt-14 text-center text-xs text-muted-foreground">
          مؤسسة التموين العالي للتجارة — منصة أدوات الذكاء الاصطناعي
        </p>
      </main>
    </div>
  );
}
