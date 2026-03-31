import { cn } from "@/lib/utils";
import { Toggle } from "./toggle";

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
        "flex max-w-full animate-slide-in-left flex-col gap-2",
        className,
      )}
      style={{ minHeight: minHeight ? `${minHeight}px` : undefined }}
    >
      <div className="py-2 rounded-lg leading-7 min-h-10 max-w-full whitespace-pre-wrap break-all flex items-center text-foreground">
        {message}
      </div>
      <div className="flex items-center justify-start">
        <Toggle iconA="copy" iconB="check" tooltip="复制" autoResetDelay={3000}/>
      </div>
    </div>
  );
}
