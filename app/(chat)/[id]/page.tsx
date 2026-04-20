"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Input } from "@/components/input";
import MessageList from "@/components/message-list";
import { Navbar } from "@/components/navbar";
import { useMessageContext } from "@/app/contexts/message-context";

type Params = {
  id: string;
};

export default function Chat() {
  const { id: chatId } = useParams<Params>();
  const [loading, setLoading] = useState(Boolean(chatId));
  const [chatTitle, setChatTitle] = useState("");
  const { pendingMessages, clearPendingMessages } = useMessageContext();

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/messages",
    }),
    id: chatId,
  });

  useEffect(() => {
    async function fetchMessages() {
      try {
        // 优先检查 Context 中是否有待处理的消息（来自 NewChat 页面）
        const hasPendingMessages = pendingMessages[chatId]?.length > 0;
        
        if (hasPendingMessages) {
          // ✅ 立刻从 Context 恢复消息，无闪烁无丢失
          setMessages(pendingMessages[chatId]);
          clearPendingMessages(chatId);
          setLoading(false);
          
          // 后台从 API 获取消息，验证数据一致性
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
            
            // 如果 API 返回的数据与 Context 不同，更新为 API 版本（保证服务端一致性）
            const formattedMessages: UIMessage[] = data.messages.map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              parts: [{ type: "text" as const, text: msg.content }],
              createdAt: new Date(msg.createdAt),
            }));

            // 只有当消息不一致时才更新（避免不必要的 re-render）
            if (JSON.stringify(formattedMessages) !== JSON.stringify(pendingMessages[chatId])) {
              setMessages(formattedMessages);
            }
          }
        } else {
          // 没有 Context 消息（例如页面刷新），直接从 API 获取
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

            // 只在消息列表为空时才设置
            if (messages.length === 0 && status !== "streaming" && status !== "submitted") {
              setMessages(formattedMessages);
            }
          }
        }
      } catch (fetchError) {
        console.error("Failed to fetch messages", fetchError);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [chatId, setMessages, messages.length, status, pendingMessages, clearPendingMessages]);

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
