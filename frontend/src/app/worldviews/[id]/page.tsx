'use client';

import React, { useEffect, useState, use } from 'react';
import { ChevronLeft, Sparkles, User, ChevronRight, BookOpen, Users, MessageSquare, Calendar, Music, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WorldviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [worldview, setWorldview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState('');
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('story'); // story, characters, prologue

  useEffect(() => {
    const defaultName = localStorage.getItem('novellia_user_name') || '여행자';
    setUserName(defaultName);
    
    const fetchWorldview = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/worldviews/${id}`);
        if (response.ok) {
          const data = await response.json();
          setWorldview(data);
          // Apply Presets
          if (data.user_persona_preset) setPersona(data.user_persona_preset);
          if (data.user_name_preset) setUserName(data.user_name_preset);
        }
      } catch (error) {
        console.error('Failed to fetch worldview:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorldview();
  }, [id]);

  const handleStart = () => {
    if (!persona.trim()) return;
    localStorage.setItem(`worldview_persona_${id}`, persona);
    // If the worldview has a fixed name, we should respect it in the chat
    if (worldview.user_name_preset) {
       localStorage.setItem(`worldview_user_name_${id}`, worldview.user_name_preset);
    }
    router.push(`/worldviews/${id}/chat`);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!worldview) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-black mb-4">세계관을 찾을 수 없습니다.</h1>
      <Link href="/worldviews" className="text-primary font-bold">목록으로 돌아가기</Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white relative flex flex-col">
      {/* Hero Background */}
      <div className="absolute top-0 left-0 right-0 h-[60vh] z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${worldview.thumbnail_url || '/placeholder_bg.png'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black" />
      </div>

      {/* Header */}
      <header className="relative z-20 px-6 h-20 flex items-center justify-between">
        <Link href="/worldviews" className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-all">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        {worldview.music_link && (
          <a href={worldview.music_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-xs font-bold hover:bg-white/20 transition-all">
            <Music className="w-4 h-4 text-primary" /> BGM 재생
          </a>
        )}
      </header>

      {/* Hero Content */}
      <div className="relative z-10 px-6 pt-12 md:pt-24 pb-8 max-w-4xl mx-auto w-full">
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest rounded-md">
            <Sparkles className="w-3 h-3" /> Novellia Original
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight drop-shadow-2xl">
            {worldview.title}
          </h1>
          {worldview.tagline && (
            <p className="text-xl md:text-2xl text-primary font-bold italic opacity-90">
              "{worldview.tagline}"
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 pt-4 text-xs font-bold text-gray-400">
            <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {worldview.updated_at || '2026.03.25'} 업데이트</div>
            <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {worldview.characters_info?.length || 0} 주요 인물</div>
            <div className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> 1.2k 참여 중</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="relative z-10 sticky top-0 bg-black/80 backdrop-blur-xl border-y border-white/5 px-6">
        <div className="max-w-4xl mx-auto flex gap-8">
          {[
            { id: 'story', label: '상세 설명', icon: Info },
            { id: 'characters', label: '등장 인물', icon: Users },
            { id: 'prologue', label: '프롤로그', icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-5 text-sm font-black transition-all relative ${
                activeTab === tab.id ? 'text-primary' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'story' && (
            <div className="space-y-8">
              <div className="prose prose-invert max-w-none">
                <p className="text-lg leading-relaxed text-gray-300 whitespace-pre-wrap">
                  {worldview.detailed_description || worldview.description}
                </p>
              </div>
              
              {worldview.user_role_guide && (
                <div className="p-8 bg-surface border border-white/10 rounded-[2rem] space-y-4 shadow-xl">
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <User className="w-6 h-6 text-primary" /> 【유저 설정 가이드】
                  </h3>
                  <p className="text-gray-300 leading-relaxed font-medium">
                    {worldview.user_role_guide}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'characters' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {worldview.characters_info?.map((char: any, i: number) => (
                <div key={i} className="p-6 bg-surface border border-white/5 rounded-3xl hover:border-primary/30 transition-all group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-black">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-black group-hover:text-primary transition-colors">[{char.name}]</h4>
                      <p className="text-xs text-primary font-bold">{char.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {char.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'prologue' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="p-10 bg-surface/50 border border-white/5 rounded-[3rem] relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
                   <BookOpen className="w-48 h-48 rotate-12" />
                </div>
                
                <div className="prologue-container relative z-10 space-y-6">
                  {worldview.prologue_preview?.split('\n').map((line: string, i: number) => {
                    // Header Metadata (e.g. 1984/04/04...)
                    if (i === 0 && line.includes('｜')) {
                      const parts = line.split('｜');
                      return (
                        <div key={i} className="flex flex-wrap items-center gap-2 mb-10 border-b border-white/10 pb-6">
                          {parts.map((part, idx) => (
                            <React.Fragment key={idx}>
                              <span className={`text-[11px] font-black uppercase tracking-tighter ${idx === 0 ? 'text-primary' : idx === 1 ? 'text-white' : 'text-gray-500'}`}>
                                {part.trim()}
                              </span>
                              {idx < parts.length - 1 && <span className="text-gray-700 text-xs">｜</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      );
                    }
                    
                    // Dialogue (e.g. Name｜"Text")
                    if (line.includes('｜')) {
                      const [name, text] = line.split('｜');
                      return (
                        <div key={i} className="flex gap-4 items-baseline group">
                          <span className="text-primary font-black whitespace-nowrap min-w-[70px] text-right text-[11px] uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                            {name.trim()}
                          </span>
                          <span className="text-gray-700 font-bold">｜</span>
                          <p className="text-gray-200 leading-relaxed font-medium">{text.trim()}</p>
                        </div>
                      );
                    }

                    // Status Badge (e.g. [상태: ...])
                    if (line.trim().startsWith('[상태:')) {
                      return (
                        <div key={i} className="mt-12 p-5 bg-primary/5 border border-primary/20 rounded-2xl inline-block">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">{line.trim()}</span>
                          </div>
                        </div>
                      );
                    }

                    // List Item
                    if (line.trim().startsWith('- ')) {
                      return (
                        <div key={i} className="flex gap-3 items-center text-xs text-gray-400 font-bold ml-6 py-1">
                          <div className="w-1 h-1 rounded-full bg-primary/40" />
                          {line.trim().replace('- ', '')}
                        </div>
                      );
                    }

                    // Empty Line
                    if (line.trim() === '') return <div key={i} className="h-4" />;

                    // Normal Text
                    return (
                      <p key={i} className="text-gray-300 leading-loose font-medium break-keep text-base opacity-90">
                        {line.trim()}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Section */}
      <div className="relative z-20 sticky bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent pt-20 pb-10 px-6">
         <div className="max-w-md mx-auto">
            <button 
              onClick={handleStart}
              className="w-full h-16 bg-white text-black rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all transform active:scale-95 shadow-2xl shadow-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300"
            >
              시나리오 시작하기 <ChevronRight className="w-6 h-6" />
            </button>
         </div>
      </div>

      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #000;
        }
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .bg-surface {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
        }
      `}</style>
    </main>
  );
}
