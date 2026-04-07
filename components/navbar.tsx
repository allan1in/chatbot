"use client";

import { ButtonTheme } from "./button-theme";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface NavbarProps {
  title?: string;
}

export function Navbar({ title = "Chatbot" }: NavbarProps) {
  return (
    <nav className="bg-background w-full h-14">
      <div className="grid h-full w-full grid-cols-[auto_1fr_auto] items-center px-4">
        <SidebarTrigger className="h-8 w-8 cursor-pointer" />
        <h1
          className="justify-self-center text-foreground"
          title={title}
        >
          {title}
        </h1>
        <div className="justify-self-end">
          <ButtonTheme />
        </div>
      </div>
    </nav>
  );
}
