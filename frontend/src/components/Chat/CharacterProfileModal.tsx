import React from 'react';
import { X, MessageCircle, Phone, Star, Lock, Unlock, Gift, Heart, User } from 'lucide-react';

interface Unlockable {
  threshold: number;
  title: string;
  content: string;
}

interface CharacterProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: {
    name: string;
    avatarUrl?: string; // camelCase (legacy)
    avatar_url?: string; // snake_case (backend)
    coverUrl?: string; // camelCase
    cover_url?: string; // snake_case
    description?: string;
    unlockables?: Unlockable[];
    recommended_personas?: string[];
  };
  favorability?: number;
  onApplyPersona?: (persona: string) => void;
}

const CharacterProfileModal: React.FC<CharacterProfileModalProps> = ({ isOpen, onClose, character, favorability = 0, onApplyPersona }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-[420px] h-full sm:h-[850px] bg-[#1a1a1b] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Cover Image */}
        <div className="absolute top-0 w-full h-[300px] overflow-hidden">
          <img 
            src={character.cover_url || character.coverUrl || character.avatar_url || character.avatarUrl || '/avatar.png'} 
            className="w-full h-full object-cover opacity-40 scale-110 blur-[1px]" 
            alt="Cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#1a1a1b]" />
        </div>

        {/* Header Actions */}
        <div className="relative p-6 flex justify-between items-center z-10">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Star className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>

        {/* Profile Info Section */}
        <div className="relative flex-1 flex flex-col items-center pt-24 pb-8 px-8 z-10 text-center overflow-y-auto custom-scrollbar">
          {/* Avatar */}
          <div className="mb-4 relative group">
            <div className="w-24 h-24 rounded-[32px] overflow-hidden border-2 border-white/20 shadow-2xl bg-surface">
              <img 
                src={character.avatar_url || character.avatarUrl || '/avatar.png'} 
                className="w-full h-full object-cover" 
                alt={character.name} 
              />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-1 tracking-tight">{character.name}</h2>
          
          {/* Affection Gauge */}
          <div className="flex flex-col items-center gap-1.5 mb-8 w-full max-w-[220px]">
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span className="text-[12px] font-black text-rose-500 uppercase">Affection {favorability}%</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${favorability}%` }} 
              />
            </div>
          </div>


          {/* Secret Content Section */}
          <div className="w-full space-y-3 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2 px-1 text-left">
              <Gift className="w-4 h-4 text-primary" />
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest text-left">Secret Moments</h3>
            </div>
            
            {character.unlockables?.map((item, idx) => {
              const isUnlocked = favorability >= item.threshold;
              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-3xl border transition-all duration-500 ${
                    isUnlocked 
                      ? 'bg-primary/10 border-primary/20 scale-100' 
                      : 'bg-white/[0.02] border-white/5 scale-[0.98] opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1 text-left">
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isUnlocked ? 'text-primary' : 'text-gray-500'}`}>
                      {isUnlocked ? item.title : `Unlocked at ${item.threshold}%`}
                    </span>
                    {isUnlocked ? <Unlock className="w-3.5 h-3.5 text-primary" /> : <Lock className="w-3.5 h-3.5 text-gray-600" />}
                  </div>
                  <p className={`text-[13px] leading-relaxed text-left ${isUnlocked ? 'text-gray-200' : 'text-gray-600 italic select-none'}`}>
                    {isUnlocked ? `"${item.content}"` : '이 마음의 비밀은 아직 잠겨 있습니다.'}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="h-24" /> {/* Spacer */}
        </div>

        {/* Kakao-style Bottom Actions */}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#1a1a1b] via-[#1a1a1b] 80% to-transparent pt-10 pb-12 flex items-center gap-14 justify-center z-20">
          <button onClick={onClose} className="flex flex-col items-center gap-3 group">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-all shadow-lg border border-white/10">
              <MessageCircle className="w-5 h-5 text-white group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 group-hover:text-white transition-colors">1:1 채팅</span>
          </button>

          <button className="flex flex-col items-center gap-3 group opacity-50 cursor-not-allowed">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <Phone className="w-5 h-5 text-white/50" />
            </div>
            <span className="text-[11px] font-bold text-gray-400">보이스톡</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterProfileModal;
