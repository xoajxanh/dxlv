"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Smile, Paperclip, Mic, X, Image as ImageIcon, FileText, MapPin, User, BarChart2 } from "lucide-react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { Message, initiateUpload, uploadChunk, completeUpload } from "@/lib/meeyland/api";
import { toast } from "sonner";

interface MessageInputProps {
  onSend: (text: string, attachmentUrl?: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  replyingToMessage?: Message | null;
  onCancelReply?: () => void;
  token?: string | null;
}

export function MessageInput({
  onSend,
  onTyping,
  disabled,
  replyingToMessage,
  onCancelReply,
  token,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachment, setShowAttachment] = useState(false);

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const attachmentRef = useRef<HTMLDivElement>(null);

  // File upload state & refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [stagedAttachmentUrl, setStagedAttachmentUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const startChunkedUpload = async (file: File) => {
    if (!token) {
      toast.error("Authentication required for uploads");
      return;
    }

    setStagedFile(file);
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setStagedAttachmentUrl(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // 1. Initiate upload session
      const session = await initiateUpload(token, file.name, file.size, file.type);
      const { uploadId, chunkSize, totalChunks } = session;

      let uploadedBytes = 0;

      // 2. Upload chunks sequentially
      for (let i = 0; i < totalChunks; i++) {
        if (abortController.signal.aborted) {
          throw new Error("Upload cancelled");
        }

        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkBlob = file.slice(start, end);

        // Upload chunk with retries (up to 3 times)
        let chunkSuccess = false;
        let retries = 0;
        while (!chunkSuccess && retries < 3) {
          try {
            await uploadChunk(token, uploadId, i, chunkBlob, abortController.signal);
            chunkSuccess = true;
          } catch (err: any) {
            if (abortController.signal.aborted) throw err;
            retries++;
            if (retries >= 3) {
              throw new Error(`Failed to upload chunk ${i + 1}/${totalChunks} after 3 attempts: ${err.message}`);
            }
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        uploadedBytes += chunkBlob.size;
        setUploadProgress(Math.round((uploadedBytes / file.size) * 100));
      }

      // 3. Complete upload
      const completion = await completeUpload(token, uploadId, file.name, totalChunks);
      setStagedAttachmentUrl(completion.attachmentUrl);
      toast.success("File uploaded successfully!");
    } catch (err: any) {
      if (err.name === "AbortError" || err.message === "Upload cancelled") {
        toast.info("Upload cancelled");
      } else {
        console.error(err);
        setUploadError(err.message ?? "An error occurred during upload.");
        toast.error("Upload failed", { description: err.message });
      }
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearStagedAttachment();
  };

  const clearStagedAttachment = () => {
    setStagedFile(null);
    setUploadProgress(0);
    setUploading(false);
    setStagedAttachmentUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRetryUpload = () => {
    if (stagedFile) {
      startChunkedUpload(stagedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 2.5 GB max
    const maxSizeBytes = 2.5 * 1024 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error("File is too large", { description: "Maximum supported size is 2.5 GB." });
      return;
    }

    startChunkedUpload(file);
  };

  // Close elements on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (emojiRef.current && !emojiRef.current.contains(target)) {
        setShowEmoji(false);
      }
      if (attachmentRef.current && !attachmentRef.current.contains(target)) {
        setShowAttachment(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    // Typing indicator
    onTyping?.(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping?.(false), 1500);

    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && !stagedAttachmentUrl) || disabled || uploading) return;
    onSend(trimmed, stagedAttachmentUrl ?? undefined);
    setText("");
    clearStagedAttachment();
    onTyping?.(false);
    clearTimeout(typingTimeout.current);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setText(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleAttachmentItemClick = (type: string) => {
    setShowAttachment(false);
    if (type === "File" || type === "Gallery") {
      fileInputRef.current?.click();
    } else {
      toast.info(`${type} attachment selected`, { description: "Attachment upload is a demo feature." });
    }
  };

  return (
    <div className="relative px-6 py-3 border-t border-[#304050] bg-[#202B36] flex flex-col gap-2 select-none">

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Reply Preview Header inside Input Area */}
      {replyingToMessage && (
        <div className="flex items-center justify-between border-l-2 border-[#3390EC] bg-[#17212B]/40 px-3 py-1.5 rounded-r-lg text-xs animate-fadeIn">
          <div className="min-w-0">
            <p className="font-semibold text-[#3390EC]">Reply to {replyingToMessage.sender.displayName}</p>
            <p className="text-slate-300 truncate mt-0.5">{replyingToMessage.content}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer outline-none border-none bg-transparent"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Staged Attachment Card */}
      {stagedFile && (
        <div className="flex items-center justify-between bg-[#17212B]/50 border border-[#304050] px-4 py-3 rounded-2xl animate-fadeIn">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-[#3390EC]/10 text-[#3390EC] flex items-center justify-center flex-shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-white truncate">{stagedFile.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatBytes(stagedFile.size)} • {uploading ? `Uploading (${uploadProgress}%)` : stagedAttachmentUrl ? "Ready to send" : uploadError ? "Upload failed" : "Pending"}
              </p>

              {/* Progress Bar / Error details */}
              {uploading && (
                <div className="w-full bg-[#202B36] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#3390EC] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              {uploadError && (
                <p className="text-xs text-red-400 mt-1 font-medium">{uploadError}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {uploadError && (
              <button
                onClick={handleRetryUpload}
                className="px-3 py-1.5 rounded-xl bg-[#3390EC]/20 text-[#3390EC] hover:bg-[#3390EC]/30 text-xs font-semibold transition-all cursor-pointer outline-none border-none"
              >
                Retry
              </button>
            )}
            <button
              onClick={handleCancelUpload}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer outline-none border-none bg-transparent"
              title={uploading ? "Cancel Upload" : "Remove File"}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div ref={emojiRef} className="absolute bottom-full mb-3 left-6 z-30 shadow-2xl rounded-2xl overflow-hidden border border-[#304050]">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme={Theme.DARK}
            lazyLoadEmojis
            width={320}
            height={360}
          />
        </div>
      )}

      {/* Attachment Popover Menu */}
      {showAttachment && (
        <div ref={attachmentRef} className="absolute bottom-full mb-3 right-[76px] z-30 w-52 bg-[#202B36] border border-[#304050] rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1 animate-scaleIn">
          <button
            onClick={() => handleAttachmentItemClick("Gallery")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm text-slate-300 hover:bg-[#2A3947] hover:text-white transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
              <ImageIcon size={15} />
            </div>
            <span className="font-medium">Gallery</span>
          </button>

          <button
            onClick={() => handleAttachmentItemClick("File")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm text-slate-300 hover:bg-[#2A3947] hover:text-white transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <FileText size={15} />
            </div>
            <span className="font-medium">File</span>
          </button>

          {/* <button
            onClick={() => handleAttachmentItemClick("Location")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm text-slate-300 hover:bg-[#2A3947] hover:text-white transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0">
              <MapPin size={15} />
            </div>
            <span className="font-medium">Location</span>
          </button> */}

          {/* <button
            onClick={() => handleAttachmentItemClick("Contact")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm text-slate-300 hover:bg-[#2A3947] hover:text-white transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
              <User size={15} />
            </div>
            <span className="font-medium">Contact</span>
          </button> */}

          {/* <button
            onClick={() => handleAttachmentItemClick("Poll")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm text-slate-300 hover:bg-[#2A3947] hover:text-white transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
              <BarChart2 size={15} />
            </div>
            <span className="font-medium">Poll</span>
          </button> */}
        </div>
      )}

      {/* Main input controls bar */}
      <div className="flex items-end gap-3 min-h-12">
        {/* Input Field Container */}
        <div className="flex-1 rounded-3xl bg-[#273442] border border-[#304050] pl-4 pr-3 py-1.5 flex items-end gap-2 relative">

          {/* Emoji button */}
          <button
            onClick={() => setShowEmoji(v => !v)}
            disabled={disabled || uploading}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors disabled:opacity-40 flex-shrink-0 mb-0.5 cursor-pointer outline-none border-none bg-transparent"
            title="Add Emoji"
          >
            <Smile size={20} />
          </button>

          {/* Text area */}
          <textarea
            ref={inputRef}
            id="msg-input"
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Message..."
            className="flex-1 resize-none bg-transparent py-1 px-1 text-base md:text-sm text-white placeholder:text-slate-500 outline-none max-h-32 disabled:opacity-50 transition-all leading-relaxed align-bottom"
          />

          {/* Paperclip attachment button */}
          <button
            onClick={() => setShowAttachment(v => !v)}
            disabled={disabled || uploading || stagedFile !== null}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors disabled:opacity-40 flex-shrink-0 mb-0.5 cursor-pointer outline-none border-none bg-transparent"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

        </div>

        {/* Send button outside the input field */}
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !stagedAttachmentUrl) || disabled || uploading}
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-[#3390EC] hover:bg-[#4DA2F1] text-white transition-all shadow-md active:scale-95 hover:scale-105 disabled:opacity-40 disabled:scale-100 disabled:pointer-events-none cursor-pointer outline-none border-none"
          title="Send message"
        >
          <Send size={18} className="translate-x-[0.5px] -translate-y-[0.5px]" />
        </button>
      </div>

    </div>
  );
}
