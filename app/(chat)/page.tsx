"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/input";
import MessageList from "@/components/message-list";
import { Navbar } from "@/components/navbar";
import { useChatList } from "@/app/contexts/chat-list-context";
import { useMessageContext } from "@/app/contexts/message-context";

export default function NewChat() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { addChat, updateChat } = useChatList();
  const { setPendingMessages } = useMessageContext();

  const [chatId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15)
  );

  const [chatTitle, setChatTitle] = useState("");
  const [shouldNavigate, setShouldNavigate] = useState(false);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/messages",
    }),
    id: chatId,
  });

  // 监听消息流完成，准备存到 Context 和路由
  useEffect(() => {
    if (shouldNavigate && status === "ready" && messages.length > 0) {
      // ✅ 这时 messages 是最新的完整消息
      setPendingMessages(chatId, messages);
      
      startTransition(() => {
        router.push(`/${chatId}`);
      });
      
      setShouldNavigate(false);
    }
  }, [shouldNavigate, status, messages, chatId, setPendingMessages, router]);

  const handleSend = async (inputText: string) => {
    // 立刻添加到聊天列表
    addChat({ id: chatId, title: "新对话" });
    
    // 发送消息（开始流式传输）
    sendMessage({ text: inputText }, { body: { chatId } });

    // 后台生成标题，不阻塞
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

    // 标记需要导航，useEffect 会监听消息完成后自动路由
    setShouldNavigate(true);
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
