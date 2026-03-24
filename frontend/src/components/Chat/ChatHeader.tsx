import React, { useState } from 'react';
import { ChevronLeft, ShieldCheck, ChevronDown, Settings, User, Zap, Palette, Image as ImageIcon, Check, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface ChatSettings {
  theme: string;
  showProfile: boolean;
  showStatus: boolean;
  autoBg: boolean;
  haptic: boolean;
}

interface ChatHeaderProps {
  activeCharacters: any[];
  onInvite: (charId: string) => void;
  userProfiles: any[];
  selectedProfileIndex: number;
  onProfileSelect: (index: number) => void;
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
  onResetChat: () => void;
  onAvatarClick: (char: any) => void;
  onOpenScenarios: () => void;
  onOpenTimeline: () => void;
  characterEmotions?: Record<string, string>;
  recommendedPersonas?: string[];
  onApplyPersona?: (persona: string) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  activeCharacters,
  onInvite,
  userProfiles, 
  selectedProfileIndex, 
  onProfileSelect,
  settings,
  onSettingsChange,
  onResetChat,
  onAvatarClick,
  onOpenScenarios,
  onOpenTimeline,
  characterEmotions = {},
  recommendedPersonas = [],
  onApplyPersona
}) => {
  const [showProfiles, setShowProfiles] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const currentProfile = userProfiles[selectedProfileIndex] || { name: '나', avatar_url: '/avatar.png' };

  // 캐릭터 검색 핸들러
  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`http://127.0.0.1:8000/characters/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const themes = [
    { id: 'basic', name: '기본', color: 'bg-primary' },
    { id: 'oreo', name: '오레오', color: 'bg-white' },
    { id: 'taro', name: '타로', color: 'bg-[#C8B6FF]' },
    { id: 'mint', name: '세이죠 민트', color: 'bg-[#94D2BD]' },
    { id: 'orange', name: '카라스노 귤', color: 'bg-[#FF9F1C]' },
    { id: 'red', name: '네코마 레드', color: 'bg-[#E63946]' },
  ];

  const toggleSetting = (key: keyof ChatSettings) => {
    onSettingsChange({ ...settings, [key]: !settings[key] });
  };

  const title = activeCharacters.length > 1 
    ? `${activeCharacters[0].name} 외 ${activeCharacters.length - 1}명`
    : activeCharacters[0]?.name || 'Chat';

  const getEmotionEffect = (charId: string) => {
    const emotion = characterEmotions[charId];
    if (!emotion) return '';
    switch (emotion) {
      case '행복': return 'ring-4 ring-yellow-400 animate-pulse scale-110';
      case '슬픔': return 'opacity-80 grayscale-[0.3] brightness-90 animate-bounce';
      case '분노': return 'ring-4 ring-red-600 animate-shake scale-105';
      case '놀람': return 'scale-115 ring-2 ring-white animate-ping-once';
      case '부끄러움': return 'ring-4 ring-pink-400 opacity-90';
      case '진지': return 'brightness-110 contrast-125';
      default: return '';
    }
  };

  return (
    <div className="glass fixed top-0 w-full z-50 border-b border-white/5">
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }
        .animate-ping-once { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) 1; }
      `}</style>
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left Section: Back button & Character info */}
        <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
          <Link href="/" className="p-1.5 hover:bg-white/5 rounded-full transition-colors flex-shrink-0">
            <ChevronLeft className="w-6 h-6 text-gray-400" />
          </Link>
          
          <div className="flex items-center gap-3 min-w-0">
            {/* Multi-Avatar Group */}
            <div className="flex -space-x-3 overflow-hidden flex-shrink-0 p-1">
              {activeCharacters.map((char, i) => (
                <div 
                  key={char.id || i}
                  onClick={() => onAvatarClick(char)}
                  className={`relative cursor-pointer hover:z-10 transition-all duration-300 hover:scale-110 active:scale-95 ${getEmotionEffect(char.id)}`}
                >
                  <img 
                    src={char.avatar_url || char.avatarUrl || '/avatar.png'} 
                    alt={char.name} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#050505] shadow-lg" 
                  />
                </div>
              ))}
              {/* Invite Button */}
              <button 
                onClick={() => setIsSearching(!isSearching)}
                className="w-10 h-10 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-primary/50 transition-all active:scale-90"
                title="캐릭터 초대"
              >
                <User className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="min-w-0 hidden sm:block">
              <h2 className="font-bold text-sm flex items-center gap-1.5 text-white truncate">
                {title} <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              </h2>
              <p className="text-[10px] text-gray-500 font-medium truncate">
                {activeCharacters.length > 1 ? '그룹 채팅 활성화됨' : '실시간 대화 중'}
              </p>
            </div>
          </div>
        </div>

        {/* Character Invite Search Dropdown */}
        {isSearching && (
          <div className="absolute top-full left-4 mr-4 mt-2 w-72 glass-card border border-white/10 shadow-2xl z-[70] p-3 animate-in fade-in slide-in-from-top-2">
            <input 
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary transition-colors mb-2"
              placeholder="초대할 캐릭터 검색..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <div className="max-h-60 overflow-y-auto space-y-1 no-scrollbar">
              {searchResults.length === 0 && searchQuery && (
                <p className="text-[10px] text-gray-500 text-center py-4">검색 결과가 없습니다.</p>
              )}
              {searchResults.map((res) => (
                <button
                  key={res.id}
                  onClick={() => {
                    onInvite(res.id);
                    setIsSearching(false);
                    setSearchQuery('');
                  }}
                  disabled={activeCharacters.some(c => c.id === res.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed group transition-colors"
                >
                  <img src={res.avatar_url || res.avatarUrl || '/avatar.png'} className="w-8 h-8 rounded-full object-cover" />
                  <div className="text-left min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{res.name}</p>
                    <p className="text-[9px] text-gray-500 truncate">{res.description}</p>
                  </div>
                  <Check className="w-3 h-3 text-primary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right Section: Selectors & Settings */}
        <div className="flex items-center gap-1">
          <button 
            onClick={onOpenScenarios}
            className="p-2 hover:bg-orange-500/10 rounded-full transition-all group lg:flex hidden items-center gap-2 px-3 border border-transparent hover:border-orange-500/20"
            title="시나리오 선택"
          >
            <Zap className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black text-orange-400/80 uppercase tracking-wider">Scenario</span>
          </button>

          <button 
            onClick={onOpenTimeline}
            className="p-2 hover:bg-white/5 rounded-full transition-all group"
            title="타임라인 보기"
          >
            <Clock className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
          </button>
          
          {/* User Persona Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowProfiles(!showProfiles)}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:bg-white/10 transition-all active:scale-95"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                <img src={currentProfile.avatar_url || '/avatar.png'} alt="My Profile" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-bold text-gray-200 max-w-[60px] truncate hidden md:block">{currentProfile.name}</span>
              <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showProfiles ? 'rotate-180' : ''}`} />
            </button>
            {/* Dropdown remains same as before... */}
            {showProfiles && (
              <div className="absolute top-full right-0 mt-3 w-56 glass-card border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-[60]">
                <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">나의 페르소나 선택</span>
                </div>
                <div className="max-h-64 overflow-y-auto py-1 no-scrollbar">
                  {userProfiles.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-gray-500 italic">생성된 프로필이 없습니다.</div>
                  ) : (
                    userProfiles.map((profile, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          onProfileSelect(index);
                          setShowProfiles(false);
                        }}
                        className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${selectedProfileIndex === index ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-gray-300'}`}
                      >
                        <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/10 bg-surface">
                          <img src={profile.avatar_url || '/avatar.png'} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-bold truncate">{profile.name}</span>
                        {selectedProfileIndex === index && <Check className="w-3.5 h-3.5 ml-auto" />}
                      </button>
                    ))
                  )}
                </div>

                {/* Recommended Personas (Refined Section) */}
                {recommendedPersonas && recommendedPersonas.length > 0 && (
                  <div className="border-t border-white/5 bg-white/[0.04] py-2">
                    <div className="flex items-center gap-2 px-4 py-1.5 mb-1 opacity-60">
                      <Zap className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">이 캐릭터에게 추천하는 역할</span>
                    </div>
                    <div className="space-y-0.5">
                      {recommendedPersonas.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            onApplyPersona?.(p);
                            setShowProfiles(false);
                          }}
                          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-all group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-[11px] font-bold text-gray-300 group-hover:text-white truncate">{p}</p>
                            <p className="text-[9px] text-gray-500 font-medium truncate">클릭하여 즉시 적용</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Link 
                  href="/profiles"
                  className="block w-full px-4 py-2.5 text-center text-[11px] font-bold text-primary hover:bg-primary/5 border-t border-white/5 transition-colors"
                >
                  페르소나 관리
                </Link>
              </div>
            )}
          </div>

          {/* Settings Menu remains same as before... */}
          <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-all active:scale-90 shadow-lg ${showSettings ? 'bg-primary text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
            {showSettings && (
              <div className="absolute top-full right-0 mt-3 w-64 glass-card border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 p-2 z-[60]">
                <div className="space-y-4 p-2">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">채팅창 테마</span>
                    <div className="flex gap-2 px-1">
                      {themes.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => onSettingsChange({ ...settings, theme: t.id })}
                          className={`flex-1 py-2 px-1 rounded-xl border transition-all text-[11px] font-bold ${
                            settings.theme === t.id 
                              ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]' 
                              : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/10'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full ${t.color} mx-auto mb-1`} />
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {[
                      { id: 'autoBg', name: '배경 이미지 자동생성', icon: ImageIcon },
                      { id: 'showProfile', name: '대화 프로필 표시', icon: User },
                      { id: 'showStatus', name: '캐릭터 상태창 표시', icon: Zap },
                      { id: 'haptic', name: '답변 완료 햅틱', icon: Zap },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <item.icon className="w-4 h-4 text-gray-500" />
                          <span className="text-[13px] font-medium text-gray-300">{item.name}</span>
                        </div>
                        <button 
                          onClick={() => toggleSetting(item.id as keyof ChatSettings)}
                          className={`w-10 h-5 rounded-full transition-all relative ${settings[item.id as keyof ChatSettings] ? 'bg-primary' : 'bg-gray-700'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings[item.id as keyof ChatSettings] ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/5 pt-1.5 space-y-1">
                    <button 
                      onClick={() => {
                        if (confirm('정말로 대화를 초기화하시겠습니까?')) {
                          onResetChat();
                          setShowSettings(false);
                        }
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-rose-500/10 text-[13px] font-bold text-rose-400 transition-colors"
                    >
                      대화 초기화하기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
