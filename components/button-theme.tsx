import { Moon, Sun, Check } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ButtonTheme() {
  const { setTheme, theme } = useTheme();

  const themes = ["light", "dark", "system"];
  const themeLabels = { light: "明亮", dark: "暗黑", system: "跟随系统" };

  return (
    <Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                >
                  <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                  <span className="sr-only">切换主题</span>
                </Button>
              }
            />
          }
        />
        <DropdownMenuContent align="end">
          {themes.map((t) => (
            <DropdownMenuItem
              key={t}
              className="cursor-pointer"
              onClick={() => setTheme(t)}
            >
              {themeLabels[t as keyof typeof themeLabels]}
              {theme === t && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <TooltipContent>切换主题</TooltipContent>
    </Tooltip>
  );
}
