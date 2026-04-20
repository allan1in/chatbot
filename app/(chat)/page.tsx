"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Input } from "@/components/input";
import MessageList from "@/components/message-list";
import { Navbar } from "@/components/navbar";
import { useChatList } from "@/app/contexts/chat-list-context";
import { useActiveChat } from "@/app/contexts/active-chat-context";

export default function ChatPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { addChat, updateChat } = useChatList();
  const {
    messages,
    sendMessage,
    status,
    error,
    chatId,
    isLoading,
    chatTitle,
  } = useActiveChat();

  const handleSend = async (inputText: string) => {
    // 1. 如果是新对话，用当前的 chatId，立刻添加到聊天列表
    if (!chatId) return; // 不应该发生，但保护一下
    
    const isFirstMessage = messages.length === 0;
    
    if (isFirstMessage) {
      // 首条消息，添加到侧边栏
      addChat({ id: chatId, title: "新对话" });
    }

    // 2. 发送消息
    sendMessage({ text: inputText }, { body: { chatId } });

    // 3. 后台生成标题
    fetch("/api/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: inputText, chatId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { title?: string } | null) => {
        const title = data?.title?.trim() || "新对话";
        updateChat(chatId, { title });
      })
      .catch((err) => console.error("Failed to generate title", err));

    // 4. ✅ 如果是新对话，用 history.pushState 改 URL，不触发 Next.js 路由导航
    if (isFirstMessage && typeof window !== "undefined" && window.location.pathname === "/") {
      window.history.pushState({}, "", `/${chatId}`);
    }
  };

  return (
    <>
      <Navbar title={chatTitle} isTitleLoading={isLoading} />
      <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-start">
        <div className="relative min-h-0 w-full flex-1">
          <MessageList
            className="h-full min-h-0 overflow-auto"
            messages={messages}
            status={status}
            error={error}
            loading={isLoading}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-18 bg-linear-to-b from-background/0 to-background/80" />
        </div>
        <Input
          className="mb-4 w-[calc(100%-2rem)] max-w-3xl"
          onSend={handleSend}
          disabled={status !== "ready" && status !== "error"}
        />
      </main>
    </>
  );
}
