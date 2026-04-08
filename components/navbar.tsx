"use client";

import { ButtonTheme } from "./button-theme";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface NavbarProps {
  title?: string;
  isTitleLoading?: boolean;
}

export function Navbar({ title, isTitleLoading = false }: NavbarProps) {
  const displayTitle = title?.trim() ? title : "新对话";

  return (
    <nav className="bg-background w-full h-14">
      <div className="grid h-full w-full grid-cols-[auto_1fr_auto] items-center px-4">
        <SidebarTrigger className="h-8 w-8 cursor-pointer" />
        <div className="justify-self-center transition-opacity duration-300 ease-out">
          {isTitleLoading ? (
            <Skeleton className="h-5 w-24 animate-in fade-in duration-300 ease-out" />
          ) : (
            <h1
              className="text-foreground animate-in fade-in duration-300 ease-out"
              title={displayTitle}
            >
              {displayTitle}
            </h1>
          )}
        </div>
        <div className="justify-self-end">
          <ButtonTheme />
        </div>
      </div>
    </nav>
  );
}
