import React from 'react';
import Link from 'next/link';
import { Home, PlusCircle, Compass, User, Sparkles } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen glass fixed left-0 top-0 z-50 p-6 border-r border-white/5">
      <Link href="/" className="flex items-center gap-2 mb-10 px-2 hover:opacity-80 transition-opacity cursor-pointer">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-black tracking-tighter text-white">Novellia</h1>
      </Link>

      <nav className="flex flex-col gap-2 flex-1">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium transition-all">
          <Home className="w-5 h-5" /> 홈
        </Link>
        <Link href="/feed" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all">
          <Compass className="w-5 h-5" /> 피드
        </Link>
        <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all">
          <User className="w-5 h-5" /> 프로필
        </Link>
      </nav>

      <div className="mt-auto">
        <Link href="/create" className="flex items-center justify-center gap-2 w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary/20">
          <PlusCircle className="w-5 h-5" /> 캐릭터 생성
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
