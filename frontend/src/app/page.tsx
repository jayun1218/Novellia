import React from 'react';
import CharacterCard from '@/components/Main/CharacterCard';
import { Sparkles } from 'lucide-react';

const characters = [
  {
    id: "sn1",
    name: "서연호",
    description: "내 모든 것이 당신을 향해 집착하고 있어요. 도망칠 수 있을 거라 생각했나요?",
    tags: ["집착공", "얀데레", "미인공", "안경"],
    chatCount: "15.4k",
    avatarUrl: "/seoyeonho.png"
  },
  {
    id: "bk2",
    name: "강백현",
    description: "어이, 너. 나랑 재미 좀 볼래? 인생 짧잖아, 안 그래? 고민하지 말고 따라와.",
    tags: ["반항아", "플레이보이", "능글남", "타투/피어싱"],
    chatCount: "12.8k",
    avatarUrl: "/baekhyun.png"
  },
  {
    id: "yj3",
    name: "윤제이",
    description: "...용건 형식이 없군요. 용건만 말하고 나가주세요. 제 시간은 당신 생각보다 비싸거든요.",
    tags: ["냉혈남", "엘리트", "오만", "비즈니스"],
    chatCount: "9.2k",
    avatarUrl: "/yunjay.png"
  },
  {
    id: "1",
    name: "엘리나",
    description: "창가 자리에 앉아 당신을 기다리는 신비로운 소녀. 오늘은 어떤 이야기가 우리를 기다릴까요?",
    tags: ["청순", "신비로움", "카페", "로맨틱"],
    chatCount: "8.5k",
    avatarUrl: "/avatar.png"
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background pb-32">
      {/* Hero Section */}
      <section className="px-6 pt-16 md:pt-24 pb-12 text-center md:text-left md:px-12 max-w-6xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Novellia Beta Open
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-white">
          이야기가 현실이 되는 곳,<br />
          <span className="text-primary">Novellia</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-lg max-w-[450px] leading-relaxed">
          당신의 상상 속 캐릭터가 살아 숨 쉬는 공간. 지금 가장 핫한 캐릭터들과 잊지 못할 이야기를 시작하세요.
        </p>
      </section>

      {/* Character Grid */}
      <section className="px-6 md:px-12 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
            Trending 캐릭터 <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </h2>
          <button className="text-sm text-gray-400 hover:text-white transition-colors font-medium">인기순 보기</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {characters.map((char) => (
            <CharacterCard key={char.id} {...char} />
          ))}
        </div>
      </section>

      {/* Story Genres */}
      <section className="mt-12 px-6 md:px-12 max-w-6xl pb-10">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Genre Explore</h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4">
          {["심리 스릴러", "다크 로맨스", "동양 판타지", "청춘 학원물", "오피스 라이프", "가상현실"].map((cat) => (
            <button key={cat} className="px-6 py-2.5 rounded-xl bg-surface border border-white/5 text-sm text-gray-400 hover:text-white hover:border-primary/50 hover:bg-primary/5 transition-all flex-shrink-0">
              {cat}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
