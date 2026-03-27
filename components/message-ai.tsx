import { cn } from "@/lib/utils";

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
        "flex max-w-full animate-slide-in-left flex-col",
        className,
      )}
      style={{ minHeight: minHeight ? `${minHeight}px` : undefined }}
    >
      <div className="py-2 rounded-lg leading-7 min-h-10 max-w-full whitespace-pre-wrap break-all flex items-center text-foreground">
        {message}
      </div>
    </div>
  );
}
