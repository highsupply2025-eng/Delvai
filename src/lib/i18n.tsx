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

export type Lang = "ar" | "en";

const STORAGE_KEY = "app.lang";
const ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

const MAP = new Map<string, string>();
for (const [ar, en] of Object.entries(AR_EN)) MAP.set(norm(ar), en);

function translate(value: string): string | null {
  const key = norm(value);
  if (!key) return null;
  const hit = MAP.get(key);
  if (hit) return hit;
  // strings that end with punctuation variations
  const stripped = key.replace(/[،.:!?]+$/u, "");
  const alt = MAP.get(stripped);
  if (alt) return alt + key.slice(stripped.length);

  // composed strings such as "label — state: value"
  if (/[—:|·]/.test(key)) {
    const parts = key.split(/\s*([—:|·])\s*/);
    let translated = false;
    const rebuilt = parts.map((part) => {
      if (/^[—:|·]$/.test(part)) return part === ":" ? ": " : ` ${part} `;
      const piece = MAP.get(norm(part));
      if (piece) translated = true;
      return piece ?? part;
    });
    if (translated) return rebuilt.join("").replace(/\s+/g, " ").trim();
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
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ar") setLangState(saved);
  }, []);

  const applyEnglish = useCallback((root: Node) => {
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
      const original = textNodes.current.get(node) ?? node.nodeValue ?? "";
      const next = translate(original);
      if (next) {
        const lead = /^\s*/.exec(original)?.[0] ?? "";
        const trail = /\s*$/.exec(original)?.[0] ?? "";
        const value = lead + next + trail;
        if (node.nodeValue !== value) {
          if (!textNodes.current.has(node)) textNodes.current.set(node, original);
          node.nodeValue = value;
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
        const saved = attrNodes.current.get(el)?.[attr] ?? current;
        const next = translate(saved);
        if (next && current !== next) {
          const bucket = attrNodes.current.get(el) ?? {};
          bucket[attr] = saved;
          attrNodes.current.set(el, bucket);
          el.setAttribute(attr, next);
        }
      }
    }
  }, []);

  const restoreArabic = useCallback(() => {
    for (const [node, original] of textNodes.current) {
      if (node.isConnected) node.nodeValue = original;
    }
    textNodes.current.clear();
    for (const [el, attrs] of attrNodes.current) {
      for (const [attr, original] of Object.entries(attrs)) {
        if (el.isConnected) el.setAttribute(attr, original);
      }
    }
    attrNodes.current.clear();
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";

    if (lang === "ar") {
      restoreArabic();
      return;
    }

    let frame = 0;
    const run = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => applyEnglish(document.body));
    };
    run();
    const observer = new MutationObserver(run);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRS],
    });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [lang, applyEnglish, restoreArabic]);

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
      t: (ar: string) => (lang === "en" ? (translate(ar) ?? ar) : ar),
    }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
