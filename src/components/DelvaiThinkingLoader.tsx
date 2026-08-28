import delvaiMarkAsset from "@/assets/uniai-mark.png.asset.json";

const delvaiMark = delvaiMarkAsset.url;

export function DelvaiLogo({ className }: { className?: string }) {
  return (
    <img
      src={delvaiMark}
      alt="Delvai"
      className={className}
      loading="eager"
    />
  );
}

interface DelvaiThinkingLoaderProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  inline?: boolean;
}

export function DelvaiThinkingLoader({
  size = "sm",
  className = "",
  text,
  inline = false,
}: DelvaiThinkingLoaderProps) {
  const sizeMap = {
    xs: { logo: "size-3.5", glow: "size-5", orbit: "size-6" },
    sm: { logo: "size-4", glow: "size-6", orbit: "size-7" },
    md: { logo: "size-6", glow: "size-9", orbit: "size-11" },
    lg: { logo: "size-10", glow: "size-14", orbit: "size-16" },
    xl: { logo: "size-16", glow: "size-24", orbit: "size-28" },
  };

  const currentSize = sizeMap[size] || sizeMap.sm;

  const content = (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Outer rotating search & neural ring */}
      <span
        aria-hidden
        className={`pointer-events-none absolute ${currentSize.orbit} rounded-full border border-dashed border-primary/50 animate-spin opacity-80`}
        style={{ animationDuration: "3.5s" }}
      />

      {/* Holographic glowing pulse wave */}
      <span
        aria-hidden
        className={`pointer-events-none absolute ${currentSize.glow} rounded-full bg-primary/25 blur-sm animate-ping opacity-60`}
        style={{ animationDuration: "1.8s" }}
      />

      {/* Counter-rotating scanning particle ring */}
      <span
        aria-hidden
        className={`pointer-events-none absolute ${currentSize.glow} rounded-full border-t-2 border-r border-transparent border-t-primary border-r-primary/40 animate-spin`}
        style={{ animationDuration: "1.2s", animationDirection: "reverse" }}
      />

      {/* Core Delvai Logo with breathing thinking glow */}
      <img
        src={delvaiMark}
        alt="Delvai Thinking..."
        className={`relative ${currentSize.logo} object-contain transition-transform duration-300 drop-shadow-[0_0_10px_oklch(0.82_0.14_82/0.85)] animate-pulse`}
      />
    </div>
  );

  if (text) {
    return (
      <div className={`inline-flex items-center gap-2.5 ${inline ? "" : "justify-center"}`}>
        {content}
        <span className="text-xs font-medium text-foreground/90 animate-pulse">{text}</span>
      </div>
    );
  }

  return content;
}
