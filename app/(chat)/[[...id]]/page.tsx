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
  const { id } = use(params);
  const routeChatId = id?.[0];

  const [chatId] = useState(() => {
    if (routeChatId) {
      return routeChatId;
    }

    return typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);
  });

  const [loading, setLoading] = useState(Boolean(routeChatId));
  const [chatTitle, setChatTitle] = useState("Chatbot");

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
      setChatTitle("Chatbot");
      return;
    }

    fetchMessages();
  }, [chatId, routeChatId, setMessages]);

  const handleSend = (inputText: string) => {
    sendMessage({ text: inputText }, { body: { chatId } });
  };

  return (
    <>
      <Navbar title={chatTitle} />
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
