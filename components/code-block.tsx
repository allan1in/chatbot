"use client";

import React, { memo, useState, useEffect, useRef } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { ToggleCopy } from "./toggle-copy";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  language: string;
  code: string;
  className?: string;
}

export const CodeBlock = memo(({ language, code, className }: CodeBlockProps) => {
  // 1. 状态管理
  // 核心：我们维护两个 code 状态。一个是原始的（用于逐字流式显示），一个是解析后的（用于高亮）
  const [highlightedTokens, setHighlightedTokens] = useState<any[] | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  // 2. Worker 引用
  const workerRef = useRef<Worker | null>(null);
  const lastProcessedCodeRef = useRef<string>("");
  const requestRef = useRef<number | null>(null);

  // 3. 初始化 Worker
  useEffect(() => {
    // 注意：在 Vite/Next.js 中，使用 new Worker(new URL('./path', import.meta.url)) 是标准做法
    // 但为了兼容性，我们假设环境支持这种方式
    try {
      workerRef.current = new Worker(new URL("./prism.worker.ts", import.meta.url), {
        type: 'module'
      });

      workerRef.current.onmessage = (e) => {
        const { tokens, success, error } = e.data;
        if (success) {
          setHighlightedTokens(tokens);
        } else {
          console.error("[CodeBlock Worker Error]", error);
        }
        setIsParsing(false);
      };
    } catch (err) {
      console.error("[CodeBlock] Failed to initialize Worker. Falling back to main thread.", err);
      workerRef.current = null;
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // 4. 监听 code 变化，调度 Worker 任务
  useEffect(() => {
    if (!workerRef.current) return;

    // 如果 code 没有变化，或者当前正在处理，则跳过（防止任务堆积）
    if (code === lastProcessedCodeRef.current) return;

    // 任务调度：由于 AI 吐字极快，我们不需要解析每一次变化，
    // 只要保证“解析”这个动作是异步且不阻塞的即可。
    // 我们使用 requestAnimationFrame 来确保解析任务不会过度挤占渲染帧。
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    requestRef.current = requestAnimationFrame(() => {
      setIsParsing(true);
      lastProcessedCodeRef.current = code;
      workerRef.current?.postMessage({
        language,
        code,
        id: Date.now() // 用于匹配请求
      });
    });

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [code, language]);

  return (
    <div className={cn("group relative my-6 rounded-xl overflow-hidden border border-border bg-muted", className)}>
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium">
            {language}
          </span>
        </div>
        <ToggleCopy 
          content={code} // 复制始终使用最原始、最完整的 code
          iconA="copy" 
          iconB="check" 
          className="flex items-center"
          autoResetDelay={3000}
        />
      </div>
      
      <Highlight
        theme={themes.vsDark}
        code={code} // 这里的 code 始终保持原始状态，保证逐字流式的丝滑感
        language={language}
      >
        {({ className: prismClassName, style, tokens, getLineProps, getTokenProps }) => {
          // 如果 Worker 还没解析完，或者我们没有解析结果，
          // 我们【不使用】Highlight 提供的 tokens，而是直接渲染原始代码
          // 这样既保证了逐字流式的流畅（因为没经过正则），又保证了不卡顿。
          
          if (!highlightedTokens || highlightedTokens.length === 0) {
            return (
              <pre className={cn(prismClassName, "p-4 overflow-x-auto text-sm font-mono leading-relaxed scrollbar-thin")} style={style}>
                <code>{code}</code>
              </pre>
            );
          }

          // 如果解析成功了，我们使用 Worker 返回的 tokens 进行高亮渲染
          return (
            <pre 
              className={cn(prismClassName, "p-4 overflow-x-auto text-sm font-mono leading-relaxed scrollbar-thin")} 
              style={style}
            >
              <code>
                {highlightedTokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line, key: i })}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token, key })} />
                    ))}
                  </div>
                ))}
              </code>
            </pre>
          );
        }}
      </Highlight>
    </div>
  );
});

CodeBlock.displayName = "CodeBlock";
