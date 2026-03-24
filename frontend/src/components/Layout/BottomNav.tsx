'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Compass, User, LayoutGrid, Users } from 'lucide-react';

import { useNotificationStore } from '@/store/useNotificationStore';

const BottomNav = () => {
  const pathname = usePathname();
  const { hasNewFeed } = useNotificationStore();

  const navItems = [
    { href: '/', icon: Home, label: '홈' },
    { href: '/feed', icon: Compass, label: '피드', hasBadge: hasNewFeed },
    { href: '/relationships', icon: Users, label: '인연' },
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
            className={`relative flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-primary' : 'text-gray-500 hover:text-white'
            }`}
          >
            <div className="relative">
              <item.icon className="w-6 h-6" />
              {item.hasBadge && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-background" />
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};


export default BottomNav;
