"use client";

import { useTheme } from "next-themes";
import { Toggle } from "./toggle";

export function Navbar() {
  const { setTheme } = useTheme();

  const handleThemeToggle = (isLight: boolean) => {
    const newTheme = isLight ? "light" : "dark";
    setTheme(newTheme);
  };

  return (
    <nav className="fixed top-0 right-0 bg-background w-full h-14 flex items-center justify-between">
      <span className="font-semibold text-foreground px-4">Chatbot</span>
      <div className="px-4">
        <Toggle
          iconA="sun"
          iconB="moon"
          tooltip="切换主题"
          onChange={handleThemeToggle}
        />
      </div>
    </nav>
  );
}
