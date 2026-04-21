// app/chat/[id]/page.tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { use, useEffect, useState, useRef } from "react";
import { Input } from "@/components/input";
import MessageList from "@/components/message-list";
import { Navbar } from "@/components/navbar";
import { useFirstMsg } from "@/app/contexts/first-message-context";
import { useChatList } from "@/app/contexts/chat-list-context";

export default function Chat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { msg, removeMsg } = useFirstMsg();

  // 关键：防止 React 18 严格模式下执行两次，或状态改变导致死循环
  const initialized = useRef(false);

  const [loading, setLoading] = useState(true);
  const { setChatLoading, setChatTitle, chats } = useChatList();

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/messages",
    }),
    id: id,
  });

  useEffect(() => {
    // 如果已经初始化过了，直接拦截，不再跑逻辑
    if (initialized.current) return;

    async function init() {
      initialized.current = true; // 立即关锁

      // 逻辑 A：检测到是从“新对话”中转过来的
      if (msg && msg.chatId === id) {
        setLoading(false);
        // 直接触发发送
        sendMessage({ text: msg.firstMessage }, { body: { chatId: id } });
        generateTitle(msg.firstMessage, (title) => setChatTitle(id, title));

        // 发送完立即清理中转站，这样下次刷新页面就会走逻辑 B
        removeMsg();
      }
      // 逻辑 B：msg 为空，说明是直接打开或刷新页面，去后端取历史记录
      else {
        try {
          const res = await fetch(`/api/messages?id=${id}`);
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

            const formattedMessages: UIMessage[] = data.messages.map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              parts: [{ type: "text" as const, text: msg.content }],
              createdAt: new Date(msg.createdAt),
            }));

            setMessages(formattedMessages);
            setChatTitle(id, data.title);
          }
        } catch (fetchError) {
          console.error("Failed to fetch messages", fetchError);
        } finally {
          setLoading(false);
        }
      }
    }

    const generateTitle = async (
      firstMessage: string,
      setTitle: (title: string) => void,
    ) => {
      try {
        const res = await fetch("/api/title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            firstMessage: firstMessage, 
            chatId: id 
          }),
        });

        if (res.ok) {
          const { title } = await res.json();
          setTitle(title);
        }
      } catch (error) {
        console.error("Failed to generate title", error);
      } finally {
        setChatLoading(id, false);
      }
    };
    init();
  }, [
    id,
    sendMessage,
    setMessages,
    removeMsg,
    msg,
    setChatTitle,
    setChatLoading,
  ]);

  const handleSend = async (inputText: string) => {
    sendMessage({ text: inputText }, { body: { chatId: id } });
  };

  return (
    <>
      <Navbar
        title={chats.find((chat) => chat.id === id)?.title || ""}
        isTitleLoading={chats.find((chat) => chat.id === id)?.loading || loading}
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
