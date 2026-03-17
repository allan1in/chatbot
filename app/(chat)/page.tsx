"use client";

import { Input } from "@/components/input";
import { LoadingDots } from "@/components/loading-dots";
import { MessageAI } from "@/components/message-ai";
import { MessageUser } from "@/components/message-user";
import { Navbar } from "@/components/navbar";
import { useChat } from "@ai-sdk/react";
import { ErrorMessage } from "@/components/error-message";
import { useEffect, useState } from "react";

export default function Home() {
  const { messages, sendMessage, status, error } = useChat();
  
  // 存储计算出的最小高度
  const [lastAiMinHeight, setLastAiMinHeight] = useState<number | undefined>(undefined);

  const handleSend = (inputText: string) => {
    sendMessage({ text: inputText });
  };

  const lastMessage = messages[messages.length - 1];
  const lastMessageIsAI = lastMessage?.role === 'assistant';
  const lastMessageIsEmpty = !lastMessage?.parts.some(p => p.type === 'text' && p.text.length > 0);
  const showLoading = status === 'submitted' || (status === 'streaming' && lastMessageIsAI && lastMessageIsEmpty);

  useEffect(() => {
    // 只有当最新一条消息是 User 发送时，才计算下一条 AI 消息的占位高度
    if (lastMessage?.role === 'user') {
      // 使用 setTimeout 确保 DOM 已经渲染完毕，能获取到最新的 User 消息高度
      setTimeout(() => {
        const userMsgElement = document.getElementById(`message-${lastMessage.id}`);
        if (userMsgElement) {
          // 获取窗口高度
          const windowHeight = window.innerHeight;
          // User 消息的高度
          const userMsgHeight = userMsgElement.getBoundingClientRect().height;
          // Navbar 高度
          const navbarHeight = 56;
          // 固定的上下内边距
          // pt-8 (32px) + pb-54 (216px)
          const fixedPadding = 32 + 216; 
          // 屏幕 - Navbar - pt8 - pb54 - MessageUser
          const calculatedHeight = windowHeight - navbarHeight - fixedPadding - userMsgHeight;
          // 分别打印调试信息
          console.log("Window Height:", windowHeight);
          console.log("Navbar Height:", navbarHeight);
          console.log("User Message Height:", userMsgHeight);
          console.log("Calculated AI Min Height:", calculatedHeight);

          // 确保不为负数
          setLastAiMinHeight(Math.max(0, calculatedHeight));

          window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            });
        }
      }, 50);
    } 
  }, [messages.length, lastMessage?.role, lastMessage?.id]);

  return (
    <div>
      <Navbar />
      <main className="flex items-center justify-center min-h-dvh px-4 pt-14">
        <div className="pt-8 pb-54 max-w-3xl w-full flex flex-col min-h-[calc(100dvh-3.5rem)]">
            {messages.map((message, index) => {
              const textContent = message.parts
                .filter((part) => part.type === "text")
                .map((part) => part.text)
                .join("");
              
              if (message.role === 'assistant' && !textContent && status === 'streaming') {
                 return null;
              }

              // 判断是否是最后一条 AI 消息
              // 只有当它是最后一条，且我们计算过高度时，才应用高度
              const isLastAi = index === messages.length - 1 && message.role === 'assistant';

              return message.role === "user" ? (
                <MessageUser
                  key={message.id}
                  id={`message-${message.id}`}
                  className="pb-8"
                  message={textContent}
                />
              ) : (
                <MessageAI
                  key={message.id}
                  className="pb-8"
                  message={textContent}
                  // 只有最后一条 AI 消息才应用动态最小高度
                  minHeight={isLastAi ? lastAiMinHeight : undefined}
                />
              );
            })}
            
            {showLoading && (
              <div style={{ minHeight: lastAiMinHeight ? `${lastAiMinHeight}px` : undefined }}>
                 <LoadingDots className="py-2 h-11 pb-8"/>
              </div>
            )}
            
            {error && (
              <div className="pb-8" style={{ minHeight: lastAiMinHeight ? `${lastAiMinHeight}px` : undefined }}>
                <ErrorMessage message={error.message} />
              </div> 
            )}
        </div>
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl pb-4 bg-background rounded-t-2xl">
            <Input className="w-full" onSend={handleSend} disabled={status !== 'error' && status !== 'ready'}/>
          </div>
      </main>
    </div>
  );
}