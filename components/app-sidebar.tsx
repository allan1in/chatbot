"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
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
import { cn } from "@/lib/utils";

type ChatItem = {
  id: string;
  title: string;
};

export function AppSidebar() {
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
      }
    }

    fetchChats();
  }, []);

  return (
    <Sidebar className="h-dvh">
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
          <SidebarGroupLabel className="text-sm h-10 p-2">所有对话</SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0 flex-1 overflow-y-auto">
            <SidebarMenu>
              {chats.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    render={<Link href={`/${item.id}`} />}
                    className={cn("w-full h-10")}
                  >
                    <span className="text-xl">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
