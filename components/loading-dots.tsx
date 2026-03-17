import { cn } from "@/lib/utils";

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn("flex justify-start max-w-full animate-slide-in-left items-center gap-1.5", className)}>
      <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span className="w-2 h-2 bg-current rounded-full animate-bounce"></span>
    </div>
  );
}
