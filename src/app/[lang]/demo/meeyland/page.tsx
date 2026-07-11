"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/meeyland/AuthContext";
import { Sidebar } from "@/components/meeyland/Sidebar";
import { ChatThread } from "@/components/meeyland/ChatThread";
import { MessageInput } from "@/components/meeyland/MessageInput";
import {
  ChatHeader, CallOverlay, DialingOverlay
} from "@/components/meeyland/CallComponents";
import { useSignalR, IncomingMessage, IncomingCall, MessageReadEvent, TypingEvent } from "@/lib/meeyland/useSignalR";
import { Room, Member, Message, getMessages, getRooms, getLiveKitToken, markRoomRead } from "@/lib/meeyland/api";
import { toast } from "sonner";
import { X, Pin, MessageSquare } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || "vi";

  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ userId: number; displayName: string }[]>([]);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);

  const typingTimeouts = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const activeRoomRef = useRef<Room | null>(null);
  const roomsRef = useRef<Room[]>([]);

  const [callToken, setCallToken] = useState<string | null>(null);
  const [activeCallRoomName, setActiveCallRoomName] = useState<string | null>(null);
  const [dialingCall, setDialingCall] = useState<{ chatRoomId: number; roomName: string; isVideo: boolean; receiverName: string } | null>(null);
  const [isPipMode, setIsPipMode] = useState(false);
  const respondToCallRef = useRef<((callerId: number, accepted: boolean, liveKitRoomName: string, reason?: string) => Promise<void>) | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.replace(`/${lang}/demo/meeyland/login`);
  }, [user, isLoading, router, lang]);

  const loadRooms = useCallback(async () => {
    if (!user) return;
    try { const data = await getRooms(user.token); setRooms(data); }
    catch (err) { console.error(err); }
  }, [user]);

  const loadActiveRoomMessages = useCallback(async () => {
    if (!user || !activeRoomRef.current) return;
    try {
      const data = await getMessages(user.token, activeRoomRef.current.roomId);
      setMessages(data);
      const latestMessageId = data.at(-1)?.id;
      if (latestMessageId) {
        await markRoomRead(user.token, activeRoomRef.current.roomId, latestMessageId);
        setRooms(prev => prev.map(room =>
          room.roomId === activeRoomRef.current?.roomId
            ? { ...room, unreadCount: 0, lastReadMessageId: latestMessageId }
            : room
        ));
      }
    } catch (err) {
      console.error("Failed to load active room messages:", err);
    }
  }, [user]);

  const handleSelectRoom = useCallback((room: Room) => {
    setActiveRoom({ ...room, unreadCount: 0 });
    setTypingUsers([]);
    setMessages([]);
    setLoadingMsgs(true);
    setReplyingToMessage(null);
    setPinnedMessage(null);
    setRooms(prev => prev.map(item =>
      item.roomId === room.roomId ? { ...item, unreadCount: 0 } : item
    ));
    if (user) markRoomRead(user.token, room.roomId).catch(console.error);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set("roomId", room.roomId.toString());
      window.history.replaceState({}, '', url.toString());
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getRooms(user.token).then(data => {
      setRooms(data);
      if (typeof window !== 'undefined' && !activeRoomRef.current) {
        const urlParams = new URLSearchParams(window.location.search);
        const roomIdStr = urlParams.get("roomId");
        if (roomIdStr) {
          const roomToSelect = data.find(r => r.roomId.toString() === roomIdStr);
          if (roomToSelect) {
            setActiveRoom({ ...roomToSelect, unreadCount: 0 });
            setLoadingMsgs(true);
            markRoomRead(user.token, roomToSelect.roomId).catch(console.error);
          }
        }
      }
    }).catch(console.error);
  }, [user]);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    if (!user || !activeRoom) return;
    let cancelled = false;
    getMessages(user.token, activeRoom.roomId)
      .then(async data => {
        if (cancelled) return;
        setMessages(data);
        const latestMessageId = data.at(-1)?.id;
        if (latestMessageId) {
          await markRoomRead(user.token, activeRoom.roomId, latestMessageId);
          if (!cancelled) {
            setRooms(prev => prev.map(room =>
              room.roomId === activeRoom.roomId
                ? { ...room, unreadCount: 0, lastReadMessageId: latestMessageId }
                : room
            ));
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoadingMsgs(false);
      });
    return () => { cancelled = true; };
  }, [user, activeRoom]);

  const handleMessage = useCallback((msg: IncomingMessage) => {
    const selectedRoom = activeRoomRef.current;
    const isActiveRoom = msg.chatRoomId === selectedRoom?.roomId;
    const isOwnMessage = msg.sender.userId === user?.userId;

    if (isActiveRoom) {
      setMessages(prev => [...prev, {
        id: msg.id,
        content: msg.content,
        attachmentUrl: msg.attachmentUrl,
        createdAt: msg.createdAt,
        isReadByOther: false,
        sender: { userId: msg.sender.userId, username: "", displayName: msg.sender.displayName, avatarUrl: msg.sender.avatarUrl }
      }]);

      if (user) {
        markRoomRead(user.token, msg.chatRoomId, msg.id).catch(console.error);
      }
    } else if (!isOwnMessage) {
      const targetRoom = roomsRef.current.find(item => item.roomId === msg.chatRoomId);
      const isGroup = msg.isGroup ?? targetRoom?.isGroup ?? false;
      const title = isGroup
        ? (msg.chatRoomName ?? targetRoom?.name ?? "Group Message")
        : msg.sender.displayName;
      const desc = isGroup
        ? `${msg.sender.displayName}: ${msg.content}`
        : msg.content;

      const toastId = `msg-${msg.id}`;
      toast(title, {
        id: toastId,
        description: desc,
        action: {
          label: "View",
          onClick: async () => {
            toast.dismiss(toastId);
            let targetRoom = roomsRef.current.find(item => item.roomId === msg.chatRoomId);
            if (!targetRoom && user) {
              try {
                const latestRooms = await getRooms(user.token);
                setRooms(latestRooms);
                targetRoom = latestRooms.find(item => item.roomId === msg.chatRoomId);
              } catch (err) {
                console.error(err);
              }
            }
            if (targetRoom) {
              handleSelectRoom(targetRoom);
            }
          }
        }
      });
    }

    setRooms(prev => {
      const exists = prev.some(r => r.roomId === msg.chatRoomId);
      if (!exists) {
        loadRooms();
        return prev;
      }

      return prev.map(r =>
        r.roomId === msg.chatRoomId
          ? {
            ...r,
            unreadCount: isActiveRoom || isOwnMessage ? 0 : r.unreadCount + 1,
            lastMessage: {
              id: msg.id,
              content: msg.content,
              senderId: msg.sender.userId,
              senderName: msg.sender.displayName,
              createdAt: msg.createdAt
            }
          }
          : r
      );
    });
  }, [user, handleSelectRoom, loadRooms]);

  const handleTyping = useCallback((evt: TypingEvent) => {
    if (evt.chatRoomId !== activeRoom?.roomId || evt.userId === user?.userId) return;
    setTypingUsers(prev => {
      const filtered = prev.filter(u => u.userId !== evt.userId);
      return evt.isTyping ? [...filtered, { userId: evt.userId, displayName: evt.displayName }] : filtered;
    });
    clearTimeout(typingTimeouts.current[evt.userId]);
    if (evt.isTyping) {
      typingTimeouts.current[evt.userId] = setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.userId !== evt.userId));
      }, 3000);
    }
  }, [activeRoom, user]);

  const handleAcceptCallFor = useCallback(async (call: IncomingCall) => {
    if (!user) return;
    try {
      const { token } = await getLiveKitToken(user.token, call.liveKitRoomName);
      const callerId = call.callerId ?? call.inviterId;
      if (callerId && respondToCallRef.current) {
        await respondToCallRef.current(callerId, true, call.liveKitRoomName);
      }
      setCallToken(token);
      setActiveCallRoomName(call.liveKitRoomName);
    } catch (err) { console.error(err); }
  }, [user]);

  const handleDeclineCallFor = useCallback(async (call: IncomingCall) => {
    const callerId = call.callerId ?? call.inviterId;
    if (callerId && respondToCallRef.current) {
      await respondToCallRef.current(callerId, false, call.liveKitRoomName);
    }
  }, []);

  const handleIncomingCall = useCallback((call: IncomingCall) => {
    const isBusy = activeCallRoomName !== null || callToken !== null || dialingCall !== null;
    if (isBusy) {
      console.log("📞 [DEBUG] Busy. Automatically declining incoming call from:", call.callerName);
      const callerId = call.callerId ?? call.inviterId;
      if (callerId && respondToCallRef.current) {
        respondToCallRef.current(callerId, false, call.liveKitRoomName, "busy");
      }
      return;
    }

    let handled = false;
    const callerName = call.callerName ?? call.inviterName ?? "Someone";
    const isVideo = call.isVideo ?? true;

    const callId = `call-${call.liveKitRoomName}`;
    toast(`Incoming ${isVideo ? "Video" : "Voice"} Call`, {
      id: callId,
      description: `${callerName} is calling you.`,
      action: {
        label: "Accept",
        onClick: () => {
          handled = true;
          toast.dismiss(callId);
          handleAcceptCallFor(call);
        }
      },
      cancel: {
        label: "Decline",
        onClick: () => {
          handled = true;
          toast.dismiss(callId);
          handleDeclineCallFor(call);
        }
      },
      onDismiss: () => {
        if (!handled) {
          handleDeclineCallFor(call);
        }
      },
      duration: Infinity,
    });
  }, [handleAcceptCallFor, handleDeclineCallFor, activeCallRoomName, callToken, dialingCall]);

  const handleCallResponse = useCallback((res: { responderId: number; responderName: string; accepted: boolean; liveKitRoomName: string; reason?: string }) => {
    if (dialingCall && dialingCall.roomName === res.liveKitRoomName) {
      if (res.accepted) {
        getLiveKitToken(user!.token, res.liveKitRoomName).then(({ token }) => {
          setCallToken(token);
          setActiveCallRoomName(res.liveKitRoomName);
          setDialingCall(null);
        }).catch(console.error);
      } else {
        setDialingCall(null);
        if (res.reason === "busy") {
          toast.error("User Busy", {
            description: `${res.responderName} is currently in another call.`,
          });
        } else {
          toast.error("Call Declined", {
            description: `${res.responderName} declined your call.`,
          });
        }
      }
    } else if (!res.accepted && activeCallRoomName === res.liveKitRoomName) {
      setCallToken(null);
      setActiveCallRoomName(null);
      toast.error("Call Declined", {
        description: `${res.responderName} declined your call.`,
      });
    }
  }, [dialingCall, activeCallRoomName, user]);

  const handleMessageRead = useCallback((evt: MessageReadEvent) => {
    setRooms(prev => prev.map(room => {
      if (room.roomId !== evt.chatRoomId) return room;
      const members = room.members.map(member =>
        member.userId === evt.userId
          ? { ...member, lastReadMessageId: evt.lastReadMessageId, lastReadAt: evt.lastReadAt }
          : member
      );

      return {
        ...room,
        members,
        unreadCount: evt.userId === user?.userId ? 0 : room.unreadCount,
        lastReadMessageId: evt.userId === user?.userId ? evt.lastReadMessageId : room.lastReadMessageId,
        directLastReadMessageId: !room.isGroup && evt.userId !== user?.userId
          ? evt.lastReadMessageId
          : room.directLastReadMessageId,
      };
    }));
    const selectedRoom = activeRoomRef.current;
    if (!selectedRoom || selectedRoom.roomId !== evt.chatRoomId || selectedRoom.isGroup || evt.userId === user?.userId)
      return;

    setMessages(prev => prev.map(message =>
      message.sender.userId === user?.userId &&
        evt.lastReadMessageId &&
        message.id <= evt.lastReadMessageId
        ? { ...message, isReadByOther: true }
        : message
    ));
  }, [user]);

  const handleRoomCreated = useCallback((room: Room) => {
    setRooms(prev => {
      if (prev.some(r => r.roomId === room.roomId)) return prev;
      return [room, ...prev];
    });
  }, []);

  const handleRoomUpdated = useCallback((evt: { roomId: number; members: Member[] }) => {
    setRooms(prev => prev.map(r =>
      r.roomId === evt.roomId ? { ...r, members: evt.members } : r
    ));
    setActiveRoom(prev => {
      if (prev && prev.roomId === evt.roomId) {
        return { ...prev, members: evt.members };
      }
      return prev;
    });
  }, []);

  const handleReconnected = useCallback(() => {
    console.log("⚡ [DEBUG] SignalR connection restored. Syncing chat data...");
    loadRooms();
    loadActiveRoomMessages();
  }, [loadRooms, loadActiveRoomMessages]);

  const handleCallEnded = useCallback((evt: { chatRoomId: number; liveKitRoomName: string; endedById: number }) => {
    toast.dismiss(`call-${evt.liveKitRoomName}`);
    if (activeCallRoomName === evt.liveKitRoomName) {
      setCallToken(null);
      setActiveCallRoomName(null);
      setIsPipMode(false);
      toast("Call Ended", { description: "The call was ended by the other participant." });
    } else if (dialingCall && dialingCall.roomName === evt.liveKitRoomName) {
      setDialingCall(null);
      toast("Call Cancelled", { description: "The other user cancelled the call." });
    }
  }, [activeCallRoomName, dialingCall]);

  const { sendMessage, sendTyping, initiateCall, inviteToCall, respondToCall, endCall } = useSignalR(
    user?.token ?? null,
    {
      onMessage: handleMessage,
      onTyping: handleTyping,
      onIncomingCall: handleIncomingCall,
      onCallResponse: handleCallResponse,
      onMessageRead: handleMessageRead,
      onRoomCreated: handleRoomCreated,
      onRoomUpdated: handleRoomUpdated,
      onReconnected: handleReconnected,
      onCallEnded: handleCallEnded,
    }
  );

  useEffect(() => {
    respondToCallRef.current = respondToCall;
  }, [respondToCall]);

  const handleSend = useCallback(async (text: string, attachmentUrl?: string) => {
    if (!activeRoom || !user) return;
    let finalContent = text;
    if (replyingToMessage) {
      const snippet = replyingToMessage.content.length > 30
        ? replyingToMessage.content.substring(0, 30) + "..."
        : replyingToMessage.content;
      finalContent = `[Reply to #${replyingToMessage.id}|${replyingToMessage.sender.displayName}|${snippet}] ${text}`;
      setReplyingToMessage(null);
    }
    await sendMessage(activeRoom.roomId, finalContent, attachmentUrl);
  }, [activeRoom, user, sendMessage, replyingToMessage]);

  const handleStartCall = useCallback(async (isVideo: boolean) => {
    if (!user || !activeRoom) return;
    const roomName = `call_${activeRoom.roomId}_${uuidv4().slice(0, 8)}`;
    try {
      if (activeRoom.isGroup) {
        const { token } = await getLiveKitToken(user.token, roomName);
        setCallToken(token);
        setActiveCallRoomName(roomName);
        await initiateCall(activeRoom.roomId, roomName, isVideo);
      } else {
        const otherMembers = activeRoom.members.filter(m => m.userId !== user.userId);
        const receiverName = otherMembers[0]?.displayName ?? "Someone";
        setDialingCall({ chatRoomId: activeRoom.roomId, roomName, isVideo, receiverName });
        await initiateCall(activeRoom.roomId, roomName, isVideo);
      }
    } catch (err) {
      console.error("Failed to start call:", err);
    }
  }, [user, activeRoom, initiateCall]);

  const handleCancelDialing = useCallback(async () => {
    if (!dialingCall) return;
    try {
      await endCall(dialingCall.chatRoomId, dialingCall.roomName);
    } catch (err) {
      console.error("Failed to cancel dialing:", err);
    } finally {
      setDialingCall(null);
    }
  }, [dialingCall, endCall]);

  const handleLeaveCall = useCallback(async (isGroup: boolean) => {
    if (!activeCallRoomName || !activeRoom) return;
    try {
      if (!isGroup) {
        await endCall(activeRoom.roomId, activeCallRoomName);
      }
    } catch (err) {
      console.error("Failed to leave/end call:", err);
    } finally {
      setCallToken(null);
      setActiveCallRoomName(null);
      setIsPipMode(false);
    }
  }, [activeCallRoomName, activeRoom, endCall]);

  const handleInviteToCall = useCallback(async (targetUserId: number) => {
    if (!activeRoom || !activeCallRoomName) return;
    await inviteToCall(activeRoom.roomId, targetUserId, activeCallRoomName);
  }, [activeRoom, activeCallRoomName, inviteToCall]);

  if (isLoading || !user) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: "var(--tg-sidebar)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--tg-accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar rooms={rooms} activeRoomId={activeRoom?.roomId}
        onSelectRoom={handleSelectRoom}
        onRoomsChange={loadRooms} />

      <div className={cn(
        "flex-1 flex-col h-full overflow-hidden",
        !activeRoom ? "hidden md:flex" : "flex"
      )} style={{ background: "var(--tg-bg)" }}>
        {activeRoom ? (
          <>
            <ChatHeader room={activeRoom} currentUserId={user.userId}
              onVoiceCall={() => handleStartCall(false)}
              onVideoCall={() => handleStartCall(true)}
              onInviteToCall={handleInviteToCall}
              activeCallRoomName={activeCallRoomName ?? undefined}
              onBack={() => {
                setActiveRoom(null);
                if (typeof window !== 'undefined') {
                  const url = new URL(window.location.href);
                  url.searchParams.delete("roomId");
                  window.history.replaceState({}, '', url.toString());
                }
              }} />

            {/* Sticky Pinned Message Header */}
            {pinnedMessage && (
              <div className="bg-[#1E293B] border-l-4 border-[#3390EC] px-6 py-2 flex items-center justify-between text-xs animate-fadeIn select-none border-b border-[#304050]/20 flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Pin size={12} className="text-[#3390EC] rotate-45 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#3390EC]">Pinned Message</p>
                    <p className="text-slate-300 truncate mt-0.5">{pinnedMessage.content}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPinnedMessage(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer outline-none border-none bg-transparent"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <ChatThread
              roomId={activeRoom.roomId}
              messages={messages}
              currentUserId={user.userId}
              typingUsers={typingUsers}
              isDirect={!activeRoom.isGroup}
            />
            <MessageInput onSend={handleSend}
              onTyping={isTyping => sendTyping(activeRoom.roomId, isTyping)}
              disabled={loadingMsgs}
              replyingToMessage={replyingToMessage}
              onCancelReply={() => setReplyingToMessage(null)}
              token={user.token} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#17212B] select-none p-6 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[#202B36] border border-[#304050] text-[#3390EC]/40 mb-4 animate-scaleIn">
              <MessageSquare size={36} className="text-[#3390EC]" />
            </div>
            <span className="px-4 py-1.5 rounded-full text-xs text-slate-300 bg-[#273442] border border-[#304050]/40 font-medium">
              Select a chat to start messaging securely
            </span>
          </div>
        )}
      </div>

      {callToken && (
        <CallOverlay
          token={callToken}
          onLeave={() => handleLeaveCall(activeRoom?.isGroup ?? false)}
          isPip={isPipMode}
          onTogglePip={() => setIsPipMode(prev => !prev)}
          isGroup={activeRoom?.isGroup ?? false}
        />
      )}

      {dialingCall && (
        <DialingOverlay
          receiverName={dialingCall.receiverName}
          isVideo={dialingCall.isVideo}
          onCancel={handleCancelDialing}
        />
      )}
    </div>
  );
}
