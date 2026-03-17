"use client";

import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar({
  offsetLeft = 0,
}: {
  offsetLeft?: number;
}) {
  return (
    <nav
      className="fixed top-0 right-0 z-50 bg-background backdrop-blur-sm transition-all duration-250 ease-in"
      style={{ left: offsetLeft }}
    >
      <div className="mx-auto h-14 grid grid-cols-[1fr_auto_1fr] items-center">
        <span className="font-semibold text-foreground ml-4">Chatbot</span>
        <span />
        <div className="justify-self-end mr-2.5">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
