import React, { useState } from 'react';
import { Send, Plus, Smile } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <div className="fixed bottom-0 w-full glass px-4 py-4 pb-8">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
        <button type="button" className="p-2 text-gray-400 hover:text-white transition-colors">
          <Plus className="w-6 h-6" />
        </button>
        <div className="relative flex-1">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="메시지를 입력하거나 *행동*을 묘사해보세요"
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 px-5 pr-12 focus:outline-none focus:border-primary/50 transition-all text-[15px]"
          />
          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <Smile className="w-5 h-5" />
          </button>
        </div>
        <button
          type="submit"
          disabled={!text.trim()}
          className={`p-2.5 rounded-full transition-all ${
            text.trim() ? 'bg-primary text-white scale-100' : 'bg-gray-800 text-gray-500 scale-90'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
