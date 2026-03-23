'use client';

import React, { useState, useEffect, use } from 'react';
import ChatHeader from '@/components/Chat/ChatHeader';
import Message from '@/components/Chat/Message';
import ChatInput from '@/components/Chat/ChatInput';
import CharacterProfileModal from '@/components/Chat/CharacterProfileModal';
import QuestWidget from '@/components/Chat/QuestWidget';

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
  const [activeCharacters, setActiveCharacters] = useState<any[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number>(0);
  const [favorability, setFavorability] = useState(0);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
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

    const fetchInitialData = async () => {
      try {
        let firstChar: any = null;
        if (id.startsWith('my-')) {
          const charIdx = parseInt(id.replace('my-', ''));
          const charRes = await fetch(`http://127.0.0.1:8000/characters/${charIdx}`);
          if (charRes.ok) {
            const data = await charRes.json();
            firstChar = { id, ...data, avatarUrl: data.avatar_url || '/avatar.png' };
          }
        } else if (popularCharacters[id]) {
          firstChar = { id, ...popularCharacters[id] };
        }

        if (firstChar) {
          setActiveCharacters([firstChar]);
          setSelectedCharacter(firstChar);
        }

        const response = await fetch(`http://127.0.0.1:8000/chats/${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.messages) {
            setMessages(data.messages);
            setFavorability(data.favorability || 0);
          } else if (firstChar) {
            setMessages([{
              id: Date.now(),
              content: firstChar.greeting || '안녕하세요!',
              isAi: true,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };

    fetchInitialData();
  }, [id]);

  useEffect(() => {
    if (messages.length > 0) {
      const charId = activeCharacters[0]?.id || id;
      fetch(`http://127.0.0.1:8000/chats/${charId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, favorability }),
      }).catch(err => console.error('Save error:', err));
    }
  }, [messages, favorability, activeCharacters, id]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      content: text,
      isAi: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          char_ids: activeCharacters.map(c => c.id),
          chat_history: messages.map(m => ({ role: m.isAi ? 'assistant' : 'user', content: m.content })),
          user_profile_index: selectedProfileIndex
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMsg = {
          id: Date.now() + 1,
          content: data.reply,
          isAi: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        setFavorability(data.favorability);
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  const inviteCharacter = async (charId: string) => {
    if (activeCharacters.find(c => c.id === charId)) return;
    
    try {
      let newChar: any = null;
      if (charId.startsWith('my-')) {
        const idx = parseInt(charId.replace('my-', ''));
        const res = await fetch(`http://127.0.0.1:8000/characters/${idx}`);
        if (res.ok) {
          const data = await res.json();
          newChar = { id: charId, ...data, avatarUrl: data.avatar_url || '/avatar.png' };
        }
      } else if (popularCharacters[charId]) {
        newChar = { id: charId, ...popularCharacters[charId] };
      }

      if (newChar) {
        setActiveCharacters(prev => [...prev, newChar]);
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: `*${newChar.name}님이 대화에 참여했습니다.*`,
          isAi: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (error) {
      console.error('Invite error:', error);
    }
  };

  const handleGenerateScene = async (prompt: string) => {
    if (isGeneratingImage || activeCharacters.length === 0) return;
    setIsGeneratingImage(true);
    try {
      const scenePrompt = prompt || messages.slice(-2).map(m => m.content).join(' ');
      const response = await fetch('http://127.0.0.1:8000/generate-scene-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: scenePrompt, char_id: activeCharacters[0].id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            content: `*${activeCharacters.map(c => c.name).join(', ')}와(과) 함께하는 이 순간을 기록했습니다.*`,
            isAi: true,
            imageUrl: data.url,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      }
    } catch (error) {
      console.error('Scene generation error:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleResetChat = async () => {
    const charId = activeCharacters[0]?.id || id;
    try {
      await fetch(`http://127.0.0.1:8000/chats/${charId}`, { method: 'DELETE' });
      setMessages([{
        id: Date.now(),
        content: activeCharacters[0]?.greeting || '안녕하세요!',
        isAi: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setFavorability(0);
    } catch (error) {
      console.error('Reset error:', error);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col pt-16">
      <ChatHeader 
        activeCharacters={activeCharacters} 
        onInvite={inviteCharacter}
        userProfiles={userProfiles}
        selectedProfileIndex={selectedProfileIndex}
        onProfileSelect={(index) => setSelectedProfileIndex(index)}
        settings={settings}
        onSettingsChange={setSettings}
        onResetChat={handleResetChat}
        onAvatarClick={(char: any) => {
          setSelectedCharacter(char);
          setIsProfileModalOpen(true);
        }}
      />
      
      <div className="flex-1 overflow-y-auto pb-32 px-4 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-2 pt-4">
          {messages.map((msg, index) => (
            <Message 
              key={msg.id || index} 
              content={msg.content} 
              isAi={msg.isAi} 
              imageUrl={msg.imageUrl}
              timestamp={msg.timestamp} 
              settings={settings}
              userProfile={userProfiles[selectedProfileIndex]}
              activeCharacters={activeCharacters}
              favorability={msg.isAi && index === messages.length - 1 ? favorability : undefined}
              onAvatarClick={(char: any) => {
                setSelectedCharacter(char);
                setIsProfileModalOpen(true);
              }}
            />
          ))}
        </div>
      </div>

      <ChatInput 
        onSend={handleSend} 
        onGenerateScene={handleGenerateScene}
        isGeneratingImage={isGeneratingImage}
      />

      {selectedCharacter && (
        <CharacterProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
          character={selectedCharacter} 
        />
      )}

      {/* Quest System Widget */}
      <QuestWidget 
        favorability={favorability} 
        messageCount={messages.length} 
        characterCount={activeCharacters.length} 
      />
    </main>
  );
}
