"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HistoryIcon,
  PlusIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LoadingDots } from "@/components/loading-dots";
import { cn } from "@/lib/utils";

type ChatItem = {
  id: string;
  title: string;
};

export function AppSidebar() {
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [chats, setChats] = useState<ChatItem[]>([]);

  useEffect(() => {
    async function fetchChats() {
      try {
        const response = await fetch("/api/chats");
        if (!response.ok) {
          return;
        }

        const data: ChatItem[] = await response.json();
        setChats(data);
      } catch (error) {
        console.error("Failed to fetch chats", error);
      } finally {
        setIsLoadingChats(false);
      }
    }

    fetchChats();
  }, []);

  return (
    <Sidebar className="h-dvh" >
      <SidebarContent className="flex h-full flex-col">
        <div className="border-b border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-10" render={<Link href="/" />}>
                <PlusIcon />
                <span>新对话</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        <SidebarGroup className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SidebarGroupLabel className="text-sm h-10 p-2 flex items-center gap-2">
            <HistoryIcon className="size-4" />
            <span>对话</span>
          </SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0 flex-1 overflow-y-auto">
            {isLoadingChats ? (
              <div className="flex h-full min-h-24 items-center justify-center px-3 text-sidebar-foreground/70">
                <LoadingDots className="text-sidebar-foreground/70" />
              </div>
            ) : (
              <SidebarMenu>
                {chats.map((item, index) => (
                  <SidebarMenuItem 
                    key={item.id}
                    style={{
                      animation: `slide-in-left 0.4s ease-out ${index * 50}ms forwards`,
                      opacity: 0,
                    }}
                  >
                    <SidebarMenuButton
                      render={<Link href={`/${item.id}`} />}
                      className={cn("w-full h-10")}
                    >
                      <span className="text-sm">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
