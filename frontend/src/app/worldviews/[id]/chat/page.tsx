'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Sparkles, Send, User, Clock, Heart, Eye } from 'lucide-react';
import ChatHeader from '@/components/Chat/ChatHeader';
import Message from '@/components/Chat/Message';
import ChatInput from '@/components/Chat/ChatInput';
import CharacterProfileModal from '@/components/Chat/CharacterProfileModal';
import ScenarioSelector from '@/components/Chat/ScenarioSelector';
import StoryTimeline from '@/components/Chat/StoryTimeline';
import QuestWidget from '@/components/Chat/QuestWidget';
import BottomNav from '@/components/Layout/BottomNav';

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
  const [settings, setSettings] = useState({
    theme: 'basic',
    showProfile: true,
    showStatus: true,
    autoBg: false,
    haptic: true
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    const fetchData = async () => {
      try {
        // 1. Fetch Worldview
        const wvRes = await fetch(`http://127.0.0.1:8000/worldviews/${id}`);
        if (!wvRes.ok) throw new Error('Worldview not found');
        const wvData = await wvRes.json();
        setWorldview(wvData);
        if (wvData.quick_replies) setQuickReplies(wvData.quick_replies);

        // 2. Fetch Characters
        const charPromises = wvData.character_ids.map(async (cid: string) => {
           if (cid.startsWith('my-')) {
             const idx = parseInt(cid.replace('my-', ''));
             const res = await fetch(`http://127.0.0.1:8000/characters/${idx}`);
             return res.ok ? { id: cid, ...(await res.json()) } : null;
           } else {
             const res = await fetch(`http://127.0.0.1:8000/characters/search?q=${cid}`);
             if (res.ok) {
               const found = await res.json();
               return found.length > 0 ? found[0] : null;
             }
           }
           return null;
        });

        const chars = (await Promise.all(charPromises)).filter(c => c !== null);
        setActiveCharacters(chars);

        // 3. Initial Message (Intro only, and remove the guide text)
        if (chars.length > 0) {
          const initialMsgs = [
            {
              id: 'guide',
              content: wvData.intro_text,
              isAi: true,
              role: 'guide',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ];
          setMessages(initialMsgs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setShowQuickReplies(false);

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
          worldview_id: id,
          custom_user_persona: `[User Name: ${userName}] ${userPersona}`,
          char_ids: activeCharacters.map(c => c.id || c.name), 
          chat_history: messages.map(m => ({ role: m.isAi ? 'assistant' : 'user', content: m.content })),
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

        // Parse Multi-character responses
        const parts = reply.trim().split(/(\[(?![^\]]*?(?:상태창|FEED|호감도|BG))[^\]]+\])/).filter(Boolean);
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
            content: reply.trim(),
            isAi: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }

        setMessages(prev => [...prev, ...newAiMsgs]);
        setFavorability(data.favorability);
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

  const handleObserve = async () => {
    if (isGeneratingImage || messages.length === 0) return;

    setIsGeneratingImage(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/chat/${id}/observe`, {
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
    <main 
      className="min-h-screen bg-background text-foreground flex flex-col pt-16 bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(${worldview?.thumbnail_url})` }}
    >
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
                <Send className="w-3 h-3 text-gray-500 group-hover:text-primary transition-colors" />
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
