import React from 'react';
import { X, MessageCircle, Phone, Star, Share2 } from 'lucide-react';

interface CharacterProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: {
    name: string;
    avatarUrl: string;
    coverUrl?: string;
    description?: string;
  };
}

const CharacterProfileModal: React.FC<CharacterProfileModalProps> = ({ isOpen, onClose, character }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-[420px] h-full sm:h-[720px] bg-[#1a1a1b] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Cover Image */}
        <div className="absolute top-0 w-full h-full overflow-hidden">
          <img 
            src={character.coverUrl || character.avatarUrl || '/avatar.png'} 
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
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Share2 className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>

        {/* Profile Info Section (Centered like KakaoTalk) */}
        <div className="relative flex-1 flex flex-col items-center justify-end pb-24 px-8 z-10 text-center">
          {/* Avatar Container */}
          <div className="mb-6 relative group">
            <div className="w-24 h-24 rounded-[32px] overflow-hidden border-2 border-white/20 shadow-2xl bg-surface transform transition-transform group-hover:scale-105 active:scale-95 duration-300">
              <img 
                src={character.avatarUrl || '/avatar.png'} 
                className="w-full h-full object-cover" 
                alt={character.name} 
              />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">{character.name}</h2>
          <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-[280px]">
            {character.description || '반갑습니다! 저와 대화해봐요.'}
          </p>

          {/* Kakao-style Bottom Actions */}
          <div className="mt-12 flex items-center gap-14 border-t border-white/10 pt-10 w-full justify-center">
            <button 
              onClick={onClose}
              className="flex flex-col items-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-all group-active:scale-90 shadow-lg">
                <MessageCircle className="w-5 h-5 text-white group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[11px] font-bold text-gray-400 group-hover:text-white transition-colors">1:1 채팅</span>
            </button>

            <button className="flex flex-col items-center gap-3 group opacity-50 cursor-not-allowed">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-bold text-gray-400">통화하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterProfileModal;
