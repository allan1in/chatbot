"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Input } from "@/components/input";
import MessageList from "@/components/message-list";
import { Navbar } from "@/components/navbar";
import { useChatList } from "@/app/contexts/chat-list-context";

type Params = {
  id?: string[];
};

export default function Home() {
  const { id } = useParams<Params>();
  const routeChatId = id?.[0];
  const { addChat, updateChat } = useChatList();

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
    transport: new DefaultChatTransport({
      api: "/api/messages",
    }),
    id: chatId,
  });

  useEffect(() => {
    async function fetchMessages() {
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

  const handleSend = async (inputText: string) => {
    if (!routeChatId) {
      let generatedTitle = "新对话";

      try {
        const titleRes = await fetch("/api/title", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: inputText,
            chatId,
          }),
        });

        if (titleRes.ok) {
          const data: { title?: string } = await titleRes.json();
          generatedTitle = data.title?.trim() || "新对话";
        }
      } catch (titleError) {
        console.error("Failed to generate title", titleError);
      }

      setChatTitle(generatedTitle);
      addChat({ id: chatId, title: generatedTitle });
      updateChat(chatId, { title: generatedTitle });

      // 原生 JS 修改，完全不触发 React 重绘，只改地址栏
      window.history.replaceState({}, "", `/${chatId}`);
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
