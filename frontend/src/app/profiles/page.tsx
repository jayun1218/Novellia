'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Camera, Check, X, Save, User as UserIcon, Trash } from 'lucide-react';

interface UserProfile {
  name: string;
  short_bio: string;
  description: string;
  persona: string; // 유저 로어 추가
  avatar_url: string;
  use_playing_name: boolean;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    short_bio: '',
    description: '',
    persona: '',
    avatar_url: '/avatar.png',
    use_playing_name: true,
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/user-profiles');
      const data = await response.json();
      setProfiles(data);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      short_bio: '',
      description: '',
      persona: '',
      avatar_url: '/avatar.png',
      use_playing_name: true,
    });
    setCurrentIndex(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (index: number) => {
    setFormData(profiles[index]);
    setCurrentIndex(index);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/user-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        await fetchProfiles();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleDelete = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('프로필을 삭제하시겠습니까?')) return;
    try {
      await fetch(`http://127.0.0.1:8000/user-profiles/${index}`, { method: 'DELETE' });
      await fetchProfiles();
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 pt-10 px-6 md:px-12 max-w-4xl mx-auto">
      {!isEditing ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <header className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-black text-white mb-2">나의 조력자 리스트</h1>
              <p className="text-gray-400 text-sm">대화에서 나를 대신할 페르소나를 관리하세요.</p>
            </div>
            <button 
              onClick={handleOpenCreate}
              className="p-4 bg-primary hover:bg-primary-hover text-white rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profiles.map((profile, index) => (
              <div 
                key={index}
                onClick={() => handleOpenEdit(index)}
                className="glass-card p-6 flex items-center gap-5 cursor-pointer hover:border-primary/50 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
                <div className="w-20 h-20 rounded-[28px] bg-surface border border-white/10 overflow-hidden flex-shrink-0 shadow-xl group-hover:scale-105 transition-transform duration-500">
                  <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 z-10">
                  <h3 className="text-xl font-black text-white truncate mb-1">{profile.name}</h3>
                  <p className="text-sm text-gray-400 truncate font-medium">{profile.short_bio || '개성 넘치는 유저'}</p>
                </div>
                <button 
                  onClick={(e) => handleDelete(index, e)}
                  className="p-3 text-gray-600 hover:text-red-500 transition-colors z-10"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {profiles.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.02]">
                <UserIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 font-bold">생성된 유저 프로필이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in-95 duration-500 max-w-xl mx-auto">
          <header className="flex items-center justify-between mb-12">
            <button onClick={() => setIsEditing(false)} className="p-2.5 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all shadow-lg active:scale-90">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-white tracking-tight">프로필 설정</h2>
            <button 
              onClick={handleSave}
              className="px-8 py-3 bg-primary text-white rounded-2xl font-black hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 active:scale-95"
            >
              저장
            </button>
          </header>

          <div className="space-y-12">
            <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer">
                <div className="w-40 h-40 rounded-[48px] bg-surface border-2 border-white/5 overflow-hidden shadow-2xl group-hover:border-primary/50 transition-all duration-500">
                  <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                    <Camera className="w-8 h-8 text-white mb-1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-gray-500 tracking-[0.2em] uppercase px-1">기본 정보 <span className="text-primary">*</span></label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="당신의 이름을 입력하세요"
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-white font-bold focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.06] transition-all outline-none"
                />
                <div className="flex items-center gap-3 mt-3 px-1">
                  <button 
                    onClick={() => setFormData({...formData, use_playing_name: !formData.use_playing_name})}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${formData.use_playing_name ? 'bg-primary shadow-lg shadow-primary/20 scale-110' : 'bg-white/5 border border-white/10'}`}
                  >
                    {formData.use_playing_name && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <span className="text-[13px] text-gray-400 font-bold">플레이 중인 닉네임 사용</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-gray-500 tracking-[0.2em] uppercase px-1">짧은 소개</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={formData.short_bio}
                    onChange={(e) => setFormData({...formData, short_bio: e.target.value})}
                    placeholder="프로필 목록에 표시될 한 줄 소개"
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-white font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    maxLength={50}
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600">
                    {formData.short_bio.length}/50
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-gray-500 tracking-[0.2em] uppercase px-1">유저 설명 (기본 인식)</label>
                <div className="relative">
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="AI가 당신을 어떻게 인식해야 할까요? (예: 18세, 차가운 성격의 우등생 등)"
                    className="w-full bg-white/[0.03] border border-white/5 rounded-3xl p-6 text-white font-medium focus:ring-2 focus:ring-primary/20 h-40 resize-none outline-none leading-relaxed"
                    maxLength={500}
                  />
                  <span className="absolute bottom-6 right-6 text-[10px] font-black text-gray-600">
                    {formData.description.length}/500
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-primary/70 tracking-[0.2em] uppercase px-1">상세 페르소나 (로어/세계관)</label>
                <div className="relative">
                   <div className="absolute inset-0 bg-primary/5 rounded-[32px] blur-2xl -z-10 opacity-30" />
                  <textarea 
                    value={formData.persona}
                    onChange={(e) => setFormData({...formData, persona: e.target.value})}
                    placeholder="당신만의 상세한 설정이나 세계관 규칙을 입력하세요. 캐릭터들이 이 설정을 기반으로 당신을 대하게 됩니다."
                    className="w-full bg-white/[0.04] border border-primary/10 rounded-[32px] p-7 text-white font-medium focus:ring-2 focus:ring-primary/40 h-64 resize-none outline-none leading-relaxed shadow-2xl"
                  />
                </div>
                <p className="text-[11px] text-gray-500 px-2 font-medium leading-relaxed">
                  * 팁: 인물 관계, 특정 사건의 기억, 금기 사항 등을 적으면 AI가 더 몰입감 있게 반응합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
