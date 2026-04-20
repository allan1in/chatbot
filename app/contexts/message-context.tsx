"use client";

import { UIMessage } from "ai";
import { createContext, useContext, useState, ReactNode } from "react";

type MessageContextType = {
  pendingMessages: Record<string, UIMessage[]>;
  setPendingMessages: (chatId: string, messages: UIMessage[]) => void;
  clearPendingMessages: (chatId: string) => void;
};

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: ReactNode }) {
  const [pendingMessages, setPending] = useState<Record<string, UIMessage[]>>({});

  const setPendingMessages = (chatId: string, messages: UIMessage[]) => {
    setPending((prev) => ({
      ...prev,
      [chatId]: messages,
    }));
  };

  const clearPendingMessages = (chatId: string) => {
    setPending((prev) => {
      const next = { ...prev };
      delete next[chatId];
      return next;
    });
  };

  return (
    <MessageContext.Provider
      value={{
        pendingMessages,
        setPendingMessages,
        clearPendingMessages,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export function useMessageContext() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessageContext must be used within MessageProvider");
  }
  return context;
}
