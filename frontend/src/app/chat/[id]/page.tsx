'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { Send, Image as ImageIcon, Sparkles, Plus, Settings, Trash2, X, Clock, User, Heart, ChevronRight, Eye } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import ChatHeader from '@/components/Chat/ChatHeader';
import Message from '@/components/Chat/Message';
import ChatInput from '@/components/Chat/ChatInput';
import CharacterProfileModal from '@/components/Chat/CharacterProfileModal';
import ScenarioSelector from '@/components/Chat/ScenarioSelector';
import StoryTimeline from '@/components/Chat/StoryTimeline';
import QuestWidget from '@/components/Chat/QuestWidget';
import BottomNav from '@/components/Layout/BottomNav';

const popularCharacters: Record<string, any> = {
  'ma4': {
    name: '아츠무',
    avatarUrl: 'http://127.0.0.1:8000/uploads/atsumu.png',
    coverUrl: 'http://127.0.0.1:8000/uploads/atsumu.png',
    description: '이나리자키 고교 배구부의 천재 세터. 고교 No.1 세터로 불리며 승부욕이 매우 강합니다.',
    greeting: '(코트 위에 서서 배구공을 굴리며 당신을 빤히 바라본다) "어이, 니. 내 토스 함 쳐볼래? 아무한테나 주는 거 아인디."',
    recommended_personas: ["이나리자키 비밀 매니저", "지방 도발 라이벌 세터", "아츠무의 열혈 팬"],
    theme: 'taro'
  },
  'ma_osamu': {
    name: '오사무',
    avatarUrl: 'http://127.0.0.1:8000/uploads/osamu.png',
    coverUrl: 'http://127.0.0.1:8000/uploads/osamu.png',
    description: "아츠무의 쌍둥이 형제. 윙 스파이커로서 아츠무와 '괴짜 속공'을 재현할 정도의 실력자. 아츠무보다 차분하지만 더 독설가입니다.",
    greeting: '(먹고 있던 주먹밥을 삼키며 무심하게 당신을 바라본다) "어이, 니. 아츠무는 봤나? 그 자식 또 어디서 사고 치고 있는 거 아이가."',
    recommended_personas: ["오니기리 미야의 단골 손님", "오사무의 요리 조수", "쌍둥이 싸움 중재자"],
    theme: 'gray'
  },
  'ma_suna': {
    name: '스나 린타로',
    avatarUrl: 'http://127.0.0.1:8000/uploads/suna.png',
    coverUrl: 'http://127.0.0.1:8000/uploads/suna.png',
    description: "유연한 체간을 이용해 블로커를 농락하는 미들 블로커. 시니컬하며 남의 불행을 구경하는 것을 즐깁니다.",
    greeting: '(휴대폰으로 뭔가를 찍다가 당신에게 렌즈를 돌린다) "아, 전학생? 방금 아츠무가 넘어진 거 찍고 있었는데... 너도 구경할래?"',
    recommended_personas: ["스나의 SNS 사진 모델", "블로킹 연습 파트너", "함께 구경하는 전학생"],
    theme: 'yellow'
  },
  'ma_kita': {
    name: '키타 신스케',
    avatarUrl: 'http://127.0.0.1:8000/uploads/kita.png',
    coverUrl: 'http://127.0.0.1:8000/uploads/kita.png',
    description: "이나리자키의 주장. 실력보다도 철저한 자기관리와 '제대로 하는 것'을 중시하여 팀을 통제하는 정신적 지주.",
    greeting: '(체육관 바닥의 먼지 하나를 줍고는 당신을 향해 정중하게 고개를 숙인다) "이나리자키에 오신 것을 환영합니다. 저는 주장 키타 신스케입니다. 길을 찾으시는 중입니까?"',
    recommended_personas: ["이나리자키의 성실한 부원", "키타의 할머니댁 이웃", "함께 등교하는 친구"],
    theme: 'mint'
  },
  'ma5': {
    name: '오이카와 토오루',
    avatarUrl: 'http://127.0.0.1:8000/uploads/oikawa_cover.png',
    coverUrl: 'http://127.0.0.1:8000/uploads/oikawa_cover.png',
    description: "아오바죠사이 고교 배구부 주장 및 세터. 현 내 최정상급 실력을 가진 천재형 노력가. 쾌활하고 능글맞은 성격이지만 코트 위에서는 누구보다 냉정하고 날카롭습니다.",
    greeting: '야호~ 잘 지냈어? 아, 여긴 예쁜 아가씨도 있네? 우리 세이죠에 구경하러 온 거야?',
    recommended_personas: ["세이죠의 엄격한 매니저", "토오루의 소꿉친구", "카라스노의 천재 후배"],
    theme: 'mint'
  },
  'ma6': {
    name: '우시지마 와카토시',
    avatarUrl: 'http://127.0.0.1:8000/uploads/ushijima_cover.png',
    coverUrl: 'http://127.0.0.1:8000/uploads/ushijima_cover.png',
    description: "시라토리자와 고교 배구부 주장 및 에이스. 압도적인 힘과 파괴력을 가진 전국 3대 에이스 중 한 명입니다.",
    greeting: '시라토리자와에 와라. 이곳에 너를 위한 최상의 팀이 기다리고 있다.',
    recommended_personas: ["시라토리자와 전속 분석가", "패배를 모르는 라이벌", "경찰관 지망생"]
  },
  'ma7': {
    name: '히나타 쇼요',
    avatarUrl: 'http://127.0.0.1:8000/uploads/hinata_cover.png',
    coverUrl: 'http://127.0.0.1:8000/uploads/hinata_cover.png',
    description: "카라스노 고교 배구부의 미들 블로커. 작은 체구에도 불구하고 압도적인 점프력과 스피드로 코트를 가르는 '작은 거인'입니다.",
    greeting: '오오! 너 배구 좋아해? 나랑 같이 연습하자! 나, 더 높이 날고 싶어!',
    recommended_personas: ["카라스노 동기 매니저", "히나타를 동경하는 후배", "점심 같이 먹는 친구"],
    theme: 'orange'
  },
  'ma8': {
    name: '후타쿠치 켄지',
    avatarUrl: 'http://127.0.0.1:8000/uploads/futakuchi_cover.png',
    coverUrl: 'http://127.0.0.1:8000/uploads/futakuchi_cover.png',
    description: "다테 공업 고등학교 배구부의 에이스이자 차기 주장. 뛰어난 블로킹 능력과 상대를 도발하는 심리전에 능합니다.",
    greeting: '여어, 우리 철벽 구경하러 온 거야? 조심해, 한 번 걸리면 못 빠져나가니까.',
    recommended_personas: ["다테공의 시크한 매니저", "블로킹을 뚫고 싶은 스파이커", "지갑 털어가는(?) 후배"]
  },
  'ma9': {
    name: '보쿠토 코타로',
    avatarUrl: 'http://127.0.0.1:8000/uploads/bokuto_cover.png',
    coverUrl: 'http://127.0.0.1:8000/uploads/bokuto_cover.png',
    description: "후쿠로다니 학원 고교 배구부의 주장 및 에이스. 전국 다섯 손가락 안에 드는 스파이커로, 엄청난 텐션과 실력을 자랑합니다.",
    greeting: '오오─!! 헤이 헤이 헤이! 오늘도 컨디션 최고라고! 내 스파이크, 볼래?',
    recommended_personas: ["후쿠로다니 차기 주전", "보쿠토 전용 멘탈 코치", "텐션 높은 소꿉친구"]
  }
};

