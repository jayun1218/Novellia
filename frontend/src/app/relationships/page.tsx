'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Users, ChevronLeft, Sparkles, User, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import RelationshipMap from '@/components/Main/RelationshipMap';
import BottomNav from '@/components/Layout/BottomNav';

const RelationshipPage = () => {
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. 캐릭터 리스트 가져오기
        const charRes = await fetch('http://127.0.0.1:8000/characters');
        const popularRes = await fetch('http://127.0.0.1:8000/popular-characters');
        
        let allChars: any[] = [];
        if (charRes.ok) {
            const userChars = await charRes.json();
            allChars.push(...userChars.map((c: any, idx: number) => ({ ...c, id: `my-${idx}` })));
        }
        if (popularRes.ok) {
            const popularData = await popularRes.json();
            allChars.push(...Object.entries(popularData).map(([id, data]: [string, any]) => ({ id, ...data })));
        }

        // 2. 각 캐릭터의 호감도 정보 가져오기 및 대화 여부 확인
        const charWithFavs = await Promise.all(allChars.map(async (char) => {
          try {
            const favRes = await fetch(`http://127.0.0.1:8000/chats/${char.id}`);
            if (favRes.ok) {
              const data = await favRes.json();
              // 사용자가 보낸 메시지가 최소 하나라도 있는 경우에만 포함
              const hasUserMessage = data.messages && data.messages.some((m: any) => !m.isAi);
              if (hasUserMessage) {
                return {
                  id: char.id,
                  name: char.name,
                  avatar: char.avatar_url || char.avatarUrl || '/avatar.png',
                  favorability: data.favorability || 0,
                  hasHistory: true
                };
              }
            }
          } catch (e) {
            console.error(`Error fetching fav for ${char.id}:`, e);
          }
          return null;
        }));

        setCharacters(charWithFavs.filter(c => c !== null).sort((a, b) => b.favorability - a.favorability));
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch relationships:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-surface-dark pb-32">
      {/* Header */}
      <div className="glass fixed top-0 w-full z-50 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> 관계도
            </h1>
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 pt-24 space-y-8">
        {/* Info Card */}
        <div className="bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/20 p-6 rounded-3xl flex items-start gap-4">
          <div className="p-3 bg-primary/20 rounded-2xl">
            <Info className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-white mb-1">인연의 깊이를 확인하세요</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              중심부로부터 캐릭터까지의 거리는 서로의 심리적 거리(호감도)를 의미합니다.<br/>
              대화를 통해 호감도를 높여 캐릭터와 더 가까워지세요.
            </p>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-surface border border-white/5 rounded-[40px] p-8 min-h-[600px] flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-8 left-8 flex flex-col gap-2">
             <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full">
               <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" /> 80+ ✨ 운명
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full">
               <div className="w-2 h-2 rounded-full bg-violet-500" /> 50+ 💜 동료
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full">
               <div className="w-2 h-2 rounded-full bg-blue-500" /> 30+ 💙 친구
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full">
               <div className="w-2 h-2 rounded-full bg-emerald-500" /> 10+ 💚 지인
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full">
               <div className="w-2 h-2 rounded-full bg-gray-500" /> 0+ 🩶 낯선 사이
             </div>
          </div>

          
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 font-bold animate-pulse">관계 점검 중...</p>
            </div>
          ) : (
             <RelationshipMap characters={characters} />
          )}
        </div>

        {/* List Section */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters.map((char) => (
              <div key={char.id} className="bg-surface border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:border-primary/30 transition-all hover:translate-x-1">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10">
                  <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-white">{char.name}</h3>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 rounded-full">
                      <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                      <span className="text-xs font-black text-rose-500">{char.favorability}</span>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${char.favorability}%` }}
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default RelationshipPage;
