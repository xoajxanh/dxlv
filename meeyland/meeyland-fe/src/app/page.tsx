import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-8 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        Meeyland Demo
      </h1>
      <p className="text-gray-400 mb-12 text-lg">Choose a feature to explore</p>
      
      <div className="flex gap-6">
        <Link 
          href="/chat" 
          className="group relative px-8 py-4 bg-gray-800 rounded-2xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
        >
          <div className="text-blue-400 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Global Chat</h2>
          <p className="text-gray-400 text-sm">Telegram-style messaging</p>
        </Link>

        <Link 
          href="/video" 
          className="group relative px-8 py-4 bg-gray-800 rounded-2xl border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
        >
          <div className="text-purple-400 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path><rect x="2" y="6" width="14" height="12" rx="2"></rect></svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Video Call</h2>
          <p className="text-gray-400 text-sm">Zoom-style meetings</p>
        </Link>
      </div>
    </div>
  );
}
