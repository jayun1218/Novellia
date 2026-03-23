import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MessageProps {
  content: string;
  isAi: boolean;
  timestamp: string;
}

const Message: React.FC<MessageProps> = ({ content, isAi, timestamp }) => {
  const [isStatusOpen, setIsStatusOpen] = useState(false);

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
    const parts = text.split(/(\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <span key={i} className="text-primary italic opacity-90">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className={`flex flex-col w-full mb-6 ${isAi ? 'items-start' : 'items-end'}`}>
      <div className={`max-w-[85%] px-5 py-3 rounded-3xl shadow-sm ${
        isAi 
          ? 'bg-surface text-gray-100 rounded-tl-none border border-white/10' 
          : 'bg-primary text-white rounded-tr-none'
      }`}>
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
          {formatDialogue(dialogue)}
        </p>

        {isAi && statusBlocks.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <button 
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-primary transition-colors"
            >
              {isStatusOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              상태창 {isStatusOpen ? '접기' : '열기'}
            </button>
            
            {isStatusOpen && (
              <div className="mt-3 space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                {statusBlocks.map((block, idx) => (
                  <div key={idx} className="space-y-2">
                    <h5 className="text-[11px] font-black text-white/40 uppercase tracking-tighter">{block.title}</h5>
                    <div className="space-y-1.5 pl-1">
                      {block.content.split('\n').filter(line => line.trim()).map((line, lidx) => (
                        <div key={lidx} className="text-[13px] text-gray-300 flex items-start gap-2">
                          <span className="opacity-80">{line.replace(/^- /, '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={`text-[10px] mt-2 opacity-50 ${isAi ? 'text-gray-500' : 'text-white/60 text-right'}`}>
          {timestamp}
        </div>
      </div>
    </div>
  );
};

export default Message;
