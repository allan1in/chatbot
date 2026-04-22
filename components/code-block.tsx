"use client";

import React, { memo } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { ToggleCopy } from "./toggle-copy";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  language: string;
  code: string;
  className?: string;
}

export const CodeBlock = memo(({ language, code, className }: CodeBlockProps) => {
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
        {({ className: prismClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre 
            className={cn(prismClassName, "p-4 overflow-x-auto text-sm font-mono leading-relaxed scrollbar-thin")} 
            style={style}
          >
            <code>
              {tokens.map((line, i) => (
                <div {...getLineProps({ line, key: i })}>
                  {line.map((token, key) => (
                    <span {...getTokenProps({ token, key })} />
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