"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type ChatItem = {
  id: string;
  title: string;
  loading?: boolean;
};

type ChatContextType = {
  chats: ChatItem[];
  isLoadingChats: boolean;
  addChat: (chat: ChatItem) => void;
  removeChat: (chatId: string) => void;
  setChatLoading: (chatId: string, loading: boolean) => void;
  setChatTitle: (chatId: string, title: string) => void;
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
      const chatsWithLoading: ChatItem[] = data.map((chat: ChatItem) => ({
        ...chat,
        loading: false,
      }));
      setChats(chatsWithLoading);
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

      return [{ ...newChat, loading: newChat.loading ?? false }, ...prev];
    });
  };

  const removeChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
  };

  const setChatLoading = (chatId: string, loading: boolean) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, loading } : chat
      )
    );
  };

  const setChatTitle = (chatId: string, title: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, title } : chat
      )
    );
  }

  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <ChatContext.Provider
      value={{ chats, isLoadingChats, addChat, removeChat, setChatLoading, setChatTitle }}
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
