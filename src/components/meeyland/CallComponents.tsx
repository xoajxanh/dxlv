"use client";

import { useState } from "react";
import {
  Phone, Video, PhoneOff, PhoneIncoming,
  UserPlus, Search, MoreVertical, Bookmark, ArrowLeft,
  Maximize2, Minimize2
} from "lucide-react";
import { Room } from "@/lib/meeyland/api";
import { Avatar } from "@/components/meeyland/Avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/meeyland/Dialog";
import { Button } from "@/components/ui/meeyland/Button";
import { cn } from "@/lib/utils";

// ── LiveKit imports ──────────────────────────────────────────
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "ws://localhost:7880";

/* ═══════════════════════════════════════════════════════════ */
/*  Incoming call banner                                        */
/* ═══════════════════════════════════════════════════════════ */
interface IncomingCallBannerProps {
  callerName: string;
  isVideo: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallBanner({ callerName, isVideo, onAccept, onDecline }: IncomingCallBannerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-fadeIn"
      style={{ background: "var(--tg-bg)", border: "1px solid var(--tg-accent)", minWidth: 280 }}>
      <div className="p-2 rounded-full animate-pulse" style={{ background: "var(--tg-accent)" }}>
        {isVideo ? <Video size={22} className="text-white" /> : <Phone size={22} className="text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs tg-muted">{isVideo ? "Incoming video call" : "Incoming call"}</p>
        <p className="text-sm font-semibold text-white truncate">{callerName}</p>
      </div>
      <button onClick={onDecline} className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: "var(--tg-danger)" }}>
        <PhoneOff size={17} className="text-white" />
      </button>
      <button onClick={onAccept} className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: "#4dcd5e" }}>
        <Phone size={17} className="text-white" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  Chat header with call buttons + Add-to-call modal          */
/* ═══════════════════════════════════════════════════════════ */
interface ChatHeaderProps {
  room: Room;
  currentUserId: number;
  onVoiceCall: () => void;
  onVideoCall: () => void;
  onInviteToCall: (userId: number) => void;
  activeCallRoomName?: string;
  onBack?: () => void;
}

