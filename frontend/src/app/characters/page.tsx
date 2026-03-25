'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Sparkles, MessageSquare, Heart, Users, Star } from 'lucide-react';

export default function CharactersPage() {
  const [characters, setCharacters] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch('http://localhost:8000/characters/search?q=' + searchQuery);
        const data = await response.json();
        setCharacters(data);
      } catch (error) {
        console.error('Error fetching characters:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchCharacters();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-10 pt-10 md:pt-4">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 mt-10 md:mt-0">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              캐릭터 탐색
            </h2>
            <p className="text-gray-500 font-medium">당신만의 특별한 인연을 찾아보세요.</p>
          </div>
          
          <div className="relative group max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="캐릭터 이름, 태그 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-6 bg-surface border border-white/5 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
            />
          </div>
        </div>

        {/* Character Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-3xl bg-surface/50 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {characters.map((char) => (
              <Link 
                key={char.id} 
                href={`/chat/${char.id}`}
                className="group relative aspect-[3/4] rounded-3xl overflow-hidden bg-surface border border-white/5 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20"
              >
                {/* Background Image */}
                <img 
                  src={char.cover_url || char.avatar_url || '/avatar.png'} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-90"
                  alt={char.name}
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-primary/20 backdrop-blur-md text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-primary" /> RECOMMENDED
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-black text-white tracking-tighter transition-colors group-hover:text-primary">
                    {char.name}
                  </h3>
                  
                  <p className="text-gray-300 text-xs line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                    {char.description}
                  </p>

                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                      <MessageSquare className="w-3 h-3" />
                      12.4k
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                      <Heart className="w-3 h-3" />
                      3.2k
                    </div>
                  </div>
                </div>

                {/* Hover Action */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-primary/10 backdrop-blur-[2px]">
                   <div className="px-6 py-3 bg-white text-black rounded-full font-black text-sm shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      지금 대화하기 <MessageSquare className="w-4 h-4" />
                   </div>
                </div>
              </Link>
            ))}

            {characters.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6 border border-white/5">
                  <Search className="w-8 h-8 text-gray-700" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">검색 결과가 없습니다</h4>
                <p className="text-gray-500">다른 키워드로 검색해보거나 새로운 캐릭터를 만들어보세요.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
