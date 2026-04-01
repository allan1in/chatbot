"use client";

import { useState, useRef, useEffect } from "react";
import { DynamicIcon, iconNames } from "lucide-react/dynamic";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type IconName = (typeof iconNames)[number];

type ToggleCopyProps = Omit<
  React.ComponentProps<typeof Button>,
  "children" | "onClick" | "onChange"
> & {
  iconA: IconName;
  iconB: IconName;
  side?: "top" | "right" | "bottom" | "left";
  onChange?: (isA: boolean) => void;
  tooltip?: string;
  autoResetDelay?: number;
};

export function ToggleCopy({
  iconA,
  iconB,
  onChange,
  tooltip,
  side = "bottom",
  autoResetDelay,
  className,
  ...buttonProps
}: ToggleCopyProps) {
  const [isA, setIsA] = useState(true);
  const autoResetRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleToggle = () => {
    if (autoResetDelay && !isA) {
      return;
    }

    const nextState = !isA;
    setIsA(nextState);
    onChange?.(nextState);

    if (autoResetDelay) {
      if (autoResetRef.current) {
        clearTimeout(autoResetRef.current);
      }
      autoResetRef.current = setTimeout(() => {
        setIsA(true);
        onChange?.(true);
      }, autoResetDelay);
    }
  };

  useEffect(() => {
    return () => {
      if (autoResetRef.current) {
        clearTimeout(autoResetRef.current);
      }
    };
  }, []);

  const button = (
    <div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-pressed={isA}
        aria-label="toggle"
        onClick={handleToggle}
        className={cn("cursor-pointer relative", className)}
        {...buttonProps}
      >
        <DynamicIcon
          name={iconA}
          className={cn(
            "size-4 absolute transition-all",
            isA ? "scale-100 rotate-0" : "scale-0 rotate-90"
          )}
        />
        <DynamicIcon
          name={iconB}
          className={cn(
            "size-4 absolute transition-all",
            isA ? "scale-0 -rotate-90" : "scale-100 rotate-0"
          )}
        />
      </Button>
    </div>
  );

  if (!tooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
