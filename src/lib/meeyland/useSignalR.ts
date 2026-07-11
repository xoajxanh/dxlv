"use client";

import { useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { API_BASE } from "@/lib/utils";
import { Room, Member } from "./api";

export interface IncomingMessage {
  id: number;
  chatRoomId: number;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
  isGroup?: boolean;
  chatRoomName?: string;
  sender: { userId: number; displayName: string; avatarUrl?: string };
}

export interface MessageReadEvent {
  chatRoomId: number;
  userId: number;
  lastReadMessageId?: number | null;
  lastReadAt?: string | null;
}

export interface IncomingCall {
  chatRoomId: number;
  liveKitRoomName: string;
  callerId?: number;
  callerName?: string;
  inviterId?: number;
  inviterName?: string;
  isVideo?: boolean;
}

export interface TypingEvent {
  chatRoomId: number;
  userId: number;
  displayName: string;
  isTyping: boolean;
}

interface Handlers {
  onMessage?: (msg: IncomingMessage) => void;
  onTyping?: (evt: TypingEvent) => void;
  onIncomingCall?: (call: IncomingCall) => void;
  onCallResponse?: (res: { responderId: number; responderName: string; accepted: boolean; liveKitRoomName: string; reason?: string }) => void;
  onMessageRead?: (evt: MessageReadEvent) => void;
  onRoomCreated?: (room: Room) => void;
  onRoomUpdated?: (evt: { roomId: number; members: Member[] }) => void;
  onReconnected?: () => void;
  onCallEnded?: (evt: { chatRoomId: number; liveKitRoomName: string; endedById: number }) => void;
}

export function useSignalR(token: string | null, handlers: Handlers) {
  const connRef = useRef<signalR.HubConnection | null>(null);
  const handlersRef = useRef(handlers);
  const isConnectedRef = useRef(false);
  const hasConnectedOnceRef = useRef(false);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const hubUrl = `${API_BASE}/chathub`;
    console.log("🚀 [DEBUG] SignalR connecting to:", hubUrl);
    
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    conn.on("ReceiveMessage", (msg: IncomingMessage) => handlersRef.current.onMessage?.(msg));
    conn.on("UserTyping", (evt: TypingEvent) => handlersRef.current.onTyping?.(evt));
    conn.on("IncomingCall", (call: IncomingCall) => handlersRef.current.onIncomingCall?.(call));
    conn.on("CallResponse", (res) => handlersRef.current.onCallResponse?.(res));
    conn.on("MessageRead", (evt: MessageReadEvent) => handlersRef.current.onMessageRead?.(evt));
    conn.on("RoomCreated", (room: Room) => handlersRef.current.onRoomCreated?.(room));
    conn.on("RoomUpdated", (evt: { roomId: number; members: Member[] }) => handlersRef.current.onRoomUpdated?.(evt));
    conn.on("CallEnded", (evt: { chatRoomId: number; liveKitRoomName: string; endedById: number }) => handlersRef.current.onCallEnded?.(evt));

    conn.onreconnected(() => {
      console.log("⚡ [DEBUG] SignalR reconnected automatically.");
      isConnectedRef.current = true;
      handlersRef.current.onReconnected?.();
    });

    conn.onclose((error) => {
      console.warn("❌ [DEBUG] SignalR connection closed. Error:", error);
      isConnectedRef.current = false;
      if (!cancelled) {
        console.log("🔄 [DEBUG] Attempting to reconnect SignalR in 5 seconds...");
        setTimeout(startConnection, 5000);
      }
    });

    async function startConnection() {
      if (cancelled) return;
      try {
        await conn.start();
        console.log("✅ [DEBUG] SignalR connected successfully.");
        const isReconnect = hasConnectedOnceRef.current;
        isConnectedRef.current = true;
        hasConnectedOnceRef.current = true;
        if (isReconnect) {
          handlersRef.current.onReconnected?.();
        }
      } catch (error: any) {
        console.error("❌ [DEBUG] SignalR connection failed to start:", error);
        const isUnauthorized = error && (
          error.statusCode === 401 ||
          (error.message && error.message.includes("401")) ||
          (error.toString && error.toString().includes("401"))
        );
        if (isUnauthorized) {
          console.warn("⚠️ [DEBUG] SignalR connection rejected with 401. Logging out...");
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("meeyland_user");
            const lang = window.location.pathname.split("/")[1] || "vi";
            window.location.href = `/${lang}/demo/meeyland/login`;
          }
          return;
        }
        isConnectedRef.current = false;
        if (!cancelled) {
          console.log("🔄 [DEBUG] Retrying SignalR connection in 5 seconds...");
          setTimeout(startConnection, 5000);
        }
      }
    }

    startConnection();
    connRef.current = conn;

    return () => {
      cancelled = true;
      connRef.current = null;
      isConnectedRef.current = false;
      void conn.stop();
    };
  }, [token]);

  const invoke = useCallback(async (methodName: string, ...args: unknown[]) => {
    const conn = connRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected)
      throw new Error("Realtime connection is not ready yet.");
    await conn.invoke(methodName, ...args);
  }, []);

  const sendMessage = useCallback(async (chatRoomId: number, content: string, attachmentUrl?: string) => {
    await invoke("SendMessage", chatRoomId, content, attachmentUrl);
  }, [invoke]);

  const sendTyping = useCallback(async (chatRoomId: number, isTyping: boolean) => {
    if (connRef.current?.state !== signalR.HubConnectionState.Connected) return;
    await invoke("Typing", chatRoomId, isTyping);
  }, [invoke]);

  const initiateCall = useCallback(async (chatRoomId: number, liveKitRoomName: string, isVideo: boolean) => {
    await invoke("InitiateCall", chatRoomId, liveKitRoomName, isVideo);
  }, [invoke]);

  const inviteToCall = useCallback(async (chatRoomId: number, targetUserId: number, liveKitRoomName: string) => {
    await invoke("InviteToCall", chatRoomId, targetUserId, liveKitRoomName);
  }, [invoke]);

  const respondToCall = useCallback(async (callerId: number, accepted: boolean, liveKitRoomName: string, reason?: string) => {
    await invoke("RespondToCall", callerId, accepted, liveKitRoomName, reason);
  }, [invoke]);

  const endCall = useCallback(async (chatRoomId: number, liveKitRoomName: string) => {
    await invoke("EndCall", chatRoomId, liveKitRoomName);
  }, [invoke]);

  const markRead = useCallback(async (chatRoomId: number, lastReadMessageId?: number) => {
    if (connRef.current?.state !== signalR.HubConnectionState.Connected) return;
    await invoke("MarkRead", chatRoomId, lastReadMessageId);
  }, [invoke]);

  return { sendMessage, sendTyping, initiateCall, inviteToCall, respondToCall, markRead, endCall };
}
