import { cn } from "@/lib/utils";

export function Avatar({ className }: { className?: string }) {
  return (
    <div
      className={cn("w-11 h-11 rounded-full", className)}
    >
    </div>
  );
}