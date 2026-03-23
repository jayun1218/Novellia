'use client';

import React, { useState, useEffect, use } from 'react';
import ChatHeader from '@/components/Chat/ChatHeader';
import Message from '@/components/Chat/Message';
import ChatInput from '@/components/Chat/ChatInput';

const popularCharacters: Record<string, any> = {
  'sn1': { name: '서연호', avatarUrl: '/seoyeonho.png', greeting: '도전장을 내밀다니, 제법이네? 내 관심을 끈 대가는 꽤 비쌀 텐데.' },
  'bk2': { name: '강백현', avatarUrl: '/baekhyun.png', greeting: '어이, 거기. 나랑 눈 마주쳤으면 그냥은 못 가지. 한판 붙을래, 아니면 나랑 놀래?' },
  'yj3': { name: '윤제이', avatarUrl: '/yunjay.png', greeting: '회의 중에 실례군요. 용건이 30초 내로 설명 가능한 수준이길 바랍니다.' },
};

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [character, setCharacter] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const loadCharacter = async () => {
      if (id.startsWith('my-')) {
        const index = parseInt(id.replace('my-', ''));
        try {
          const response = await fetch(`http://localhost:8000/characters/${index}`);
          if (response.ok) {
            const data = await response.json();
            const charData = {
              name: data.name,
              avatarUrl: data.avatar_url || '/avatar.png',
              greeting: data.greeting || '안녕하세요, 만나서 반가워요!'
            };
            setCharacter(charData);
            setMessages([{
              id: 1,
              content: charData.greeting,
              isAi: true,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
          }
        } catch (error) {
          console.error('Failed to load character:', error);
        }
      } else if (popularCharacters[id]) {
        const charData = popularCharacters[id];
        setCharacter(charData);
        setMessages([{
          id: 1,
          content: charData.greeting,
          isAi: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    };
    loadCharacter();
  }, [id]);

  const handleSend = async (text: string) => {
    const newMessage = {
      id: messages.length + 1,
      content: text,
      isAi: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
    
    try {
      const index = id.startsWith('my-') ? parseInt(id.replace('my-', '')) : -1;
      const charId = id.startsWith('my-') ? null : id;
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, index: index, char_id: charId }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = {
          id: messages.length + 2,
          content: data.reply || "*묵묵부답입니다.*",
          isAi: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      alert('대화 중 오류가 발생했습니다.');
    }
  };

  if (!character) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <ChatHeader 
        name={character.name} 
        status="당신과 함께 이야기를 만들어가는 중" 
        avatarUrl={character.avatarUrl} 
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
