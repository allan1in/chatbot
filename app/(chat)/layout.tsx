import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { ChatProvider } from "../contexts/chat-list-context";
import { FirstMsgProvider } from "../contexts/first-message-context";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <FirstMsgProvider>
        <ChatProvider>
          <div className="flex h-dvh w-full">
            <AppSidebar />
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
              {children}
            </div>
          </div>
        </ChatProvider>
      </FirstMsgProvider>
    </SidebarProvider>
  );
}
