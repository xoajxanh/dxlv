"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";
import { Message } from "@/lib/api";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { MessageSquare } from "lucide-react";

interface ChatThreadProps {
  roomId: number;
  messages: Message[];
  currentUserId: number;
  typingUsers: { userId: number; displayName: string }[];
  isDirect: boolean;
}

export function ChatThread({
  roomId,
  messages,
  currentUserId,
  typingUsers,
  isDirect,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevRoomIdRef = useRef<number | null>(null);

  const latestOwnMessageId = [...messages]
    .reverse()
    .find(item => item.sender.userId === currentUserId)?.id;

  // Scroll to bottom: instantly on room switch, smoothly on new messages
  useEffect(() => {
    const prevRoomId = prevRoomIdRef.current;
    prevRoomIdRef.current = roomId;

    if (prevRoomId !== null && prevRoomId !== roomId) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers, roomId]);

  // Helper to format date dividers
  const formatDividerDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (d.toDateString() === now.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    }
  };

  // Helper to parse custom reply serialization: [Reply to #id|senderName|snippet] actualContent
  const parseMessageContent = (msg: Message) => {
    const replyMatch = msg.content.match(/^\[Reply to #(\d+)\|([^|]*)\|([^\]]*)\] ([\s\S]*)$/);
    if (replyMatch) {
      return {
        replyId: parseInt(replyMatch[1], 10),
        replySender: replyMatch[2],
        replySnippet: replyMatch[3],
        actualContent: replyMatch[4],
      };
    }
    return null;
  };

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-2 bg-[#17212B]">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full gap-3 select-none opacity-30">
          <div className="w-16 h-16 rounded-full bg-[#273442] flex items-center justify-center">
            <MessageSquare size={32} className="text-[#3390EC]" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-white">No messages yet</p>
            <p className="text-xs text-slate-400">Say hello! 👋</p>
          </div>
        </div>
      )}

      {messages.map((msg, i) => {
        const isMe = msg.sender.userId === currentUserId;
        const prevMsg = messages[i - 1];
        const showAvatar = !isMe && (!prevMsg || prevMsg.sender.userId !== msg.sender.userId);
        const showName = !isMe && showAvatar;

        // Date divider check
        const msgDate = new Date(msg.createdAt).toDateString();
        const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null;
        const showDateDivider = msgDate !== prevMsgDate;

        // Parse custom replies
        const replyDetails = parseMessageContent(msg);
        const displayContent = replyDetails ? replyDetails.actualContent : msg.content;

        // Read receipt state
        const isLatestOwnMessage = isMe && msg.id === latestOwnMessageId;
        const showSeen = isDirect && isLatestOwnMessage && msg.isReadByOther;

        return (
          <div key={msg.id} className="flex flex-col space-y-1">
            {/* Centered Date Divider */}
            {showDateDivider && (
              <div className="flex justify-center my-4 select-none">
                <span className="rounded-full bg-[#273442] px-4 py-1 text-[11px] text-slate-300 font-semibold shadow-sm border border-[#304050]/20">
                  {formatDividerDate(msg.createdAt)}
                </span>
              </div>
            )}

            <div className={cn(
              "group relative flex items-end gap-2.5 animate-msgIn",
              isMe ? "justify-end" : "justify-start"
            )}>

              {/* Avatar for other users */}
              {!isMe && (
                <div className="w-10 flex-shrink-0">
                  {showAvatar && <Avatar name={msg.sender.displayName} size="sm" />}
                </div>
              )}

              {/* Message Bubble Container */}
              <div className={cn(
                "max-w-[70%] flex flex-col gap-1",
                isMe ? "items-end" : "items-start"
              )}>
                {showName && (
                  <span className="text-[11px] font-semibold mb-1 px-2 text-[#3390EC] tracking-tight">
                    {msg.sender.displayName}
                  </span>
                )}

                <Bubble
                  align={isMe ? "end" : "start"}
                  variant={isMe ? "default" : "muted"}
                >
                  <BubbleContent>
                    {/* Reply Quote Block inside Bubble */}
                    {replyDetails && (
                      <div
                        onClick={() => {
                          const el = document.getElementById(`msg-${replyDetails.replyId}`);
                          el?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                        className="border-l-2 border-[#3390EC] bg-[#17212B]/40 rounded-r-lg px-2.5 py-1.5 text-xs text-slate-300 cursor-pointer hover:bg-[#17212B]/60 transition-all select-none mb-1 max-w-full"
                      >
                        <p className="font-semibold text-[#3390EC] truncate">{replyDetails.replySender}</p>
                        <p className="truncate opacity-80 mt-0.5">{replyDetails.replySnippet}</p>
                      </div>
                    )}

                    <p id={`msg-${msg.id}`} className="whitespace-pre-wrap pr-1">{displayContent}</p>

                    {/* Time + Receipts aligned nicely in bubble */}
                    <div className="flex items-center justify-end self-end text-[10px] opacity-75 mt-1 select-none pointer-events-none">
                      <span style={{ color: isMe ? "#a4c4e2" : "#94A3B8" }}>
                        {formatTime(msg.createdAt)}
                      </span>
                      {isMe && isLatestOwnMessage && (
                        isDirect ? (
                          showSeen ? (
                            <span className="ml-1 text-[#2ECC71] font-bold" title="Read">✓</span>
                          ) : (
                            <span className="ml-1 text-slate-400 font-bold" title="Delivered">✓</span>
                          )
                        ) : (
                          <span className="ml-1 text-slate-400 font-bold" title="Sent">✓</span>
                        )
                      )}
                    </div>
                  </BubbleContent>
                </Bubble>
              </div>

            </div>
          </div>
        );
      })}

      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <div className="flex items-end gap-2.5 animate-fadeIn">
          <div className="w-10 flex-shrink-0" />
          <div className="bg-[#182533] rounded-3xl rounded-bl-lg px-5 py-3 shadow-md">
            <p className="text-[11px] text-slate-400 font-medium mb-1.5">
              {typingUsers.map(u => u.displayName).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
            </p>
            <div className="flex gap-1.5 justify-start">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
