import React, { useState } from 'react';
import { ChevronLeft, ShieldCheck, ChevronDown, Settings, User, Zap, Palette, Image as ImageIcon, Check } from 'lucide-react';
import Link from 'next/link';

interface ChatSettings {
  theme: string;
  showProfile: boolean;
  autoBg: boolean;
  haptic: boolean;
}

interface ChatHeaderProps {
  name: string;
  status: string;
  avatarUrl: string;
  userProfiles: any[];
  selectedProfileIndex: number;
  onProfileSelect: (index: number) => void;
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
  onResetChat: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  name, 
  status, 
  avatarUrl, 
  userProfiles, 
  selectedProfileIndex, 
  onProfileSelect,
  settings,
  onSettingsChange,
  onResetChat
}) => {
  const [showProfiles, setShowProfiles] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const currentProfile = userProfiles[selectedProfileIndex] || { name: '나', avatar_url: '/avatar.png' };

  const themes = [
    { id: 'basic', name: '기본', color: 'bg-primary' },
    { id: 'oreo', name: '오레오', color: 'bg-white' },
    { id: 'taro', name: '타로', color: 'bg-[#C8B6FF]' },
  ];

  const toggleSetting = (key: keyof ChatSettings) => {
    onSettingsChange({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="glass fixed top-0 w-full z-50 border-b border-white/5">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left Section: Back button & Character info */}
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <Link href="/" className="p-1.5 hover:bg-white/5 rounded-full transition-colors flex-shrink-0">
            <ChevronLeft className="w-6 h-6 text-gray-400" />
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <img 
                src={avatarUrl || '/avatar.png'} 
                alt={name} 
                className="w-10 h-10 rounded-full object-cover border border-white/10" 
              />
              <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#050505] rounded-full shadow-lg"></div>
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm flex items-center gap-1.5 text-white truncate">
                {name} <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              </h2>
              <p className="text-[10px] text-gray-500 font-medium truncate">{status}</p>
            </div>
          </div>
        </div>

        {/* Right Section: Selectors & Settings */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* User Persona Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowProfiles(!showProfiles)}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:bg-white/10 transition-all active:scale-95"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                <img src={currentProfile.avatar_url || '/avatar.png'} alt="My Profile" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-bold text-gray-200 max-w-[60px] truncate hidden sm:block">{currentProfile.name}</span>
              <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showProfiles ? 'rotate-180' : ''}`} />
            </button>

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
                <Link 
                  href="/profiles"
                  className="block w-full px-4 py-2.5 text-center text-[11px] font-bold text-primary hover:bg-primary/5 border-t border-white/5 transition-colors"
                >
                  페르소나 관리
                </Link>
              </div>
            )}
          </div>

          {/* Settings Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-all active:scale-90 shadow-lg ${showSettings ? 'bg-primary text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
              title="채팅 설정"
            >
              <Settings className="w-5 h-5" />
            </button>

            {showSettings && (
              <div className="absolute top-full right-0 mt-3 w-64 glass-card border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 p-2 z-[60]">
                <div className="space-y-4 p-2">
                  <div className="space-y-1">
                    {[
                      { id: 'autoBg', name: '배경 이미지 자동생성', icon: ImageIcon },
                      { id: 'showProfile', name: '대화 프로필 표시', icon: User },
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

                  <div className="border-t border-white/5 pt-3">
                    <p className="text-[11px] font-bold text-gray-500 mb-2 px-2 flex items-center gap-2 uppercase tracking-tighter">
                      <Palette className="w-3.5 h-3.5" /> 말풍선 테마
                    </p>
                    <div className="grid grid-cols-3 gap-2 px-1 pb-2">
                      {themes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => onSettingsChange({ ...settings, theme: theme.id })}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border ${
                            settings.theme === theme.id ? 'border-primary bg-primary/10 shadow-md' : 'border-white/5 hover:bg-white/5'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg ${theme.id === 'oreo' ? 'bg-[#222124] border border-white/10' : theme.color}`} />
                          <span className={`text-[10px] font-bold ${settings.theme === theme.id ? 'text-primary' : 'text-gray-500'}`}>{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-1.5 space-y-1">
                    <button className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 text-[13px] font-medium text-gray-400 transition-colors">
                      대화방 편집
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('정말로 대화를 초기화하시겠습니까? 모든 대화 내용과 호감도가 사라집니다.')) {
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
