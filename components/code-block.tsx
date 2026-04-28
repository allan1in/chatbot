"use client";

import React, { memo, useState, useEffect, useRef } from "react";
import { ToggleCopy } from "./toggle-copy";

// ============================================================
// Worker 返回的 token 类型
// ============================================================
interface WorkerToken {
  content: string;
  types: string[];
}

type WorkerLine = WorkerToken[];

// ============================================================
// Worker 代码（内联，Blob URL 加载，避免 Next.js 编译问题）
// ============================================================
const WORKER_SOURCE = `
const LANG_DEFS = {
  js: {
    keywords: "async await break case catch class const continue debugger default delete do else enum export extends finally for function if import in instanceof let new of return static super switch this throw try typeof var void while with yield".split(" "),
    patterns: [
      [/\\/\\/.*/, "comment"],
      [/\\/\\*[\\s\\S]*?\\*\\//, "comment"],
      [/"[^"]*"/, "string"],
      [/\`[^\`]*\`/, "string"],
      [/'[^']*'/, "string"],
      [/\\b(0[xX][\\da-f]+|0[bB][01]+|0[oO][0-7]+)\\b/, "number"],
      [/\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b/, "number"],
    ],
  },
  py: {
    keywords: "and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(" "),
    patterns: [
      [/#.*/, "comment"],
      [/"""/, "string"],
      [/'''/, "string"],
      [/"[^"]*"/, "string"],
      [/'[^']*'/, "string"],
      [/\\b(0[xX][\\da-f]+|0[bB][01]+|0[oO][0-7]+)\\b/, "number"],
      [/\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b/, "number"],
      [/@\\w+/, "decorator"],
    ],
  },
  html: {
    patterns: [
      [/<!--[\\s\\S]*?-->/, "comment"],
      [/<\\/?[\\w-]+(?:\\s[^>]*)?\\/?>/, "tag"],
      [/"[^"]*"/, "string"],
      [/'[^']*'/, "string"],
    ],
  },
  css: {
    patterns: [
      [/\\/\\*[\\s\\S]*?\\*\\//, "comment"],
      [/@\\w+(?:[^{};]*[;{])/, "atrule"],
      [/\\.?[\\w-]+(?=\\s*\\{)/, "class-name"],
      [/#[0-9a-fA-F]{3,8}\\b/, "number"],
      [/"[^"]*"/, "string"],
      [/'[^']*'/, "string"],
    ],
  },
};

var LANG_ALIAS = {
  javascript: "js", jsx: "js", mjs: "js", cjs: "js", es6: "js",
  typescript: "js", tsx: "js", ts: "js",
  python: "py", rust: "py", rs: "py", go: "py", java: "py", cpp: "py",
  c: "py", csharp: "py", cs: "py", php: "py", ruby: "py", rb: "py",
  swift: "py", kotlin: "py", kt: "py", scala: "py", dart: "py",
  sql: "py", sh: "py", bash: "py", zsh: "py", shell: "py",
  yaml: "py", yml: "py", toml: "py", ini: "py", json: "py",
  md: "py", markdown: "py", text: "py", txt: "py",
  html: "html", htm: "html", xhtml: "html", xml: "html", svg: "html",
  css: "css", scss: "css", sass: "css", less: "css",
};

function resolveLang(name) {
  return LANG_DEFS[name] || LANG_DEFS[LANG_ALIAS[name]] || null;
}

// 增量缓存
var prevCode = null;
var prevLines = [];

// 逐行分词器
function tokenizeLine(line, def, keywordSet) {
  var tokens = [];
  var pos = 0;

  while (pos < line.length) {
    var matched = false;

    if (def.patterns) {
      for (var pi = 0; pi < def.patterns.length; pi++) {
        var pattern = def.patterns[pi];
        var re = pattern[0];
        var type = pattern[1];
        re.lastIndex = 0;
        var m = re.exec(line.substring(pos));
        if (m && m.index === 0) {
          tokens.push({ content: m[0], types: [type] });
          pos += m[0].length;
          matched = true;
          break;
        }
      }
      if (matched) continue;
    }

    var ch = line[pos];

    if (/[a-zA-Z_]/.test(ch)) {
      var word = "";
      while (pos < line.length && /[a-zA-Z0-9_]/.test(line[pos])) { word += line[pos]; pos++; }
      if (keywordSet[word]) {
        tokens.push({ content: word, types: ["keyword"] });
      } else {
        if (line.substring(pos).trim().startsWith("(")) {
          tokens.push({ content: word, types: ["function"] });
        } else {
          tokens.push({ content: word, types: [] });
        }
      }
    }
    else if (/\\d/.test(ch)) {
      var num = "";
      while (pos < line.length && /[0-9a-fA-F.xXbBoO]/.test(line[pos])) { num += line[pos]; pos++; }
      tokens.push({ content: num, types: ["number"] });
    }
    else if (/["'\`]/.test(ch)) {
      var quote = ch;
      var str = quote;
      pos++;
      while (pos < line.length) {
        if (line[pos] === "\\\\") { str += line[pos]; pos++; if (pos < line.length) { str += line[pos]; pos++; } }
        else if (line[pos] === quote) { str += quote; pos++; break; }
        else { str += line[pos]; pos++; }
      }
      tokens.push({ content: str, types: ["string"] });
    }
    else if (/[-+*\\/%=<>!&|^~?:]/.test(ch)) {
      var op = ch;
      pos++;
      if (pos < line.length && /[-+*\\/%=<>!&|^~?]/.test(line[pos])) { op += line[pos]; pos++; }
      if (pos < line.length && line[pos] === "=") { op += "="; pos++; }
      tokens.push({ content: op, types: ["operator"] });
    }
    else if (/[{}[\\]();,.]/.test(ch)) {
      tokens.push({ content: ch, types: ["punctuation"] });
      pos++;
    }
    else {
      tokens.push({ content: ch, types: [] });
      pos++;
    }
  }
  return tokens;
}

onmessage = function(e) {
  var data = e.data;
  var code = data.code;
  var language = data.language;
  var id = data.id;

  try {
    var def = resolveLang(language);
    if (!def) {
      var plain = code.split("\\n").map(function(l) { return l ? [{ content: l, types: [] }] : []; });
      postMessage({ id: id, lines: plain, success: true });
      return;
    }

    var keywordSet = {};
    if (def.keywords) def.keywords.forEach(function(k) { keywordSet[k] = true; });

    var lines = code.split("\\n");

    // === 增量分词：逐行对比，只处理新增或变化行 ===
    var startIdx = 0;

    if (prevCode) {
      // 找到第一行不同的位置
      for (var li = 0; li < prevLines.length && li < lines.length; li++) {
        if (lines[li] !== prevCode.split("\n")[li]) {
          startIdx = li;
          break;
        }
        startIdx = li + 1; // 遍历到最后一行的下一格
      }
      // 纯追加：已有行都没变
      if (lines.length > prevLines.length && startIdx >= prevLines.length) {
        startIdx = prevLines.length;
      }
      // 从 startIdx 开始重新分词
      prevLines = prevLines.slice(0, startIdx);
      for (var li = startIdx; li < lines.length; li++) {
        prevLines.push(tokenizeLine(lines[li], def, keywordSet));
      }
    } else {
      prevLines = [];
      for (var li = 0; li < lines.length; li++) {
        prevLines.push(tokenizeLine(lines[li], def, keywordSet));
      }
    }
    prevCode = code;

    // 分块发送：只发送新增/变化的部分
    var CHUNK_SIZE = 1;
    var sendFrom = startIdx;
    for (var ci = sendFrom; ci < prevLines.length; ci += CHUNK_SIZE) {
      var chunk = prevLines.slice(ci, ci + CHUNK_SIZE);
      postMessage({ id: id, lines: chunk, offset: ci, success: true });
    }
  } catch (err) {
    var fallback = code.split("\\n").map(function(l) { return l ? [{ content: l, types: [] }] : []; });
    var CHUNK_SIZE2 = 1;
    for (var ci2 = 0; ci2 < fallback.length; ci2 += CHUNK_SIZE2) {
      postMessage({ id: id, lines: fallback.slice(ci2, ci2 + CHUNK_SIZE2), offset: ci2, success: true });
    }
  }
};
`;

