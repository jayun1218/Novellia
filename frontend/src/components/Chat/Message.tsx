import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MessageProps {
  content: string;
  isAi: boolean;
  timestamp: string;
  settings?: {
    theme: string;
    showProfile: boolean;
    showStatus: boolean;
  };
  userProfile?: {
    name: string;
    avatar_url: string;
  };
  activeCharacters?: any[];
  favorability?: number;
  imageUrl?: string;
  onAvatarClick?: (char: any) => void;
}

const Message: React.FC<MessageProps> = ({ 
  content, 
  isAi, 
  timestamp, 
  settings, 
  userProfile, 
  activeCharacters = [], 
  favorability, 
  imageUrl, 
  onAvatarClick 
}) => {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const theme = settings?.theme || 'basic';
  const showProfile = settings?.showProfile ?? true;

  // 화자 식별 및 내용 정리
  const getSpeakerInfo = () => {
    if (!isAi) return { name: userProfile?.name || '나', avatar: userProfile?.avatar_url || '/avatar.png', char: null };
    
    // [이름] 형식의 태그 추출
    const nameMatch = content.match(/^\[(.*?)\]/);
    const speakerName = nameMatch ? nameMatch[1] : '';
    const char = activeCharacters.find(c => c.name === speakerName) || activeCharacters[0];
    
    return {
      name: char?.name || 'AI',
      avatar: char?.avatar_url || char?.avatarUrl || '/avatar.png',
      char: char
    };
  };

  const speaker = getSpeakerInfo();
  
  const parseContent = (text: string) => {
    const statusRegex = /\[(.*?)상태창\]([\s\S]*?)(?=\[|$)/g;
    const statusBlocks: { title: string; content: string }[] = [];
    
    // 서비스 태그(행동, 배경, 호감도 등) 제거 헬퍼
    const cleanSystemTags = (t: string) => {
      return t.replace(/\[.*? 감정:\s*.*?\]/g, "")
              .replace(/\[BG:\s*.*?\]/g, "")
              .replace(/\[.*?호감도:\s*[+-]?\d+\]/g, "")
              .replace(/\[FEED:\s*.*?\]/g, "");
    };

    // 화자 이름 접두사 제거 헬퍼 (멀티라인 지원)
    const stripSpeakerPrefix = (t: string) => {
      return t.split('\n').map(line => line.replace(/^(?:\[.*?\]|.*?[:：])\s*/, "")).join('\n');
    };

    let dialogue = cleanSystemTags(text);
    dialogue = dialogue.replace(/"/g, ""); // 모든 큰따옴표 제거
    
    let match;
    const originalText = text;
    while ((match = statusRegex.exec(originalText)) !== null) {
      const cleanedStatus = stripSpeakerPrefix(cleanSystemTags(match[2].trim()));
      statusBlocks.push({ title: match[1].trim() + " 상태창", content: cleanedStatus });
      dialogue = dialogue.replace(match[0], "");
    }

    dialogue = stripSpeakerPrefix(dialogue);
    return { dialogue: dialogue.trim(), statusBlocks };
  };

  const { dialogue, statusBlocks } = parseContent(content);

  const formatDialogue = (text: string) => {
    const cleanText = text.replace(/\[.*?호감도:\s*[+-]?\d+\]/g, '').trim();
    const parts = cleanText.split(/(\*.*?\*|\(.*?\))/g);
    return parts.map((part, i) => {
      if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('(') && part.endsWith(')'))) {
        let actionColor = isAi ? 'text-primary' : 'text-white/60';
        if (theme === 'oreo' || theme === 'taro') actionColor = isAi ? 'text-gray-500' : 'text-black/40';
        if (theme === 'mint') actionColor = isAi ? 'text-[#40916C]' : 'text-white/70';
        if (theme === 'orange') actionColor = isAi ? 'text-[#D48806]' : 'text-white/70';
        if (theme === 'red') actionColor = isAi ? 'text-[#C53030]' : 'text-white/70';
        return <span key={i} className={`${actionColor} italic font-normal`}>{part}</span>;
      }
      return part;
    });
  };

  const getBubbleStyle = () => {
    if (isAi) {
      if (theme === 'oreo' || theme === 'taro') return 'bg-white text-black border border-black/5 shadow-sm';
      if (theme === 'mint') return 'bg-[#F0F9F6] text-[#2D6A4F] border border-[#94D2BD]/30';
      if (theme === 'orange') return 'bg-[#FFF8F0] text-[#D48806] border border-[#FF9F1C]/30';
      if (theme === 'red') return 'bg-[#FFF5F5] text-[#C53030] border border-[#E63946]/30';
      return 'bg-surface text-gray-100 border border-white/10';
    }
    if (theme === 'oreo') return 'bg-[#222124] text-white';
    if (theme === 'taro') return 'bg-[#C8B6FF] text-black';
    if (theme === 'mint') return 'bg-[#94D2BD] text-white shadow-md';
    if (theme === 'orange') return 'bg-[#FF9F1C] text-white shadow-md';
    if (theme === 'red') return 'bg-[#E63946] text-white shadow-md shadow-red-500/20';
    return 'bg-primary text-white shadow-md';
  };

  return (
    <div className={`flex w-full mb-6 gap-3 ${isAi ? 'flex-row items-start' : 'flex-row-reverse items-start'}`}>
      {(isAi || showProfile) && (
        <div className="flex-shrink-0 mt-1">
          <div 
            className={`w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-surface ${isAi ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all' : ''}`}
            onClick={() => isAi && speaker.char && onAvatarClick?.(speaker.char)}
          >
            <img src={speaker.avatar} className="w-full h-full object-cover" alt="" />
          </div>
        </div>
      )}

      <div className={`flex flex-col max-w-[80%] ${isAi ? 'items-start' : 'items-end'}`}>
        {(isAi || showProfile) && (
          <span className={`text-[11px] font-bold mb-1 px-1 ${isAi ? 'text-gray-400' : 'text-primary'}`}>
            {speaker.name}
          </span>
        )}
        
        <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${getBubbleStyle()} ${
          isAi ? 'rounded-tl-none' : 'rounded-tr-none'
        }`}>
          {imageUrl && (
            <div className="w-full aspect-video overflow-hidden border-b border-white/5">
              <img src={imageUrl} alt="Scene" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          )}
          <div className="px-5 py-3.5">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium tracking-tight">
              {formatDialogue(dialogue)}
            </p>
          </div>

          {isAi && settings?.showStatus && statusBlocks.length > 0 && (
            <div className={`mt-2 pt-3 border-t ${theme === 'basic' ? 'border-white/5' : 'border-black/5'}`}>
              <button 
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-primary/80 hover:text-primary transition-colors px-5 pb-3"
              >
                상태창 {isStatusOpen ? '접기' : '열기'}
                {isStatusOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              
              {isStatusOpen && (
                <div className="px-5 pb-5 space-y-5 animate-in fade-in slide-in-from-top-1">
                  {favorability !== undefined && (
                    <div className={`pb-4 border-b ${theme === 'basic' ? 'border-white/5' : 'border-black/5'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase text-rose-400">Favorability</span>
                        <span className="text-[10px] font-bold text-rose-400">{favorability}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-400 transition-all duration-1000" style={{ width: `${favorability}%` }} />
                      </div>
                    </div>
                  )}

                  {statusBlocks.map((block, idx) => (
                    <div key={idx} className="space-y-2.5">
                      <h5 className={`text-[11px] font-black uppercase ${theme === 'basic' ? 'text-white/40' : 'text-black/30'}`}>{block.title}</h5>
                      <div className="space-y-2 pl-1">
                        {block.content.split('\n').filter(l => l.trim()).map((line, lidx) => {
                          const cleanLine = line.replace(/^[*-]\s*/, '');
                          const categories = ['장소', '상황', '기분', '행동', '속마음'];
                          
                          // 이미 콜론이 있으면 그대로 표시, 없으면 순서대로 카테고리 부여
                          const hasLabel = cleanLine.includes(':') || cleanLine.includes('：');
                          const displayLine = hasLabel ? cleanLine : `${categories[lidx % categories.length]} : ${cleanLine}`;
                          
                          return (
                            <div key={lidx} className={`text-[13px] ${theme === 'basic' ? 'text-white/70' : 'text-black/60'} flex items-start`}>
                               <span>{displayLine}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="text-[9px] mt-1.5 opacity-40 text-gray-500 px-1 font-medium">
          {timestamp}
        </div>
      </div>
    </div>
  );
};

export default Message;
