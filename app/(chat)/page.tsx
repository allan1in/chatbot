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

    startTransition(() => {
      router.push(`/${chatId}`);
    });

    sendMessage({ text: inputText }, { body: { chatId } });
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
