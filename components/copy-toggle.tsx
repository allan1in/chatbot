"use client";

import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useState } from "react";

interface CopyToggleProps {
  text: string;
  align?: "left" | "right";
  className?: string;
}

export function CopyToggle({ text, align = "left", className }: CopyToggleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (text) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={handleCopy}
        className={cn(
          "relative cursor-pointer p-2 rounded-[var(--radius-md)] transition-all duration-200",
          "hover:bg-accent text-muted-foreground hover:text-foreground",
          align === "left" ? "self-start" : "self-end",
          className
        )}
      >
        <Copy className={cn(
          "w-4 h-4 transition-all duration-200",
          copied ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
        )} />
        <Check className={cn(
          "absolute top-2 left-2 w-4 h-4 transition-all duration-200",
          copied ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"
        )} />
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={10}>
        {copied ? "已复制" : "复制"}
      </TooltipContent>
    </Tooltip>
  );
}
