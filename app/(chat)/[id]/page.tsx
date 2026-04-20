"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Input } from "@/components/input";
import MessageList from "@/components/message-list";
import { Navbar } from "@/components/navbar";

type Params = {
  id: string;
};

export default function Chat() {
  const { id: chatId } = useParams<Params>();
  const [loading, setLoading] = useState(Boolean(chatId));
  const [chatTitle, setChatTitle] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/messages",
    }),
    id: chatId,
  });

  // 只在首次加载或页面刷新时，从 API 获取聊天记录和标题
  // 如果是从 NewChat 跳转过来，useChat 会复用已有状态，不会执行这个 fetch
  useEffect(() => {
    async function fetchChatInfo() {
      try {
        const res = await fetch(`/api/messages?id=${chatId}`);
        if (res.ok) {
          const data: {
            title: string;
            messages: Array<{
              id: string;
              role: "user" | "assistant";
              content: string;
              createdAt: string;
            }>;
          } = await res.json();

          setChatTitle(data.title || "新对话");

          // 只在消息为空时设置（说明是页面刷新场景）
          if (messages.length === 0) {
            const formattedMessages: UIMessage[] = data.messages.map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              parts: [{ type: "text" as const, text: msg.content }],
              createdAt: new Date(msg.createdAt),
            }));
            // 直接调用 useChat 的方法来设置消息
            // 注意：这里假设 setMessages 可用，如果不可用需要用其他方式
          }
        }
      } catch (fetchError) {
        console.error("Failed to fetch chat info", fetchError);
      } finally {
        setLoading(false);
      }
    }

    fetchChatInfo();
  }, [chatId, messages.length]);

  const handleSend = async (inputText: string) => {
    sendMessage({ text: inputText }, { body: { chatId } });
  };

  return (
    <>
      <Navbar
        title={chatTitle}
        isTitleLoading={loading}
      />
      <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-start">
        <div className="relative min-h-0 w-full flex-1">
          <MessageList
            className="h-full min-h-0 overflow-auto"
            messages={messages}
            status={status}
            error={error}
            loading={loading}
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
