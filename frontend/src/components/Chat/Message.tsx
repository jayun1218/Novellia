import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User, Sparkles, Clock } from 'lucide-react';

interface MessageProps {
  content: string;
  isAi: boolean;
  role?: string;
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
  role,
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
    const char = activeCharacters.find(c => c.name === speakerName);
    
    if (char) {
      return {
        name: char.name,
        avatar: char.avatar_url || char.avatarUrl || '/avatar.png',
        char: char
      };
    }
    
    // 대화에 참여 중이지 않은 제3의 인물(하나마키 등) 처리
    if (speakerName) {
      return {
        name: speakerName,
        avatar: 'default_side', // 기본 실루엣 태그
        char: null
      };
    }

    // 기본값 (참여 중인 첫 번째 캐릭터)
    const fallbackChar = activeCharacters[0];
    return {
      name: fallbackChar?.name || 'AI',
      avatar: fallbackChar?.avatar_url || fallbackChar?.avatarUrl || 'default_side',
      char: fallbackChar
    };
  };

  const speaker = getSpeakerInfo();
  
  const parseContent = (text: string) => {
    // 1. Scenario Header Parsing (YYYY/MM/DD HH:MM｜Location｜[Turn])
    const headerRegex = /^(\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}｜.*?｜\[\d+\])\n*/;
    const headerMatch = text.match(headerRegex);
    const header = headerMatch ? headerMatch[1] : null;
    let remainingText = header ? text.replace(headerRegex, "") : text;

    // 2. Schicksal Block Parsing (𝕾𝖈𝖍𝖎𝖈𝖐𝖘𝖆𝖑 ... 턴 수 n/10)
    const schicksalRegex = /(𝕾𝖈𝖍𝖎𝖈𝖐𝖘𝖆𝖑[\s\S]*?(?:엔딩까지 턴 수 \d+\/\d+|$))/;
    const schicksalMatch = remainingText.match(schicksalRegex);
    const schicksalContent = schicksalMatch ? schicksalMatch[1] : null;
    remainingText = schicksalContent ? remainingText.replace(schicksalRegex, "") : remainingText;

    const statusRegex = /\[(.*?)상태창\]([\s\S]*?)(?=\[|$)/g;
    const statusBlocks: { title: string; content: string }[] = [];
    
    const cleanSystemTags = (t: string) => {
      return t.replace(/\[.*? 감정:\s*.*?\]/g, "")
              .replace(/\[BG:\s*.*?\]/g, "")
              .replace(/\[.*?호감도:\s*[+-]?\d+\]/g, "")
              .replace(/\[FEED:\s*.*?\]/g, "");
    };

    const stripSpeakerPrefix = (t: string) => {
      return t.split('\n').map(line => line.replace(/^(?:\[.*?\]|.*?[:：])\s*/, "")).join('\n');
    };

    let mainText = cleanSystemTags(remainingText);
    
    let match;
    const originalText = remainingText;
    while ((match = statusRegex.exec(originalText)) !== null) {
      const cleanedStatus = stripSpeakerPrefix(cleanSystemTags(match[2].trim()));
      statusBlocks.push({ title: match[1].trim() + " 상태창", content: cleanedStatus });
      mainText = mainText.replace(match[0], "");
    }

    mainText = stripSpeakerPrefix(mainText);
    return { 
      header,
      dialogue: mainText.trim(), 
      statusBlocks,
      schicksalContent
    };
  };

  const { header, dialogue, statusBlocks, schicksalContent } = parseContent(content);
  const isGuide = role === 'guide';

  const formatDialogue = (text: string) => {
    const cleanText = text.replace(/\[.*?호감도:\s*[+-]?\d+\]/g, '').trim();
    // 캐릭터 이름 ｜ "대사" 패턴 하이라이트
    const parts = cleanText.split(/(\*.*?\*|\(.*?\)|\S+?\s*｜\s*".*?")/g);
    
    return parts.map((part, i) => {
      if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('(') && part.endsWith(')'))) {
        let actionColor = isAi ? 'text-primary' : 'text-white/60';
        if (theme === 'oreo' || theme === 'taro') actionColor = isAi ? 'text-gray-500' : 'text-black/40';
        return <span key={i} className={`${actionColor} italic font-normal`}>{part}</span>;
      }
      
      const charDialogueMatch = part.match(/^(\S+?)\s*｜\s*"(.*?)"$/);
      if (charDialogueMatch) {
         return (
           <span key={i} className="block my-2" style={{ textIndent: 0 }}>
             <span className="font-black text-primary mr-2 tracking-tight opacity-90">{charDialogueMatch[1]}</span>
             <span className={isAi ? "text-gray-100" : "text-white"}>"{charDialogueMatch[2]}"</span>
           </span>
         );
      }
      return part;
    });
  };

  const getBubbleStyle = () => {
    if (isGuide) return 'bg-white/5 border-l-2 border-primary/50 text-gray-300';
    if (isAi) {
      return 'bg-surface/40 backdrop-blur-sm text-gray-100 border border-white/5';
    }
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
            {speaker.avatar === 'default_side' ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-500/20 text-gray-400">
                <User className="w-5 h-5" />
              </div>
            ) : (
              <img src={speaker.avatar} className="w-full h-full object-cover" alt="" />
            )}
          </div>
        </div>
      )}

      <div className={`flex flex-col max-w-[85%] ${isAi ? 'items-start' : 'items-end'}`}>
        {(isAi || showProfile) && (
          <span className={`text-[10px] font-black uppercase tracking-tighter mb-1 px-1 ${isAi ? 'text-gray-500' : 'text-primary'}`}>
            {speaker.name}
          </span>
        )}
        
        {header && (
          <div className="mb-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] text-gray-400 font-bold flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
             {header}
          </div>
        )}

        <div className={`rounded-2xl overflow-hidden transition-all duration-300 shadow-2xl ${getBubbleStyle()} ${
          isAi ? 'rounded-tl-none' : 'rounded-tr-none'
        }`}>
          {imageUrl && (
            <div className="w-full aspect-video overflow-hidden border-b border-white/5">
              <img src={imageUrl} alt="Scene" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          )}
          <div className="px-6 py-5">
            {isGuide && (
              <div className="flex items-center gap-1.5 mb-3 text-red-500 font-black text-xs uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                ! 플레이 가이드
              </div>
            )}
            <div className={`leading-relaxed whitespace-pre-wrap font-medium tracking-tight ${isGuide ? 'text-sm text-gray-400 italic' : 'text-[15px]'}`}>
              {formatDialogue(dialogue)}
            </div>
          </div>

          {/* Schicksal Block */}
          {schicksalContent && (
             <div className="px-6 pb-6 mt-2">
                <div className="bg-black/40 rounded-xl border border-white/5 p-4 space-y-4 shadow-inner">
                   <div className="text-primary font-serif font-black italic text-xl tracking-[0.2em] border-b border-primary/20 pb-2 mb-3">
                      𝕾𝖈𝖍𝖎𝖈𝖐𝖘𝖆𝖑
                   </div>
                   
                   {/* Point Icons Block */}
                   <div className="flex items-center gap-3 text-[10px] font-black tracking-widest text-gray-500 uppercase">
                      {schicksalContent.includes('☀︎') && (
                         <span className="bg-white/5 px-2 py-1 rounded border border-white/5 flex items-center gap-1">
                            <span className="text-primary">☀︎</span> {schicksalContent.match(/☀︎:(\d+)/)?.[1] || '0'}
                         </span>
                      )}
                      {schicksalContent.includes('★') && (
                         <span className="bg-white/5 px-2 py-1 rounded border border-white/5 flex items-center gap-1">
                            <span className="text-rose-500">★</span> {schicksalContent.match(/★:(\d+)/)?.[1] || '0'}
                         </span>
                      )}
                   </div>

                   {/* Status Badges */}
                   <div className="flex flex-wrap gap-2 py-1">
                      {schicksalContent.match(/\[상태:\s*(.*?)\]/) && 
                         schicksalContent.match(/\[상태:\s*(.*?)\]/)?.[1].split(',').map((status, si) => (
                            <span key={si} className="text-[10px] px-2 py-1 bg-white/5 text-gray-300 rounded font-black border border-white/10 uppercase tracking-wider">
                               {status.trim()}
                            </span>
                         ))
                      }
                   </div>

                   {/* Bullet Points */}
                   <div className="space-y-2 py-1">
                      {schicksalContent.split('\n').filter(l => l.trim().startsWith('-')).map((point, pi) => (
                         <div key={pi} className="text-[13px] text-gray-400 flex items-start gap-2 leading-snug">
                            <span className="text-primary mt-1 text-[10px]">▶</span>
                            <span>{point.replace(/^- \s*/, '')}</span>
                         </div>
                      ))}
                   </div>

                   {/* Turn Counter */}
                   <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[9px] text-gray-600 font-bold tracking-widest uppercase">system log synchronized</span>
                      <span className="text-[10px] text-primary font-black tracking-tighter">
                         {schicksalContent.match(/엔딩까지 턴 수 \d+\/\d+/) || "TRACKING..."}
                      </span>
                   </div>
                </div>
             </div>
          )}

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
