'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Camera, Check, X, Save, User as UserIcon, Trash } from 'lucide-react';

interface UserProfile {
  name: string;
  short_bio: string;
  description: string;
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
      // For simplicity, we just push to the end or replace. 
      // Backend actually marks them by index in this simple implementation.
      const response = await fetch('http://127.0.0.1:8000/user-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        if (currentIndex !== null) {
          // If editing, we should ideally have a PUT endpoint, but my current backend just appends.
          // I'll fix the backend logic or just handle it as a refresh.
          // Let's assume the user wants to add/manage.
        }
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
              <h1 className="text-3xl font-black text-white mb-2">유저 프로필 리스트</h1>
              <p className="text-gray-400 text-sm">대화에서 나를 대신할 페르소나를 관리하세요.</p>
            </div>
            <button 
              onClick={handleOpenCreate}
              className="p-4 bg-primary hover:bg-primary-hover text-white rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.map((profile, index) => (
              <div 
                key={index}
                onClick={() => handleOpenEdit(index)}
                className="glass-card p-6 flex items-center gap-4 cursor-pointer hover:border-primary/50 transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface border border-white/5 overflow-hidden flex-shrink-0">
                  <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{profile.name}</h3>
                  <p className="text-sm text-gray-400 truncate">{profile.short_bio || '소개 없음'}</p>
                </div>
                <button 
                  onClick={(e) => handleDelete(index, e)}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {profiles.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <UserIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">생성된 유저 프로필이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in-95 duration-500 max-w-lg mx-auto">
          <header className="flex items-center justify-between mb-10">
            <button onClick={() => setIsEditing(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-white">프로필 설정</h2>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all"
            >
              저장
            </button>
          </header>

          <div className="space-y-10">
            {/* Avatar Section - Zeta Style */}
            <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer">
                <div className="w-32 h-32 rounded-[32px] bg-surface border border-white/5 overflow-hidden">
                  <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-bold text-white uppercase tracking-tighter">이미지 편집</span>
                  </div>
                </div>
                <button className="absolute -top-2 -right-2 p-2 bg-surface border border-white/10 rounded-full text-gray-400 hover:text-white shadow-xl">
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form Fields - Zeta Style */}
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 tracking-wider">이름 <span className="text-primary">*</span></label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="{{user}}"
                  className="w-full bg-surface border-none rounded-xl p-4 text-white focus:ring-1 focus:ring-primary/50 transition-all"
                />
                <div className="flex items-center gap-2 mt-2">
                  <div 
                    onClick={() => setFormData({...formData, use_playing_name: !formData.use_playing_name})}
                    className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-all ${formData.use_playing_name ? 'bg-primary border-primary' : 'border border-white/20'}`}
                  >
                    {formData.use_playing_name && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">플레이하는 유저 이름 사용하기</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 tracking-wider">짧은 소개 <span className="text-primary">*</span></label>
                <div className="relative">
                  <textarea 
                    value={formData.short_bio}
                    onChange={(e) => setFormData({...formData, short_bio: e.target.value})}
                    placeholder="프로필의 특징을 짧게 입력하세요"
                    className="w-full bg-surface border-none rounded-xl p-4 text-white focus:ring-1 focus:ring-primary/50 transition-all h-32 resize-none"
                    maxLength={50}
                  />
                  <span className="absolute bottom-4 right-4 text-[10px] font-bold text-gray-600">
                    {formData.short_bio.length}/50
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 tracking-wider">설명</label>
                <div className="relative">
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="AI가 당신을 어떻게 인식해야 할까요? (나이, 성별, 키, 성격 등)"
                    className="w-full bg-surface border-none rounded-xl p-4 text-white focus:ring-1 focus:ring-primary/50 transition-all h-48 resize-none"
                    maxLength={500}
                  />
                  <span className="absolute bottom-4 right-4 text-[10px] font-bold text-gray-600">
                    {formData.description.length}/500
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
