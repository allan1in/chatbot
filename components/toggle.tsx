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

type ToggleProps = Omit<
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

export function Toggle({
  iconA,
  iconB,
  onChange,
  tooltip,
  side = "bottom",
  autoResetDelay,
  className,
  ...buttonProps
}: ToggleProps) {
  const [isA, setIsA] = useState(true);
  const autoResetRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const iconName = isA ? iconA : iconB;

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
        className={cn("cursor-pointer", className)}
        {...buttonProps}
      >
        <DynamicIcon name={iconName} className="size-4" />
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
