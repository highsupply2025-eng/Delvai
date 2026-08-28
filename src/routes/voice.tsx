import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Check,
  Copy,
  Download,
  FileAudio,
  Headphones,
  Languages,
  Mic,
  MicOff,
  Music,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Rocket,
  Share2,
  Sliders,
  Sparkles,
  Square,
  Upload,
  Volume2,
  VolumeX,
  Wand2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToolShell } from "@/components/ToolShell";
import { saveGeneration } from "@/lib/history.functions";
import { chunkText, encodeWav } from "@/lib/wav";
import { useAuth } from "@/hooks/useAuth";
import { DelvaiThinkingLoader, DelvaiLogo } from "@/components/DelvaiThinkingLoader";

export const Route = createFileRoute("/voice")({
  head: () => ({
    meta: [
      { title: "استوديو الصوت والنص الفائق (Delvai Voice Studio) | ذكاء اصطناعي صوتي فائق السرعة" },
      {
        name: "description",
        content:
          "استوديو الصوت المتكامل فائق السرعة: تحويل النص إلى صوت بشري طبيعي وواقعي، تفريغ التسجيلات الصوتية بدقة متناهية، تلخيص المحادثات بالبث اللحظي، واستخراج محاضر الاجتماعات بأحدث محركات الذكاء الاصطناعي.",
      },
      { property: "og:title", content: "استوديو الصوت والنص الفائق — Delvai Voice Studio" },
      {
        property: "og:description",
        content: "تحويل النص إلى تعليق صوتي سينمائي وتفريغ التسجيلات بدقة فائقة وبث فوري بالعربية والإنجليزية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VoiceStudio,
});

type Tab = "tts" | "transcribe";

const VOICES = [
  { id: "nova", name: "Nova", gender: "أنثوي", desc: "حيوي ومتحمس ومثالي للإعلانات والريلز 🔥", tag: "الأكثر طلباً" },
  { id: "onyx", name: "Onyx", gender: "ذكوري", desc: "عميق وواثق ومثالي للأفلام الوثائقية والبودكاست 🎙️", tag: "سينمائي" },
  { id: "alloy", name: "Alloy", gender: "محايد", desc: "متوازن ومريح ومثالي للشروحات والأخبار 📰", tag: "متوازن" },
  { id: "shimmer", name: "Shimmer", gender: "أنثوي", desc: "ناعم ورقيق ومثالي للتأمل والكتب الصوتية 📖", tag: "هادئ" },
  { id: "echo", name: "Echo", gender: "ذكوري", desc: "واضح ورنان ومثالي للبيانات والتدريب 📢", tag: "واضح" },
  { id: "coral", name: "Coral", gender: "أنثوي", desc: "ودود ودافئ ومثالي لخدمة العملاء والقصص 💬", tag: "ودود" },
  { id: "ash", name: "Ash", gender: "ذكوري", desc: "دافئ ومقنع ومثالي للرسائل التسويقية 🚀", tag: "مقنع" },
  { id: "fable", name: "Fable", gender: "حكواتي", desc: "نبرة سردية معبرة ومثالية للروايات والقصص 🎭", tag: "سردي" },
] as const;

const TONES = [
  { id: "", label: "نبرة طبيعية متوازنة" },
  { id: "Read as a professional news anchor: clear, confident, neutral pace.", label: "إخباري رسمي وواثق 🎙️" },
  { id: "Read as an energetic advertising voice-over: upbeat, persuasive, punchy.", label: "إعلاني حماسي ومؤثر 🚀" },
  { id: "Read as a calm audiobook narrator: warm, unhurried, expressive.", label: "كتاب صوتي هادئ ومعبر 📖" },
  { id: "Read as a friendly podcast host: conversational and relaxed.", label: "بودكاست عفوي وودود 🎧" },
  { id: "Read softly and slowly, soothing and gentle, like a meditation guide.", label: "تأمّلي مريح للأعصاب 🧘" },
] as const;

const POST_ACTIONS = [
  { id: "clean", label: "تنقيح وتشكيل النص ✍️", icon: Sparkles, prompt: "صحّح الأخطاء وأضف الترقيم والفواصل ونظّم الفقرات بدقة دون تغيير المعنى." },
  { id: "summary", label: "تلخيص تنفيذي شامل ⚡", icon: Activity, prompt: "لخّص التفريغ في فقرة موجزة واضحة تحفظ كل الأفكار والقرارات الرئيسية." },
  { id: "minutes", label: "استخراج محضر اجتماع 📋", icon: Check, prompt: "حوّل التفريغ إلى محضر اجتماع احترافي: الموضوعات الرئيسية، القرارات المتخذة، وقائمة المهام مع المسؤولين عنها." },
  { id: "translate_ar", label: "ترجمة لفصحى راقية 🌐", icon: Languages, prompt: "ترجم النص إلى لغة عربية فصحى سليمة، سلسة، وبلاغية." },
  { id: "translate_en", label: "Translate to English 🇺🇸", icon: Languages, prompt: "Translate this transcript into natural, professional, and fluent English." },
];

const TTS_PRESETS = [
  { title: "إعلان تجاري حماسي", text: "اكتشف الجيل الجديد من خدمات الذكاء الاصطناعي مع منصة دلفاي، حيث تلتقي السرعة الفائقة بالدقة الاستثنائية لتحقيق أعلى نتائج أعمالك!" },
  { title: "مقدمة بودكاست", text: "أهلاً بكم في حلقة جديدة من بودكاست المستقبل، اليوم سنغوص في أسرار التقنية وكيف يعيد الذكاء الاصطناعي تشكيل حياتنا اليومية." },
  { title: "اقتباس وتأمل", text: "الهدوء ليس غياب الضجيج من حولك، بل هو السكينة التي تنبع من داخلك حين تدرك أن كل خطوة تخطوها تقربك من هدفك." },
];

function VoiceStudio() {
  const save = useServerFn(saveGeneration);
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>("tts");

  // ---- Text to Speech State ----
  const [ttsText, setTtsText] = useState("");
  const [voice, setVoice] = useState<string>("nova");
  const [tone, setTone] = useState<string>("");
  const [speed, setSpeed] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ---- Transcription State ----
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcribeModel, setTranscribeModel] = useState("openai/gpt-4o-mini-transcribe");
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const pcmRef = useRef<Float32Array[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Start Mic Recording
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
      toast.info("بدأ التسجيل الصوتي المباشر… تحدث بوضوح 🎙️");
    } catch {
      toast.error("تعذّر الوصول إلى المايكروفون. يرجى التحقق من صلاحيات المتصفح.");
    }
  };

  // Stop Mic Recording
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
    await uploadAudio(new File([blob], "recording.wav", { type: "audio/wav" }));
  };

  // Transcribe Uploaded Audio File
  const uploadAudio = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      toast.error("حجم الملف الصوتي كبير جدًا (الحد الأقصى 25 ميجابايت)");
      return;
    }
    setTranscribing(true);
    setTranscript("");
    setActionOutput(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("model", transcribeModel);
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!res.ok) {
        toast.error("تعذّر تفريغ الصوت، يرجى المحاولة مرة أخرى.");
        return;
      }
      const data = (await res.json()) as { text?: string };
      if (data.text) {
        setTranscript(data.text);
        toast.success("تم تفريغ الصوت بسرعة فائقة! ⚡");
        if (user) void save({ data: { tool: "صوت", prompt: "تفريغ صوتي", result_text: data.text } });
      }
    } catch {
      toast.error("حدث خطأ أثناء إرسال الملف الصوتي.");
    } finally {
      setTranscribing(false);
    }
  };

  // Run Text to Speech Synthesis
  const generateSpeech = async () => {
    if (!ttsText.trim() || speaking) return;
    setSpeaking(true);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    try {
      const chunks = chunkText(ttsText.trim(), 400);
      const buffers: ArrayBuffer[] = [];
      for (const c of chunks) {
        const full = tone ? `${tone}\n\n${c}` : c;
        const res = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: full, voice, speed }),
        });
        if (!res.ok) {
          toast.error("تعذّر توليد الصوت، يرجى المحاولة مرة أخرى.");
          return;
        }
        buffers.push(await res.arrayBuffer());
      }
      const totalLen = buffers.reduce((acc, b) => acc + b.byteLength, 0);
      const combined = new Uint8Array(totalLen);
      let offset = 0;
      for (const b of buffers) {
        combined.set(new Uint8Array(b), offset);
        offset += b.byteLength;
      }
      const blob = new Blob([combined], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      toast.success("تم توليد التعليق الصوتي فائق النقاء! 🔊");
      if (user) void save({ data: { tool: "صوت", prompt: ttsText.slice(0, 100), result_text: "تم توليد ملف صوتي" } });
    } catch {
      toast.error("حدث خطأ في الاتصال بخدمة الصوت.");
    } finally {
      setSpeaking(false);
    }
  };

  // Run AI Post-Action on Transcript with Direct Real-time Streaming
  const runPostAction = async (action: (typeof POST_ACTIONS)[number]) => {
    if (!transcript.trim() || actionBusy) return;
    setActiveAction(action.id);
    setActionBusy(true);
    setActionOutput("");

    const controller = new AbortController();
    abortRef.current = controller;
    let acc = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          system: `أنت مساعد صوتي وتحليلي خبير في منصة Delvai. نفّذ المهمة التالية بأعلى درجات الدقة والاحترافية: ${action.prompt}`,
          messages: [{ role: "user", content: transcript }],
          model: "google/gemini-3.7-flash",
        }),
      });

      if (!res.ok || !res.body) {
        toast.error("تعذّر الاتصال بخادم المعالجة اللحظية.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload) as {
              choices?: { delta?: { content?: string } }[];
            };
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setActionOutput(acc);
            }
          } catch {
            /* ignore partial */
          }
        }
      }
      toast.success(`تم إتمام: ${action.label} ⚡`);
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") {
        toast.error("حدث خطأ أثناء المعالجة الذكية.");
      }
    } finally {
      setActionBusy(false);
      abortRef.current = null;
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("تم نسخ النص بنجاح");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolShell
      title="استوديو الصوت والنص الفائق — Delvai Voice Studio"
      subtitle="عقل المعالجة الصوتية لمنصة Delvai — تحويل النص إلى تعليق صوتي واقعي فائق النقاء، وتفريغ وتلخيص التسجيلات الصوتية بالبث اللحظي السريع."
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5">
        {/* ================= TOP CYBER HUD BAR ================= */}
        <div className="relative overflow-hidden rounded-3xl glass p-3 sm:p-4 shadow-float border-primary/25 ring-glow">
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            {/* Mode Switcher */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab("tts")}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                  tab === "tts"
                    ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.35)] scale-105"
                    : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <Volume2 className="size-3.5" />
                <span>تحويل النص إلى صوت واقعي (Neural TTS)</span>
              </button>

              <button
                type="button"
                onClick={() => setTab("transcribe")}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                  tab === "transcribe"
                    ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.35)] scale-105"
                    : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <Mic className="size-3.5" />
                <span>تفريغ وتلخيص التسجيلات الصوتية (AI Speech-to-Text)</span>
              </button>
            </div>

            <div className="ms-auto flex items-center gap-2 text-xs font-mono text-primary font-bold">
              <Sparkles className="size-3.5 animate-pulse" />
              <span>محرك Neural Voice 48kHz متصل</span>
            </div>
          </div>
        </div>

        {/* ================= MODE 1: TEXT TO SPEECH ================= */}
        {tab === "tts" && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left Controls */}
            <div className="flex flex-col gap-4 rounded-3xl glass p-5 sm:p-6 shadow-float border-primary/20 backdrop-blur-xl">
              {/* Text Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <PenLine className="size-3.5 text-primary" />
                    النص المراد تحويله إلى صوت:
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {ttsText.length} حرف
                  </span>
                </div>
                <div className="rounded-2xl border border-border/80 bg-background/80 p-3 shadow-inner focus-within:border-primary/80 focus-within:shadow-[0_0_20px_oklch(0.82_0.14_82/0.2)] transition-all">
                  <Textarea
                    rows={4}
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder="اكتب أو الصق النص هنا ليقوم الذكاء الاصطناعي بقراءته بنبرة طبيعية مذهلة…"
                    className="w-full resize-none border-none bg-transparent p-0 text-sm leading-6 placeholder:text-muted-foreground/60 outline-none focus-visible:ring-0"
                  />
                </div>
              </div>

              {/* Inspiration Presets */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground me-1 my-auto">نماذج جاهزة:</span>
                {TTS_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTtsText(p.text);
                      toast.success(`تم اختيار: ${p.title}`);
                    }}
                    className="rounded-full border border-border/70 bg-card/40 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
                  >
                    {p.title}
                  </button>
                ))}
              </div>

              {/* Voice Actor Selection */}
              <div>
                <span className="mb-2 block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  اختر الصوت البشري (Voice Actor):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {VOICES.map((v) => {
                    const isSelected = voice === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVoice(v.id)}
                        className={`flex flex-col items-start rounded-2xl border p-2.5 text-start transition-all ${
                          isSelected
                            ? "border-primary bg-primary/15 text-primary shadow-[0_0_15px_oklch(0.82_0.14_82/0.25)] font-bold scale-[1.02]"
                            : "border-border/70 bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{v.name}</span>
                          <span className="text-[10px] rounded-md bg-muted px-1 py-0.5 text-muted-foreground font-mono">
                            {v.gender}
                          </span>
                        </div>
                        <span className="mt-1 text-[10px] text-muted-foreground line-clamp-1">{v.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tone Style & Speed Slider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border/40 pt-3">
                {/* Tone */}
                <div>
                  <span className="mb-1.5 block text-xs font-bold text-muted-foreground">نبرة وطابع الإلقاء:</span>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground outline-none focus:border-primary/80"
                  >
                    {TONES.map((t, idx) => (
                      <option key={idx} value={t.id} className="bg-card text-foreground">
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speed */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-muted-foreground">سرعة الإلقاء:</span>
                    <span className="text-xs font-mono font-bold text-primary">{speed.toFixed(1)}x</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Slider
                      value={[speed]}
                      min={0.75}
                      max={1.5}
                      step={0.05}
                      onValueChange={([v]) => setSpeed(v ?? 1)}
                      className="py-1"
                    />
                  </div>
                </div>
              </div>

              {/* Launch TTS Button */}
              <Button
                onClick={() => void generateSpeech()}
                disabled={speaking || !ttsText.trim()}
                className="mt-2 h-12 w-full rounded-2xl bg-cine text-primary-foreground shadow-glow font-bold text-sm transition-transform hover:scale-[1.01]"
              >
                {speaking ? (
                  <div className="flex items-center gap-2">
                    <DelvaiThinkingLoader size="xs" inline />
                    <span>دلفاي يولد التعليق الصوتي فائق النقاء…</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Volume2 className="size-4" />
                    <span>توليد التعليق الصوتي بالذكاء الاصطناعي ⚡</span>
                  </div>
                )}
              </Button>
            </div>

            {/* Right Audio Output Canvas */}
            <div className="flex flex-col gap-4 rounded-3xl glass p-5 sm:p-6 shadow-float border-primary/20 backdrop-blur-xl">
              <div className="relative flex min-h-[340px] max-h-[55vh] flex-col items-center justify-center rounded-2xl border border-border/80 bg-background/80 p-6 text-center shadow-inner">
                {speaking ? (
                  <div className="my-auto text-center space-y-3">
                    <DelvaiThinkingLoader size="lg" text="معالجة الموجات الصوتية وضبط النبرة العصبية…" />
                    <div className="flex justify-center items-end gap-1 h-8 pt-2">
                      {[40, 70, 90, 60, 100, 75, 45, 85, 95, 60, 80].map((h, i) => (
                        <span
                          key={i}
                          className="w-1.5 bg-primary rounded-full animate-pulse"
                          style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  </div>
                ) : audioUrl ? (
                  <div className="my-auto w-full max-w-sm space-y-4">
                    <div className="relative mx-auto flex size-20 items-center justify-center">
                      <div className="pointer-events-none absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                      <Headphones className="size-10 text-primary drop-shadow-[0_0_15px_oklch(0.82_0.14_82/0.8)]" />
                    </div>

                    {/* Equalizer animation */}
                    <div className="flex justify-center items-end gap-1.5 h-6">
                      {[30, 60, 95, 45, 80, 100, 50, 70, 90, 40].map((h, i) => (
                        <span
                          key={i}
                          className="w-1 bg-primary/80 rounded-full"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>

                    <audio ref={audioRef} src={audioUrl} controls className="w-full rounded-xl" autoPlay />

                    <a href={audioUrl} download={`delvai-voice-${Date.now()}.mp3`} className="block w-full">
                      <Button className="w-full rounded-xl bg-cine text-primary-foreground shadow-glow font-bold gap-2">
                        <Download className="size-4" /> تنزيل الملف الصوتي MP3
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div className="my-auto text-center">
                    <div className="relative mx-auto mb-3 flex size-16 items-center justify-center">
                      <div className="pointer-events-none absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                      <DelvaiLogo className="size-10 drop-shadow-[0_0_15px_oklch(0.82_0.14_82/0.8)]" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      استوديو <span className="text-shine">التعليق الصوتي الفائق</span>
                    </h3>
                    <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                      اكتب النص واصنع تعليقاً صوتياً احترافياً جاهزاً للإعلانات والبودكاست واليوتيوب بسرعة البرق.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODE 2: SPEECH TO TEXT & TRANSCRIPTION ================= */}
        {tab === "transcribe" && (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left Recording & Upload Controls */}
            <div className="flex flex-col gap-4 rounded-3xl glass p-5 sm:p-6 shadow-float border-primary/20 backdrop-blur-xl">
              {/* Engine Selector */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-xs font-bold text-muted-foreground">محرك التفريغ الصوتي:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setTranscribeModel("openai/gpt-4o-mini-transcribe")}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                      transcribeModel === "openai/gpt-4o-mini-transcribe"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border/70 bg-card/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    GPT-4o Mini (فائق السرعة ⚡)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTranscribeModel("openai/gpt-4o-transcribe")}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                      transcribeModel === "openai/gpt-4o-transcribe"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border/70 bg-card/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    GPT-4o (دقة قصوى 🎯)
                  </button>
                </div>
              </div>

              {/* Live Mic Recorder Box */}
              <div className="rounded-2xl border border-border/80 bg-background/60 p-5 text-center">
                <span className="block text-xs font-bold text-foreground mb-3">التسجيل الصوتي المباشر:</span>
                <div className="flex flex-col items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={recording ? stopRecording : startRecording}
                    className={`flex size-20 items-center justify-center rounded-full transition-all ${
                      recording
                        ? "bg-destructive text-destructive-foreground shadow-[0_0_25px_oklch(0.6_0.21_27/0.7)] animate-pulse scale-110"
                        : "bg-primary text-primary-foreground shadow-glow hover:scale-105"
                    }`}
                  >
                    {recording ? <Square className="size-8" /> : <Mic className="size-8" />}
                  </button>

                  {recording && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-destructive font-mono font-bold text-sm animate-pulse">
                        <span className="size-2 rounded-full bg-destructive animate-ping" />
                        <span>جارٍ التسجيل: {seconds} ثانية</span>
                      </div>
                      <div className="flex justify-center items-end gap-1 h-5">
                        {[40, 80, 100, 60, 90, 70, 50].map((h, i) => (
                          <span
                            key={i}
                            className="w-1 bg-destructive rounded-full animate-pulse"
                            style={{ height: `${h}%`, animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {!recording && (
                    <span className="text-xs text-muted-foreground">
                      اضغط على الميكروفون لبدء التسجيل المباشر
                    </span>
                  )}
                </div>
              </div>

              {/* Audio File Dropzone */}
              <div className="border-t border-border/40 pt-3">
                <span className="mb-2 block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  أو ارفع ملفاً صوتياً (MP3, WAV, M4A, OGG):
                </span>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="cursor-pointer rounded-2xl border border-dashed border-border/80 bg-card/40 p-5 text-center text-xs text-muted-foreground hover:border-primary/50 transition-colors"
                >
                  <Upload className="mx-auto mb-1.5 size-6 text-primary/70" />
                  <span>اسحب الملف الصوتي هنا أو اضغط للاختيار من جهازك (حتى 24 ميجابايت)</span>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadAudio(f);
                  }}
                />
              </div>

              {transcribing && (
                <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-center">
                  <DelvaiThinkingLoader size="sm" text="دلفاي يفرغ التسجيل الصوتي بسرعة فائقة…" inline />
                </div>
              )}
            </div>

            {/* Right Output & Post-Actions */}
            <div className="flex flex-col gap-4 rounded-3xl glass p-5 sm:p-6 shadow-float border-primary/20 backdrop-blur-xl">
              {/* Transcript Display */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-foreground">النص المفرغ من التسجيل:</span>
                  {transcript && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transcript)}
                      className="h-7 text-xs gap-1"
                    >
                      {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      <span>{copied ? "تم النسخ" : "نسخ"}</span>
                    </Button>
                  )}
                </div>
                <div className="min-h-[160px] max-h-[220px] overflow-y-auto rounded-2xl border border-border/80 bg-background/80 p-3.5 text-xs sm:text-sm leading-6 text-foreground/90">
                  {transcript || (
                    <span className="text-muted-foreground/60 italic">
                      سوف يظهر التفريغ الصوتي الدقيق هنا فور انتهاء التسجيل أو رفع الملف…
                    </span>
                  )}
                </div>
              </div>

              {/* AI Post-Actions Buttons */}
              {transcript && (
                <div className="border-t border-border/40 pt-3">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    معالجة وتحليل بالبث اللحظي السريع:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {POST_ACTIONS.map((a) => {
                      const Icon = a.icon;
                      return (
                        <Button
                          key={a.id}
                          variant="outline"
                          size="sm"
                          disabled={actionBusy}
                          onClick={() => void runPostAction(a)}
                          className={`rounded-xl text-xs gap-1.5 ${
                            activeAction === a.id ? "border-primary bg-primary/15 text-primary" : ""
                          }`}
                        >
                          <Icon className="size-3" />
                          <span>{a.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Post Action Output Box with Live Streaming */}
              {actionBusy && !actionOutput && (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center">
                  <DelvaiThinkingLoader size="sm" text="دلفاي يبدأ المعالجة اللحظية السريعة…" inline />
                </div>
              )}

              {actionOutput && (
                <div className="space-y-2 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-xs leading-6 text-foreground/95">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">النتيجة التحليلية اللحظية:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(actionOutput)}
                      className="h-6 text-[10px] gap-1"
                    >
                      <Copy className="size-3" /> نسخ
                    </Button>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {actionOutput}
                    {actionBusy && (
                      <span className="inline-block size-1.5 animate-ping rounded-full bg-primary align-middle ms-1" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
