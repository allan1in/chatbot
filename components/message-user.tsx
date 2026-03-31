import { cn } from "@/lib/utils";
import { Toggle } from "./toggle";

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
    <div
      id={id}
      className={cn("flex items-end animate-slide-in-right flex-col gap-2", className)}
    >
      <div className="bg-primary text-primary-foreground py-2 px-4 rounded-lg leading-7 min-h-10 max-w-full whitespace-pre-wrap break-all flex items-center">
        {message}
      </div>
      <div className="flex items-center justify-end">
        <Toggle iconA="copy" iconB="check" tooltip="复制" autoResetDelay={3000}/>
      </div>
    </div>
  );
}
