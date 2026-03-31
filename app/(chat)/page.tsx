"use client";

import { Input } from "@/components/input";

import { Navbar } from "@/components/navbar";
import { useChat } from "@ai-sdk/react";
import MessageList from "@/components/message-list";

export default function Home() {
  const { messages, sendMessage, status, error } = useChat();

  const handleSend = (inputText: string) => {
    sendMessage({ text: inputText });
  };

  return (
    <div>
      <Navbar />
      <main className="flex flex-col items-center justify-start min-h-dvh pt-14">
          <MessageList className="h-[calc(100dvh-17rem)] overflow-auto" messages={messages} status={status} error={error} />
          <Input className="w-[calc(100%-2rem)] max-w-3xl" onSend={handleSend} />
      </main>
    </div>
  );
}
