'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, Sparkles, BookOpen, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function WorldviewListPage() {
  const [worldviews, setWorldviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorldviews = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/worldviews');
        if (response.ok) {
          setWorldviews(await response.json());
        }
      } catch (error) {
        console.error('Failed to fetch worldviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorldviews();
  }, []);

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 md:left-64 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-black tracking-tight">세계관 탐험</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      <div className="pt-24 px-6 max-w-6xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> 시나리오 모드
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">어떤 세계의 주인공이<br />되어볼까요?</h2>
          <p className="text-gray-400 max-w-md">준비된 시나리오 속에서 당신만의 역할을 정하고 캐릭터들과 깊은 이야기를 나눠보세요.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-64 bg-surface rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {worldviews.map((wv) => (
              <Link 
                key={wv.id} 
                href={`/worldviews/${wv.id}`}
                className="group relative h-[400px] rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-500 shadow-2xl"
              >
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${wv.thumbnail_url || '/placeholder_bg.png'})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <div className="space-y-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wider border border-white/10 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3" /> SCENARIO
                      </span>
                      <span className="px-3 py-1 bg-primary/20 backdrop-blur-md rounded-lg text-[10px] font-bold text-primary uppercase tracking-wider border border-primary/20 flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> {wv.character_ids?.length || 0} Characters
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl md:text-3xl font-black text-white mb-2">{wv.title}</h3>
                      <p className="text-gray-300 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        {wv.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-white font-black text-sm pt-2">
                       탐험 시작하기 <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
