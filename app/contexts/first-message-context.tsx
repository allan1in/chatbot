"use client";
import { createContext, useContext, useState } from "react";

type FirstMsgContextType = {
  msg: { chatId: string; firstMessage: string } | null;
  saveMsg: (chatId: string, firstMessage: string) => void;
  removeMsg: () => void;
};

const FirstMsgContext = createContext<FirstMsgContextType | null>(null);

export function FirstMsgProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<{ chatId: string; firstMessage: string } | null>(null);

  const saveMsg = (chatId: string, firstMessage: string) => {
    setMsg({ chatId, firstMessage });
  };

  const removeMsg = () => {
    setMsg(null);
  }

  return (
    <FirstMsgContext.Provider value={{ saveMsg, msg, removeMsg }}>
      {children}
    </FirstMsgContext.Provider>
  );
}

export const useFirstMsg = () => {
  const context = useContext(FirstMsgContext);
  if (!context) {
    throw new Error("useFirstMsg must be used within a FirstMsgProvider");
  }
  return context;
};
