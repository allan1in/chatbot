"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Ellipsis, HistoryIcon, PlusIcon, Trash } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { LoadingDots } from "@/components/loading-dots";
import { cn } from "@/lib/utils";
import { useChatList } from "@/app/contexts/chat-list-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";

export function AppSidebar() {
  const { chats, isLoadingChats, removeChat } = useChatList();
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile } = useSidebar();

  async function handleDeleteChat(chatId: string) {
    try {
      const response = await fetch(`/api/chats?id=${chatId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return;
      }

      removeChat(chatId);

      if (pathname === `/${chatId}`) {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to delete chat", error);
    }
  }

  return (
    <Sidebar className="h-dvh">
      <SidebarContent className="flex h-full flex-col">
        <div className="border-b border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                isActive={pathname === "/"}
                render={<Link href="/" />}
              >
                <PlusIcon />
                <span>新对话</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        <SidebarGroup className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div className="p-2">
            <SidebarGroupLabel className="text-sm h-10 p-2 flex items-center gap-2">
              <HistoryIcon className="size-4" />
              <span>对话</span>
            </SidebarGroupLabel>
          </div>
          <div className="pl-2 min-h-0 flex-1 overflow-y-auto scrollbar-thin [scrollbar-gutter:stable]">
            <SidebarGroupContent className="h-full">
              {isLoadingChats ? (
                <div className="flex h-full min-h-24 items-center justify-center px-3 text-sidebar-foreground/70">
                  <LoadingDots className="text-sidebar-foreground/70" />
                </div>
              ) : (
                <SidebarMenu>
                  {chats.map((item) =>
                    item.loading ? (
                      <Skeleton
                        key={item.id}
                        className="h-10 w-full rounded-md animate-in fade-in duration-300 ease-out"
                      />
                    ) : (
                      <SidebarMenuItem
                        key={item.id}
                        className={cn(
                          "opacity-0 animate-[slide-in-left_0.3s_ease-out_forwards]",
                        )}
                      >
                        <SidebarMenuButton
                          isActive={pathname === `/${item.id}`}
                          size="lg"
                          render={<Link href={`/${item.id}`} />}
                        >
                          <span className="text-sm">{item.title}</span>
                        </SidebarMenuButton>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <SidebarMenuAction
                                showOnHover
                                className="rounded-sm data-[state=open]:bg-accent cursor-pointer"
                              />
                            }
                          >
                            <Ellipsis />
                            <span className="sr-only">More</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className="w-24 rounded-lg"
                            side={isMobile ? "bottom" : "right"}
                            align={isMobile ? "end" : "start"}
                          >
                            <DropdownMenuItem
                              className="cursor-pointer"
                              variant="destructive"
                              onClick={() => handleDeleteChat(item.id)}
                            >
                              <Trash />
                              <span>删除</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    ),
                  )}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </div>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
