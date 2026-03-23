import React from 'react';
import { X, Clock, Calendar, Image as ImageIcon, Flame, Star } from 'lucide-react';

interface Milestone {
  type: 'scenario' | 'image' | 'moment';
  title: string;
  description: string;
  timestamp: string;
  imageUrl?: string;
}

interface StoryTimelineProps {
  isOpen: boolean;
  onClose: () => void;
  timeline: Milestone[];
  characterName: string;
}

const StoryTimeline: React.FC<StoryTimelineProps> = ({ isOpen, onClose, timeline, characterName }) => {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'scenario': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-primary" />;
      default: return <Star className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-end p-0 sm:p-4 animate-in fade-in slide-in-from-right duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-[#0d0d0e]/95 border-l border-white/5 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-500">
        
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Story Timeline</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Memories with {characterName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative">
          {/* Vertical Line */}
          <div className="absolute left-[39px] top-8 bottom-8 w-px bg-gradient-to-b from-primary/50 via-white/5 to-transparent" />

          {timeline.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <Calendar className="w-12 h-12 text-gray-500" />
              <p className="text-sm font-medium text-gray-400">아직 쌓인 추억이 없습니다.<br/>대화를 통해 기억을 만들어보세요!</p>
            </div>
          ) : (
            timeline.map((item, idx) => (
              <div key={idx} className="relative flex gap-6 animate-in fade-in slide-in-from-bottom duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                {/* Dot / Icon */}
                <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-[#1a1a1b] border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  {getIcon(item.type)}
                </div>

                {/* Content Card */}
                <div className="flex-1 space-y-2 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-white group-hover:text-primary transition-colors">{item.title}</h3>
                    <span className="text-[10px] font-medium text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{item.timestamp}</span>
                  </div>
                  <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                    {item.imageUrl && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-white/10 shadow-xl max-h-40">
                        <img src={item.imageUrl} className="w-full h-full object-cover" alt="Memory" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryTimeline;
