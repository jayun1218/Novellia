import React from 'react';

interface MessageProps {
  content: string;
  isAi: boolean;
  timestamp: string;
}

const Message: React.FC<MessageProps> = ({ content, isAi, timestamp }) => {
  // 지시문 (*행동*) 처리 로직
  const formatContent = (text: string) => {
    const parts = text.split(/(\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <span key={i} className="directive">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className={`flex w-full mb-4 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
        isAi 
          ? 'bg-surface text-gray-100 rounded-tl-none border border-white/5' 
          : 'bg-primary text-white rounded-tr-none'
      }`}>
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
          {formatContent(content)}
        </p>
        <div className={`text-[10px] mt-1 ${isAi ? 'text-gray-500' : 'text-primary-foreground/60'}`}>
          {timestamp}
        </div>
      </div>
    </div>
  );
};

export default Message;
