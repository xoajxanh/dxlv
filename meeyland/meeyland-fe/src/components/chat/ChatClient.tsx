"use client";

import { useState, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Paperclip, Send, Smile, User } from "lucide-react";

interface ChatMessage {
  id: number;
  senderName: string;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
}

export default function ChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinChat = async () => {
    if (!name.trim()) return;
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5229';
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/chathub`) // Connect to backend locally or based on env
      .withAutomaticReconnect()
      .build();

    conn.on("ReceiveMessage", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    try {
      await conn.start();
      setConnection(conn);
      setIsJoined(true);
    } catch (e) {
      console.error("Connection failed: ", e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !connection) return;
    try {
      await connection.invoke("SendMessage", name, input, null);
      setInput("");
      setShowEmojiPicker(false);
    } catch (e) {
      console.error("Failed to send: ", e);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !connection) return;

    // For demo purposes, we'll create a local blob URL
    // In a real app, you would upload to a server and get a real URL back
    const localUrl = URL.createObjectURL(file);
    try {
      await connection.invoke("SendMessage", name, `Sent a file: ${file.name}`, localUrl);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-500/20 p-4 rounded-full">
              <User className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-6">Join Chat</h2>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent transition-all"
            onKeyDown={(e) => e.key === "Enter" && joinChat()}
          />
          <button
            onClick={joinChat}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Join
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 px-6 py-4 flex items-center border-b border-gray-700 shadow-sm z-10">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
          G
        </div>
        <div className="ml-4">
          <h1 className="text-lg font-semibold text-white">Global Chat</h1>
          <p className="text-sm text-green-400">Online</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => {
          const isMe = msg.senderName === name;
          return (
            <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-800 text-gray-200 rounded-bl-sm border border-gray-700"
                }`}
              >
                {!isMe && <div className="text-sm text-blue-400 font-medium mb-1">{msg.senderName}</div>}
                
                {msg.attachmentUrl ? (
                  <div className="mb-2">
                    {/* Simplified attachment rendering */}
                    <img src={msg.attachmentUrl} alt="attachment" className="max-w-full rounded-lg" onError={(e) => e.currentTarget.style.display='none'}/>
                    <a href={msg.attachmentUrl} target="_blank" className="text-blue-300 underline text-sm block mt-1">View Attachment</a>
                  </div>
                ) : null}
                
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className={`text-xs mt-1 text-right ${isMe ? "text-blue-200" : "text-gray-500"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 relative">
        {showEmojiPicker && (
          <div className="absolute bottom-full mb-2 left-4 z-50">
            <EmojiPicker onEmojiClick={onEmojiClick} theme={"dark" as any} />
          </div>
        )}
        
        <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-xl border border-gray-700 focus-within:border-blue-500 transition-colors">
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700"
          >
            <Smile className="w-6 h-6" />
          </button>
          
          <label className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700 cursor-pointer">
            <Paperclip className="w-6 h-6" />
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 bg-transparent text-white focus:outline-none px-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
