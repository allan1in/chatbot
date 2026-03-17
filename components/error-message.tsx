import { cn } from "@/lib/utils";

export function ErrorMessage({ className, message }: { className?: string; message: string }) {
  return (
    <div className={cn("animate-slide-in-left px-4 py-2 bg-destructive/10 border border-destructive/50 text-destructive rounded-[var(--radius-lg)] whitespace-pre-wrap break-all ", className)}>
      Error: {message}
    </div>
  );
}
