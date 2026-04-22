"use client";

import React, { memo, useRef, useEffect } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { ToggleCopy } from "./toggle-copy";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  language: string;
  code: string;
  className?: string;
}

export const CodeBlock = memo(({ language, code, className }: CodeBlockProps) => {
  const renderCountRef = useRef(0);
  const prevCodeRef = useRef(code);

  // 性能监控逻辑
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      renderCountRef.current += 1;
      const prevCode = prevCodeRef.current;
      const changed = prevCode !== code;
      console.log(`[CodeBlock] render #${renderCountRef.current}, lang: ${language}, len: ${code.length}, changed: ${changed}`);
      prevCodeRef.current = code;
    }
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
          content={code}
          iconA="copy" 
          iconB="check" 
          className="flex items-center"
          autoResetDelay={3000}
        />
      </div>
      
      <Highlight
        theme={themes.vsDark}
        code={code}
        language={language}
      >
        {({ className: prismClassName, style, tokens, getLineProps, getTokenProps }) => {
          const start = performance.now();
          const content = (
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
          );
          
          if (process.env.NODE_ENV === 'development') {
            const end = performance.now();
            console.log(`[CodeBlock] prism-render took ${(end - start).toFixed(2)}ms, tokens: ${tokens.length}, lines: ${tokens.length}`);
          }
          
          return content;
        }}
      </Highlight>
    </div>
  );
});

CodeBlock.displayName = "CodeBlock";
