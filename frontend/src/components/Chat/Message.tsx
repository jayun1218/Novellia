import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MessageProps {
  content: string;
  isAi: boolean;
  timestamp: string;
  settings?: {
    theme: string;
    showProfile: boolean;
  };
  userProfile?: {
    name: string;
    avatar_url: string;
  };
  aiAvatarUrl?: string;
}

const Message: React.FC<MessageProps> = ({ content, isAi, timestamp, settings, userProfile, aiAvatarUrl }) => {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const theme = settings?.theme || 'basic';
  const showProfile = settings?.showProfile ?? true;

  // 추출 로직: 상태창 블록과 대화 내용을 분리
  const parseContent = (text: string) => {
    const statusRegex = /\[(.*?)상태창\]([\s\S]*?)(?=\[|$)/g;
    const statusBlocks: { title: string; content: string }[] = [];
    let dialogue = text;

    let match;
    while ((match = statusRegex.exec(text)) !== null) {
      statusBlocks.push({ title: match[1].trim() + " 상태창", content: match[2].trim() });
      dialogue = dialogue.replace(match[0], "");
    }

    return { dialogue: dialogue.trim(), statusBlocks };
  };

  const { dialogue, statusBlocks } = parseContent(content);

  const formatDialogue = (text: string) => {
    const parts = text.split(/(\*.*?\*|\(.*?\))/g);
    return parts.map((part, i) => {
      if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('(') && part.endsWith(')'))) {
        let actionColor = isAi ? 'text-primary' : 'text-white/60';
        if (theme === 'oreo' || theme === 'taro') {
          actionColor = isAi ? 'text-gray-500' : 'text-black/40';
        }
        return <span key={i} className={`${actionColor} italic font-normal`}>{part}</span>;
      }
      return part;
    });
  };

  // 테마 스타일 결정
  const getBubbleStyle = () => {
    if (isAi) {
      switch (theme) {
        case 'oreo': return 'bg-white text-black border border-black/5';
        case 'taro': return 'bg-white text-black border border-black/5';
        default: return 'bg-surface text-gray-100 border border-white/10';
      }
    } else {
      switch (theme) {
        case 'oreo': return 'bg-[#222124] text-white';
        case 'taro': return 'bg-[#C8B6FF] text-black';
        default: return 'bg-primary text-white';
      }
    }
  };

  return (
    <div className={`flex w-full mb-6 gap-3 ${isAi ? 'flex-row items-start' : 'flex-row-reverse items-start'}`}>
      {/* Avatar Section */}
      {(isAi || showProfile) && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-surface">
            <img 
              src={isAi ? (aiAvatarUrl || '/avatar.png') : (userProfile?.avatar_url || '/avatar.png')} 
              className="w-full h-full object-cover" 
              alt="" 
            />
          </div>
        </div>
      )}

      <div className={`flex flex-col max-w-[80%] ${isAi ? 'items-start' : 'items-end'}`}>
        {(isAi || showProfile) && (
          <span className="text-[11px] font-bold text-gray-500 mb-1 px-1">
            {isAi ? 'AI' : (userProfile?.name || '나')}
          </span>
        )}
        
        <div className={`px-5 py-3 rounded-2xl shadow-sm ${getBubbleStyle()} ${
          isAi ? 'rounded-tl-none' : 'rounded-tr-none'
        }`}>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
            {formatDialogue(dialogue)}
          </p>

          {isAi && statusBlocks.length > 0 && (
            <div className="mt-4 pt-3 border-t border-black/5">
              <button 
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-primary transition-colors"
              >
                상태창 {isStatusOpen ? '접기' : '열기'}
              </button>
              
              {isStatusOpen && (
                <div className="mt-3 space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                  {statusBlocks.map((block, idx) => (
                    <div key={idx} className="space-y-2">
                      <h5 className="text-[11px] font-black text-black/40 uppercase tracking-tighter">{block.title}</h5>
                      <div className="space-y-1.5 pl-1">
                        {block.content.split('\n').filter(line => line.trim()).map((line, lidx) => (
                          <div key={lidx} className="text-[13px] text-black/70 flex items-start gap-2">
                            <span>{line.replace(/^- /, '')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="text-[10px] mt-1.5 opacity-40 text-gray-500 px-1">
          {timestamp}
        </div>
      </div>
    </div>
  );
};

export default Message;
