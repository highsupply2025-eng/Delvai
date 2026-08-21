/** Browser-side document text extraction (PDF, Word, Excel, CSV, text, images). */

export type ExtractedDoc = {
  id: string;
  name: string;
  kind: "pdf" | "word" | "sheet" | "text" | "image";
  pages?: number;
  chars: number;
  text: string;
  /** data URL, only for images (sent to the vision model) */
  image?: string;
};

const uid = () => Math.random().toString(36).slice(2, 10);

async function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read error"));
    reader.readAsDataURL(file);
  });
}

async function extractPdf(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const parts: string[] = [];
  for (let p = 1; p <= pdf.numPages; p += 1) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    parts.push(`\n[صفحة ${p}]\n${line}`);
  }
  return { text: parts.join("\n").trim(), pages: pdf.numPages };
}

async function extractWord(file: File) {
  const mammoth = await import("mammoth");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value.trim();
}

async function extractSheet(file: File) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  return wb.SheetNames.map((name) => {
    const sheet = wb.Sheets[name];
    const csv = sheet ? XLSX.utils.sheet_to_csv(sheet) : "";
    return `\n[ورقة: ${name}]\n${csv}`;
  })
    .join("\n")
    .trim();
}

export async function extractFile(file: File): Promise<ExtractedDoc> {
  const name = file.name;
  const lower = name.toLowerCase();
  const base = { id: uid(), name };

  if (lower.endsWith(".pdf") || file.type === "application/pdf") {
    const { text, pages } = await extractPdf(file);
    return { ...base, kind: "pdf", pages, text, chars: text.length };
  }
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
    const text = await extractWord(file);
    return { ...base, kind: "word", text, chars: text.length };
  }
  if (/\.(xlsx|xls|csv|tsv)$/.test(lower)) {
    const text = await extractSheet(file);
    return { ...base, kind: "sheet", text, chars: text.length };
  }
  if (file.type.startsWith("image/")) {
    const image = await readAsDataUrl(file);
    return { ...base, kind: "image", text: "", chars: 0, image };
  }
  const text = await file.text();
  return { ...base, kind: "text", text: text.trim(), chars: text.length };
}

export function toCsvDownload(text: string, filename: string) {
  const blob = new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
