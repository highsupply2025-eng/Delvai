import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Square, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ToolShell } from "@/components/ToolShell";

export const Route = createFileRoute("/voice")({
  head: () => ({
    meta: [
      { title: "تحويل الصوت إلى نص والنص إلى صوت" },
      {
        name: "description",
        content: "فرّغ تسجيلاتك الصوتية إلى نص عربي، وحوّل أي نص إلى صوت مسموع مباشرة من المتصفح.",
      },
      { property: "og:title", content: "أداة الصوت والنص" },
      { property: "og:description", content: "تفريغ صوتي عربي وقراءة النصوص بصوت طبيعي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VoiceTool,
});

function VoiceTool() {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speakText, setSpeakText] = useState("");
  const recognition = useRef<any>(null);

  useEffect(() => {
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.lang = "ar-SA";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) text += event.results[i][0].transcript;
      setTranscript(text);
    };
    rec.onend = () => setListening(false);
    recognition.current = rec;
    return () => rec.stop?.();
  }, []);

  const toggle = () => {
    if (!recognition.current) return;
    if (listening) {
      recognition.current.stop();
      setListening(false);
    } else {
      setTranscript("");
      recognition.current.start();
      setListening(true);
    }
  };

  const speak = () => {
    if (!speakText.trim()) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(speakText);
    utter.lang = "ar-SA";
    window.speechSynthesis.speak(utter);
  };

  return (
    <ToolShell
      title="الصوت والنص"
      subtitle="فرّغ كلامك إلى نص عربي، أو اجعل المتصفح يقرأ نصك بصوت مسموع."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
          <Label>تفريغ الصوت إلى نص</Label>
          {!supported ? (
            <p className="mt-3 rounded-xl border border-border bg-background/50 px-4 py-3 text-sm text-muted-foreground">
              متصفحك لا يدعم التعرّف على الكلام. جرّب Chrome أو Edge.
            </p>
          ) : (
            <>
              <Button
                onClick={toggle}
                className={`mt-3 w-full ${listening ? "bg-destructive" : "bg-cine"} text-primary-foreground`}
              >
                {listening ? <Square className="size-4" /> : <Mic className="size-4" />}
                {listening ? "إيقاف التسجيل" : "بدء التسجيل"}
              </Button>
              <Textarea
                rows={8}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="سيظهر النص المُفرَّغ هنا…"
                className="mt-4 resize-none bg-background/60"
              />
            </>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
          <Label htmlFor="tts">تحويل النص إلى صوت</Label>
          <Textarea
            id="tts"
            rows={8}
            value={speakText}
            onChange={(e) => setSpeakText(e.target.value)}
            placeholder="اكتب النص الذي تريد سماعه…"
            className="mt-3 resize-none bg-background/60"
          />
          <div className="mt-4 flex gap-2">
            <Button onClick={speak} disabled={!speakText.trim()} className="flex-1 bg-cine text-primary-foreground">
              <Volume2 className="size-4" /> استماع
            </Button>
            <Button variant="outline" onClick={() => window.speechSynthesis.cancel()}>
              <MicOff className="size-4" /> إيقاف
            </Button>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
