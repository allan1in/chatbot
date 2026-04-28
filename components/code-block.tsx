"use client";

import React, { memo, useState, useEffect, useRef, useCallback } from "react";
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
// oneDark 主题色映射（完整还原 react-syntax-highlighter 的 oneDark）
// ============================================================
const DEFAULT_COLOR = "hsl(220, 14%, 71%)";

const STYLE_MAP: Record<string, React.CSSProperties> = {
  comment: { color: "hsl(220, 10%, 40%)", fontStyle: "italic" },
  prolog: { color: "hsl(220, 10%, 40%)" },
  cdata: { color: "hsl(220, 10%, 40%)" },
  doctype: { color: DEFAULT_COLOR },
  punctuation: { color: DEFAULT_COLOR },
  entity: { color: DEFAULT_COLOR },

  // Orange group
  "attr-name": { color: "hsl(29, 54%, 61%)" },
  "class-name": { color: "hsl(29, 54%, 61%)" },
  boolean: { color: "hsl(29, 54%, 61%)" },
  constant: { color: "hsl(29, 54%, 61%)" },
  number: { color: "hsl(29, 54%, 61%)" },
  atrule: { color: "hsl(29, 54%, 61%)" },

  // Purple group
  keyword: { color: "hsl(286, 60%, 67%)" },

  // Red group
  property: { color: "hsl(355, 65%, 65%)" },
  tag: { color: "hsl(355, 65%, 65%)" },
  symbol: { color: "hsl(355, 65%, 65%)" },
  deleted: { color: "hsl(355, 65%, 65%)" },
  important: { color: "hsl(355, 65%, 65%)" },

  // Green group
  selector: { color: "hsl(95, 38%, 62%)" },
  string: { color: "hsl(95, 38%, 62%)" },
  char: { color: "hsl(95, 38%, 62%)" },
  builtin: { color: "hsl(95, 38%, 62%)" },
  inserted: { color: "hsl(95, 38%, 62%)" },
  regex: { color: "hsl(95, 38%, 62%)" },
  "attr-value": { color: "hsl(95, 38%, 62%)" },

  // Blue group
  variable: { color: "hsl(207, 82%, 66%)" },
  operator: { color: "hsl(207, 82%, 66%)" },
  function: { color: "hsl(207, 82%, 66%)" },

  // Cyan group (URL etc.)
  url: { color: "hsl(187, 47%, 55%)" },
};

/** 根据 token 的 types 列表，按优先级取第一个匹配到的颜色样式 */
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
  const currentCodeRef = useRef(code);
  const lastResultRef = useRef<WorkerLine[] | null>(null);

  // 1. 初始化 Worker（仅挂载时一次）
  useEffect(() => {
    let worker: Worker | null = null;
    try {
      worker = new Worker(
        new URL("./prism.worker.ts", import.meta.url),
        { type: "module" },
      );

      worker.onmessage = (e: MessageEvent) => {
        const { id, lines, success } = e.data;
        if (success && id === pendingIdRef.current) {
          lastResultRef.current = lines;
          setWorkerLines(lines);
        }
      };

      worker.onerror = () => {
        worker?.terminate();
        workerRef.current = null;
      };
    } catch {
      // Worker 初始化失败，降级：始终显示纯文本
      worker = null;
    }
    workerRef.current = worker;

    return () => {
      worker?.terminate();
    };
  }, []);

  // 2. 每次 code 变化时，发送任务给 Worker
  // 使用 requestAnimationFrame 保证不与渲染帧冲突
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!workerRef.current) return;
    if (code === currentCodeRef.current) return;

    currentCodeRef.current = code;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const id = performance.now();
      pendingIdRef.current = id;
      workerRef.current?.postMessage({ code, language, id });
    });
  });

  // 3. 渲染
  const hasHighlight = workerLines && workerLines.length > 0;

  // 当 Worker 结果可用时，用高亮版本；否则显示纯文本（不卡主线程）
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
    // 纯文本 fallback — 零分词开销
    code
  );

  return (
    <div className="group relative my-6 rounded-xl overflow-hidden border border-border bg-[hsl(220,13%,18%)]">
      {/* 标题栏 */}
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

      {/* 代码区 */}
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed scrollbar-thin text-[hsl(220,14%,71%)]">
        <code>{codeContent}</code>
      </pre>
    </div>
  );
});

CodeBlock.displayName = "CodeBlock";
