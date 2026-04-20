"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/input";
import MessageList from "@/components/message-list";
import { Navbar } from "@/components/navbar";
import { useActiveChat } from "@/app/contexts/active-chat-context";

export default function Chat() {
  const { messages, sendMessage, status, error, chatId } = useActiveChat();
  const [chatTitle, setChatTitle] = useState("");
  const [loading, setLoading] = useState(true);

  // 从 API 获取聊天标题
  useEffect(() => {
    if (!chatId) return;
    
    setLoading(true);
    fetch(`/api/messages?id=${chatId}`)
      .then((res) => res.json())
      .then((data: { title?: string }) => {
        setChatTitle(data.title || "新对话");
      })
      .catch((err) => {
        console.error("Failed to fetch chat title", err);
        setChatTitle("新对话");
      })
      .finally(() => setLoading(false));
  }, [chatId]);

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