function createWorker() {
  try {
    const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    return worker;
  } catch {
    return null;
  }
}

// ============================================================
// oneDark 主题色映射
// ============================================================
const DEFAULT_COLOR = "hsl(220, 14%, 71%)";

const STYLE_MAP: Record<string, React.CSSProperties> = {
  comment: { color: "hsl(220, 10%, 40%)", fontStyle: "italic" },
  prolog: { color: "hsl(220, 10%, 40%)" },
  cdata: { color: "hsl(220, 10%, 40%)" },
  doctype: { color: DEFAULT_COLOR },
  punctuation: { color: DEFAULT_COLOR },
  entity: { color: DEFAULT_COLOR },
  "attr-name": { color: "hsl(29, 54%, 61%)" },
  "class-name": { color: "hsl(29, 54%, 61%)" },
  boolean: { color: "hsl(29, 54%, 61%)" },
  constant: { color: "hsl(29, 54%, 61%)" },
  number: { color: "hsl(29, 54%, 61%)" },
  atrule: { color: "hsl(29, 54%, 61%)" },
  keyword: { color: "hsl(286, 60%, 67%)" },
  property: { color: "hsl(355, 65%, 65%)" },
  tag: { color: "hsl(355, 65%, 65%)" },
  symbol: { color: "hsl(355, 65%, 65%)" },
  deleted: { color: "hsl(355, 65%, 65%)" },
  important: { color: "hsl(355, 65%, 65%)" },
  selector: { color: "hsl(95, 38%, 62%)" },
  string: { color: "hsl(95, 38%, 62%)" },
  char: { color: "hsl(95, 38%, 62%)" },
  builtin: { color: "hsl(95, 38%, 62%)" },
  inserted: { color: "hsl(95, 38%, 62%)" },
  regex: { color: "hsl(95, 38%, 62%)" },
  "attr-value": { color: "hsl(95, 38%, 62%)" },
  variable: { color: "hsl(207, 82%, 66%)" },
  operator: { color: "hsl(207, 82%, 66%)" },
  function: { color: "hsl(207, 82%, 66%)" },
  url: { color: "hsl(187, 47%, 55%)" },
};

