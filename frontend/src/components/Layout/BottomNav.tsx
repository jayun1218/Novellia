'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Compass, User, LayoutGrid } from 'lucide-react';

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: '홈' },
    { href: '/feed', icon: Compass, label: '피드' },
    { href: '/gallery', icon: LayoutGrid, label: '갤러리' },
    { href: '/create', icon: PlusCircle, label: '생성' },
    { href: '/profiles', icon: User, label: '마이' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 w-full glass z-50 px-6 py-3 pb-6 flex items-center justify-between border-t border-white/5">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.href}
            href={item.href} 
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-primary' : 'text-gray-500 hover:text-white'
            }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
