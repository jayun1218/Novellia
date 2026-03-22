import React from 'react';
import Link from 'next/link';
import { Home, PlusCircle, Compass, User } from 'lucide-react';

const BottomNav = () => {
  return (
    <nav className="md:hidden fixed bottom-0 w-full glass z-50 px-6 py-3 pb-6 flex items-center justify-between border-t border-white/5">
      <Link href="/" className="flex flex-col items-center gap-1 text-primary">
        <Home className="w-6 h-6" />
        <span className="text-[10px] font-medium">홈</span>
      </Link>
      <Link href="/feed" className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
        <Compass className="w-6 h-6" />
        <span className="text-[10px] font-medium">피드</span>
      </Link>
      <Link href="/create" className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
        <PlusCircle className="w-6 h-6" />
        <span className="text-[10px] font-medium">생성</span>
      </Link>
      <Link href="/profile" className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
        <User className="w-6 h-6" />
        <span className="text-[10px] font-medium">마이</span>
      </Link>
    </nav>
  );
};

export default BottomNav;
