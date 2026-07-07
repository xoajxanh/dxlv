"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Video, LogIn, Plus } from "lucide-react";

export default function VideoLobby() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");

  const handleCreateRoom = () => {
    if (!name.trim()) return alert("Please enter your name");
    const newRoomId = uuidv4().substring(0, 8);
    router.push(`/video/${newRoomId}?name=${encodeURIComponent(name)}`);
  };

  const handleJoinRoom = () => {
    if (!name.trim()) return alert("Please enter your name");
    if (!roomId.trim()) return alert("Please enter a room code");
    router.push(`/video/${roomId}?name=${encodeURIComponent(name)}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="flex justify-center mb-8">
          <div className="bg-purple-500/20 p-5 rounded-2xl">
            <Video className="w-12 h-12 text-purple-400" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white text-center mb-8">Video Meetings</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Your Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 text-white rounded-xl px-4 py-4 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>

          <div className="border-t border-gray-700 my-6"></div>

          <button
            onClick={handleCreateRoom}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
          >
            <Plus className="w-5 h-5" />
            New Meeting
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">or</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Room Code"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="flex-1 bg-gray-900 text-white rounded-xl px-4 py-4 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
            <button
              onClick={handleJoinRoom}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 rounded-xl transition-colors flex items-center justify-center"
            >
              <LogIn className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