function getTokenStyle(types: string[]): React.CSSProperties {
  for (const type of types) {
    const style = STYLE_MAP[type];
    if (style) return style;
  }
  return { color: DEFAULT_COLOR };
}

// ============================================================
// 组件
// ============================================================
export const CodeBlock = memo(function CodeBlock({
  language,
  code,
}: {
  language: string;
  code: string;
}) {
  const [workerLines, setWorkerLines] = useState<WorkerLine[] | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const pendingIdRef = useRef(0);
  const codeRef = useRef('');
  const initAttempted = useRef(false);

  // 初始化 Worker（仅挂载时一次）
  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    const worker = createWorker();
    if (!worker) return;

    worker.onmessage = (e: MessageEvent) => {
      const { id, lines, offset, success } = e.data;
      if (success && id === pendingIdRef.current) {
        setWorkerLines(prev => {
          const next = prev ? [...prev] : [];
          while (next.length < offset + lines.length) next.push([]);
          lines.forEach((line: WorkerLine, i: number) => {
            next[offset + i] = line;
          });
          return next;
        });
      }
    };

    worker.onerror = () => {
      worker?.terminate();
      workerRef.current = null;
    };

    workerRef.current = worker;

    // 立即发送初始代码（静态加载场景）
    if (code) {
      const id = performance.now();
      pendingIdRef.current = id;
      codeRef.current = code;
      worker.postMessage({ code, language, id });
    }

    return () => {
      worker?.terminate();
    };
  }, []);

  // RAF 节流：每帧只发一次 Worker 请求
  const rafRef = useRef(0);

  useEffect(() => {
    if (!workerRef.current) return;
    if (code === codeRef.current) return;
    codeRef.current = code;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const id = performance.now();
      pendingIdRef.current = id;
      workerRef.current?.postMessage({ code: codeRef.current, language, id });
    });
  });

  // --- 渲染策略：三段式 ---
  const codeLines = code.split('\n');
  const allLinesReady = workerLines && workerLines.length >= codeLines.length;

  const codeContent = !workerLines
    ? code
    : allLinesReady
    ? workerLines.map((line, i) => (
        <div key={i}>
          {line.length > 0
            ? line.map((token, j) => (
                <span key={j} style={getTokenStyle(token.types)}>
                  {token.content}
                </span>
              ))
            : '\u00A0'}
        </div>
      ))
    : codeLines.map((line, i) => {
        const tokens = workerLines[i];
        if (tokens && tokens.length > 0) {
          return (
            <div key={i}>
              {tokens.map((token, j) => (
                <span key={j} style={getTokenStyle(token.types)}>
                  {token.content}
                </span>
              ))}
            </div>
          );
        }
        return <div key={i}>{line || '\u00A0'}</div>;
      });

  return (
    <div className="group relative my-6 rounded-xl overflow-hidden border border-border bg-[hsl(220,13%,18%)]">
      <div className="flex items-center justify-between px-4 py-2 bg-[hsl(220,13%,18%)] border-b border-border/20">
        <span className="text-[hsl(220,10%,40%)] text-xs font-mono font-medium">
          {language}
        </span>
        <ToggleCopy
          content={code}
          iconA="copy"
          iconB="check"
          className="flex items-center"
          autoResetDelay={3000}
        />
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed scrollbar-thin text-[hsl(220,14%,71%)]">
        <code>{codeContent}</code>
      </pre>
    </div>
  );
});

CodeBlock.displayName = "CodeBlock";
