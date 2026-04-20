"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ActiveChatContextValue = {
  chatId: string;
  messages: UIMessage[];
  setMessages: (messages: UIMessage[]) => void;
  sendMessage: (message: UIMessage, body?: Record<string, unknown>) => Promise<void>;
  status: string;
  error: Error | undefined;
  isLoading: boolean;
  chatTitle: string;
};

const ActiveChatContext = createContext<ActiveChatContextValue | null>(null);

export function ActiveChatProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // 状态
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [chatTitle, setChatTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const loadedChatIdsRef = useRef(new Set<string>());
  const pathnameRef = useRef(pathname);
  const chatIdRef = useRef("");
  const chatIdTrackerRef = useRef(""); // 用来检测 chatId 是否真的变化

  // 监听 popstate
  useEffect(() => {
    const handlePopState = () => {
      pathnameRef.current = window.location.pathname;
      // 提取新的 chatId
      const segments = window.location.pathname.split("/").filter(Boolean);
      const newChatIdFromUrl = segments.length > 0 ? segments[0] : "";
      
      if (newChatIdFromUrl && newChatIdFromUrl !== chatIdRef.current) {
        chatIdRef.current = newChatIdFromUrl;
        chatIdTrackerRef.current = newChatIdFromUrl; // 触发 useEffect
      }
    };
    
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // 监听 pathname 变化
  useEffect(() => {
    pathnameRef.current = pathname;
    
    // 从 pathname 提取 chatId
    const pathSegments = pathname.split("/").filter(Boolean);
    const chatIdFromUrl = pathSegments.length > 0 ? pathSegments[0] : "";
    
    // 为新对话生成一个临时 chatId（只生成一次）
    if (!chatIdRef.current) {
      chatIdRef.current = chatIdFromUrl || (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15));
    } else if (chatIdFromUrl && chatIdFromUrl !== chatIdRef.current) {
      // URL 中有 chatId，说明切换到了旧对话
      chatIdRef.current = chatIdFromUrl;
    }
    
    // 只在 chatId 真的变化时才更新 tracker，触发下面的 useEffect
    if (chatIdTrackerRef.current !== chatIdRef.current) {
      chatIdTrackerRef.current = chatIdRef.current;
    }
  }, [pathname]);

  const chatId = chatIdRef.current;
  const isNewChat = !pathname.split("/").filter(Boolean)[0];

  // 当 chatId 变化时，从 API 加载历史消息
  useEffect(() => {
    if (isNewChat) {
      // 新对话，清空消息和标题
      setInitialMessages([]);
      setChatTitle("");
      loadedChatIdsRef.current.clear();
    } else if (!loadedChatIdsRef.current.has(chatId)) {
      // 旧对话，从 API 加载
      loadedChatIdsRef.current.add(chatId);
      setIsLoading(true);

      fetch(`/api/messages?id=${chatId}`)
        .then((res) => res.json())
        .then((data: { title?: string; messages?: UIMessage[] }) => {
          setChatTitle(data.title || "新对话");
          
          if (data.messages) {
            // 转换成 useChat 期望的格式
            const formattedMessages = data.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              parts: msg.parts || [{ type: "text" as const, text: msg.content }],
              createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
            }));
            setInitialMessages(formattedMessages);
          }
        })
        .catch((err) => {
          console.error("Failed to load chat history", err);
          setChatTitle("新对话");
        })
        .finally(() => setIsLoading(false));
    }
  }, [chatId, isNewChat]);

  // 创建 useChat，用 initialMessages 初始化
  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/messages",
    }),
    id: chatId,
    initialMessages,
  });

  return (
    <ActiveChatContext.Provider
      value={{
        chatId,
        messages,
        setMessages,
        sendMessage,
        status,
        error: error as Error | undefined,
        isLoading,
        chatTitle,
      }}
    >
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
