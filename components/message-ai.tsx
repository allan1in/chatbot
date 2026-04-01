"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { markdownComponents } from "./markdown-components";
import { ToggleCopy } from "./toggle-copy";

export function MessageAI({
  className,
  message,
  minHeight,
}: {
  className?: string;
  message?: string;
  minHeight?: number;
}) {

  return (
    <div
      className={cn(
        "flex max-w-full animate-slide-in-left flex-col gap-4 mb-4",
        className,
      )}
      style={{ minHeight: minHeight ? `${minHeight}px` : undefined }}
    >
      <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground/90 leading-7">
        <ReactMarkdown components={markdownComponents}>
          {message}
        </ReactMarkdown>
      </div>

      <div className="flex items-center justify-start">
        <ToggleCopy 
          content={message}
          iconA="copy" 
          iconB="check" 
          tooltip="复制全文"
          autoResetDelay={3000}
        />
      </div>
    </div>
  );
}