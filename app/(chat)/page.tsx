"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/input";
import MessageList from "@/components/message-list";
import { Navbar } from "@/components/navbar";
import { useChatList } from "@/app/contexts/chat-list-context";

export default function NewChat() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { addChat, updateChat } = useChatList();

  const [chatId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15)
  );

  const [chatTitle, setChatTitle] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/messages",
    }),
    id: chatId,
  });

  const handleSend = async (inputText: string) => {
    // 1. 立刻添加到聊天列表
    addChat({ id: chatId, title: "新对话" });
    
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
        setChatTitle(title);
        updateChat(chatId, { title });
      })
      .catch((err) => console.error("Failed to generate title", err));

    // 4. ✅ 绕过 Next.js 路由，直接用 History API 改 URL
    //    这样能避免 Next.js 路由的加载动画闪烁
    if (typeof window !== "undefined") {
      // 存当前消息到 sessionStorage，Chat[id] 页面会先从这里读
      sessionStorage.setItem(
        `chatbot:messages:${chatId}`,
        JSON.stringify(messages)
      );
      
      // 用 window.history.pushState 改 URL，绕过 Next.js 路由
      window.history.pushState({ chatId }, "", `/${chatId}`);
      
      // 然后手动触发 Next.js 导航到新的 chatId
      // 但此时 URL 已经改了，useParams 会读取新的 chatId
      // 这样可以避免路由层面的加载动画
      startTransition(() => {
        // 强制重新挂载 Chat[id] 组件
        router.refresh();
      });
    }
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
