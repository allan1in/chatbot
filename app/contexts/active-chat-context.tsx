"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type ActiveChatContextValue = {
  chatId: string;
  messages: UIMessage[];
  setMessages: (messages: UIMessage[]) => void;
  sendMessage: (message: UIMessage, body?: Record<string, unknown>) => Promise<void>;
  status: string;
  error: Error | undefined;
};

const ActiveChatContext = createContext<ActiveChatContextValue | null>(null);

function extractChatId(pathname: string): string | null {
  const match = pathname.match(/\/chat\/([^/]+)/);
  return match ? match[1] : null;
}

export function ActiveChatProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const chatIdFromUrl = extractChatId(pathname);
  const isNewChat = !chatIdFromUrl;
  
  // 为新对话生成一个临时 chatId（待发送消息后才会路由到真实 id）
  const newChatIdRef = useRef("");
  if (!newChatIdRef.current) {
    newChatIdRef.current =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15);
  }

  const chatId = chatIdFromUrl ?? newChatIdRef.current;

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/messages",
    }),
    id: chatId,
  });

  // 当 chatId 变化时，从 API 加载历史消息
  const loadedChatIdsRef = useRef(new Set<string>());
  const prevChatIdRef = useRef(chatId);

  useEffect(() => {
    // 如果是切换到新的 chatId
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      
      if (isNewChat) {
        // 新对话，清空消息
        setMessages([]);
      } else if (!loadedChatIdsRef.current.has(chatId)) {
        // 旧对话，从 API 加载
        loadedChatIdsRef.current.add(chatId);
        
        fetch(`/api/messages?id=${chatId}`)
          .then((res) => res.json())
          .then((data: { messages?: UIMessage[] }) => {
            if (data.messages) {
              setMessages(data.messages);
            }
          })
          .catch((err) => console.error("Failed to load chat history", err));
      }
    }
  }, [chatId, isNewChat, setMessages]);

  // 重置新对话 id 当返回到新对话页面
  useEffect(() => {
    if (isNewChat) {
      newChatIdRef.current = "";
    }
  }, [isNewChat]);

  return (
    <ActiveChatContext.Provider value={{ chatId, messages, setMessages, sendMessage, status, error: error as Error | undefined }}>
      {children}
    </ActiveChatContext.Provider>
  );
}

export function useActiveChat() {
  const context = useContext(ActiveChatContext);
  if (!context) {
    throw new Error("useActiveChat must be used within ActiveChatProvider");
  }
  return context;
}
