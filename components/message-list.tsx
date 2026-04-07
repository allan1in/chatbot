"use client";

import { LoadingDots } from "@/components/loading-dots";
import { MessageAI } from "@/components/message-ai";
import { MessageUser } from "@/components/message-user";
import { ErrorMessage } from "@/components/error-message";
import { UIMessage, UIDataTypes, UITools } from "ai";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface ChatGroup {
  id: string;
  user?: UIMessage<unknown, UIDataTypes, UITools>;
  ai?: UIMessage<unknown, UIDataTypes, UITools>;
}

export default function MessageList({
  messages,
  status,
  error,
  className,
  loading,
}: {
  messages: UIMessage<unknown, UIDataTypes, UITools>[];
  status: string;
  error: Error | undefined;
  className?: string;
  loading?: boolean;
}) {
  const groups = messages.reduce<ChatGroup[]>((acc, message) => {
    if (message.role === "user") {
      acc.push({ id: message.id, user: message });
    } else if (message.role === "assistant") {
      const lastGroup = acc[acc.length - 1];
      if (lastGroup) {
        lastGroup.ai = message;
      }
    }
    return acc;
  }, []);

  function isGroupLoading(index: number) {
    const isLastGroup = index === groups.length - 1;
    if (!isLastGroup) return false;

    const lastMsg = messages[messages.length - 1];
    const isWaiting = status === "submitted";
    const isStreamingEmpty =
      status === "streaming" &&
      lastMsg?.role === "assistant" &&
      !lastMsg.parts.some((p) => p.type === "text" && p.text.length > 0);

    return isWaiting || isStreamingEmpty;
  }

  const lastGroupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (groups.length > 0) {
      lastGroupRef.current?.scrollIntoView({
        behavior: "smooth", 
        block: "start"
      });
    }
  }, [groups.length]);

  return (
    <div
      className={cn(
        "flex flex-col scrollbar-thin w-full items-center [scrollbar-gutter:stable] pl-4 pr-2",
        className,
      )}
    >
      <div className="max-w-3xl w-full flex flex-col px-4">
        {loading && (
          <div className="flex min-h-[calc(100dvh-17rem)] items-center justify-center">
            <LoadingDots />
          </div>
        )}

        {groups.map((group, index) => {
          const isLast = index === groups.length - 1;

          return (
            <div
              key={group.id}
              ref={isLast ? lastGroupRef : null}
              className={cn(
                "flex flex-col gap-4",
                isLast && "min-h-[calc(100dvh-17rem)]"
              )}
            >
              {group.user?.parts.map((part, i) =>
                part.type === "text" ? (
                  <MessageUser
                    key={`${group.id}-user-${i}`}
                    message={part.text}
                  />
                ) : null,
              )}

              {group.ai?.parts.map((part, i) =>
                part.type === "text" ? (
                  <MessageAI key={`${group.id}-ai-${i}`} message={part.text} />
                ) : null,
              )}

              {isGroupLoading(index) && (
                <div className="flex items-center h-11">
                  <LoadingDots className="py-2" />
                </div>
              )}
            </div>
          );
        })}
        
        {error && (
          <div className="pb-8">
            <ErrorMessage message={error.message} />
          </div>
        )}
      </div>
    </div>
  );
}