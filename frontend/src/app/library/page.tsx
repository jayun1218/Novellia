'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Book, CheckCircle, Lock, Star, ChevronRight, Play, Trophy } from 'lucide-react';
import BottomNav from '@/components/Layout/BottomNav';

export default function LibraryPage() {
  const router = useRouter();
  const [library, setLibrary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/library');
        if (res.ok) {
          const data = await res.json();
          setLibrary(data);
        }
      } catch (err) {
        console.error('Failed to fetch library:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLibrary();
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      {/* Header */}
      <div className="pt-16 px-6 pb-8">
        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
          <Book className="w-8 h-8 text-primary" />
          내 서재
        </h1>
        <p className="text-gray-400 text-sm">수집한 시나리오와 진행 중인 이야기들</p>
      </div>

      <div className="px-6 space-y-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : library.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Book className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-500 font-bold">아직 수집한 시나리오가 없습니다.</p>
            <button 
              onClick={() => router.push('/')}
              className="mt-6 px-6 py-3 bg-primary text-white font-black rounded-2xl"
            >
              세계관 탐색하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {library.map((wv) => (
              <div 
                key={wv.id}
                className="group relative bg-[#121212] border border-white/5 rounded-[40px] overflow-hidden hover:border-primary/30 transition-all duration-500 shadow-2xl"
              >
                {/* Thumbnail Background */}
                <div 
                  className="absolute inset-0 opacity-20 grayscale group-hover:grayscale-0 transition-all duration-700"
                  style={{ backgroundImage: `url(${wv.thumbnail_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
                
                <div className="relative p-8 flex flex-col h-full z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                        {wv.progress?.progress_rate === 100 ? '완독함' : '진행 중'}
                      </span>
                    </div>
                    <Trophy className={`w-5 h-5 ${wv.progress?.unlocked_endings.length > 0 ? 'text-yellow-500' : 'text-gray-600'}`} />
                  </div>

                  <h3 className="text-xl font-black mb-2 line-clamp-1">{wv.title}</h3>
                  <p className="text-gray-400 text-xs mb-6 line-clamp-2 leading-relaxed">{wv.tagline}</p>

                  {/* Progress Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                      <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">챕터 진행</div>
                      <div className="text-sm font-black flex items-end gap-1">
                        {wv.progress?.completed_chapters.length} <span className="text-[10px] text-gray-600">/ {wv.total_chapters}</span>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                      <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">업적 달성</div>
                      <div className="text-sm font-black flex items-end gap-1">
                        {wv.progress?.unlocked_achievements?.length || 0} <span className="text-[10px] text-gray-600">/ 4</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-8">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black text-gray-500 uppercase">전체 달성률</span>
                      <span className="text-xs font-black text-primary">{wv.progress?.progress_rate}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${wv.progress?.progress_rate}%` }} 
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => router.push(`/worldviews/${wv.id}`)}
                    className="w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-lg active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    이야기 이어가기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
