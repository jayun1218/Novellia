import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User, Sparkles, Clock, Heart, Zap } from 'lucide-react';

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
  isStory?: boolean;
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
  isStory = false,
  onAvatarClick 
}) => {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const theme = settings?.theme || 'basic';
  const showProfile = settings?.showProfile ?? true;

  // 화자 식별 및 내용 정리
  const getSpeakerInfo = () => {
    if (!isAi) return { name: userProfile?.name || '나', avatar: userProfile?.avatar_url || '/avatar.png', char: null };
    
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
    
    const fallbackChar = activeCharacters[0];
    return {
      name: fallbackChar?.name || 'AI',
      avatar: fallbackChar?.avatar_url || fallbackChar?.avatarUrl || '/avatar.png',
      char: fallbackChar
    };
  };

  const speaker = getSpeakerInfo();
  
  const parseContent = (text: string) => {
    // 1. Header Parsing
    const headerRegex = /^(\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}｜.*?｜\[\d+\])\n*/;
    const headerMatch = text.match(headerRegex);
    const header = headerMatch ? headerMatch[1] : null;
    let remainingText = header ? text.replace(headerRegex, "") : text;

    // 2. Scenario Status Parsing [Name | Mood | Action]
    const scenarioStatusRegex = /\[([^\]|]+)\s*\|\s*([^\]|]+)\s*\|\s*([^\]|]+)\]/g;
    const scenarioStatuses: { name: string; mood: string; action: string }[] = [];
    
    let match;
    let tempText = remainingText;
    while ((match = scenarioStatusRegex.exec(tempText)) !== null) {
      scenarioStatuses.push({ 
        name: match[1].trim(), 
        mood: match[2].trim(), 
        action: match[3].trim() 
      });
      remainingText = remainingText.replace(match[0], "");
    }

    // 3. Legacy Status Parsing [Name 상태창]
    const legacyStatusRegex = /\[(.*?)상태창\]([\s\S]*?)(?=\[|$)/g;
    const legacyStatuses: { title: string; content: string }[] = [];
    
    while ((match = legacyStatusRegex.exec(remainingText)) !== null) {
      legacyStatuses.push({ 
        title: match[1].trim() + " 상태창", 
        content: match[2].trim() 
      });
      remainingText = remainingText.replace(match[0], "");
    }

    // 4. Relationship Parsing [관계｜...]
    const relRegex = /\[관계｜([^\]]+)\]/;
    const relMatch = remainingText.match(relRegex);
    const relationshipRaw = relMatch ? relMatch[1] : null;
    remainingText = relationshipRaw ? remainingText.replace(relRegex, "") : remainingText;
    
    const relationships = relationshipRaw ? relationshipRaw.split('｜').filter(Boolean) : [];

    const cleanSystemTags = (t: string) => {
      return t.replace(/\[.*? 감정:\s*.*?\]/g, "")
              .replace(/\[BG:\s*.*?\]/g, "")
              .replace(/\[.*?호감도:\s*[+-]?\d+\]/g, "")
              .replace(/\[FEED:\s*.*?\]/g, "")
              .replace(/𝕾𝖈𝖍𝖎𝖈𝖐𝖘𝖆𝖑/g, "")
              .replace(/엔딩까지 턴 수 \d+\/\d+/g, "");
    };

    const stripSpeakerPrefix = (t: string) => {
      return t.split('\n').map(line => line.replace(/^(?:\[.*?\]|.*?[:：])\s*/, "")).join('\n');
    };

    let mainText = cleanSystemTags(remainingText);
    mainText = stripSpeakerPrefix(mainText);

    return { 
      header,
      dialogue: mainText.trim(), 
      scenarioStatuses,
      legacyStatuses,
      relationships
    };
  };

  const { header, dialogue, scenarioStatuses, legacyStatuses, relationships } = parseContent(content);
  const isGuide = role === 'guide';

  const formatDialogue = (text: string) => {
    const parts = text.split(/(\*.*?\*|\(.*?\)|\S+?\s*｜\s*".*?")/g);
    
    return parts.map((part, i) => {
      if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('(') && part.endsWith(')'))) {
        let actionColor = isAi ? 'text-white/40' : 'text-white/60';
        if (theme === 'oreo' || theme === 'taro' || theme === 'mint') actionColor = isAi ? 'text-gray-500' : 'text-black/40';
        return <span key={i} className={`${actionColor} italic font-medium`}>{part}</span>;
      }
      
      const charDialogueMatch = part.match(/^(\S+?)\s*｜\s*"(.*?)"$/);
      if (charDialogueMatch) {
         return (
           <span key={i} className="block my-2" style={{ textIndent: 0 }}>
             <span className="font-black text-primary mr-2 tracking-tight">{charDialogueMatch[1]}</span>
             <span className={isAi ? "" : "text-inherit"}>"{charDialogueMatch[2]}"</span>
           </span>
         );
      }
      return part;
    });
  };

  const getBubbleStyle = () => {
    const isLight = theme === 'oreo' || theme === 'taro' || theme === 'mint';

    if (!isAi) {
      switch (theme) {
        case 'oreo': return 'bg-zinc-100 text-zinc-900 border border-zinc-200';
        case 'taro': return 'bg-[#8E7CC3] text-white shadow-lg';
        case 'mint': return 'bg-[#2D6A4F] text-white shadow-lg';
        case 'orange': return 'bg-[#D67118] text-white shadow-lg';
        case 'red': return 'bg-[#A4161A] text-white shadow-lg';
        default: return 'bg-primary text-white shadow-lg';
      }
    }
    
    switch (theme) {
      case 'oreo': return 'bg-white text-zinc-900 border border-zinc-200';
      case 'taro': return 'bg-[#C8B6FF]/90 text-zinc-900 shadow-[0_4px_20px_rgba(200,182,255,0.3)] border border-white/20';
      case 'mint': return 'bg-[#94D2BD]/90 text-zinc-900 shadow-[0_4px_20px_rgba(148,210,189,0.3)] border border-white/20';
      case 'orange': return 'bg-[#FF9F1C]/90 text-white shadow-[0_4px_20px_rgba(255,159,28,0.3)] border border-white/20';
      case 'red': return 'bg-[#E63946]/90 text-white shadow-[0_4px_20px_rgba(230,57,70,0.3)] border border-white/20';
      default: return 'bg-zinc-900/40 backdrop-blur-xl border border-white/5 text-gray-100';
    }
  };

  return (
    <div className={`flex w-full mb-8 gap-4 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
      {(isAi || showProfile) && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-zinc-900">
            <img src={speaker.avatar} className="w-full h-full object-cover" alt="" />
          </div>
        </div>
      )}

      <div className={`flex flex-col max-w-[85%] ${isAi ? 'items-start' : 'items-end'}`}>
        {header && (
          <div className="mb-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] text-gray-400 font-bold flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
             {header}
          </div>
        )}

        <div className={`rounded-3xl p-6 shadow-2xl transition-all duration-300 ${getBubbleStyle()} ${isAi ? 'rounded-tl-none' : 'rounded-tr-none'}`}>
          {imageUrl && (
            <img src={imageUrl} alt="Scene" className="w-full rounded-2xl mb-4 border border-white/10" />
          )}
          
          <div className="space-y-4">
            <div className={`leading-relaxed whitespace-pre-wrap font-medium tracking-tight text-[15px] ${isGuide ? 'italic opacity-60' : ''}`}>
              {formatDialogue(dialogue)}
            </div>

            {/* AI Status Windows (Hybrid) */}
            {isAi && settings?.showStatus && (scenarioStatuses.length > 0 || legacyStatuses.length > 0 || relationships.length > 0) && (
              <div className={`mt-6 pt-6 border-t ${theme === 'oreo' || theme === 'taro' || theme === 'mint' ? 'border-black/5' : 'border-white/5'} space-y-4`}>
                
                {/* 1. Scenario Style Statuses */}
                {scenarioStatuses.length > 0 && (
                  <div className="grid grid-cols-1 gap-2">
                    {scenarioStatuses.map((s, idx) => (
                      <div key={idx} className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${theme === 'oreo' || theme === 'taro' || theme === 'mint' ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'}`}>
                         <span className="text-[11px] font-black text-primary border-r border-black/10 pr-3 min-w-[60px]">{s.name}</span>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold flex items-center gap-1.5">
                              <Zap className="w-3 h-3 text-yellow-500" /> {s.mood}
                            </span>
                            <span className="text-[11px] opacity-60 font-medium italic translate-y-[-1px]">{s.action}</span>
                         </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Legacy Style Statuses */}
                {legacyStatuses.length > 0 && (
                  <div className="space-y-4">
                    <button 
                      onClick={() => setIsStatusOpen(!isStatusOpen)}
                      className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${theme === 'oreo' || theme === 'taro' || theme === 'mint' ? 'text-black/40 hover:text-primary' : 'text-white/40 hover:text-primary'} transition-colors ml-1`}
                    >
                      <span>캐릭터 상태창</span>
                      {isStatusOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isStatusOpen && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Favorability Bar */}
                        {favorability !== undefined && !isStory && (
                          <div className={`rounded-2xl border p-4 ${theme === 'oreo' || theme === 'taro' || theme === 'mint' ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'}`}>
                            <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center gap-2">
                                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Favorability</span>
                               </div>
                               <span className="text-[10px] font-bold text-rose-400">{favorability}%</span>
                            </div>
                            <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme === 'oreo' || theme === 'taro' || theme === 'mint' ? 'bg-black/10' : 'bg-white/10'}`}>
                               <div className="h-full bg-rose-400 transition-all duration-1000" style={{ width: `${favorability}%` }} />
                            </div>
                          </div>
                        )}

                        {legacyStatuses.map((block, idx) => (
                          <div key={idx} className={`rounded-2xl border p-4 ${theme === 'oreo' || theme === 'taro' || theme === 'mint' ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'}`}>
                            <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Zap className="w-3 h-3" /> {block.title}
                            </h5>
                            <div className="space-y-1.5">
                              {block.content.split('\n').filter(l => l.trim()).map((line, lidx) => (
                                <div key={lidx} className="text-[12px] opacity-80 flex items-start gap-2">
                                   <span className="opacity-40 font-bold">•</span>
                                   <span>{line.replace(/^[*-]\s*/, '')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Relationships */}
                {relationships.length > 0 && (
                  <div className={`px-4 py-3 rounded-2xl border ${theme === 'oreo' || theme === 'taro' || theme === 'mint' ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex items-center gap-2 mb-2">
                       <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                       <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">Relationships</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {relationships.map((rel, idx) => (
                         <div key={idx} className="bg-black/20 px-3 py-1 rounded-full border border-white/5 text-[11px] font-bold opacity-80">
                           {rel}
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-[9px] mt-2 opacity-30 text-gray-500 px-2 font-bold tracking-widest">
          {timestamp}
        </div>
      </div>
    </div>
  );
};

export default Message;
