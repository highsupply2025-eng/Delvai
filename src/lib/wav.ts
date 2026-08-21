/** Encode Float32 PCM chunks into a complete 16-bit mono WAV blob. */
export function encodeWav(chunks: Float32Array[], sampleRate: number, targetRate = 16000): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }

  const ratio = sampleRate / targetRate;
  const outLength = ratio > 1 ? Math.floor(merged.length / ratio) : merged.length;
  const samples = new Float32Array(outLength);
  for (let i = 0; i < outLength; i += 1) {
    samples[i] = merged[Math.floor(i * (ratio > 1 ? ratio : 1))] ?? 0;
  }
  const rate = ratio > 1 ? targetRate : sampleRate;

  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (pos: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) view.setUint8(pos + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let pos = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    pos += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

/** Split long text at sentence boundaries so each TTS request stays small. */
export function chunkText(text: string, maxChars = 1800): string[] {
  const parts = text.match(/[^.!?؟。\n]+[.!?؟。\n]*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const part of parts) {
    if (part.length > maxChars) {
      if (current.trim()) chunks.push(current.trim());
      current = "";
      for (let i = 0; i < part.length; i += maxChars) chunks.push(part.slice(i, i + maxChars));
      continue;
    }
    if (current.length + part.length > maxChars) {
      if (current.trim()) chunks.push(current.trim());
      current = "";
    }
    current += part;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
