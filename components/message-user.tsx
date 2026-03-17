import { CopyToggle } from "./copy-toggle";
import { cn } from "@/lib/utils";

export function MessageUser({
  className,
  message,
  id,
}: {
  className?: string;
  message?: string;
  id?: string;
}) {
  return (
    <div id={id} className={cn("flex justify-end animate-slide-in-right", className)}>
      <div className="flex flex-col gap-2 items-end">
        <div className="bg-primary text-primary-foreground py-2 px-4 rounded-[var(--radius-lg)] leading-7 min-h-10 max-w-full whitespace-pre-wrap break-all flex items-center">
          {message}
        </div>
        {message && <CopyToggle text={message} align="right" />}
      </div>
    </div>
  );
}