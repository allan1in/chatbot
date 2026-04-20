"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatProvider } from "../contexts/chat-list-context";
import { ActiveChatProvider } from "../contexts/active-chat-context";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ChatProvider>
        <ActiveChatProvider>
          <div className="flex h-dvh w-full">
            <AppSidebar />
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
              {children}
            </div>
          </div>
        </ActiveChatProvider>
      </ChatProvider>
    </SidebarProvider>
  );
}