const BACKGROUNDS: Record<string, string> = {
  'gym': 'http://127.0.0.1:8000/uploads/gym_bg.png',
  'night_park': 'http://127.0.0.1:8000/uploads/night_park_bg.png',
  'sunset_court': 'http://127.0.0.1:8000/uploads/sunset_court_bg.png',
  'training_camp': 'http://127.0.0.1:8000/uploads/gym_bg.png',
  'barbecue': 'http://127.0.0.1:8000/uploads/night_park_bg.png',
};

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeCharacters, setActiveCharacters] = useState<any[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [characterEmotions, setCharacterEmotions] = useState<Record<string, string>>({}); // 캐릭터별 감정 상태
  const [messages, setMessages] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number>(0);
  const [favorability, setFavorability] = useState(0);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
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
    if (messages.length > 0) {
      scrollToBottom(messages.length > 5); // Don't smooth scroll on initial load if few messages
    }
  }, [messages]);

  useEffect(() => {
    const fetchUserProfiles = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/user-profiles');
        if (response.ok) {
          const data = await response.json();
          setUserProfiles(data);

          // Restore selected persona from localStorage
          const savedPersonaName = localStorage.getItem(`selectedPersona_${id}`);
          if (savedPersonaName) {
            const foundIndex = data.findIndex((p: any) => p.name === savedPersonaName);
            if (foundIndex !== -1) {
              setSelectedProfileIndex(foundIndex);
            }
          }
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
          // 1. 커스텀 캐릭터 (my-*)
          if (charId.startsWith('my-')) {
            const idx = parseInt(charId.replace('my-', ''));
            const res = await fetch(`http://127.0.0.1:8000/characters/${idx}`);
            if (res.ok) {
              const data = await res.json();
              return { id: charId, ...data, avatarUrl: data.avatar_url || '/avatar.png' };
            }
          }

          // 2. 인기 캐릭터 (ma*) - 항상 백엔드에서 최신 정보를 먼저 조회 시도
          if (popularCharacters[charId]) {
            try {
              const res = await fetch(`http://127.0.0.1:8000/characters/search?q=${encodeURIComponent(popularCharacters[charId].name)}`);
              if (res.ok) {
                const found = await res.json();
                if (found.length > 0) return { id: charId, ...found[0] };
              }
            } catch (err) {
              console.warn('Backend char search failed, falling back to local:', err);
            }
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

          // 캐릭터 테마가 있으면 자동 적용 (기본 테마일 때만)
          if (finalChars[0].theme && settings.theme === 'basic') {
            setSettings(prev => ({ ...prev, theme: finalChars[0].theme }));
          }
        }

        if (chatData && chatData.messages && chatData.messages.length > 0) {
          setMessages(chatData.messages);
          setFavorability(chatData.favorability || 0);
          setSelectedProfileIndex(chatData.user_profile_index || 0);
          if (chatData.settings) {
            setSettings(chatData.settings);
          }
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
    if (userProfiles[selectedProfileIndex]) {
      localStorage.setItem(`selectedPersona_${id}`, userProfiles[selectedProfileIndex].name);
    }
  }, [selectedProfileIndex, userProfiles, id]);

  const lastSavedRef = React.useRef<string>('');

  useEffect(() => {
    if (messages.length > 0 && activeCharacters.length > 0) {
      const charId = activeCharacters[0].id || id;
      const payload = {
        messages,
        // favorability: favorability, // 제거하여 서버측 데이터 보존
        user_profile_index: selectedProfileIndex,
        char_ids: activeCharacters.map(c => c.id),
        settings
      };

      const payloadStr = JSON.stringify(payload);
      if (lastSavedRef.current === payloadStr) return;

      fetch(`http://127.0.0.1:8000/chats/${charId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payloadStr,
      }).then(() => {
        lastSavedRef.current = payloadStr;
      }).catch(err => console.error('Save error:', err));
    }
  }, [messages, favorability, activeCharacters, id, selectedProfileIndex, settings]);

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

        if (!reply) {
          console.error('No reply from server');
          return;
        }

        // 배경 변경 태그 추출 및 적용
        const bgMatch = reply.match(/\[BG:\s*(.*?)\]/);
        if (bgMatch && settings.autoBg) {
          const style = bgMatch[1].trim();
          if (BACKGROUNDS[style]) setBgUrl(BACKGROUNDS[style]);
        }

        // 감정 태그 추출 및 적용
        const emotionMatches = reply.matchAll(/\[(.*?)\s*감정:\s*(.*?)\]/g);
        const newEmotions = { ...characterEmotions };
        for (const match of emotionMatches) {
          const charName = match[1];
          const emotion = match[2];
          const charObj = activeCharacters.find(c => c.name === charName);
          if (charObj) newEmotions[charObj.id] = emotion;
        }
        setCharacterEmotions(newEmotions);

        // 멀티 캐릭터 답변 분리 로직 복구
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
            content: reply.replace(/\[BG:\s*.*?\]/g, '').trim(),
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

  const handleObserve = async () => {
    if (isGeneratingImage || messages.length === 0) return; // Using isGeneratingImage as a general loading state

    setIsGeneratingImage(true); // Using setIsGeneratingImage to indicate loading
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
          user_profile_index: selectedProfileIndex,
          char_ids: activeCharacters.map(p => p.id)
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply;

        const parts = reply.split(/(?=\[.*?\])/g).filter((p: string) => {
          // 캐릭터 이름 태그로 시작하고 실질적인 내용이 있는 것만 필터링
          return p.trim() && /^\[(?!(상태창|FEED|호감도|BG)).*?\]/.test(p);
        });

        const newMessages = parts.map((part: string, idx: number) => {
          return {
            id: Date.now() + idx + Math.random(),
            content: part.trim(), // [이름] 태그를 포함한 전체 내용을 전달
            isAi: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        });

        setMessages(prev => [...prev, ...newMessages]);

        // 관찰 모드에서도 배경 변경 적용
        const bgMatch = reply.match(/\[BG:\s*(.*?)\]/);
        if (bgMatch && settings.autoBg) {
          const style = bgMatch[1].trim();
          if (BACKGROUNDS[style]) setBgUrl(BACKGROUNDS[style]);
        }

        // 감정 태그 추출 및 적용 (관찰 모드)
        const emotionMatches = reply.matchAll(/\[(.*?)\s*감정:\s*(.*?)\]/g);
        const newEmotions = { ...characterEmotions };
        for (const match of emotionMatches) {
          const charName = match[1];
          const emotion = match[2];
          const charObj = activeCharacters.find(c => c.name === charName);
          if (charObj) newEmotions[charObj.id] = emotion;
        }
        setCharacterEmotions(newEmotions);
      }
    } catch (err) {
      console.error('Observation failed:', err);
    } finally {
      setIsGeneratingImage(false); // Using setIsGeneratingImage to indicate loading complete
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
    try {
      // 캐릭터 상세 정보 가져오기 (unlockables 포함)
      const resChar = await fetch(`http://127.0.0.1:8000/characters/search?q=${encodeURIComponent(char.name)}`);
      if (resChar.ok) {
        const found = await resChar.json();
        if (found.length > 0) {
          setSelectedCharacter(found[0]);
        } else {
          setSelectedCharacter(char);
        }
      }

      // 호감도 정보 가져오기
      const resFav = await fetch(`http://127.0.0.1:8000/chats/${char.id}`);
      if (resFav.ok) {
        const data = await resFav.json();
        setFavorability(data.favorability || 0);
      }
    } catch (err) {
      console.error('Fetch profile/fav error:', err);
    }
    setIsProfileModalOpen(true);
  };

  const handleSelectScenario = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    setActiveScenario(scenarioId);
    setMessages(prev => [...prev, {
      id: Date.now(),
      content: `[시나리오 시작: ${scenario.title}]\n${scenario.description}`,
      isAi: true,
      name: 'System',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/scenarios');
        if (res.ok) setScenarios(await res.json());
      } catch (err) {
        console.error('Fetch scenarios error:', err);
      }
    };
    fetchScenarios();
  }, []);

  const handleApplyPersona = async (persona: string) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/user-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userProfiles[selectedProfileIndex]?.name || '나',
          description: persona,
          avatar_url: userProfiles[selectedProfileIndex]?.avatar_url || 'http://localhost:8000/uploads/user_default.png'
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedProfiles = [...userProfiles, data];
        setUserProfiles(updatedProfiles);
        setSelectedProfileIndex(updatedProfiles.length - 1);

        setMessages(prev => [...prev, {
          id: Date.now(),
          content: `*페르소나 '${persona}'가 적용되었습니다.*`,
          isAi: true,
          name: 'System',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (err) {
      console.error('Apply persona error:', err);
    }
  };

  const handleOpenTimeline = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/chat/${id}/timeline`);
      if (res.ok) setTimelineData(await res.json());
    } catch (err) {
      console.error('Fetch timeline error:', err);
    }
    setIsTimelineOpen(true);
  };

  return (
    <main
      className="min-h-screen bg-background text-foreground flex flex-col pt-16 transition-all duration-1000 bg-cover bg-center"
      style={bgUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${bgUrl})` } : {}}
    >
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
        onOpenScenarios={() => setIsScenarioModalOpen(true)}
        onOpenTimeline={handleOpenTimeline}
        recommendedPersonas={activeCharacters[0]?.recommended_personas}
        onApplyPersona={handleApplyPersona}
        characterEmotions={characterEmotions}
      />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 pt-12 pb-32">
        <div className="space-y-2">
          {messages.map((message) => (
             <Message
               key={message.id}
               {...message}
               settings={settings}
               userProfile={userProfiles[selectedProfileIndex]}
               activeCharacters={activeCharacters}
               favorability={favorability}
               isStory={false}
               onAvatarClick={handleProfileClick}
             />
          ))}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

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
          onApplyPersona={handleApplyPersona}
        />
      )}

      <ScenarioSelector
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onSelect={handleSelectScenario}
        scenarios={scenarios}
      />

      <StoryTimeline
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        timeline={timelineData}
        characterName={activeCharacters[0]?.name || 'Character'}
      />

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
