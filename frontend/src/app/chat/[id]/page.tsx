'use client';

import React, { useState, useEffect, use } from 'react';
import ChatHeader from '@/components/Chat/ChatHeader';
import Message from '@/components/Chat/Message';
import ChatInput from '@/components/Chat/ChatInput';
import CharacterProfileModal from '@/components/Chat/CharacterProfileModal';

const popularCharacters: Record<string, any> = {
  'ma4': { 
    name: '미야 아츠무', 
    avatarUrl: 'http://127.0.0.1:8000/uploads/atsumu.png', 
    coverUrl: 'http://127.0.0.1:8000/uploads/atsumu.png',
    description: '이나리자키 고교 배구부의 천재 세터. 고교 No.1 세터로 불리며 승부욕이 매우 강합니다.',
    greeting: '(코트 위에 서서 배구공을 굴리며 당신을 빤히 바라본다) "어이, 니. 내 토스 함 쳐볼래? 아무한테나 주는 거 아인디."' 
  },
};

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [character, setCharacter] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number>(0);
  const [favorability, setFavorability] = useState(0);
  const [settings, setSettings] = useState({
    theme: 'basic',
    showProfile: true,
    autoBg: false,
    haptic: true
  });

  useEffect(() => {
    const fetchUserProfiles = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/user-profiles');
        if (response.ok) {
          const data = await response.json();
          setUserProfiles(data);
        }
      } catch (error) {
        console.error('Failed to fetch user profiles:', error);
      }
    };
    fetchUserProfiles();

    const fetchChatHistoryAndChar = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/chats/${id}`);
        if (response.ok) {
          const data = await response.json();
          let history = [];
          let fav = 0;

          if (data && data.messages) {
            history = data.messages;
            fav = data.favorability || 0;
          } else if (Array.isArray(data)) {
            history = data;
          }

          if (history.length > 0) {
            setMessages(history);
            setFavorability(fav);
            
            // Load character info
            if (id.startsWith('my-')) {
              const charIdx = parseInt(id.replace('my-', ''));
              const charRes = await fetch(`http://127.0.0.1:8000/characters/${charIdx}`);
              if (charRes.ok) {
                const charData = await charRes.json();
                setCharacter({ 
                  name: charData.name, 
                  avatarUrl: charData.avatar_url || '/avatar.png',
                  coverUrl: charData.cover_url || charData.avatar_url || '/avatar.png',
                  description: charData.description
                });
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

      // If no history, load character and set greeting
      const loadCharacter = async () => {
        if (id.startsWith('my-')) {
          const index = parseInt(id.replace('my-', ''));
          try {
            const response = await fetch(`http://127.0.0.1:8000/characters/${index}`);
            if (response.ok) {
              const data = await response.json();
              const charData = {
                name: data.name,
                avatarUrl: data.avatar_url || '/avatar.png',
                coverUrl: data.cover_url || data.avatar_url || '/avatar.png',
                description: data.description,
                greeting: data.greeting || '안녕하세요, 만나서 반가워요!'
              };
              setCharacter(charData);
              const firstMsg = {
                id: Date.now(),
                content: charData.greeting,
                isAi: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              setMessages([firstMsg]);
            }
          } catch (error) {
            console.error('Failed to load character:', error);
          }
        } else if (popularCharacters[id]) {
          const charData = popularCharacters[id];
          setCharacter(charData);
          setMessages([{
            id: Date.now(),
            content: charData.greeting,
            isAi: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      };
      loadCharacter();
    };

    fetchChatHistoryAndChar();
  }, [id]);

  useEffect(() => {
    if (messages.length > 0) {
      const saveHistory = async () => {
        try {
          await fetch(`http://127.0.0.1:8000/chats/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, favorability }),
          });
        } catch (error) {
          console.error('Failed to save chat history:', error);
        }
      };
      saveHistory();
    }
  }, [messages, id, favorability]);

  const handleSend = async (text: string) => {
    const newMessage = {
      id: Date.now(),
      content: text,
      isAi: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    try {
      const index = id.startsWith('my-') ? parseInt(id.replace('my-', '')) : -1;
      const charId = id.startsWith('my-') ? null : id;
      
      const history = updatedMessages.slice(-10).map(m => ({
        role: m.isAi ? 'assistant' : 'user',
        content: m.content
      }));

      const response = await fetch('http://127.0.0.1:8000/chat', {
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
        if (data.favorability !== undefined) {
          setFavorability(data.favorability);
        }
        const aiResponse = {
          id: Date.now() + 1,
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

  const handleResetChat = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/chats/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setMessages([{
          id: Date.now(),
          content: character.greeting || '안녕하세요, 만나서 반가워요!',
          isAi: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setFavorability(0);
      }
    } catch (error) {
      console.error('Failed to reset chat:', error);
      alert('초기화 중 오류가 발생했습니다.');
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
        onResetChat={handleResetChat}
        onAvatarClick={() => setIsProfileModalOpen(true)}
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
              aiName={character.name}
              favorability={msg.isAi && index === messages.length - 1 ? favorability : undefined}
              onAvatarClick={() => setIsProfileModalOpen(true)}
            />
          ))}
        </div>
      </div>

      <ChatInput onSend={handleSend} />

      {character && (
        <CharacterProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
          character={character} 
        />
      )}
    </main>
  );
}
