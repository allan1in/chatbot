     1|"use client";
     2|
     3|import React, { memo, useRef, useEffect } from "react";
     4|import { Highlight, themes } from "prism-react-renderer";
     5|import { ToggleCopy } from "./toggle-copy";
     6|import { cn } from "@/lib/utils";
     7|
     8|interface CodeBlockProps {
     9|  language: string;
    10|  code: string;
    11|  className?: string;
    12|}
    13|
    14|export const CodeBlock = memo(({ language, code, className }: CodeBlockProps) => {
    15|  const renderCountRef = useRef(0);
    16|  const prevCodeRef = useRef(code);
    17|  
    18|  useEffect(() => {
    19|    if (process.env.NODE_ENV === 'development') {
    20|      renderCountRef.current += 1;
    21|      const prevCode = prevCodeRef.current;
    22|      const changed = prevCode !== code;
    23|      console.log(`[CodeBlock] render #${renderCountRef.current}, language: ${language}, code length: ${code.length}, changed: ${changed}`);
    24|      prevCodeRef.current = code;
    25|    }
    26|  });
    27|  
    28|  return (
    29|    <div className={cn("group relative my-6 rounded-xl overflow-hidden border border-border bg-muted", className)}>
    30|      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
    31|        <div className="flex items-center gap-2">
    32|          <span className="text-muted-foreground text-xs font-medium">
    33|            {language}
    34|          </span>
    35|        </div>
    36|        <ToggleCopy 
    37|          content={code}
    38|          iconA="copy" 
    39|          iconB="check" 
    40|          className="flex items-center"
    41|          autoResetDelay={3000}
    42|        />
    43|      </div>
    44|      
    45|      <Highlight
    46|        theme={themes.vsDark}
    47|        code={code}
    48|        language={language}
    49|      >
{({ className: prismClassName, style, tokens, getLineProps, getTokenProps }) => {
          const start = performance.now();
          const result = (
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
            console.log(`[CodeBlock] prism-render took ${end - start}ms, tokens: ${tokens.length}, lines: ${tokens.length}`);
          }
          return result;
        }}
    66|      </Highlight>
    67|    </div>
    68|  );
    69|});
    70|
    71|CodeBlock.displayName = "CodeBlock";