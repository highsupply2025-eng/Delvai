import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Copy,
  Download,
  FileAudio,
  Languages,
  Loader2,
  Mic,
  Pause,
  Play,
  Sparkles,
  Square,
  Upload,
  Volume2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToolShell } from "@/components/ToolShell";
import { chatComplete } from "@/lib/ai.functions";
import { saveGeneration } from "@/lib/history.functions";
import { chunkText, encodeWav } from "@/lib/wav";

export const Route = createFileRoute("/voice")({
  head: () => ({
    meta: [
      { title: "استوديو الصوت — تفريغ صوتي وتعليق صوتي بالذكاء الاصطناعي" },
      {
        name: "description",
        content:
          "فرّغ التسجيلات والملفات الصوتية إلى نص عربي بدقة عالية، ولخّصها أو ترجمها، وحوّل أي نص إلى تعليق صوتي احترافي بأصوات متعددة وسرعة ونبرة قابلة للتحكم.",
      },
      { property: "og:title", content: "استوديو الصوت بالذكاء الاصطناعي" },
      {
        property: "og:description",
        content: "تفريغ صوتي دقيق، تلخيص وترجمة، وتعليق صوتي بأصوات طبيعية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VoiceStudio,
});

const LANGS = [
  { id: "auto", label: "تعرّف تلقائي" },
  { id: "ar", label: "العربية" },
  { id: "en", label: "الإنجليزية" },
  { id: "fr", label: "الفرنسية" },
  { id: "tr", label: "التركية" },
  { id: "ur", label: "الأردية" },
  { id: "hi", label: "الهندية" },
] as const;

const VOICES = [
  { id: "alloy", label: "Alloy — محايد متوازن" },
  { id: "nova", label: "Nova — أنثوي حيوي" },
  { id: "shimmer", label: "Shimmer — أنثوي ناعم" },
  { id: "coral", label: "Coral — أنثوي ودود" },
  { id: "sage", label: "Sage — هادئ واثق" },
  { id: "onyx", label: "Onyx — ذكوري عميق" },
  { id: "echo", label: "Echo — ذكوري واضح" },
  { id: "ash", label: "Ash — ذكوري دافئ" },
  { id: "fable", label: "Fable — حكواتي" },
  { id: "ballad", label: "Ballad — درامي" },
] as const;

const TONES = [
  { id: "", label: "افتراضي" },
  { id: "Read as a professional news anchor: clear, confident, neutral pace.", label: "إخباري" },
  { id: "Read as an energetic advertising voice-over: upbeat, persuasive, punchy.", label: "إعلاني" },
  { id: "Read as a calm audiobook narrator: warm, unhurried, expressive.", label: "كتاب صوتي" },
  { id: "Read as a friendly podcast host: conversational and relaxed.", label: "بودكاست" },
  { id: "Read as a corporate explainer narrator: polished and instructional.", label: "شرح تعليمي" },
  { id: "Read softly and slowly, soothing and gentle, like a meditation guide.", label: "تأمّلي هادئ" },
] as const;

type Post = "summary" | "bullets" | "translate_ar" | "translate_en" | "clean" | "minutes";

const POST_ACTIONS: { id: Post; label: string; prompt: string }[] = [
  { id: "clean", label: "تنقيح النص", prompt: "صحّح الأخطاء وأضف الترقيم والفواصل ونظّم الفقرات دون تغيير المعنى." },
  { id: "summary", label: "تلخيص", prompt: "لخّص التفريغ في فقرة موجزة تحفظ كل الأفكار الرئيسية." },
  { id: "bullets", label: "نقاط رئيسية", prompt: "استخرج أهم النقاط في قائمة نقطية مرتبة." },
  { id: "minutes", label: "محضر اجتماع", prompt: "حوّل التفريغ إلى محضر اجتماع: الموضوعات، القرارات، والمهام مع المسؤول." },
  { id: "translate_ar", label: "ترجمة للعربية", prompt: "ترجم النص إلى عربية فصحى سليمة وطبيعية." },
  { id: "translate_en", label: "ترجمة للإنجليزية", prompt: "Translate the text into natural, fluent English." },
];

function VoiceStudio() {
  // ---- تفريغ ----
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState<string>("auto");
  const [hint, setHint] = useState("");
  const [proModel, setProModel] = useState(true);
  const [working, setWorking] = useState<Post | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const pcmRef = useRef<Float32Array[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ---- تعليق صوتي ----
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<string>("alloy");
  const [tone, setTone] = useState<string>("");
  const [speed, setSpeed] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);
      pcmRef.current = [];
      node.onaudioprocess = (e) => {
        pcmRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      source.connect(node);
      node.connect(ctx.destination);
      nodeRef.current = node;
      setSeconds(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("تعذّر الوصول إلى المايكروفون. تحقّق من صلاحيات المتصفح.");
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setRecording(false);
    const ctx = ctxRef.current;
    nodeRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (!ctx) return;
    const blob = encodeWav(pcmRef.current, ctx.sampleRate);
    await ctx.close().catch(() => {});
    ctxRef.current = null;
    if (blob.size < 4096) {
      toast.error("التسجيل قصير جدًا أو صامت. أعد المحاولة.");
      return;
    }
    void transcribe(new File([blob], "recording.wav", { type: "audio/wav" }));
  };

  const transcribe = async (file: File) => {
    setTranscribing(true);
    try {
      const form = new FormData();
      form.append("file", file, file.name);
      form.append("model", proModel ? "openai/gpt-4o-transcribe" : "openai/gpt-4o-mini-transcribe");
      form.append("language", language);
      if (hint.trim()) form.append("prompt", hint.trim());

      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = (await res.json()) as { text?: string; message?: string };
      if (!res.ok) {
        toast.error(data.message ?? "تعذّر تفريغ الصوت");
        return;
      }
      const out = (data.text ?? "").trim();
      if (!out) {
        toast.error("لم يُعثر على كلام في التسجيل.");
        return;
      }
      setTranscript((prev) => (prev ? `${prev}\n\n${out}` : out));
      toast.success("تم التفريغ");
      void saveGeneration({ data: { tool: "voice-stt", result_text: out.slice(0, 20000) } }).catch(
        () => {},
      );
    } catch {
      toast.error("حدث خطأ أثناء التفريغ");
    } finally {
      setTranscribing(false);
    }
  };

  const runPost = async (action: (typeof POST_ACTIONS)[number]) => {
    if (!transcript.trim()) return;
    setWorking(action.id);
    try {
      const res = await chatComplete({
        data: {
          system:
            "أنت مساعد تحرير صوتي محترف. أعد النتيجة النهائية فقط دون مقدمات أو شروح إضافية.",
          messages: [{ role: "user", content: `${action.prompt}\n\nالنص:\n${transcript}` }],
        },
      });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      setTranscript(res.text.trim());
      toast.success("تم التنفيذ");
    } finally {
      setWorking(null);
    }
  };

  const speakNow = async () => {
    const value = text.trim();
    if (!value) return;
    setSpeaking(true);
    try {
      const parts = chunkText(value);
      const blobs: Blob[] = [];
      for (const part of parts) {
        const res = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: part, voice, speed, instructions: tone }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { message?: string } | null;
          toast.error(data?.message ?? "تعذّر توليد الصوت");
          return;
        }
        blobs.push(await res.blob());
      }
      const url = URL.createObjectURL(new Blob(blobs, { type: "audio/mpeg" }));
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      await audio.play().catch(() => {});
      setPlaying(true);
      toast.success("جاهز");
      void saveGeneration({
        data: { tool: "voice-tts", prompt: value.slice(0, 8000), result_text: `صوت: ${voice}` },
      }).catch(() => {});
    } catch {
      toast.error("حدث خطأ أثناء توليد الصوت");
    } finally {
      setSpeaking(false);
    }
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      await audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  const enhanceScript = async () => {
    if (!text.trim()) return;
    setWorking("clean");
    try {
      const res = await chatComplete({
        data: {
          system: "أنت كاتب سكربتات تعليق صوتي. أعد السكربت الجاهز للقراءة فقط.",
          messages: [
            {
              role: "user",
              content: `أعد صياغة النص التالي كسكربت تعليق صوتي سلس مناسب للقراءة الصوتية، بجمل قصيرة وترقيم يساعد على الوقفات، مع الحفاظ على المعنى واللغة:\n\n${text}`,
            },
          ],
        },
      });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      setText(res.text.trim());
      toast.success("تم تحسين السكربت");
    } finally {
      setWorking(null);
    }
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <ToolShell
      title="استوديو الصوت"
      subtitle="تفريغ صوتي دقيق لأي تسجيل أو ملف، مع تلخيص وترجمة ومحاضر اجتماعات — وتعليق صوتي احترافي بأصوات وسرعات ونبرات متعددة."
    >
      <Tabs defaultValue="stt">
        <TabsList className="mb-6 w-full">
          <TabsTrigger value="stt" className="flex-1">
            <FileAudio className="size-4" /> تفريغ الصوت إلى نص
          </TabsTrigger>
          <TabsTrigger value="tts" className="flex-1">
            <Volume2 className="size-4" /> النص إلى صوت
          </TabsTrigger>
        </TabsList>

        {/* ------- STT ------- */}
        <TabsContent value="stt" className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-5 rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
            <div className="flex gap-2">
              <Button
                onClick={() => (recording ? void stopRecording() : void startRecording())}
                disabled={transcribing}
                className={`flex-1 ${recording ? "bg-destructive" : "bg-cine"} text-primary-foreground`}
              >
                {recording ? <Square className="size-4" /> : <Mic className="size-4" />}
                {recording ? `إيقاف (${mm}:${ss})` : "تسجيل مباشر"}
              </Button>
              <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={recording || transcribing}
              >
                <Upload className="size-4" /> ملف صوتي
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="audio/*,video/mp4,video/webm"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void transcribe(f);
                  e.target.value = "";
                }}
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">لغة التسجيل</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {LANGS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLanguage(l.id)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                      language === l.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="hint" className="text-xs text-muted-foreground">
                مصطلحات وأسماء لتحسين الدقة (اختياري)
              </Label>
              <Input
                id="hint"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="أسماء أشخاص، علامات تجارية، مصطلحات فنية…"
                className="mt-2 bg-background/60"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium">دقة عالية</p>
                <p className="text-xs text-muted-foreground">نموذج تفريغ متقدّم مقابل نموذج أسرع</p>
              </div>
              <Switch checked={proModel} onCheckedChange={setProModel} />
            </div>

            {transcribing && (
              <p className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="size-4 animate-spin" /> جارٍ التفريغ…
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              يدعم mp3 وwav وm4a وwebm حتى ٢٤ ميجابايت. للتسجيلات الطويلة قسّمها إلى مقاطع.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
            <div className="flex flex-wrap gap-2">
              {POST_ACTIONS.map((a) => (
                <Button
                  key={a.id}
                  size="sm"
                  variant="outline"
                  disabled={!transcript.trim() || working !== null}
                  onClick={() => void runPost(a)}
                >
                  {working === a.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : a.id.startsWith("translate") ? (
                    <Languages className="size-3.5" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  {a.label}
                </Button>
              ))}
            </div>

            <Textarea
              rows={16}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="سيظهر النص المُفرَّغ هنا…"
              className="resize-none bg-background/60"
            />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!transcript.trim()}
                onClick={() => {
                  void navigator.clipboard.writeText(transcript);
                  toast.success("تم النسخ");
                }}
              >
                <Copy className="size-3.5" /> نسخ
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!transcript.trim()}
                onClick={() => {
                  const url = URL.createObjectURL(new Blob([transcript], { type: "text/plain" }));
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "transcript.txt";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="size-3.5" /> تنزيل النص
              </Button>
              <Button
                size="sm"
                className="bg-cine text-primary-foreground"
                disabled={!transcript.trim()}
                onClick={() => setText(transcript)}
              >
                <Volume2 className="size-3.5" /> اقرأه بصوت
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ------- TTS ------- */}
        <TabsContent value="tts" className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4 rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
            <Label htmlFor="tts">نص التعليق الصوتي</Label>
            <Textarea
              id="tts"
              rows={14}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب أو الصق النص… النصوص الطويلة تُقسَّم تلقائيًا وتُدمج في ملف واحد."
              className="resize-none bg-background/60"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{text.length} حرف</span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!text.trim() || working !== null}
                onClick={() => void enhanceScript()}
              >
                {working ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                تحسين السكربت
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void speakNow()}
                disabled={!text.trim() || speaking}
                className="flex-1 bg-cine text-primary-foreground"
              >
                {speaking ? <Loader2 className="size-4 animate-spin" /> : <Volume2 className="size-4" />}
                {speaking ? "جارٍ التوليد…" : "توليد الصوت"}
              </Button>
              {audioUrl && (
                <>
                  <Button variant="outline" onClick={() => void togglePlay()}>
                    {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                    {playing ? "إيقاف مؤقت" : "تشغيل"}
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={audioUrl} download="voiceover.mp3">
                      <Download className="size-4" /> تنزيل MP3
                    </a>
                  </Button>
                </>
              )}
            </div>

            {audioUrl && <audio src={audioUrl} controls className="w-full" />}
          </div>

          <div className="space-y-5 rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
            <div>
              <Label className="text-xs text-muted-foreground">الصوت</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVoice(v.id)}
                    className={`rounded-lg border px-3 py-2 text-start text-xs transition-colors ${
                      voice === v.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">نبرة الأداء</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => setTone(t.id)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                      tone === t.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">سرعة القراءة</Label>
                <span className="text-xs text-primary">{speed.toFixed(2)}×</span>
              </div>
              <Slider
                className="mt-3"
                min={0.5}
                max={2}
                step={0.05}
                value={[speed]}
                onValueChange={(v) => setSpeed(v[0] ?? 1)}
              />
            </div>

            <p className="rounded-xl border border-border bg-background/50 px-4 py-3 text-xs text-muted-foreground">
              مناسب للإعلانات، الفيديوهات، البودكاست، الكتب الصوتية والردود الهاتفية. يمكنك تنزيل الملف
              واستخدامه في المونتاج.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </ToolShell>
  );
}