export function ChatHeader({
  room, currentUserId, onVoiceCall, onVideoCall, onInviteToCall, activeCallRoomName, onBack
}: ChatHeaderProps) {
  const [showInvite, setShowInvite] = useState(false);

  const otherMembers = room.members.filter(m => m.userId !== currentUserId);
  const isSavedMessages = !room.isGroup && (room.members.length === 1 || room.members.every(m => m.userId === currentUserId));
  const displayName = isSavedMessages ? "Saved Messages" : (room.isGroup ? room.name : otherMembers[0]?.displayName ?? room.name);

  return (
    <header className="tg-header flex items-center justify-between h-[72px] bg-[#202B36] border-b border-[#304050] px-4 md:px-6 flex-shrink-0 select-none">
      <div className="flex items-center gap-2 md:gap-3">
        {onBack && (
          <button onClick={onBack} className="md:hidden p-1.5 -ml-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer outline-none">
            <ArrowLeft size={20} />
          </button>
        )}
        {isSavedMessages ? (
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-[#3390EC] text-white flex-shrink-0">
            <Bookmark size={20} className="fill-white" />
          </div>
        ) : (
          <Avatar name={displayName} size="md" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{displayName}</p>
          <p className="text-xs text-[#94A3B8]">
            {isSavedMessages ? "Drafts & files" : (room.isGroup ? `${room.members.length} members` : "online")}
          </p>
        </div>
      </div>

      {/* Call & Utility controls */}
      <div className="flex items-center gap-1">
        {activeCallRoomName && room.isGroup && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInvite(true)}
            title="Add people to call"
          >
            <UserPlus size={18} />
          </Button>
        )}
        {/* <Button variant="ghost" size="icon" title="Search messages">
          <Search size={18} />
        </Button> */}
        <Button variant="ghost" size="icon" onClick={onVoiceCall} title="Voice call">
          <Phone size={18} />
        </Button>
        {/* <Button variant="ghost" size="icon" onClick={onVideoCall} title="Video call">
          <Video size={18} />
        </Button> */}
        {/* <Button variant="ghost" size="icon" title="More options">
          <MoreVertical size={18} />
        </Button> */}
      </div>

      {/* Invite-to-call modal */}
      {showInvite && (
        <InviteModal
          members={otherMembers}
          onInvite={(uid) => { onInviteToCall(uid); setShowInvite(false); }}
          onClose={() => setShowInvite(false)}
        />
      )}
    </header>
  );
}

function InviteModal({ members, onInvite, onClose }: {
  members: { userId: number; displayName: string; avatarUrl?: string }[];
  onInvite: (userId: number) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to call</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 max-h-64 overflow-y-auto mt-4 border border-slate-800 rounded-xl p-1.5 bg-[#17212b]">
          {members.length === 0 ? (
            <p className="text-xs tg-muted text-center py-4">No other members available</p>
          ) : (
            members.map(m => (
              <button key={m.userId} onClick={() => onInvite(m.userId)}
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-slate-800/40 transition-colors cursor-pointer text-left outline-none">
                <Avatar name={m.displayName} size="sm" />
                <span className="text-sm text-white font-medium">{m.displayName}</span>
                <PhoneIncoming size={14} className="ml-auto text-sky-500" />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  Full-screen Call Overlay (LiveKit room)                    */
/* ═══════════════════════════════════════════════════════════ */
interface CallOverlayProps {
  token: string;
  onLeave: () => void;
  isPip: boolean;
  onTogglePip: () => void;
  isGroup: boolean;
}

export function CallOverlay({ token, onLeave, isPip, onTogglePip, isGroup }: CallOverlayProps) {
  return (
    <div
      className={cn(
        "z-40 flex flex-col transition-all duration-300 shadow-2xl border bg-[#0a0f14]",
        isPip
          ? "fixed bottom-6 right-6 w-80 h-60 rounded-2xl overflow-hidden border-slate-700 animate-scaleIn"
          : "fixed inset-0 border-transparent animate-fadeIn"
      )}
    >
      {/* Control overlay */}
      <div className="absolute top-2 right-2 z-50 flex items-center gap-2 bg-slate-900/80 px-2 py-1 rounded-lg backdrop-blur-sm">
        <button
          onClick={onTogglePip}
          className="p-1.5 text-white hover:bg-slate-800 rounded transition-colors cursor-pointer outline-none border-none bg-transparent"
          title={isPip ? "Maximize" : "Minimize to Picture-in-Picture"}
        >
          {isPip ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
        </button>
        {isPip && (
          <button
            onClick={onLeave}
            className="p-1.5 text-red-500 hover:bg-slate-800 rounded transition-colors cursor-pointer outline-none border-none bg-transparent"
            title={isGroup ? "Leave Call" : "End Call"}
          >
            <PhoneOff size={16} />
          </button>
        )}
      </div>

      <LiveKitRoom
        token={token}
        serverUrl={LIVEKIT_URL}
        connect={true}
        onDisconnected={onLeave}
        data-lk-theme="default"
        className="flex-1 min-h-0"
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  1-1 Calling Dialing Overlay                                 */
/* ═══════════════════════════════════════════════════════════ */
interface DialingOverlayProps {
  receiverName: string;
  isVideo: boolean;
  onCancel: () => void;
}

export function DialingOverlay({ receiverName, isVideo, onCancel }: DialingOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/95 text-white animate-fadeIn">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="relative">
          {/* Avatar / Pulse effect */}
          <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden animate-pulse">
            <Avatar name={receiverName} size="lg" />
          </div>
          <div className="absolute inset-0 w-24 h-24 rounded-full border border-sky-500/50 animate-ping" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{receiverName}</h2>
          <p className="text-sm text-slate-400">
            {isVideo ? "Calling (Video)..." : "Calling..."}
          </p>
        </div>

        <button
          onClick={onCancel}
          className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg cursor-pointer outline-none mt-8 border-none"
        >
          <PhoneOff size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
}
