import { API_BASE } from "@/lib/utils";

export interface Room {
  roomId: number;
  name: string;
  isGroup: boolean;
  createdAt: string;
  members: Member[];
  unreadCount: number;
  lastReadMessageId?: number | null;
  directLastReadMessageId?: number | null;
  lastMessage?: { id: number; content: string; senderId: number; senderName: string; createdAt: string } | null;
}

export interface Member {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  lastReadMessageId?: number | null;
  lastReadAt?: string | null;
}

export interface Message {
  id: number;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
  isReadByOther?: boolean;
  sender: Member;
}

export interface Contact {
  contactId: number;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  addedAt: string;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Contacts ─────────────────────────────────────────────────

export async function getContacts(token: string): Promise<Contact[]> {
  return handleResponse(await fetch(`${API_BASE}/api/contacts`, { headers: authHeaders(token) }));
}

export async function searchUsers(token: string, q: string): Promise<Member[]> {
  return handleResponse(await fetch(`${API_BASE}/api/contacts/search?q=${encodeURIComponent(q)}`, { headers: authHeaders(token) }));
}

export async function addContact(token: string, userId: number) {
  return handleResponse(await fetch(`${API_BASE}/api/contacts`, {
    method: "POST", headers: authHeaders(token), body: JSON.stringify({ userId }),
  }));
}

export async function removeContact(token: string, contactId: number) {
  return handleResponse(await fetch(`${API_BASE}/api/contacts/${contactId}`, {
    method: "DELETE", headers: authHeaders(token),
  }));
}

// ── Rooms ─────────────────────────────────────────────────────

export async function getRooms(token: string): Promise<Room[]> {
  return handleResponse(await fetch(`${API_BASE}/api/chatrooms`, { headers: authHeaders(token) }));
}

export async function openDirectChat(token: string, otherUserId: number): Promise<{ roomId: number; created: boolean }> {
  return handleResponse(await fetch(`${API_BASE}/api/chatrooms/direct`, {
    method: "POST", headers: authHeaders(token), body: JSON.stringify({ otherUserId }),
  }));
}

export async function createGroup(token: string, name: string, memberUserIds: number[]): Promise<{ roomId: number }> {
  return handleResponse(await fetch(`${API_BASE}/api/chatrooms/group`, {
    method: "POST", headers: authHeaders(token), body: JSON.stringify({ name, memberUserIds }),
  }));
}

export async function addMemberToGroup(token: string, roomId: number, userId: number) {
  return handleResponse(await fetch(`${API_BASE}/api/chatrooms/${roomId}/members`, {
    method: "POST", headers: authHeaders(token), body: JSON.stringify({ userId }),
  }));
}

export async function markRoomRead(token: string, roomId: number, lastReadMessageId?: number) {
  return handleResponse<{ chatRoomId: number; userId: number; lastReadMessageId?: number | null; lastReadAt?: string | null }>(
    await fetch(`${API_BASE}/api/chatrooms/${roomId}/read`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ lastReadMessageId }),
    })
  );
}

// ── Messages ──────────────────────────────────────────────────

export async function getMessages(token: string, roomId: number, limit = 50, before?: number): Promise<Message[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", String(before));
  return handleResponse(await fetch(`${API_BASE}/api/chatrooms/${roomId}/messages?${params}`, { headers: authHeaders(token) }));
}

// ── LiveKit token ─────────────────────────────────────────────

export async function getLiveKitToken(token: string, roomName: string): Promise<{ token: string; identity: string; displayName: string }> {
  return handleResponse(await fetch(`${API_BASE}/api/token/livekit?roomName=${encodeURIComponent(roomName)}`, { headers: authHeaders(token) }));
}

// ── File Uploads ──────────────────────────────────────────────

export interface UploadSession {
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
}

export async function initiateUpload(
  token: string,
  fileName: string,
  fileSize: number,
  contentType: string
): Promise<UploadSession> {
  return handleResponse(
    await fetch(`${API_BASE}/api/upload/initiate`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ fileName, fileSize, contentType }),
    })
  );
}

export async function getUploadStatus(
  token: string,
  uploadId: string
): Promise<{ uploadedChunks: number[] }> {
  return handleResponse(
    await fetch(`${API_BASE}/api/upload/status?uploadId=${encodeURIComponent(uploadId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );
}

export async function uploadChunk(
  token: string,
  uploadId: string,
  chunkIndex: number,
  chunkBlob: Blob,
  abortSignal?: AbortSignal
): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append("uploadId", uploadId);
  formData.append("chunkIndex", String(chunkIndex));
  formData.append("chunk", chunkBlob, `chunk_${chunkIndex}`);

  const res = await fetch(`${API_BASE}/api/upload/chunk`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    signal: abortSignal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Chunk upload HTTP ${res.status}`);
  }
  return res.json();
}

export async function completeUpload(
  token: string,
  uploadId: string,
  fileName: string,
  totalChunks: number
): Promise<{ attachmentUrl: string }> {
  return handleResponse(
    await fetch(`${API_BASE}/api/upload/complete`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ uploadId, fileName, totalChunks }),
    })
  );
}
