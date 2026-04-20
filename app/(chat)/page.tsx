"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Input } from "@/components/input";
import MessageList from "@/components/message-list";
import { Navbar } from "@/components/navbar";
import { useChatList } from "@/app/contexts/chat-list-context";
import { useActiveChat } from "@/app/contexts/active-chat-context";

export default function NewChat() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { addChat, updateChat } = useChatList();
  const { messages, sendMessage, status, error, chatId } = useActiveChat();

  const handleSend = async (inputText: string) => {
    // 1. 生成新 chatId（如果是真的新对话）
    const newChatId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);

    // 2. 立刻添加到聊天列表
    addChat({ id: newChatId, title: "新对话" });
    
    // 3. 发送消息
    sendMessage({ text: inputText }, { body: { chatId: newChatId } });

    // 4. 后台生成标题
    fetch("/api/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: inputText, chatId: newChatId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { title?: string } | null) => {
        const title = data?.title?.trim() || "新对话";
        updateChat(newChatId, { title });
      })
      .catch((err) => console.error("Failed to generate title", err));

    // 5. ✅ 路由到新对话
    //    ActiveChatProvider 会自动检测 URL 变化，从 API 加载消息
    //    不会闪烁因为消息已经在 useChat 的内存中
    startTransition(() => {
      router.push(`/chat/${newChatId}`);
    });
  };

  return (
    <>
      <Navbar title={chatTitle} isTitleLoading={false} />
      <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-start">
        <div className="relative min-h-0 w-full flex-1">
          <MessageList
            className="h-full min-h-0 overflow-auto"
            messages={messages}
            status={status}
            error={error}
            loading={false}
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
