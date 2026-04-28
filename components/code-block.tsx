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
  const codeRef = useRef(code);
  const initAttempted = useRef(false);

  // 初始化 Worker（仅挂载时一次）
  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    let worker: Worker | null = null;
    try {
      worker = new Worker(
        new URL("./prism.worker.ts", import.meta.url),
        { type: "module" },
      );

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
    } catch {
      worker = null;
    }
    workerRef.current = worker;

    return () => {
      worker?.terminate();
    };
  }, []);

  // RAF 节流：每帧只发一次 Worker 请求
  // 流式过程中每次代码变化只节流到 60fps，Worker 在后台逐帧 tokenize
  const rafRef = useRef(0);

  useEffect(() => {
    if (!workerRef.current) return;
    if (code === codeRef.current) return;
    codeRef.current = code;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      // 每次 RAF 发送最新完整代码给 Worker
      // Worker 是后台线程，不影响主线程
      // chunk 机制保证结果逐步到达，不会一次性大规模 re-render
      const id = performance.now();
      pendingIdRef.current = id;
      workerRef.current?.postMessage({ code: codeRef.current, language, id });
    });
  });

  const hasHighlight = workerLines && workerLines.length > 0;

  const codeContent = hasHighlight ? (
    workerLines!.map((line, i) => (
      <div key={i}>
        {line.length > 0
          ? line.map((token, j) => (
              <span key={j} style={getTokenStyle(token.types)}>
                {token.content}
              </span>
            ))
          : "\u00A0"}
      </div>
    ))
  ) : (
    code
  );

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
