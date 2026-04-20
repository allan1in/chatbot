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
  const [currentPathname, setCurrentPathname] = useState(pathname);

  // 监听 popstate 事件（浏览器回退/前进）
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPathname(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // 也要监听 pathname 变化（初始加载）
  useEffect(() => {
    setCurrentPathname(pathname);
  }, [pathname]);
  
  // 从 pathname 提取 chatId
  // / -> 新对话（chatId 为空）
  // /abc123 -> 旧对话（chatId = "abc123"）
  const pathSegments = currentPathname.split("/").filter(Boolean);
  const chatIdFromUrl = pathSegments.length > 0 ? pathSegments[0] : "";
  const isNewChat = !chatIdFromUrl;

  // 为新对话生成一个临时 chatId
  const newChatIdRef = useRef("");
  if (isNewChat && !newChatIdRef.current) {
    newChatIdRef.current =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15);
  }

  const chatId = chatIdFromUrl || newChatIdRef.current;

  // 状态
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [chatTitle, setChatTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const loadedChatIdsRef = useRef(new Set<string>());
  const prevChatIdRef = useRef(chatId);

  // 当 chatId 变化时，从 API 加载历史消息
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      
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

  // 重置新对话 id 当返回到新对话页面
  useEffect(() => {
    if (isNewChat) {
      newChatIdRef.current = "";
    }
  }, [isNewChat]);

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
