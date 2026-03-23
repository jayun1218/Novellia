'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Compass, User, Sparkles, LayoutGrid } from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: '홈' },
    { href: '/feed', icon: Compass, label: '피드' },
    { href: '/gallery', icon: LayoutGrid, label: '갤러리' },
    { href: '/profiles', icon: User, label: '프로필' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen glass fixed left-0 top-0 z-50 p-6 border-r border-white/5">
      <Link href="/" className="flex items-center gap-2 mb-10 px-2 hover:opacity-80 transition-opacity cursor-pointer">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-black tracking-tighter text-white">Novellia</h1>
      </Link>

      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" /> {item.label}
            </Link>
          );
        })}
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
