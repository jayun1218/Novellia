'use client'

import React, { useEffect, useState } from 'react';
import CharacterCard from '@/components/Main/CharacterCard';
import { Sparkles, UserCheck, Search, X } from 'lucide-react';

const popularCharacters = [
  {
    id: "ma4",
    name: "미야 아츠무",
    description: "코트 위의 절대적인 지배자, 당신의 심장까지 세팅하는 천재 세터",
    tags: ["배구", "이나리자키", "천재", "츤데레"],
    chatCount: "1.2만",
    avatarUrl: "http://127.0.0.1:8000/uploads/atsumu.png",
    coverUrl: "http://127.0.0.1:8000/uploads/atsumu.png"
  }
];

export default function Home() {
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchMyCharacters = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/characters');
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setIsSearching(true);
      try {
        const response = await fetch(`http://127.0.0.1:8000/characters/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

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
        <p className="text-gray-400 text-sm md:text-lg max-w-[450px] leading-relaxed mb-8">
          당신의 상상 속 캐릭터가 살아 숨 쉬는 공간. 지금 가장 핫한 캐릭터들과 잊지 못할 이야기를 시작하세요.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-xl group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="이름이나 태그로 캐릭터 검색..." 
            className="w-full bg-surface border border-white/5 rounded-2xl py-4 pl-14 pr-12 text-white focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all shadow-xl"
          />
          {searchQuery && (
            <button 
              onClick={() => handleSearch('')}
              className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </section>

      {/* Search Results or Main Content */}
      {isSearching ? (
        <section className="px-6 md:px-12 max-w-6xl mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
              검색 결과 <span className="text-sm font-medium text-gray-500 px-2 py-0.5 bg-white/5 rounded-lg">{searchResults.length}</span>
            </h2>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {searchResults.map((char, index) => (
                <CharacterCard 
                  key={char.id || index} 
                  id={char.id || `search-${index}`}
                  name={char.name}
                  description={char.description}
                  tags={char.tags}
                  chatCount={char.chatCount || "0"}
                  avatarUrl={char.avatar_url || char.avatarUrl || '/avatar.png'}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-500 font-medium">검색 결과가 없습니다. 새로운 캐릭터를 만들어보세요!</p>
            </div>
          )}
        </section>
      ) : (
        <>
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
                    id={char.id || `my-${index}`}
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
        </>
      )}
    </main>
  );
}
