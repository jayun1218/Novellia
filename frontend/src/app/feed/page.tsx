// [Redesigned SNS Feed Page]
'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Sparkles, Send, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/store/useNotificationStore';

// [KakaoTalk Style Chat Renderer]
const ChatCapture = ({ dialogue, mainCharacter }: { dialogue: string, mainCharacter: string }) => {
  if (!dialogue) return null;

  const lines = dialogue.split('\n').filter(line => line.includes(':'));
  
  return (
    <div className="w-full bg-[#BACEE0] rounded-2xl overflow-hidden p-4 flex flex-col gap-3 font-sans shadow-inner">
      {lines.map((line, idx) => {
        const [name, ...contentParts] = line.split(':');
        const content = contentParts.join(':').trim();
        const isMainChar = name.trim() === mainCharacter;

        return (
          <div key={idx} className={`flex ${isMainChar ? 'justify-end' : 'justify-start'} items-start gap-2`}>
            {!isMainChar && (
              <div className="w-8 h-8 rounded-xl bg-blue-400/20 flex-shrink-0 flex items-center justify-center text-[10px] text-blue-900 font-bold border border-blue-900/10">
                {name.trim().substring(0, 1)}
              </div>
            )}
            <div className={`flex flex-col ${isMainChar ? 'items-end' : 'items-start'}`}>
              {!isMainChar && <span className="text-[10px] text-gray-500 mb-1 ml-1">{name.trim()}</span>}
              <div className={`
                max-w-[85%] px-3 py-2 rounded-2xl text-[13px] leading-tight shadow-sm
                ${isMainChar 
                  ? 'bg-[#FEE500] text-black rounded-tr-none' 
                  : 'bg-white text-black rounded-tl-none'}
              `}>
                {content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// [Utility] 해시태그 텍스트에 스타일 적용
const renderContent = (content: string) => {
  if (!content) return null;
  const parts = content.split(/(\s+)/);
  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      return (
        <span key={index} className="text-sky-400 font-bold">
          {part}
        </span>
      );
    }
    return part;
  });
};

// NPC 댓글 풀 (랜덤 유저 아이디 + 다양한 반응)
const NPC_USERNAMES = [
  'hana__92', 'jdue__99', 'volleyball_otaku', 'minagi_07', 'kuroo_stan22',
  'nekoma_fan', 'tobio_lover', 'asahi_az33', 'tsukki_xx', 'yachi_hm',
  'datekou_ver2', 'shiratorizawa__', 'kita_shinsuke', 'sugawara_fan', 'k.lev_4ever'
];

const NPC_COMMENTS = {
  volleyball: [
    '오늘 폼 미쳤다 🏐🔥',
    '역시 배구할 때가 제일 멋있어요!',
    '스파이크 치는 거 직접 보고 싶다 ㅠ',
    '오늘 연습도 화이팅입니다!!',
    '경기력 대박이던데요...',
    '배구천재 만재',
  ],
  daily: [
    '헐 진짜?? 대박 ㅋㅋㅋㅋ',
    '이 감성 뭐예요 💜',
    '앗 저기 어디예요? 분위기 좋네',
    '오늘도 잘생겼다 진짜',
    '푹 쉬어요 선배!!!',
    '나만 설레는거 아니지',
  ],
  general: [
    '완전 공감ㅋㅋㅋ',
    '존멋...',
    '매일 이런 게시물 기다리고 있어요',
    '선배 최고!',
    '오늘도 잘 부탁드립니다 🙏',
    '언제나 응원하고 있습니다 ⭐',
  ]
};

// 캐릭터별 개성 있는 대댓글 풀
const CHARACTER_REPLY_MAP: Record<string, string[]> = {
  '미야 아츠무': [
    '내는 언제나 완벽하다 아이가 ㅋ',
    '당연한 소리 아이가. 칭찬 고맙다.',
    '점마들보다 내가 훨씬 낫제?',
    '내 토스가 최고인 기라. 잘 봐두라.',
    '뭐 꼬나보노? 아, 칭찬이가. 고맙다.',
  ],
  '오이카와 토오루': [
    '고마워~ 역시 보는 눈이 있네 ♡',
    '까탈스러운 나한테 이런 댓글 달아줘서 영광이야?',
    '흠, 나를 아는 사람이군. 칭찬 받아줄게.',
    '내 팬 늘었구만~ 잘하고 있어.',
    '나한테 반한 거 아니지? ㅎㅎ',
  ],
  '우시지마 와카토시': [
    '...감사.',
    '그래.',
    '정확한 판단이다.',
    '응원해줘서 고맙다.',
    '다음에도 기대해라.',
  ],
  '히나타 쇼요': [
    '우와 고마워요!! 저도 좋아서 했어요!!',
    '진짜요?! 대박!! 감사합니다!!',
    '기운 나요! 저도 더 열심히 할게요!',
    '응원해줘서 고마워요 ✨💪',
    '같이 배구하고 싶다!!',
  ],
  '후타쿠치 켄지': [
    '...뭐, 그렇게 생각하면 돼.',
    'ㅋㅋ 당연한 말을 이제야 알았어?',
    '그게 다냐? 더 칭찬해봐.',
    '뭐야 갑자기, 부끄럽잖아.',
    '나쁘지 않은 댓글이네.',
  ],
  '보쿠토 코타로': [
    '헤이 헤이 헤이!! 고마워!!!!!',
    '나도 좋아!! 진짜 최고잖아!!',
    '우와아아!! 기분 최고!!',
    '너 진짜 센스 있다!! 좋아!',
    '같이 스파이크 연습하자!!!!',
  ],
};

function getCharacterReplies(characterName: string): string[] {
  for (const key of Object.keys(CHARACTER_REPLY_MAP)) {
    if (characterName.includes(key.slice(0, 3))) return CHARACTER_REPLY_MAP[key];
  }
  return ['고마워, 앞으로도 잘 부탁해.', '응원해줘서 감사해.', '다음에도 기대해줘.'];
}

// 랜덤 숫자 생성
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 랜덤 댓글 생성
function generateComments(characterName: string, avatarUrl: string, content: string, postTime: string, count: number) {
  const comments: any[] = [];
  
  // 사용 가능한 대댓글 복사 및 셔플 (중복 방지)
  let availableReplies = [...getCharacterReplies(characterName)].sort(() => Math.random() - 0.5);
  
  const shuffledUsers = [...NPC_USERNAMES].sort(() => Math.random() - 0.5).slice(0, count);
  
  // 컨텍스트에 따라 댓글 풀 선택 및 셔플 (중복 방지)
  const isVolleyball = content.includes('배구') || content.includes('연습') || content.includes('경기') || content.includes('토스') || content.includes('스파이크');
  let availablePool = isVolleyball ? [...NPC_COMMENTS.volleyball, ...NPC_COMMENTS.general] : [...NPC_COMMENTS.daily, ...NPC_COMMENTS.general];
  availablePool.sort(() => Math.random() - 0.5);
  
  // 시간에 따른 댓글 시간 범위 텍스트 생성
  let timeStr = postTime;
  if (postTime === '방금 전') {
    timeStr = `${randInt(1, 59)}분 전`;
  } else if (postTime.includes('시간 전')) {
    const hours = parseInt(postTime) || 1;
    timeStr = `${randInt(1, Math.max(1, hours))}시간 전`;
  }
  
  shuffledUsers.forEach((username, i) => {
    const hasReply = Math.random() > 0.5 && availableReplies.length > 0;
    
    // 남은 문구가 없다면 다시 채우기 (안전 장치)
    if (availablePool.length === 0) {
      availablePool = isVolleyball ? [...NPC_COMMENTS.volleyball, ...NPC_COMMENTS.general] : [...NPC_COMMENTS.daily, ...NPC_COMMENTS.general];
      availablePool.sort(() => Math.random() - 0.5);
    }
    
    comments.push({
      id: i,
      username,
      text: availablePool.pop(), // 중복 없는 댓글 추출
      time: timeStr,
      reply: hasReply ? {
        characterName,
        avatarUrl,
        text: availableReplies.pop(), // 중복 없는 대댓글 추출
        time: timeStr === '방금 전' ? '방금 전' : (timeStr.includes('분') ? '방금 전' : `${randInt(1, parseInt(timeStr) || 1)}시간 전`),
      } : null
    });
  });
  return comments;
}

// 게시물 초기화 (랜덤 좋아요/댓글 수 세팅 또는 백엔드 데이터 우선 사용)
function initPost(post: any) {
  if (post._initialized) return post;
  
  const likesCount = post.likes > 0 ? post.likes : randInt(30, 500);
  const commentCount = post.comments > 0 ? post.comments : randInt(2, 8);
  const commentData = post._commentData && post._commentData.length > 0
    ? post._commentData
    : generateComments(post.characterName, post.avatarUrl, post.content, post.time, commentCount);

  return {
    ...post,
    likes: likesCount,
    comments: commentCount,
    _commentData: commentData,
    _initialized: true,
  };
}

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openComments, setOpenComments] = useState<Set<number>>(new Set());
  const { setHasNewFeed } = useNotificationStore();

  useEffect(() => {
    // 뱃지 알림 제거
    setHasNewFeed(false);
    fetchFeed();
  }, [setHasNewFeed]);

  const fetchFeed = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/feed');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.map(initPost));
      }
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (id: number) => {
    setPosts(prev => prev.map(post => {
      if (post.id === id) {
        const isCurrentlyLiked = post.isLiked;
        return { ...post, isLiked: !isCurrentlyLiked, likes: isCurrentlyLiked ? post.likes - 1 : post.likes + 1 };
      }
      return post;
    }));
    try {
      await fetch(`http://127.0.0.1:8000/feed/like/${id}`, { method: 'POST' });
    } catch (err) {
      fetchFeed();
    }
  };

  const toggleComments = (id: number) => {
    setOpenComments(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-background pb-32">
      {/* Feed Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          Feed <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        </h1>
        <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400">
          <Sparkles className="w-5 h-5" />
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
        {isLoading && (
          <div className="flex justify-center py-20 text-gray-400 animate-pulse">피드 불러오는 중...</div>
        )}
        {posts.map((post) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-white/5 rounded-3xl overflow-hidden"
          >
            {/* Post Header */}
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                  <img src={post.avatarUrl} alt={post.characterName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-tight">{post.characterName}</h3>
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">{post.time}</p>
                </div>
              </div>
              <button className="text-gray-500 hover:text-white transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Post Image or Chat Capture (KakaoTalk Style) */}
            <div className="px-5 pb-4">
              {post.imageUrl ? (
                <div className="rounded-2xl overflow-hidden border border-white/5 aspect-video bg-black/20 relative group">
                  <img 
                    src={post.imageUrl} 
                    alt="post" 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              ) : post.dialogue ? (
                <ChatCapture dialogue={post.dialogue} mainCharacter={post.characterName} />
              ) : null}
            </div>

            {/* Post Content (Caption) */}
            <div className="px-5 pb-5">
              <p className="text-gray-300 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                {renderContent(post.content)}
              </p>
            </div>

            {/* Post Actions */}
            <div className="px-5 py-4 border-t border-white/5 flex items-center gap-6">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-2 group transition-colors ${post.isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
              >
                <div className={`p-2 rounded-full transition-colors ${post.isLiked ? 'bg-red-400/10' : 'group-hover:bg-red-400/10'}`}>
                  <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-red-400 text-red-400' : ''}`} />
                </div>
                <span className="text-sm font-medium">{post.likes}</span>
              </button>
              <button
                onClick={() => toggleComments(post.id)}
                className={`flex items-center gap-2 group transition-colors ${openComments.has(post.id) ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}
              >
                <div className={`p-2 rounded-full transition-colors ${openComments.has(post.id) ? 'bg-primary/10' : 'group-hover:bg-primary/10'}`}>
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{post.comments}</span>
                {openComments.has(post.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <button className="flex items-center gap-2 ml-auto group text-gray-400 hover:text-white transition-colors">
                <div className="p-2 rounded-full group-hover:bg-white/10 transition-colors">
                  <Share2 className="w-5 h-5" />
                </div>
              </button>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
              {openComments.has(post.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-white/5"
                >
                  <div className="px-5 py-4 space-y-4">
                    {(post._commentData || []).map((comment: any) => (
                      <div key={comment.id} className="space-y-2">
                        {/* NPC comment */}
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">
                            {comment.username[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-[12px] font-black text-white">{comment.username}</span>
                              <span className="text-[10px] text-gray-600">{comment.time}</span>
                            </div>
                            <p className="text-[13px] text-gray-300 mt-0.5">{comment.text}</p>
                          </div>
                        </div>

                        {/* Character reply */}
                        {comment.reply && (
                          <div className="ml-10 flex gap-3">
                            <div className="w-6 h-6 rounded-full overflow-hidden border border-primary/40 flex-shrink-0">
                              <img src={comment.reply.avatarUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 bg-primary/5 rounded-xl px-3 py-2 border border-primary/10">
                              <div className="flex items-baseline gap-2">
                                <span className="text-[12px] font-black text-primary">{comment.reply.characterName}</span>
                                <span className="text-[10px] text-gray-600">{comment.reply.time}</span>
                              </div>
                              <p className="text-[13px] text-gray-300 mt-0.5">{comment.reply.text}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Comment input */}
                    <div className="flex gap-3 pt-2 border-t border-white/5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">
                        나
                      </div>
                      <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                        <input
                          className="flex-1 bg-transparent text-[13px] text-white placeholder-gray-600 outline-none"
                          placeholder="댓글 달기..."
                        />
                        <button className="text-primary hover:text-primary/70 transition-colors">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        ))}
      </div>
    </main>
  );
}
