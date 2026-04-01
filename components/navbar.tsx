"use client";

import { ButtonTheme } from "./button-theme";

export function Navbar() {
  return (
    <nav className="fixed top-0 right-0 bg-background w-full h-14 flex items-center justify-between">
      <span className="text-foreground px-4">Chatbot</span>
      <div className="px-4">
        <ButtonTheme />
      </div>
    </nav>
  );
}
