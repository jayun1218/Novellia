'use client';

import React, { useState, useEffect, use } from 'react';
import ChatHeader from '@/components/Chat/ChatHeader';
import Message from '@/components/Chat/Message';
import ChatInput from '@/components/Chat/ChatInput';

const popularCharacters: Record<string, any> = {
  'sn1': { name: '서연호', avatarUrl: '/seoyeonho.png', greeting: '도전장을 내밀다니, 제법이네? 내 관심을 끈 대가는 꽤 비쌀 텐데.' },
  'bk2': { name: '강백현', avatarUrl: '/baekhyun.png', greeting: '어이, 거기. 나랑 눈 마주쳤으면 그냥은 못 가지. 한판 붙을래, 아니면 나랑 놀래?' },
  'yj3': { name: '윤제이', avatarUrl: '/yunjay.png', greeting: '회의 중에 실례군요. 용건이 30초 내로 설명 가능한 수준이길 바랍니다.' },
  'ma4': { name: '미야 아츠무', avatarUrl: 'http://localhost:8000/uploads/atsumu.png', greeting: '(코트 위에 서서 배구공을 굴리며 당신을 빤히 바라본다) "어이, 니. 내 토스 함 쳐볼래? 아무한테나 주는 거 아인디."' },
};

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [character, setCharacter] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number>(0);
  const [settings, setSettings] = useState({
    theme: 'basic',
    showProfile: true,
    autoBg: false,
    haptic: true
  });

  useEffect(() => {
    const fetchUserProfiles = async () => {
      try {
        const response = await fetch('http://localhost:8000/user-profiles');
        if (response.ok) {
          const data = await response.json();
          setUserProfiles(data);
        }
      } catch (error) {
        console.error('Failed to fetch user profiles:', error);
      }
    };
    fetchUserProfiles();

    const fetchChatHistory = async () => {
      try {
        const response = await fetch(`http://localhost:8000/chats/${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setMessages(data);
            // Load character info only
            if (id.startsWith('my-')) {
              const charIdx = parseInt(id.replace('my-', ''));
              const charRes = await fetch(`http://localhost:8000/characters/${charIdx}`);
              if (charRes.ok) {
                const charData = await charRes.json();
                setCharacter({ name: charData.name, avatarUrl: charData.avatar_url || '/avatar.png' });
              }
            } else if (popularCharacters[id]) {
              setCharacter(popularCharacters[id]);
            }
            return;
          }
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }

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
    };

    fetchChatHistory();
  }, [id]);

  useEffect(() => {
    if (messages.length > 0) {
      const saveHistory = async () => {
        try {
          await fetch(`http://localhost:8000/chats/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
          });
        } catch (error) {
          console.error('Failed to save chat history:', error);
        }
      };
      saveHistory();
    }
  }, [messages, id]);

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
      
      const history = messages.slice(-10).map(m => ({
        role: m.isAi ? 'assistant' : 'user',
        content: m.content
      }));

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          index: index, 
          char_id: charId,
          chat_history: history,
          user_profile_index: selectedProfileIndex
        }),
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
    <main className="min-h-screen bg-background text-foreground flex flex-col pt-16">
      <ChatHeader 
        name={character.name} 
        status="당신과 함께 이야기를 만들어가는 중" 
        avatarUrl={character.avatarUrl} 
        userProfiles={userProfiles}
        selectedProfileIndex={selectedProfileIndex}
        onProfileSelect={(index) => setSelectedProfileIndex(index)}
        settings={settings}
        onSettingsChange={setSettings}
      />
      
      <div className="flex-1 overflow-y-auto pb-32 px-4 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-2 pt-4">
          {messages.map((msg, index) => (
            <Message 
              key={msg.id || index} 
              content={msg.content} 
              isAi={msg.isAi} 
              timestamp={msg.timestamp} 
              settings={settings}
              userProfile={userProfiles[selectedProfileIndex]}
              aiAvatarUrl={character.avatarUrl}
            />
          ))}
        </div>
      </div>

      <ChatInput onSend={handleSend} />
    </main>
  );
}
