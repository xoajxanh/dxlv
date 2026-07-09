"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Menu, Users, LogOut, X, Check, Loader2, MessageSquare, Bookmark, User, Settings, BookOpen, Plus, Home } from "lucide-react";
import { useAuth, AuthUser } from "@/lib/meeyland/AuthContext";
import { Avatar } from "@/components/meeyland/Avatar";
import { cn } from "@/lib/utils";
import {
  Room, Member, Contact,
  getRooms, searchUsers, openDirectChat, createGroup, getContacts, addContact
} from "@/lib/meeyland/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/meeyland/Dialog";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/meeyland/drawer";
import { Input } from "@/components/ui/meeyland/Input";
import { Button } from "@/components/ui/meeyland/Button";
import Link from "next/link";
import Image from "next/image";

interface SidebarProps {
  activeRoomId?: number;
  onSelectRoom: (room: Room) => void;
  rooms: Room[];
  onRoomsChange: () => void;
}

export function Sidebar({ activeRoomId, onSelectRoom, rooms, onRoomsChange }: SidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);

  // Drawer and Dialog states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // New group modal
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Handler to open self-DM chat (Saved Messages)
  const handleOpenSavedMessages = async () => {
    if (!user) return;
    setIsDrawerOpen(false);
    try {
      const { roomId } = await openDirectChat(user.token, user.userId);
      onRoomsChange();
      const foundRoom = rooms.find(r => r.roomId === roomId);
      if (foundRoom) {
        onSelectRoom(foundRoom);
      } else {
        setTimeout(async () => {
          const freshRooms = await getRooms(user.token);
          const matched = freshRooms.find(r => r.roomId === roomId);
          if (matched) onSelectRoom(matched);
        }, 150);
      }
    } catch (err) {
      console.error("Failed to open Saved Messages:", err);
    }
  };

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load contacts for group creation or contacts list
  useEffect(() => {
    if (!user || (!showNewGroup && !showContacts)) return;
    getContacts(user.token).then(setContacts).catch(console.error);
  }, [user, showNewGroup, showContacts]);

  // Global search when typing in search input
  useEffect(() => {
    if (!user) return;
    clearTimeout(searchTimeout.current);
    if (search.trim().length < 1) return;

    searchTimeout.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await searchUsers(user.token, search.trim());
        setSearchResults(res);
      } catch { /* ignore */ }
      finally { setSearching(false); }
    }, 300);
  }, [search, user]);

  const handleOpenDirect = async (contactUserId: number) => {
    if (!user) return;
    try {
      // Auto-add as contact first (fails silently if already contact)
      try {
        await addContact(user.token, contactUserId);
      } catch {
        // ignore if already added
      }

      const { roomId } = await openDirectChat(user.token, contactUserId);
      onRoomsChange();
      // Wait briefly for rooms list to reload, or manually find/select
      const foundRoom = rooms.find(r => r.roomId === roomId);
      if (foundRoom) {
        onSelectRoom(foundRoom);
      } else {
        // If room is newly created, trigger full reload and let caller handle selection
        setTimeout(async () => {
          const freshRooms = await getRooms(user.token);
          const matched = freshRooms.find(r => r.roomId === roomId);
          if (matched) onSelectRoom(matched);
        }, 150);
      }
      setSearch("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedMembers.length === 0) return;
    setCreatingGroup(true);
    try {
      await createGroup(user.token, groupName.trim(), selectedMembers.map(m => m.userId));
      setShowNewGroup(false);
      setGroupName("");
      setSelectedMembers([]);
      onRoomsChange();
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleLogout = () => {
    logout();
    const lang = window.location.pathname.split("/")[1] || "en";
    router.replace(`/${lang}/demo/meeyland/login`);
  };

  const getRoomDisplayName = (room: Room) => {
    return room.isGroup
      ? room.name
      : room.members.find(m => m.userId !== user?.userId)?.displayName ?? room.name;
  };

  // Filter local rooms by search query
  const filteredRooms = rooms.filter(r =>
    getRoomDisplayName(r).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className={cn(
      "tg-sidebar flex flex-col h-full flex-shrink-0 border-r border-[#304050] select-none relative overflow-hidden",
      activeRoomId ? "hidden md:flex md:w-[320px]" : "w-full md:w-[320px]"
    )}>

      {/* Slide-over Left Menu Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} swipeDirection="left">
        <DrawerContent className="fixed inset-y-0 left-0 z-50 flex h-full w-[320px] flex-col border-r border-[#304050] bg-[#202B36] outline-none shadow-2xl rounded-none select-none">
          {/* Header with user info */}
          <div className="p-5 border-b border-[#304050] bg-[#17212B] flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar name={user?.displayName ?? "User"} size="lg" />
              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-start gap-1.5">
                  <h3 className="font-semibold text-base text-white truncate leading-tight">{user?.displayName}</h3>
                  <span className="w-2 h-2 rounded-full bg-[#2ECC71] mt-0.5 flex-shrink-0" />
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">@{user?.username}</p>
              </div>
            </div>

            <DrawerClose
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer outline-none border-none bg-transparent flex-shrink-0 -mr-2 -mt-1"
            >
              <X size={18} />
            </DrawerClose>
          </div>

          {/* Drawer Menu Items */}
          <div className="flex-1 py-3 overflow-y-auto space-y-1">
            <button
              onClick={() => { setShowProfile(true); setIsDrawerOpen(false); }}
              className="w-full flex items-center gap-4 px-6 py-3 text-slate-300 hover:text-white hover:bg-[#2A3947] transition-colors text-left cursor-pointer outline-none border-none bg-transparent"
            >
              <User size={18} className="text-slate-400" />
              <span className="text-sm font-medium">Profile</span>
            </button>

            <button
              onClick={() => { setShowContacts(true); setIsDrawerOpen(false); }}
              className="w-full flex items-center gap-4 px-6 py-3 text-slate-300 hover:text-white hover:bg-[#2A3947] transition-colors text-left cursor-pointer outline-none border-none bg-transparent"
            >
              <BookOpen size={18} className="text-slate-400" />
              <span className="text-sm font-medium">Contacts</span>
            </button>

            <button
              onClick={() => { setShowNewGroup(true); setIsDrawerOpen(false); }}
              className="w-full flex items-center gap-4 px-6 py-3 text-slate-300 hover:text-white hover:bg-[#2A3947] transition-colors text-left cursor-pointer outline-none border-none bg-transparent"
            >
              <Users size={18} className="text-slate-400" />
              <span className="text-sm font-medium">Groups</span>
            </button>

            <Link
              href="/"
              className="w-full flex items-center gap-4 px-6 py-3 text-slate-300 hover:text-white hover:bg-[#2A3947] transition-colors text-left cursor-pointer outline-none border-none bg-transparent"
            >
              <Home size={18} className="text-slate-400" />
              <span className="text-sm font-medium">Về trang chủ</span>
            </Link>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-[#304050] bg-[#17212B]/40">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left font-medium cursor-pointer"
            >
              <LogOut size={18} />
              <span className="text-sm">Log Out</span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Header with Search and Hamburger menu */}
      <div className="flex items-center gap-3 px-4 py-3 h-[72px] bg-[#202B36] border-b border-[#304050]">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#2A3947] transition-colors cursor-pointer outline-none flex-shrink-0"
        >
          <Menu size={20} />
        </button>

        {/* Search bar */}
        <div className="flex-1">
          <Input
            id="search-chat"
            value={search}
            onChange={e => {
              const value = e.target.value;
              setSearch(value);
              if (!value.trim()) setSearchResults([]);
            }}
            placeholder="Search messages or users"
            iconLeft={<Search size={15} />}
            iconRight={
              search ? (
                <button
                  onClick={() => { setSearch(""); setSearchResults([]); }}
                  className="opacity-60 hover:opacity-100 cursor-pointer"
                >
                  <X size={13} />
                </button>
              ) : undefined
            }
            className="h-10 rounded-full bg-[#273442] border-transparent focus-visible:border-[#3390EC]"
          />
        </div>
      </div>

      {/* Main chat list / search results */}
      <div className="flex-1 overflow-y-auto">
        {search.trim() ? (
          // Active search layout
          <div className="space-y-4 py-2">
            {/* Local Matching Chats */}
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 px-3 pb-1.5 uppercase">Chats</p>
              {filteredRooms.length === 0 ? (
                <p className="text-xs tg-muted px-3 py-1">No chats match</p>
              ) : (
                filteredRooms.map(room => (
                  <RoomRow
                    key={room.roomId}
                    room={room}
                    active={room.roomId === activeRoomId}
                    onClick={() => { onSelectRoom(room); setSearch(""); }}
                    getRoomDisplayName={getRoomDisplayName}
                  />
                ))
              )}
            </div>

            {/* Global search results */}
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 px-3 pb-1.5 uppercase border-t tg-border pt-3">Global Search</p>
              {searching ? (
                <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin tg-muted" /></div>
              ) : searchResults.length === 0 ? (
                <p className="text-xs tg-muted px-3 py-1">No users found</p>
              ) : (
                searchResults.map(u => (
                  <button
                    key={u.userId}
                    onClick={() => handleOpenDirect(u.userId)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#2A3947] transition-colors text-left"
                  >
                    <Avatar name={u.displayName} size="md" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-white truncate block">{u.displayName}</span>
                      <span className="text-xs tg-muted block">@{u.username}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          // Empty search, show active rooms
          rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <MessageSquare size={32} className="opacity-20 mb-3" />
              <p className="text-xs tg-muted">No chats started yet.</p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-[200px]">Type in the search bar above to find and message users globally.</p>
            </div>
          ) : (
            rooms.map(room => (
              <RoomRow
                key={room.roomId}
                room={room}
                active={room.roomId === activeRoomId}
                onClick={() => onSelectRoom(room)}
                getRoomDisplayName={getRoomDisplayName}
              />
            ))
          )
        )}
      </div>

      {/* New Group Modal */}
      {showNewGroup && (
        <NewGroupModal
          contacts={contacts}
          user={user!}
          groupName={groupName}
          setGroupName={setGroupName}
          selectedMembers={selectedMembers}
          setSelectedMembers={setSelectedMembers}
          creating={creatingGroup}
          onCreate={handleCreateGroup}
          onClose={() => { setShowNewGroup(false); setGroupName(""); setSelectedMembers([]); }}
        />
      )}

      {/* Profile Modal */}
      {showProfile && (
        <Dialog open={true} onOpenChange={(open) => !open && setShowProfile(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Profile Information</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center mt-2">
              <Avatar name={user?.displayName ?? "User"} size="lg" />
              <div>
                <h2 className="text-lg font-bold text-white">{user?.displayName}</h2>
                <p className="text-sm text-slate-400">@{user?.username}</p>
              </div>
              <div className="w-full bg-[#17212B] border border-[#304050] rounded-xl p-4 text-left space-y-2.5">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-[#3390EC] uppercase block">Status</span>
                  <span className="text-sm text-[#2ECC71] font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2ECC71]" /> Online
                  </span>
                </div>
              </div>
              <Button onClick={() => setShowProfile(false)} variant="secondary" className="w-full text-sm">Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Dialog open={true} onOpenChange={(open) => !open && setShowSettings(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col p-4 space-y-4 mt-2">
              <div className="flex items-center gap-4">
                <Avatar name={user?.displayName ?? "User"} size="lg" />
                <div>
                  <h3 className="text-base font-bold text-white">{user?.displayName}</h3>
                  <p className="text-xs text-slate-400">@{user?.username}</p>
                </div>
              </div>
              <div className="border-t border-[#304050] pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm py-1.5">
                  <span className="text-slate-400">App Version</span>
                  <span className="text-white font-mono">1.0.0</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1.5">
                  <span className="text-slate-400">Secure Protocol</span>
                  <span className="text-[#2ECC71] font-semibold">Enabled</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1.5">
                  <span className="text-slate-400">Environment</span>
                  <span className="text-slate-200">Production</span>
                </div>
              </div>
              <Button onClick={() => setShowSettings(false)} variant="accent" className="w-full text-sm">Done</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Contacts Modal */}
      {showContacts && (
        <ContactsDialog
          contacts={contacts}
          user={user!}
          onSelectContact={(contactUserId) => {
            handleOpenDirect(contactUserId);
            setShowContacts(false);
          }}
          onClose={() => setShowContacts(false)}
        />
      )}
    </aside>
  );
}

/* ── Room row ─────────────────────────────────────────────── */
function RoomRow({ room, active, onClick, getRoomDisplayName }: {
  room: Room;
  active: boolean;
  onClick: () => void;
  getRoomDisplayName: (room: Room) => string;
}) {
  const { user } = useAuth();
  const isSavedMessages = !room.isGroup && (room.members.length === 1 || (user && room.members.every(m => m.userId === user.userId)));
  const displayName = isSavedMessages ? "Saved Messages" : getRoomDisplayName(room);
  const last = room.lastMessage;

  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-3 px-4 py-3 h-[72px] transition-all duration-150 text-left cursor-pointer outline-none border-b border-transparent select-none",
      active ? "bg-[#3390EC]" : "hover:bg-[#2A3947]"
    )}>
      {isSavedMessages ? (
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
          active ? "bg-white/20 text-white" : "bg-[#3390EC] text-white"
        )}>
          <Bookmark size={20} className="fill-white" />
        </div>
      ) : (
        <Avatar name={displayName} size="md" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-semibold text-white truncate">{displayName}</span>
          {last && (
            <span className={cn("text-[10px] flex-shrink-0 ml-2", active ? "text-white/75" : "text-slate-400")}>
              {formatTime(last.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {last ? (
            <p className={cn("text-xs truncate mt-0.5 flex-1", active ? "text-white/85" : "text-slate-400")}>
              {room.isGroup && <span className={cn("font-semibold", active ? "text-white/95" : "text-slate-300")}>{last.senderName}: </span>}
              {last.content}
            </p>
          ) : (
            <p className={cn("text-xs italic mt-0.5 flex-1", active ? "text-white/75" : "text-slate-500")}>No messages yet</p>
          )}
          {room.unreadCount > 0 && (
            <span className={cn(
              "min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center animate-scaleIn",
              active ? "bg-white text-[#3390EC]" : "bg-[#3390EC] text-white"
            )}>
              {room.unreadCount > 99 ? "99+" : room.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ── New Group Modal ──────────────────────────────────────── */
function NewGroupModal({
  contacts,
  user,
  groupName,
  setGroupName,
  selectedMembers,
  setSelectedMembers,
  creating,
  onCreate,
  onClose,
}: {
  contacts: Contact[];
  user: AuthUser;
  groupName: string;
  setGroupName: (v: string) => void;
  selectedMembers: Member[];
  setSelectedMembers: (v: Member[]) => void;
  creating: boolean;
  onCreate: () => void;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(user.token, searchQuery);
        setSearchResults(results.filter(r => r.userId !== user.userId));
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, user]);

  const toggle = (m: Member | Contact) => {
    setSelectedMembers(
      selectedMembers.some(x => x.userId === m.userId)
        ? selectedMembers.filter(x => x.userId !== m.userId)
        : [...selectedMembers, { userId: m.userId, username: m.username, displayName: m.displayName, avatarUrl: m.avatarUrl }]
    );
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">Group Name</label>
            <Input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Enter group name"
            />
          </div>

          {/* Selected Members Tray */}
          {selectedMembers.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-[#3390EC] uppercase block">Selected ({selectedMembers.length})</label>
              <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin select-none">
                {selectedMembers.map(m => (
                  <div key={m.userId} className="flex flex-col items-center gap-1 flex-shrink-0 relative group">
                    <Avatar name={m.displayName} size="sm" />
                    <span className="text-[10px] text-slate-300 max-w-[55px] truncate text-center">{m.displayName}</span>
                    <button
                      type="button"
                      onClick={() => toggle(m)}
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 rounded-full p-0.5 text-white transition-colors cursor-pointer border-none flex items-center justify-center"
                    >
                      <X size={8} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search box inside group selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">Add Members</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={searchQuery}
                onChange={e => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  if (!value.trim()) setSearchResults([]);
                }}
                placeholder="Search contacts or users globally..."
                className="w-full rounded-xl py-2 px-9 text-sm text-white placeholder:text-gray-500 bg-[#273442] border border-[#304050] outline-none focus:border-[#3390EC] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-65 hover:opacity-100 text-slate-400"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 border border-[#304050] rounded-xl p-1.5 bg-[#17212b]">
            {searchQuery.trim() ? (
              searching ? (
                <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-slate-500" /></div>
              ) : searchResults.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No users found matching &quot;{searchQuery}&quot;</p>
              ) : (
                searchResults.map(u => {
                  const sel = selectedMembers.some(m => m.userId === u.userId);
                  return (
                    <button
                      key={u.userId}
                      type="button"
                      onClick={() => toggle(u)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer text-left outline-none",
                        sel ? "tg-active" : "hover:bg-slate-800/40"
                      )}
                    >
                      <Avatar name={u.displayName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white truncate font-medium block leading-tight">{u.displayName}</span>
                        <span className="text-[10px] text-slate-400 truncate block">@{u.username}</span>
                      </div>
                      {sel && <Check size={14} className="text-sky-500" />}
                    </button>
                  );
                })
              )
            ) : contacts.length === 0 ? (
              <p className="text-xs tg-muted text-center py-6">Add users as contacts to build group members.</p>
            ) : (
              contacts.map(c => {
                const sel = selectedMembers.some(m => m.userId === c.userId);
                return (
                  <button
                    key={c.userId}
                    type="button"
                    onClick={() => toggle(c)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer text-left outline-none",
                      sel ? "tg-active" : "hover:bg-slate-800/40"
                    )}
                  >
                    <Avatar name={c.displayName} size="sm" />
                    <span className="flex-1 text-sm text-white truncate font-medium">{c.displayName}</span>
                    {sel && <Check size={14} className="text-sky-500" />}
                  </button>
                );
              })
            )}
          </div>

          <Button
            onClick={onCreate}
            disabled={creating || !groupName.trim() || selectedMembers.length === 0}
            loading={creating}
            variant="accent"
            className="w-full text-white"
          >
            Create Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/* ── Contacts Modal Dialog ────────────────────────────────── */
function ContactsDialog({
  contacts,
  user,
  onSelectContact,
  onClose,
}: {
  contacts: Contact[];
  user: AuthUser;
  onSelectContact: (userId: number) => void;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(user.token, searchQuery);
        setSearchResults(results.filter(r => r.userId !== user.userId));
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, user]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contacts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Search to add or chat */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={e => {
                const value = e.target.value;
                setSearchQuery(value);
                if (!value.trim()) setSearchResults([]);
              }}
              placeholder="Search users by name/username..."
              className="w-full rounded-xl py-2 px-9 text-sm text-white placeholder:text-gray-500 bg-[#273442] border border-[#304050] outline-none focus:border-[#3390EC]"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 bg-[#17212b] border border-[#304050] rounded-xl p-1.5">
            {searchQuery.trim() ? (
              searching ? (
                <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-slate-500" /></div>
              ) : searchResults.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No users found matching &quot;{searchQuery}&quot;</p>
              ) : (
                searchResults.map(u => (
                  <button
                    key={u.userId}
                    onClick={() => onSelectContact(u.userId)}
                    className="w-full flex items-center gap-3 px-2.5 py-2 hover:bg-slate-800/40 rounded-lg transition-colors text-left cursor-pointer outline-none border-none bg-transparent"
                  >
                    <Avatar name={u.displayName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-white truncate block">{u.displayName}</span>
                      <span className="text-xs text-slate-400 block">@{u.username}</span>
                    </div>
                    <Plus size={16} className="text-sky-500 ml-auto flex-shrink-0" />
                  </button>
                ))
              )
            ) : contacts.length === 0 ? (
              <div className="text-center py-8 px-4 text-slate-500">
                <p className="text-sm font-semibold">No contacts yet</p>
                <p className="text-xs mt-1">Use the search box above to search users globally.</p>
              </div>
            ) : (
              contacts.map(c => (
                <button
                  key={c.contactId}
                  onClick={() => onSelectContact(c.userId)}
                  className="w-full flex items-center gap-3 px-2.5 py-2 hover:bg-[#2A3947] rounded-lg transition-colors text-left cursor-pointer outline-none border-none bg-transparent"
                >
                  <Avatar name={c.displayName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-white truncate block">{c.displayName}</span>
                    <span className="text-xs text-slate-400 block">@{c.username}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
