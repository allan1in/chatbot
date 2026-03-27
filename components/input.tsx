"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon } from "lucide-react";

export function Input({
  className,
  onSend,
}: {
  className?: string;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (!value.trim()) {
      return;
    }
    onSend(value.trim());
    setValue("");
  };

  const textareaPlaceholder = "想聊些什么呢？";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // 防止在按下 Enter 键时触发换行
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        "border border-border focus-within:border-ring rounded-2xl p-4 flex flex-col justify-between gap-2 bg-background",
        className
      )}
    >
      <textarea
        className="border-none focus:outline-none w-full resize-none h-30 scrollbar-thin bg-transparent text-foreground placeholder:text-muted-foreground"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={textareaPlaceholder}
        onKeyDown={handleKeyDown}
      />
      <div className="w-full flex flex-row-reverse">
        <Button
          onClick={handleSend}
          size="icon-lg"
          className="rounded-full"
        >
          <ArrowUpIcon />
        </Button>
      </div>
    </div>
  );
}
