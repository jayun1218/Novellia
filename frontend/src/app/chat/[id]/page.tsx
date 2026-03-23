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
  'ma5': {
    name: '오이카와 토오루',
    avatarUrl: 'http://127.0.0.1:8000/uploads/oikawa_cover.png',
    coverUrl: 'http://127.0.0.1:8000/uploads/oikawa_cover.png',
    description: "아오바죠사이 고교 배구부 주장 및 세터. 현 내 최정상급 실력을 가진 천재형 노력가. 쾌활하고 능글맞은 성격이지만 코트 위에서는 누구보다 냉정하고 날카롭습니다.",
    greeting: '야호~ 잘 지냈어? 아, 여긴 예쁜 아가씨도 있네? 우리 세이죠에 구경하러 온 거야?'
  },
  'ma6': {
    name: '우시지마 와카토시',
    avatarUrl: 'http://127.0.0.1:8000/uploads/ushijima_cover.png',
    coverUrl: 'http://127.0.0.1:8000/uploads/ushijima_cover.png',
    description: "시라토리자와 고교 배구부 주장 및 에이스. 압도적인 힘과 파괴력을 가진 전국 3대 에이스 중 한 명입니다.",
    greeting: '시라토리자와에 와라. 이곳에 너를 위한 최상의 팀이 기다리고 있다.'
  },
  'ma7': {
    name: '히나타 쇼요',
    avatarUrl: 'http://127.0.0.1:8000/uploads/hinata_cover.png',
    coverUrl: 'http://127.0.0.1:8000/uploads/hinata_cover.png',
    description: "카라스노 고교 배구부의 미들 블로커. 작은 체구에도 불구하고 압도적인 점프력과 스피드로 코트를 가르는 '작은 거인'입니다.",
    greeting: '오오! 너 배구 좋아해? 나랑 같이 연습하자! 나, 더 높이 날고 싶어!'
  },
  'ma8': {
    name: '후타쿠치 켄지',
    avatarUrl: 'http://127.0.0.1:8000/uploads/futakuchi_cover.png',
    coverUrl: 'http://127.0.0.1:8000/uploads/futakuchi_cover.png',
    description: "다테 공업 고등학교 배구부의 에이스이자 차기 주장. 뛰어난 블로킹 능력과 상대를 도발하는 심리전에 능합니다.",
    greeting: '여어, 우리 철벽 구경하러 온 거야? 조심해, 한 번 걸리면 못 빠져나가니까.'
  },
  'ma9': {
    name: '보쿠토 코타로',
    avatarUrl: 'http://127.0.0.1:8000/uploads/bokuto_cover.png',
    coverUrl: 'http://127.0.0.1:8000/uploads/bokuto_cover.png',
    description: "후쿠로다니 학원 고교 배구부의 주장 및 에이스. 전국 다섯 손가락 안에 드는 스파이커로, 엄청난 텐션과 실력을 자랑합니다.",
    greeting: '오오─!! 헤이 헤이 헤이! 오늘도 컨디션 최고라고! 내 스파이크, 볼래?'
  }
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
    showStatus: true,
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
        const response = await fetch(`http://127.0.0.1:8000/chats/${id}`);
        let chatData: any = null;
        if (response.ok) {
          chatData = await response.json();
        }

        const fetchCharInfo = async (charId: string) => {
          if (charId.startsWith('my-')) {
            const idx = parseInt(charId.replace('my-', ''));
            const res = await fetch(`http://127.0.0.1:8000/characters/${idx}`);
            if (res.ok) {
              const data = await res.json();
              return { id: charId, ...data, avatarUrl: data.avatar_url || '/avatar.png' };
            }
          } else if (popularCharacters[charId]) {
            return { id: charId, ...popularCharacters[charId] };
          }
          return null;
        };

        // 참여 캐릭터 리스트 결정
        const charIdsToFetch = (chatData && chatData.char_ids && chatData.char_ids.length > 0) 
          ? chatData.char_ids 
          : [id];

        const fetchedChars = await Promise.all(charIdsToFetch.map(fetchCharInfo));
        const finalChars = fetchedChars.filter(c => c !== null);

        if (finalChars.length > 0) {
          setActiveCharacters(finalChars);
          setSelectedCharacter(finalChars[0]);
        }

        if (chatData && chatData.messages && chatData.messages.length > 0) {
          setMessages(chatData.messages);
          setFavorability(chatData.favorability || 0);
          setSelectedProfileIndex(chatData.user_profile_index || 0);
        } else if (finalChars.length > 0) {
          setMessages([{
            id: Date.now(),
            content: finalChars[0].greeting || '안녕하세요!',
            isAi: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };

    fetchInitialData();
  }, [id]);

  useEffect(() => {
    if (messages.length > 0 && activeCharacters.length > 0) {
      const charId = activeCharacters[0].id || id;
      fetch(`http://127.0.0.1:8000/chats/${charId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages, 
          favorability, 
          user_profile_index: selectedProfileIndex,
          char_ids: activeCharacters.map(c => c.id)
        }),
      }).catch(err => console.error('Save error:', err));
    }
  }, [messages, favorability, activeCharacters, id, selectedProfileIndex]);

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
        const reply = data.reply;
        
        // 멀티 캐릭터 답변 분리 로직 ([이름] 태그 기준, 상태창/FEED/호감도 태그 제외)
        const parts = reply.trim().split(/(\[(?![^\]]*?(?:상태창|FEED|호감도))[^\]]+\])/).filter(Boolean);
        const newAiMsgs: any[] = [];
        
        if (parts.length >= 2 && parts[0].startsWith('[')) {
          for (let i = 0; i < parts.length; i += 2) {
            const nameTag = parts[i];
            const content = parts[i + 1] || '';
            if (nameTag.startsWith('[') && content.trim()) {
              newAiMsgs.push({
                id: Date.now() + i,
                content: `${nameTag} ${content.trim()}`,
                isAi: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              });
            }
          }
        }
        
        if (newAiMsgs.length === 0) {
          newAiMsgs.push({
            id: Date.now() + 1,
            content: reply,
            isAi: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }

        setMessages(prev => [...prev, ...newAiMsgs]);
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

  const handleProfileClick = async (char: any) => {
    setSelectedCharacter(char);
    try {
      const res = await fetch(`http://127.0.0.1:8000/chats/${char.id}`);
      if (res.ok) {
        const data = await res.json();
        setFavorability(data.favorability || 0);
      }
    } catch (err) {
      console.error('Fetch fav error:', err);
    }
    setIsProfileModalOpen(true);
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
        onAvatarClick={handleProfileClick}
      />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 pb-32">
        <div className="space-y-2">
          {messages.map((message) => (
            <Message 
              key={message.id} 
              {...message} 
              settings={settings}
              userProfile={userProfiles[selectedProfileIndex]}
              activeCharacters={activeCharacters}
              favorability={favorability}
              onAvatarClick={handleProfileClick}
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
          favorability={favorability}
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
