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
  // 核心优化：使用 throttledCode 来避免由于流式输出导致的频繁解析
  const [throttledCode, setThrottledCode] = useState(code);
  const lastUpdateTimeRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 每次 code 变化时，尝试进行节流更新
    const throttleMs = 500; // 500ms 更新一次解析，平衡实时感和性能
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

    // 清除之前的待执行更新，防止堆积
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (timeSinceLastUpdate >= throttleMs) {
      // 如果距离上次更新已超过阈值，立即更新
      setThrottledCode(code);
      lastUpdateTimeRef.current = now;
    } else {
      // 否则，计划在阈值到达时更新（trailing edge throttle）
      const delay = throttleMs - timeSinceLastUpdate;
      timeoutRef.current = setTimeout(() => {
        setThrottledCode(code);
        lastUpdateTimeRef.current = Date.now();
      }, delay);
    }

    // 组件卸载时清理定时器
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [code]);

  // 确保 language 变化时立即更新（虽然 language 通常不会变）
  useEffect(() => {
    setThrottledCode(code);
  }, [language]);

  return (
    <div className={cn("group relative my-6 rounded-xl overflow-hidden border border-border bg-muted", className)}>
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium">
            {language}
          </span>
        </div>
        <ToggleCopy 
          content={code} // 复制时依然使用完整的原始 code
          iconA="copy" 
          iconB="check" 
          className="flex items-center"
          autoResetDelay={3000}
        />
      </div>
      
      <Highlight
        theme={themes.vsDark}
        code={throttledCode} // 使用节流后的代码进行高亮解析
        language={language}
      >
        {({ className: prismClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre 
            className={cn(prismClassName, "p-4 overflow-x-auto text-sm font-mono leading-relaxed scrollbar-thin")} 
            style={style}
          >
            <code>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line, key: i })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token, key })} />
                  ))}
                </div>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
});

CodeBlock.displayName = "CodeBlock";
