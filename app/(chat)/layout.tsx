"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full">
        <AppSidebar />
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </SidebarProvider>
  );
}
