"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={toggleTheme}
        className={cn(
          "relative p-2 rounded-[var(--radius-md)] transition-all duration-300",
          "cursor-pointer hover:bg-accent text-muted-foreground hover:text-foreground",
          className
        )}
        aria-label="切换主题"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute top-2 left-2 h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        {theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
      </TooltipContent>
    </Tooltip>
  );
}
