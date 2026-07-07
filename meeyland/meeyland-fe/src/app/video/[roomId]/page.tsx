"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Share2, ArrowLeft } from 'lucide-react';

export default function VideoCallPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const room = params.roomId as string;
  const name = searchParams.get('name') || 'Guest';

  const [token, setToken] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5229';
        const resp = await fetch(
          `${baseUrl}/api/token/livekit?roomName=${room}&participantName=${name}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [room, name]);

  const copyInviteLink = () => {
    const url = `${window.location.origin}/video?join=${room}`;
    navigator.clipboard.writeText(url);
    alert('Invite link copied to clipboard!');
  };

  if (token === "") {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p>Connecting to {room}...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/video')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{room}</h1>
            <p className="text-sm text-gray-400">Meeting Room</p>
          </div>
        </div>
        
        <button 
          onClick={copyInviteLink}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Invite Others</span>
        </button>
      </header>
      
      <div className="flex-1">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://your-livekit-server-url"}
          // Use the default LiveKit theme for the built-in styles
          data-lk-theme="default"
          style={{ height: 'calc(100vh - 73px)' }}
        >
          {/* Your custom component with basic video conferencing functionality. */}
          <VideoConference />
          {/* The RoomAudioRenderer takes care of room-wide audio for you. */}
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}
