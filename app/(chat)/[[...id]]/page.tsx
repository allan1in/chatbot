"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { use, useEffect, useState } from "react";

import { Input } from "@/components/input";
import MessageList from "@/components/message-list";
import { Navbar } from "@/components/navbar";

type Params = {
  id?: string[];
};

export default function Home({ params }: { params: Promise<Params> }) {
  // 用 use 来获取路由参数，因为它是一个异步操作，可能会导致组件在获取参数之前就渲染
  const { id } = use(params);
  const routeChatId = id?.[0];

  // 生成一个新的 chatId，除非路由中已经有了 chatId
  // 用 useState 来保持 chatId 的稳定性，避免在组件重新渲染时生成新的 chatId
  const [chatId] = useState(() => {
    if (routeChatId) {
      return routeChatId;
    }

    return typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);
  });

  // 避免在新建对话时显示加载状态，因为没有消息需要加载
  const [loading, setLoading] = useState(Boolean(routeChatId));
  const [chatTitle, setChatTitle] = useState("");

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: chatId,
  });

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/chat?id=${chatId}`);
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

          const formattedMessages: UIMessage[] = data.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            parts: [{ type: "text" as const, text: msg.content }],
            createdAt: new Date(msg.createdAt),
          }));
          setMessages(formattedMessages);
        }
      } catch (fetchError) {
        console.error("Failed to fetch messages", fetchError);
      } finally {
        setLoading(false);
      }
    }

    if (!routeChatId) {
      setLoading(false);
      setChatTitle("");
      return;
    }

    fetchMessages();
  }, [chatId, routeChatId, setMessages]);

  const handleSend = (inputText: string) => {
    if (!routeChatId) {
      // 原生 JS 修改，完全不触发 React 重绘，只改地址栏
      window.history.pushState({}, "", `/${chatId}`);
    }
    sendMessage({ text: inputText }, { body: { chatId } });
  };

  return (
    <>
      <Navbar
        title={chatTitle}
        isTitleLoading={loading && Boolean(routeChatId)}
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
