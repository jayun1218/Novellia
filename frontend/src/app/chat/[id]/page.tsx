'use client';

import React, { useState, use } from 'react';
import ChatHeader from '@/components/Chat/ChatHeader';
import Message from '@/components/Chat/Message';
import ChatInput from '@/components/Chat/ChatInput';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  // 실제 서비스라면 id를 기반으로 캐릭터 정보를 가져와야 함
  const characterName = id === '1' ? "엘리나" : "미스테리 AI";

  const [messages, setMessages] = useState([
    {
      id: 1,
      content: `*당신이 카페에 들어서자, 창가 자리에 앉아 있던 ${characterName}가 고개를 들어 미소 짓습니다.* 어서 와요, 기다리고 있었어요.`,
      isAi: true,
      timestamp: "오후 2:30"
    },
    {
      id: 2,
      content: "많이 기다렸어? 오는 길에 차가 좀 막혔네.",
      isAi: false,
      timestamp: "오후 2:31"
    }
  ]);

  const handleSend = (text: string) => {
    const newMessage = {
      id: messages.length + 1,
      content: text,
      isAi: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
    
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        content: "*당신의 말을 듣고 잠시 생각에 잠긴 듯 눈을 가늘게 뜹니다.* 그렇군요. 그것 참 흥미로운 제안이네요.",
        isAi: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <ChatHeader 
        name={characterName} 
        status="당신과 함께 이야기를 만들어가는 중" 
        avatarUrl="/avatar.png" 
      />
      
      <div className="flex-1 overflow-y-auto pt-20 pb-28 px-4 max-w-4xl mx-auto w-full">
        {messages.map((msg) => (
          <Message 
            key={msg.id} 
            content={msg.content} 
            isAi={msg.isAi} 
            timestamp={msg.timestamp} 
          />
        ))}
      </div>

      <ChatInput onSend={handleSend} />
    </main>
  );
}
