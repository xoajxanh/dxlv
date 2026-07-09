"use client";

import { useState } from "react";
import {
  Phone, Video, PhoneOff, PhoneIncoming,
  UserPlus, Search, MoreVertical, Bookmark
} from "lucide-react";
import { Room } from "@/lib/meeyland/api";
import { Avatar } from "@/components/meeyland/Avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/meeyland/Dialog";
import { Button } from "@/components/ui/meeyland/Button";

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
}

export function ChatHeader({
  room, currentUserId, onVoiceCall, onVideoCall, onInviteToCall, activeCallRoomName
}: ChatHeaderProps) {
  const [showInvite, setShowInvite] = useState(false);

  const otherMembers = room.members.filter(m => m.userId !== currentUserId);
  const isSavedMessages = !room.isGroup && (room.members.length === 1 || room.members.every(m => m.userId === currentUserId));
  const displayName = isSavedMessages ? "Saved Messages" : (room.isGroup ? room.name : otherMembers[0]?.displayName ?? room.name);

  return (
    <header className="tg-header flex items-center justify-between h-[72px] bg-[#202B36] border-b border-[#304050] px-6 flex-shrink-0 select-none">
      <div className="flex items-center gap-3">
        {isSavedMessages ? (
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#3390EC] text-white flex-shrink-0">
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
}

export function CallOverlay({ token, onLeave }: CallOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "#0a0f14" }}>
      <LiveKitRoom
        token={token}
        serverUrl={LIVEKIT_URL}
        connect={true}
        onDisconnected={onLeave}
        data-lk-theme="default"
        className="flex-1"
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
