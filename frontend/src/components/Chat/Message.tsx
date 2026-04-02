import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User, Sparkles, Clock, Heart, Zap } from 'lucide-react';
import LoreTooltip from './LoreTooltip';

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
  storyAvatar?: string;
  lorebook?: any[];
  onAvatarClick?: (char: any) => void;
}

const LoreSpan: React.FC<{ name: string; content: string; children: React.ReactNode }> = ({ name, content, children }) => {
  const [show, setShow] = useState(false);
  return (
    <span 
      className="relative cursor-help border-b border-primary/40 text-primary transition-colors hover:bg-primary/5"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <LoreTooltip name={name} content={content} show={show} />
    </span>
  );
};

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
  storyAvatar,
  lorebook = [],
  onAvatarClick 
}) => {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const theme = settings?.theme || 'basic';
  const showProfile = settings?.showProfile ?? true;

  // 화자 식별 및 내용 정리
  const getSpeakerInfo = () => {
    if (!isAi) return { name: userProfile?.name || '나', avatar: userProfile?.avatar_url || '/avatar.png', char: null };
    
    // 시나리오 모드일 경우 세계관 전용 아바타(나레이션) 우선 사용 및 화자 고정
    if (isStory) {
      return { 
        name: 'Scenario', 
        avatar: storyAvatar || '/avatar.png', 
        char: null 
      };
    }

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
    const legacyStatusRegex = /\[(.*?)\s*상태창\]([\s\S]*?)(?=\[|$)/g;
    const legacyStatuses: { title: string; content: string }[] = [];
    
    const legacyMatches = Array.from(remainingText.matchAll(legacyStatusRegex));
    for (const match of legacyMatches) {
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
    
    // 5. Scenario Summary Parsing [☀︎:0]｜[★:0], [상태: ...], bullets, turn count
    const scenarioSummaryRegex = /\[[☀︎★❤⚡️].*?\](?:｜\[.*?\])*|\[상태:\s*.*?\]|^- .*|엔딩까지 턴 수 \d+\/\d+/gm;
    const summaryLines: string[] = [];
    let scenarioSummaryRaw = "";
    
    let summaryMatch;
    while ((summaryMatch = scenarioSummaryRegex.exec(remainingText)) !== null) {
      summaryLines.push(summaryMatch[0]);
      remainingText = remainingText.replace(summaryMatch[0], "");
    }
    
    const scenarioSummary = {
      stats: summaryLines.filter(l => l.startsWith('[') && !l.includes('상태:')),
      status: summaryLines.find(l => l.includes('[상태:')),
      bullets: summaryLines.filter(l => l.startsWith('- ')),
      turnCount: summaryLines.find(l => l.includes('엔딩까지 턴 수'))
    };

    const cleanSystemTags = (t: string) => {
      return t.replace(/\[.*? 감정:\s*.*?\]/g, "")
              .replace(/\[BG:\s*.*?\]/g, "")
              .replace(/\[.*?호감도:\s*[+-]?\d+\]/g, "")
              .replace(/\[FEED:\s*.*?\]/g, "")
              .replace(/𝕾𝖈𝖍𝖎𝖈𝖐𝖘𝖆𝖑/g, "")
              .replace(/\[[☀︎★❤⚡️].*?\](?:｜\[.*?\])*/g, "")
              .replace(/\[상태:\s*.*?\]/g, "")
              .replace(/^- .*/gm, "")
              .replace(/^-{3,}/gm, "") // 구분선(---, ---- 등) 제거
              .replace(/엔딩까지 턴 수 \d+\/\d+/g, "")
              // 본문 하단에 남은 잔여 키워드들 (기분, 장소, 소괄호 속마음 등) 제거
              .replace(/^(?:neutral|없음|보통|공격적|호의적|호기심|평온|긴장|분노|슬픔|기쁨)\s*$/gm, "")
              .replace(/^\(.*?(\.|\?|!)\)\s*$/gm, ""); // (속마음.) 형태 제거
    };

    const stripSpeakerPrefix = (t: string) => {
      // 따옴표(")가 바로 뒤에 붙는 이름(대화문)은 삭제하지 않고 보존함
      // [수정] 공백 및 특수 패턴([^\s.?!,｜"()]{1,10}\s*")까지 허용하여 유연한 화자 인식 지원
      return t.split('\n').map(line => {
        if (line.match(/^[^\s.?!,｜"()]{1,10}\s*".*?"/)) return line;
        return line.replace(/^(?:\[.*?\]|.*?[:：])\s*/, "");
      }).join('\n');
    };

    let mainText = cleanSystemTags(remainingText);
    mainText = stripSpeakerPrefix(mainText);

    return { 
      header,
      dialogue: mainText.trim(), 
      scenarioStatuses,
      legacyStatuses,
      relationships,
      scenarioSummary
    };
  };

  const { header, dialogue, scenarioStatuses, legacyStatuses, relationships, scenarioSummary } = parseContent(content);
  const isGuide = role === 'guide';
  const isObservationRole = role === 'observation';
  const isNarrator = speaker.name === 'Scenario' || speaker.name === 'Guide' || speaker.name === '나레이션';
  // 스토리 모드에서는 가이드나 나레이션이더라도 상태창을 보여주어야 함 (관찰 모드 제외)
  const hideStatus = isObservationRole || (!isStory && (isGuide || isNarrator));
  const hideName = isNarrator;

  const applyLore = (text: string) => {
    if (!lorebook.length) return text;
    
    // 키워드를 긴 순서대로 정렬하여 중첩 방지
    let allLore: any[] = [];
    lorebook.forEach(entry => {
      entry.keywords.forEach((kw: string) => {
        allLore.push({ kw, content: entry.content });
      });
    });
    allLore.sort((a, b) => b.kw.length - a.kw.length);

    const keywords = allLore.map(l => l.kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    if (!keywords) return text;

    const regex = new RegExp(`(${keywords})`, 'g');
    const segments = text.split(regex);
    
    return segments.map((seg, idx) => {
      const loreEntry = allLore.find(l => l.kw === seg);
      if (loreEntry) {
        return <LoreSpan key={idx} name={seg} content={loreEntry.content}>{seg}</LoreSpan>;
      }
      return seg;
    });
  };

  const formatDialogue = (text: string) => {
    // 1. 기존 액션/속마음/대사 파싱
    const parts = isStory 
      ? text.split(/(\*.*?\*|\(.*?\)|[^\s.?!,｜"()]{1,10}\s*(?:｜\s*)?".*?")/g)
      : text.split(/(\*.*?\*|\(.*?\)|[^\s.?!,｜"()]{1,10}\s*｜\s*".*?")/g);
    
    return parts.map((part, i) => {
      // 액션/속마음 처리
      if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('(') && part.endsWith(')'))) {
        let actionColor = isAi ? 'text-white/40' : 'text-white/60';
        if (theme === 'oreo' || theme === 'taro' || theme === 'mint') actionColor = isAi ? 'text-gray-500' : 'text-black/40';
        return <span key={i} className={`${actionColor} italic font-medium`}>{part}</span>;
      }
      
      const charDialogueMatch = isStory 
        ? part.match(/^([^\s.?!,｜"()]{1,10})\s*(?:｜\s*)?"(.*?)"$/)
        : part.match(/^([^\s.?!,｜"()]{1,10})\s*｜\s*"(.*?)"$/);

      if (charDialogueMatch) {
         return (
           <span key={i} className="block my-1.5" style={{ textIndent: 0 }}>
             <span className="font-black text-primary mr-1 tracking-tight">{charDialogueMatch[1]}</span>
             <span className={isAi ? "" : "text-inherit"}>"{applyLore(charDialogueMatch[2])}"</span>
           </span>
         );
      }
      return applyLore(part);
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

        {isAi && speaker.name && !header && !hideName && (

          <span className="text-[11px] font-black opacity-40 mb-1.5 ml-1 uppercase tracking-widest">{speaker.name}</span>
        )}

        {!isAi && speaker.name && !header && settings?.showProfile && (
          <span className="text-[11px] font-black opacity-40 mb-1.5 mr-1 uppercase tracking-widest">{speaker.name}</span>
        )}




        <div className={`rounded-3xl p-6 shadow-2xl transition-all duration-300 ${getBubbleStyle()} ${isAi ? 'rounded-tl-none' : 'rounded-tr-none'}`}>
          {imageUrl && (
            <img src={imageUrl} alt="Scene" className="w-full rounded-2xl mb-4 border border-white/10" />
          )}
          
          <div className="space-y-4">
            <div className={`leading-relaxed whitespace-pre-wrap font-medium tracking-tight text-[15px] ${isGuide ? 'italic opacity-60' : ''}`}>
              {formatDialogue(dialogue)}
            </div>

            {/* AI Status Windows (Hybrid) - Hidden in Observation/Guide Mode */}
            {isAi && !hideStatus && (



              <div className={`mt-6 pt-6 border-t ${theme === 'oreo' || theme === 'taro' || theme === 'mint' ? 'border-black/5' : 'border-white/5'} space-y-4`}>
                
                {/* 1. SCENARIO MODE: Always visible Card layout */}
                {isStory && (
                  <>
                    {scenarioStatuses.length > 0 && (
                      <div className="space-y-2">
                        {scenarioStatuses.map((s, idx) => (
                          <div key={idx} className={`flex items-center gap-4 px-6 py-3 rounded-3xl border transition-all ${theme === 'oreo' || theme === 'taro' || theme === 'mint' ? 'bg-black/5 border-black/5' : 'bg-black/20 border-white/5'}`}>
                            <span className={`text-[14px] font-black min-w-[70px] ${
                              s.name === '사용자' ? 'text-[#A29BFE]' : 
                              s.name.includes('아츠무') ? 'text-[#81ECEC]' : 
                              s.name.includes('키타') ? 'text-[#A29BFE]' : 'text-primary'
                            }`}>{s.name === '사용자' ? (userProfile?.name || '나') : s.name}</span>
                            <div className="flex flex-col gap-0 border-l border-white/10 pl-4">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-3 h-3 text-[#A29BFE] fill-[#A29BFE]" />
                                  <span className="text-[12px] font-bold opacity-90">{s.mood}</span>
                                </div>
                                <span className="text-[11px] opacity-50 font-medium italic">{s.action}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Support Legacy Status in Story Mode with Polished UI */}
                    {legacyStatuses.map((block, idx) => (
                      <div key={idx} className={`rounded-3xl border p-6 ${theme === 'oreo' || theme === 'taro' || theme === 'mint' ? 'bg-black/5 border-black/5' : 'bg-black/30 border-white/5 shadow-inner'}`}>
                        <h5 className="text-[12px] font-black text-[#A29BFE] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-[#A29BFE] rounded-full animate-pulse" />
                           {block.title}
                        </h5>
                        <div className="space-y-3">
                          {block.content.split('\n').filter(l => l.trim()).map((line, lidx) => {
                            const [label, ...valParts] = line.includes(':') ? line.split(':') : ['', line];
                            const value = valParts.join(':').trim();
                            
                            return (
                              <div key={lidx} className="flex items-baseline gap-3 text-[13px]">
                                {label && <span className="text-[10px] font-black opacity-30 uppercase min-w-[60px] text-right">{label.replace(/^[*-]\s*/, '').trim()}</span>}
                                <span className={`leading-relaxed ${label ? 'opacity-90 font-bold' : 'opacity-80 italic'}`}>
                                  {value.replace(/^[*-]\s*/, '')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {relationships.length > 0 && (
                      <div className={`px-6 py-4 rounded-3xl border ${theme === 'oreo' || theme === 'taro' || theme === 'mint' ? 'bg-black/5 border-black/5' : 'bg-black/20 border-white/5'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Heart className="w-3.5 h-4 text-rose-500 fill-rose-500" />
                          <span className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">Relationships</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {relationships.map((rel, idx) => (
                            <div key={idx} className="bg-white/5 px-4 py-1.5 rounded-full border border-white/5 text-[11px] font-bold opacity-80 backdrop-blur-md">
                              {rel}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* 2. CHARACTER MODE: Toggleable Legacy layout */}
                {!isStory && settings?.showStatus && (
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
                        {/* Status Cards in Character Mode (if available) */}
                        {scenarioStatuses.length > 0 && (
                          <div className="space-y-2">
                             {scenarioStatuses.map((s, idx) => (
                               <div key={idx} className={`flex items-center gap-4 px-4 py-2.5 rounded-2xl border transition-all ${theme === 'oreo' ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'}`}>
                                  <span className={`text-[12px] font-black min-w-[60px] ${
                                    s.name === '사용자' ? 'text-[#A29BFE]' : 
                                    s.name.includes('아츠무') ? 'text-[#81ECEC]' : 
                                    s.name.includes('키타') ? 'text-[#A29BFE]' : 'text-primary'
                                  }`}>{s.name === '사용자' ? (userProfile?.name || '나') : s.name}</span>
                                  <div className="flex flex-col gap-0 border-l border-white/10 pl-3">
                                      <div className="flex items-center gap-2">
                                        <Zap className="w-3 h-3 text-[#A29BFE] fill-[#A29BFE]" />
                                        <span className="text-[11px] font-bold opacity-90">{s.mood}</span>
                                      </div>
                                      <span className="text-[10px] opacity-50 font-medium italic">{s.action}</span>
                                  </div>
                               </div>
                             ))}
                          </div>
                        )}

                        {/* Favorability Bar */}
                        {favorability !== undefined && (
                          <div className={`rounded-2xl border p-4 ${theme === 'oreo' || theme === 'taro' || theme === 'mint' ? 'bg-black/5 border-black/5' : 'bg-black/20 border-white/5'}`}>

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

                        {legacyStatuses.map((block, idx) => {
                          const lines = block.content.split('\n').filter(l => l.trim()).map(l => l.replace(/^[*-]\s*/, ''));
                          
                          // 레이블 보충 및 분류
                          const defaultLabels = ["장소", "상황", "기분", "포즈", "속마음"];
                          const processedLines = lines.map((line, lidx) => {
                            if (line.includes(':')) return line;
                            const label = defaultLabels[lidx] || "기타";
                            return `${label}: ${line}`;
                          });

                          const bgLines = processedLines.filter(line => line.startsWith('장소:') || line.startsWith('상황:'));
                          const otherLines = processedLines.filter(line => !line.startsWith('장소:') && !line.startsWith('상황:'));

                          return (
                            <div key={idx} className="space-y-4">
                              {/* 1. 배경 상태창 (장소, 상황) - 이미지 1 스타일 */}
                              {bgLines.length > 0 && (
                                <div className={`rounded-2xl border p-4 ${theme === 'oreo' || theme === 'taro' || theme === 'mint' ? 'bg-black/5 border-black/5' : 'bg-black/20 border-white/5'}`}>
                                  <h5 className="text-[10px] font-black text-[#A29BFE] uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 fill-[#A29BFE] text-[#A29BFE]" /> 배경 상태창
                                  </h5>
                                  <div className="space-y-1.5">
                                    {bgLines.map((line, lidx) => (
                                      <div key={lidx} className="text-[12px] opacity-80 flex items-start gap-2">
                                        <span className="opacity-40 font-bold">•</span>
                                        <span>{line}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 2. 기타 상태 (기분, 포즈, 속마음 등) - 불렛 리스트 */}
                              {otherLines.length > 0 && (
                                <div className="space-y-1.5 px-1 pb-2">
                                  {otherLines.map((line, lidx) => (
                                    <div key={lidx} className="text-[12px] opacity-80 flex items-start gap-2">
                                      <span className="opacity-40 font-bold">•</span>
                                      <span>{line}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                      </div>
                    )}

                    {/* Relationships in Character Mode */}
                    {relationships.length > 0 && (
                      <div className={`mt-2 px-4 py-3 rounded-2xl border ${theme === 'oreo' || theme === 'taro' || theme === 'mint' ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center gap-2 mb-2">
                           <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                           <span className="text-[10px] font-black opacity-60 uppercase tracking-widest text-[#A29BFE]">Relationships</span>
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
            )}

            {/* 4. Scenario Summary Block (New Aesthetic) - Only for Character Mode if needed, but Story Mode uses Cards */}
            {isAi && !isStory && (scenarioSummary.stats.length > 0 || scenarioSummary.status || scenarioSummary.bullets.length > 0 || scenarioSummary.turnCount) && (
              <div className={`mt-6 pt-6 border-t ${theme === 'oreo' || theme === 'taro' || theme === 'mint' ? 'border-black/5' : 'border-white/5'} space-y-3`}>
                {(scenarioSummary.stats.length > 0 || scenarioSummary.status) && (
                  <div className="flex flex-col gap-1">
                    {scenarioSummary.stats.length > 0 && (
                      <div className="text-[12px] font-bold opacity-80 flex items-center gap-2">
                        {scenarioSummary.stats.join('｜')}
                      </div>
                    )}
                    {scenarioSummary.status && (
                      <div className="text-[11px] font-black text-primary uppercase tracking-tighter">
                        {scenarioSummary.status}
                      </div>
                    )}
                  </div>
                )}
                
                {scenarioSummary.bullets.length > 0 && (
                  <div className="space-y-1">
                    {scenarioSummary.bullets.map((bullet, idx) => (
                      <div key={idx} className="text-[12px] opacity-70 flex items-start gap-2 leading-tight">
                        <span className="opacity-40 font-bold mt-[2px]">•</span>
                        <span>{bullet.replace(/^- \s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {scenarioSummary.turnCount && (
                  <div className="text-[10px] font-black opacity-40 uppercase tracking-widest pt-2">
                    {scenarioSummary.turnCount}
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
