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
        <div className="bg-primary text-primary-foreground py-2 px-4 rounded-lg leading-7 min-h-10 max-w-full whitespace-pre-wrap break-all flex items-center">
          {message}
        </div>
    </div>
  );
}