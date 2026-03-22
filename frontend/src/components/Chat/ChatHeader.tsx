import React from 'react';
import { ChevronLeft, MoreVertical, ShieldCheck } from 'lucide-react';

interface ChatHeaderProps {
  name: string;
  status: string;
  avatarUrl: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ name, status, avatarUrl }) => {
  return (
    <div className="glass fixed top-0 w-full z-50 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button className="p-1 hover:bg-white/5 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="relative">
          <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#050505] rounded-full"></div>
        </div>
        <div>
          <h2 className="font-semibold text-sm flex items-center gap-1">
            {name} <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          </h2>
          <p className="text-[10px] text-gray-400">{status}</p>
        </div>
      </div>
      <button className="p-1 hover:bg-white/5 rounded-full transition-colors">
        <MoreVertical className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );
};

export default ChatHeader;
