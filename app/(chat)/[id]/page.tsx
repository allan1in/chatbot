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

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/messages",
    }),
    id: chatId,
  });

  // 页面加载时，先从 sessionStorage 读临时消息，然后从 API 获取完整历史
  useEffect(() => {
    async function initChat() {
      try {
        // 1️⃣ 先从 sessionStorage 读（从 NewChat 跳过来的消息）
        const cachedMessages = sessionStorage.getItem(`chatbot:messages:${chatId}`);
        if (cachedMessages) {
          const parsedMessages: UIMessage[] = JSON.parse(cachedMessages);
          setMessages(parsedMessages);
          sessionStorage.removeItem(`chatbot:messages:${chatId}`); // 读完删除
        }

        // 2️⃣ 从 API 获取完整的历史消息和标题
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

          // 只有当 sessionStorage 里没有消息时才从 API 设置
          // （这样能保留最新的、正在流式生成中的消息）
          if (!cachedMessages && data.messages.length > 0) {
            const formattedMessages: UIMessage[] = data.messages.map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              parts: [{ type: "text" as const, text: msg.content }],
              createdAt: new Date(msg.createdAt),
            }));
            setMessages(formattedMessages);
          }
        }
      } catch (fetchError) {
        console.error("Failed to fetch chat info", fetchError);
      } finally {
        setLoading(false);
      }
    }

    initChat();
  }, [chatId, setMessages]);

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
