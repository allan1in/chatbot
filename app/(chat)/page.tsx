"use client";

import { Input } from "@/components/input";
import { Navbar } from "@/components/navbar";
import { useChatList } from "../contexts/chat-list-context";
import { useRouter } from "next/navigation";
import { useFirstMsg } from "../contexts/first-message-context";

export default function New() {
  const router = useRouter();
  const { saveMsg } = useFirstMsg();

  const { addChat } = useChatList();

  const id = crypto.randomUUID();

  const handleSend = async (inputText: string) => {
    addChat({
      id: id,
      title: inputText.slice(0, 20),
    });
    saveMsg(id, inputText);
    router.push(`/${id}`);
  };

  return (
    <>
      <Navbar title="新对话" isTitleLoading={false} />
      <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-start">
        <div className="relative min-h-0 w-full flex-1">
          <div className="h-full min-h-0 overflow-auto"></div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-18 bg-linear-to-b from-background/0 to-background/80" />
        </div>
        <Input
          className="mb-4 w-[calc(100%-2rem)] max-w-3xl"
          onSend={handleSend}
        />
      </main>
    </>
  );
}
