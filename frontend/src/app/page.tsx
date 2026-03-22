'use client'

import React, { useEffect, useState } from 'react';
import CharacterCard from '@/components/Main/CharacterCard';
import { Sparkles, UserCheck } from 'lucide-react';

const popularCharacters = [
  {
    id: "sn1",
    name: "서연호",
    description: "도전장을 내민 당신을 흥미롭게 지켜보는 위험한 선배",
    tags: ["#집착", "#연상", "#능글"],
    chatCount: "8.6만",
    avatarUrl: "/seoyeonho.png"
  },
  {
    id: "bk2",
    name: "강백현",
    description: "반항적인 눈빛 속에 숨겨진 서투른 진심",
    tags: ["#반항아", "#츤데레", "#일진"],
    chatCount: "12.3만",
    avatarUrl: "/baekhyun.png"
  },
  {
    id: "yj3",
    name: "윤제이",
    description: "완벽한 이목구비 뒤에 감춰진 시린 얼음 왕자",
    tags: ["#냉혈남", "#재벌3세", "#엘리트"],
    chatCount: "5.4만",
    avatarUrl: "/yunjay.png"
  }
];

export default function Home() {
  const [myCharacters, setMyCharacters] = useState<any[]>([]);

  useEffect(() => {
    const fetchMyCharacters = async () => {
      try {
        const response = await fetch('http://localhost:8000/characters');
        if (response.ok) {
          const data = await response.json();
          setMyCharacters(data);
        }
      } catch (error) {
        console.error('Failed to fetch characters:', error);
      }
    };
    fetchMyCharacters();
  }, []);

  return (
    <main className="min-h-screen bg-background pb-32">
      {/* Hero Section */}
      <section className="px-6 pt-16 md:pt-24 pb-12 text-center md:text-left md:px-12 max-w-6xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Novellia Beta Open
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-white">
          이야기가 현실이 되는 곳,<br />
          <span className="text-primary">Novellia</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-lg max-w-[450px] leading-relaxed">
          당신의 상상 속 캐릭터가 살아 숨 쉬는 공간. 지금 가장 핫한 캐릭터들과 잊지 못할 이야기를 시작하세요.
        </p>
      </section>

      {/* Popular Character Grid */}
      <section className="px-6 md:px-12 max-w-6xl mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
            Trending 캐릭터 <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </h2>
          <button className="text-sm text-gray-400 hover:text-white transition-colors font-medium">인기순 보기</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {popularCharacters.map((char) => (
            <CharacterCard key={char.id} {...char} />
          ))}
        </div>
      </section>

      {/* My Created Characters Section */}
      {myCharacters.length > 0 && (
        <section className="px-6 md:px-12 max-w-6xl mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">내가 만든 캐릭터</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {myCharacters.map((char, index) => (
              <CharacterCard 
                key={index} 
                id={`my-${index}`}
                name={char.name}
                description={char.description}
                tags={char.tags}
                chatCount="0"
                avatarUrl={char.avatar_url || '/avatar.png'}
              />
            ))}
          </div>
        </section>
      )}

      {/* Story Genres */}
      <section className="mt-12 px-6 md:px-12 max-w-6xl pb-10">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Genre Explore</h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4">
          {["심리 스릴러", "다크 로맨스", "동양 판타지", "청춘 학원물", "오피스 라이프", "가상현실"].map((cat) => (
            <button key={cat} className="px-6 py-2.5 rounded-xl bg-surface border border-white/5 text-sm text-gray-400 hover:text-white hover:border-primary/50 hover:bg-primary/5 transition-all flex-shrink-0">
              {cat}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
