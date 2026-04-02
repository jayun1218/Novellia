'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Sparkles, Send, User, Clock, Heart, Eye, Navigation, Book } from 'lucide-react';
import ChatHeader from '@/components/Chat/ChatHeader';
import Message from '@/components/Chat/Message';
import ChatInput from '@/components/Chat/ChatInput';
import CharacterProfileModal from '@/components/Chat/CharacterProfileModal';
import ScenarioSelector from '@/components/Chat/ScenarioSelector';
import StoryTimeline from '@/components/Chat/StoryTimeline';
import QuestWidget from '@/components/Chat/QuestWidget';
import MapOverlay from '@/components/Chat/MapOverlay';
import BottomNav from '@/components/Layout/BottomNav';
import AchievementToast from '@/components/Chat/AchievementToast';
import EpilogueModal from '@/components/Chat/EpilogueModal';

export default function WorldviewChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [worldview, setWorldview] = useState<any>(null);
  const [activeCharacters, setActiveCharacters] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [favorability, setFavorability] = useState(0);
  const [characterEmotions, setCharacterEmotions] = useState<Record<string, string>>({});
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPersona, setUserPersona] = useState('');
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [currentLocationId, setCurrentLocationId] = useState('gym-1');
  const [bgUrl, setBgUrl] = useState('');
  const [settings, setSettings] = useState({
    theme: 'basic',
    showProfile: true,
    showStatus: true,
    autoBg: false,
    haptic: true
  });
  const [lastAchievement, setLastAchievement] = useState<any>(null);
  const [favorabilities, setFavorabilities] = useState<Record<string, number>>({});

  const checkAchievements = async (msgCount: number, favs: Record<string, number>) => {
    try {
      const res = await fetch(`http://localhost:8000/worldviews/${id}/check-achievements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_count: msgCount,
          favorabilities: favs
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.new_achievements && data.new_achievements.length > 0) {
          // 다수의 업적 중 첫 번째 것만 우선 표시 (또는 큐잉 가능)
          setLastAchievement(data.new_achievements[0]);
        }
      }
    } catch (err) {
      console.error('Failed to check achievements:', err);
    }
  };

  useEffect(() => {
    const presetName = localStorage.getItem(`worldview_user_name_${id}`);
    const defaultName = localStorage.getItem('novellia_user_name') || '여행자';
    const name = presetName || defaultName;
    
    const persona = localStorage.getItem(`worldview_persona_${id}`) || '';
    setUserName(name);
    setUserPersona(persona);

    if (!persona) {
      router.replace(`/worldviews/${id}`);
      return;
    }

    const initData = async () => {
      try {
        setLoading(true);

        // 1. Check for Reset Flag
        const isReset = localStorage.getItem(`worldview_reset_${id}`) === 'true';
        if (isReset) {
          await fetch(`http://localhost:8000/worldviews/${id}/chat`, { method: 'DELETE' });
          localStorage.removeItem(`worldview_reset_${id}`);
        }

        // 2. Fetch Worldview Config
        const wvRes = await fetch(`http://localhost:8000/worldviews/${id}`);
        if (!wvRes.ok) throw new Error('Worldview not found');
        const wvData = await wvRes.json();
        setWorldview(wvData);
        if (wvData.quick_replies) setQuickReplies(wvData.quick_replies);

        // 3. Fetch Existing Chat History & Progress (Parallel)
        const [historyRes, progressRes, favsRes] = await Promise.all([
          fetch(`http://localhost:8000/worldviews/${id}/history`),
          fetch(`http://localhost:8000/worldviews/${id}/progress`),
          fetch(`http://localhost:8000/worldviews/${id}/favorabilities`)
        ]);

        let hData = historyRes.ok ? await historyRes.json() : { history: [] };
        let pData = progressRes.ok ? await progressRes.json() : { progress: {} };
        let fData = favsRes.ok ? await favsRes.json() : {};

        // 4. Update State
        if (hData.history?.length > 0) {
          setMessages(hData.history);
          
          // [NEW] Generate fresh suggestions for the last message
          const lastAiMsg = [...hData.history].reverse().find(m => m.isAi);
          if (lastAiMsg) {
            const charNames = (wvData.characters || []).map((c: any) => c.name).join(', ');
            try {
              const suggestRes = await fetch(`http://localhost:8000/chat/generate-suggestions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  reply: lastAiMsg.content, 
                  char_names: charNames,
                  user_name: name 
                })
              });
              if (suggestRes.ok) {
                const suggestData = await suggestRes.json();
                if (suggestData.quick_replies) {
                  setQuickReplies(suggestData.quick_replies);
                  setShowQuickReplies(true);
                }
              }
            } catch (err) {
              console.error('Failed to refresh suggestions:', err);
            }
          }
        } else if (wvData.intro_text) {
          setMessages([{
            id: Date.now(),
            content: wvData.intro_text,
            isAi: true,
            role: 'observation',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }

        if (pData.progress?.last_location) {
          const locId = pData.progress.last_location;
          setCurrentLocationId(locId);
          const loc = wvData.locations?.find((l: any) => l.id === locId);
          if (loc?.bg_url) setBgUrl(loc.bg_url);
        } else if (wvData.thumbnail_url) {
          setBgUrl(wvData.thumbnail_url);
        }

        setFavorabilities(fData);

        // 5. Build Active Characters with current favorabilities
        const charPromises = (wvData.characters || []).map(async (char: any) => {
           return { ...char, favorability: fData[char.name] || fData[char.id] || 0 };
        });
        const chars = await Promise.all(charPromises);
        setActiveCharacters(chars);

      } catch (err) {
        console.error('Initialization failed:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) initData();
  }, [id, router]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(messages.length > 5);
  }, [messages]);

  const handleMoveLocation = async (loc: any) => {
    setCurrentLocationId(loc.id);
    setIsMapOpen(false);
    if (loc.bg_url) setBgUrl(loc.bg_url);

    // 장소 이동 알림 메시지 (AI가 이를 감지하여 서사 변경 가능)
    const moveMsg = `[시스템 알림: ${loc.name}(으)로 장소를 이동했습니다. ${loc.description}]`;
    handleSend(moveMsg);

    // 백엔드 진행도 업데이트
    try {
      await fetch(`http://localhost:8000/worldviews/${id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_location: loc.id })
      });
    } catch (err) {
      console.error('Failed to update progress location:', err);
    }
  };

  const [isEpilogueOpen, setIsEpilogueOpen] = useState(false);
  const [epilogueText, setEpilogueText] = useState('');
  const [isEpilogueLoading, setIsEpilogueLoading] = useState(false);

  const handleEndJourney = async () => {
    setIsEpilogueOpen(true);
    setIsEpilogueLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/worldviews/${id}/generate-epilogue`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setEpilogueText(data.epilogue);
      }
    } catch (err) {
      console.error('Failed to generate epilogue:', err);
    } finally {
      setIsEpilogueLoading(false);
    }
  };

  const saveHistory = async (newMessages: any[]) => {
    try {
      // 세계관 전용 대화 내역 저장소 (chats_{id}.json)에 저장
      await fetch(`http://localhost:8000/worldviews/${id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          last_location: currentLocationId
        })
      });
    } catch (err) {
      console.error('Failed to save history:', err);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setShowQuickReplies(false);

    const userMsg = {
      id: Date.now(),
      content: text,
      isAi: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const updatedMsgsWithUser = [...messages, userMsg];
    setMessages(updatedMsgsWithUser);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          worldview_id: id,
          custom_user_persona: `[User Name: ${userName}] ${userPersona}`,
          char_ids: activeCharacters.map(c => c.id || c.name), 
          chat_history: updatedMsgsWithUser.map(m => ({ role: m.isAi ? 'assistant' : 'user', content: m.content })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.reply;
        
        // Handle Emotions
        const emotionMatches = reply.matchAll(/\[(.*?)\s*감정:\s*(.*?)\]/g);
        const newEmotions = { ...characterEmotions };
        for (const match of emotionMatches) {
           const charName = match[1];
           const emotion = match[2];
           const charObj = activeCharacters.find(c => c.name === charName);
           if (charObj) newEmotions[charObj.id] = emotion;
        }
        setCharacterEmotions(newEmotions);

        // [MODIFIED] Do NOT split response in Story Mode. Use single narrative bubble.
        const newAiMsg = {
          id: Date.now(),
          content: reply.trim(),
          isAi: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const finalMsgs = [...updatedMsgsWithUser, newAiMsg];
        setMessages(finalMsgs);
        setFavorability(data.favorability);
        
        // [PERSIST] Save to Backend
        saveHistory(finalMsgs);

        if (data.quick_replies) {
          setQuickReplies(data.quick_replies);
          setShowQuickReplies(true);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  const handleGenerateScene = async (prompt: string) => {
    if (isGeneratingImage || activeCharacters.length === 0) return;
    setIsGeneratingImage(true);
    try {
      const scenePrompt = prompt || messages.slice(-2).map(m => m.content).join(' ');
      const response = await fetch('http://localhost:8000/generate-scene-image', {
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

  const handleObserve = async () => {
    if (isGeneratingImage || messages.length === 0) return;

    setIsGeneratingImage(true);
    try {
      const res = await fetch(`http://localhost:8000/chat/${id}/observe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '[관찰 모드]',
          chat_history: messages.map(m => ({
            role: m.isAi ? 'assistant' : 'user',
            content: m.content
          })),
          char_ids: activeCharacters.map(p => p.id)
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply;

        const parts = reply.split(/(?=\[.*?\])/g).filter((p: string) => {
          return p.trim() && /^\[(?!(상태창|FEED|호감도|BG)).*?\]/.test(p);
        });

        const newMessages = parts.map((part: string, idx: number) => {
          return {
            id: Date.now() + idx + Math.random(),
            content: part.trim(),
            isAi: true,
            role: 'observation',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        });

        setMessages(prev => [...prev, ...newMessages]);
      }
    } catch (err) {
      console.error('Observation failed:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleProfileClick = (char: any) => {
    setSelectedCharacter(char);
    setIsProfileModalOpen(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-primary font-black uppercase tracking-widest">Loading Worldview...</div>
    </div>
  );

  return (
    <main className="relative min-h-screen text-foreground flex flex-col pt-16">
      {/* Fixed Background Layer */}
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center transition-all duration-1000"
        style={bgUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${bgUrl})` } : { backgroundColor: '#121212' }}
      />
      
      {/* Map Toggle Button (Floating) */}
      <button 
        onClick={() => setIsMapOpen(true)}
        className="fixed top-44 right-4 z-40 p-3 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-2xl hover:bg-primary/40 transition-all group shadow-2xl"
      >
        <Navigation className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
        <span className="absolute right-full mr-2 px-2 py-1 bg-black/60 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">월드맵 열기</span>
      </button>

      <ChatHeader 
        activeCharacters={activeCharacters} 
        onInvite={() => {}}
        userProfiles={[{ name: userName, persona: userPersona }]}
        selectedProfileIndex={0}
        onProfileSelect={() => {}}
        settings={settings}
        onSettingsChange={setSettings}
        onResetChat={() => setMessages([])}
        onAvatarClick={handleProfileClick}
        onOpenScenarios={() => {}}
        onOpenTimeline={() => {}}
        onApplyPersona={() => {}}
        characterEmotions={characterEmotions}
        isStory={true}
      />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 pt-12 pb-32">
        <div className="space-y-4">
           {/* Worldview Badge */}
           <div className="flex justify-center mb-8">
              <div className="px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-primary" />
                 <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{worldview?.title}</span>
              </div>
           </div>

          {messages.map((message) => (
            <Message 
              key={message.id} 
              {...message} 
              settings={settings}
              userProfile={{ name: userName, persona: userPersona, avatar_url: '/avatar.png' }}
              activeCharacters={activeCharacters}
              favorability={favorability}
              isStory={true}
              storyAvatar={worldview?.thumbnail_url}
              lorebook={worldview?.lorebook}
            />
          ))}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Quick Replies */}
      {showQuickReplies && quickReplies.length > 0 && (
        <div className="fixed bottom-32 left-0 w-full px-4 z-20 animate-in fade-in slide-in-from-bottom-2">
          <div className="max-w-4xl mx-auto flex flex-col items-end gap-2">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => {
                  handleSend(reply);
                  setShowQuickReplies(false);
                }}
                className="px-5 py-2.5 bg-zinc-800/80 backdrop-blur-md border border-white/10 rounded-3xl text-[13px] text-gray-200 font-bold hover:bg-zinc-700/80 hover:border-primary/50 transition-all shadow-xl flex items-center gap-2 group"
              >
                {reply}
                <Navigation className="w-3 h-3 text-gray-500 group-hover:text-primary transition-colors rotate-45" />
              </button>
            ))}
          </div>
        </div>
      )}

      <ChatInput 
        onSend={handleSend} 
        onGenerateScene={handleGenerateScene}
        onObserve={handleObserve}
        isGeneratingImage={isGeneratingImage}
        theme={settings.theme}
      />

      {/* Achievement Toast */}
      <AchievementToast 
        achievement={lastAchievement} 
        onClose={() => setLastAchievement(null)} 
      />

      {/* Map Overlay */}
      <MapOverlay 
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        locations={worldview?.locations || []}
        currentLocationId={currentLocationId}
        onMove={handleMoveLocation}
        thumbnailUrl={worldview?.thumbnail_url || ''}
      />

      {selectedCharacter && (
        <CharacterProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)}
          character={selectedCharacter}
          favorability={favorability}
          onApplyPersona={() => {}}
        />
      )}

      <BottomNav />

      {/* Quest System Widget */}
      <QuestWidget 
        favorability={favorability} 
        messageCount={messages.length} 
        characterCount={activeCharacters.length} 
      />
    </main>
  );
}
