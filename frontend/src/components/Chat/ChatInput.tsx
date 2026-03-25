import React, { useState } from 'react';
import { Send, Wand2, RefreshCw, Eye, Smile } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onGenerateScene: (prompt: string) => void;
  onObserve: () => void;
  isGeneratingImage?: boolean;
  theme?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  onGenerateScene, 
  onObserve, 
  isGeneratingImage,
  theme = 'basic'
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  const getThemeColor = () => {
    switch (theme) {
      case 'oreo': return 'text-zinc-900 hover:bg-zinc-100';
      case 'taro': return 'text-[#8E7CC3] hover:bg-[#8E7CC3]/10';
      case 'mint': return 'text-[#2D6A4F] hover:bg-[#2D6A4F]/10';
      case 'orange': return 'text-[#FF9F1C] hover:bg-[#FF9F1C]/10';
      case 'red': return 'text-[#E63946] hover:bg-[#E63946]/10';
      default: return 'text-primary hover:bg-primary/10';
    }
  };

  const getSendBtnBg = () => {
    if (!text.trim()) return 'bg-gray-800 text-gray-500 scale-90';
    switch (theme) {
      case 'oreo': return 'bg-zinc-900 text-white scale-100';
      case 'taro': return 'bg-[#8E7CC3] text-white scale-100 shadow-[0_0_15px_rgba(142,124,195,0.4)]';
      case 'mint': return 'bg-[#2D6A4F] text-white scale-100 shadow-[0_0_15px_rgba(45,106,79,0.4)]';
      case 'orange': return 'bg-[#FF9F1C] text-white scale-100 shadow-[0_0_15px_rgba(255,159,28,0.4)]';
      case 'red': return 'bg-[#E63946] text-white scale-100 shadow-[0_0_15px_rgba(230,57,70,0.4)]';
      default: return 'bg-primary text-white scale-100 shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]';
    }
  };

  return (
    <div className="fixed bottom-0 w-full glass px-4 py-4 pb-8 border-t border-white/5">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button 
            type="button" 
            onClick={() => onGenerateScene(text)}
            disabled={isGeneratingImage}
            className={`p-2 rounded-xl transition-all ${isGeneratingImage ? 'bg-primary/20 text-primary' : `text-gray-400 ${getThemeColor()}`}`}
            title="현재 장면 이미지 생성"
          >
            {isGeneratingImage ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
          </button>
          
          <button 
            type="button" 
            onClick={onObserve}
            disabled={isGeneratingImage}
            className="p-2 rounded-xl transition-all text-gray-400 hover:text-blue-400 hover:bg-blue-400/10"
            title="캐릭터끼리 대화시키기 (관찰 모드)"
          >
            <Eye className="w-6 h-6" />
          </button>
        </div>

        <div className="relative flex-1">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="메시지를 입력하거나 *행동*을 묘사해보세요"
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 px-5 pr-12 focus:outline-none focus:border-white/20 transition-all text-[15px]"
          />
          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
            <Smile className="w-5 h-5" />
          </button>
        </div>
        
        <button
          type="submit"
          disabled={!text.trim()}
          className={`p-2.5 rounded-full transition-all duration-300 ${getSendBtnBg()}`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
