import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { AR_EN } from "./i18n-dict";
import { MULTI_DICT } from "./multilingual-dict";

export type Lang = "ar" | "en" | "fr" | "es" | "de" | "tr" | "zh" | "ja";

export interface LanguageOption {
  code: Lang;
  name: string;
  nativeName: string;
  flag: string;
  dir: "rtl" | "ltr";
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", dir: "ltr" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", dir: "ltr" },
];

const STORAGE_KEY = "app.lang";
const ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

const MAP = new Map<string, string>();
for (const [ar, en] of Object.entries(AR_EN)) MAP.set(norm(ar), en);

function lookup(k: string, targetLang: Lang): string | null {
  const normK = norm(k);
  if (!normK) return null;
  if (targetLang !== "en" && targetLang !== "ar") {
    const direct = MULTI_DICT[targetLang]?.[normK];
    if (direct) return direct;
  }
  const enDirect = MAP.get(normK);
  if (enDirect) return enDirect;

  // strip trailing / leading punctuation & quotes & ellipsis
  const stripped = normK
    .replace(/^[\s•✦✨*—\-–"“«]+/u, "")
    .replace(/[\s•✦✨*—\-–"”»….:!?,،؟]+$/u, "")
    .trim();
  if (stripped && stripped !== normK) {
    if (targetLang !== "en" && targetLang !== "ar") {
      const strippedHit = MULTI_DICT[targetLang]?.[stripped];
      if (strippedHit) return strippedHit;
    }
    const enStrippedHit = MAP.get(stripped);
    if (enStrippedHit) return enStrippedHit;
  }
  return null;
}

function translate(value: string, targetLang: Lang = "en"): string | null {
  const key = norm(value);
  if (!key) return null;
  if (targetLang === "ar") return null;

  // 1. Direct or stripped lookup
  const simple = lookup(key, targetLang);
  if (simple) return simple;

  // 2. Composed strings (with bullets, dashes, colons, ellipses)
  const leadMatch = /^([\s•✦✨*—\-–"“«]+)/u.exec(value);
  const trailMatch = /([\s•✦✨*—\-–"”»….:!?,،؟]+)$/u.exec(value);
  const lead = leadMatch ? leadMatch[1] : "";
  const trail = trailMatch ? trailMatch[1] : "";
  const core = norm(value.slice(lead.length, value.length - (trail ? trail.length : 0)));

  if (core) {
    const coreHit = lookup(core, targetLang);
    if (coreHit) {
      return lead + coreHit + trail;
    }
  }

  // 3. Composed strings such as "label — state: value"
  if (/[—:|·]/.test(key)) {
    const parts = key.split(/\s*([—:|·])\s*/);
    let translated = false;
    const rebuilt = parts.map((part) => {
      if (/^[—:|·]$/.test(part)) return part === ":" ? ": " : ` ${part} `;
      const normPart = norm(part);
      const piece = lookup(normPart, targetLang);
      if (piece) translated = true;
      return piece ?? part;
    });
    if (translated) return rebuilt.join("").replace(/\s+/g, " ").trim();
  }

  // 4. Multi-sentence paragraph split
  if (/[.\n،؛]/.test(value) && value.length > 20) {
    const lines = value.split(/(\n+)/);
    let translatedLines = false;
    const transformedLines = lines.map((line) => {
      if (/^\n+$/.test(line)) return line;
      const hit = lookup(line, targetLang);
      if (hit) {
        translatedLines = true;
        return hit;
      }
      return line;
    });
    if (translatedLines) return transformedLines.join("");
  }

  return null;
}

type Ctx = {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (ar: string) => string;
};

const LangContext = createContext<Ctx>({
  lang: "ar",
  dir: "rtl",
  setLang: () => {},
  toggle: () => {},
  t: (ar) => ar,
});

export const useLang = () => useContext(LangContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const textNodes = useRef(new Map<Text, string>());
  const attrNodes = useRef(new Map<Element, Record<string, string>>());

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      setLangState(saved);
    }
  }, []);

  const applyLanguage = useCallback((root: Node, currentLang: Lang) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = (node as Text).parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest("script,style,noscript,[data-no-translate]"))
          return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let node = walker.nextNode() as Text | null;
    while (node) {
      if (!textNodes.current.has(node) && node.nodeValue) {
        textNodes.current.set(node, node.nodeValue);
      }
      const original = textNodes.current.get(node) ?? node.nodeValue ?? "";
      if (currentLang === "ar") {
        if (node.nodeValue !== original) {
          node.nodeValue = original;
        }
      } else {
        const next = translate(original, currentLang);
        if (next) {
          const lead = /^\s*/.exec(original)?.[0] ?? "";
          const trail = /\s*$/.exec(original)?.[0] ?? "";
          const value = lead + next + trail;
          if (node.nodeValue !== value) {
            node.nodeValue = value;
          }
        }
      }
      node = walker.nextNode() as Text | null;
    }

    const scope = root instanceof Element ? root : document.body;
    const elements = [
      ...(root instanceof Element ? [root] : []),
      ...scope.querySelectorAll<HTMLElement>("*"),
    ];
    for (const el of elements) {
      if (el.closest("[data-no-translate]")) continue;
      for (const attr of ATTRS) {
        const current = el.getAttribute(attr);
        if (!current) continue;
        if (!attrNodes.current.get(el)?.[attr]) {
          const bucket = attrNodes.current.get(el) ?? {};
          bucket[attr] = current;
          attrNodes.current.set(el, bucket);
        }
        const original = attrNodes.current.get(el)?.[attr] ?? current;
        if (currentLang === "ar") {
          if (current !== original) {
            el.setAttribute(attr, original);
          }
        } else {
          const next = translate(original, currentLang);
          if (next && current !== next) {
            el.setAttribute(attr, next);
          }
        }
      }
    }
  }, []);

  const restoreArabic = useCallback(() => {
    for (const [node, original] of textNodes.current) {
      if (node.isConnected && node.nodeValue !== original) {
        node.nodeValue = original;
      }
    }
    for (const [el, attrs] of attrNodes.current) {
      if (el.isConnected) {
        for (const [attr, original] of Object.entries(attrs)) {
          if (el.getAttribute(attr) !== original) {
            el.setAttribute(attr, original);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";

    if (lang === "ar") {
      restoreArabic();
    } else {
      restoreArabic();
      applyLanguage(document.body, lang);
    }

    let timer: number | null = null;
    const observer = new MutationObserver(() => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (lang === "ar") {
          restoreArabic();
        } else {
          applyLanguage(document.body, lang);
        }
      }, 50);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRS],
    });

    return () => {
      if (timer) window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [lang, applyLanguage, restoreArabic]);

  const setLang = useCallback((next: Lang) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      toggle: () => setLang(lang === "ar" ? "en" : "ar"),
      t: (ar: string) => (lang === "ar" ? ar : (translate(ar, lang) ?? ar)),
    }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
