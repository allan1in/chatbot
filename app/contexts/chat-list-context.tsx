"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type ChatItem = {
  id: string;
  title: string;
};

type ChatContextType = {
  chats: ChatItem[];
  isLoadingChats: boolean;
  addChat: (chat: ChatItem) => void;
  removeChat: (chatId: string) => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chats");

      if (!res.ok) {
        throw new Error("Fetch error!");
      }

      const data = await res.json();
      setChats(data);
    } catch (err) {
      console.error("Fetch chats error:", err);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const addChat = (newChat: ChatItem) => {
    setChats((prev) => {
      if (prev.some((chat) => chat.id === newChat.id)) {
        return prev;
      }

      return [newChat, ...prev];
    });
  };

  const removeChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <ChatContext.Provider
      value={{ chats, isLoadingChats, addChat, removeChat }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatList() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChatList must be used within a ChatProvider.");
  }

  return context;
}
