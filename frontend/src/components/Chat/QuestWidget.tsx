'use client';

import React, { useState } from 'react';
import { Target, CheckCircle2, Circle, ChevronRight, Trophy, Zap } from 'lucide-react';

interface Quest {
  id: string;
  title: string;
  description: string;
  progress: number;
  max: number;
  isCompleted: boolean;
  reward: string;
}

interface QuestWidgetProps {
  favorability: number;
  messageCount: number;
  characterCount: number;
}

const QuestWidget: React.FC<QuestWidgetProps> = ({ favorability, messageCount, characterCount }) => {
  const [isOpen, setIsOpen] = useState(false);

  const quests: Quest[] = [
    {
      id: '1',
      title: '첫 대화 나누기',
      description: '캐릭터에게 먼저 말을 걸어보세요.',
      progress: messageCount > 0 ? 1 : 0,
      max: 1,
      isCompleted: messageCount > 0,
      reward: '칭호: 초보 대화가'
    },
    {
      id: '2',
      title: '친밀감 형성',
      description: '호감도를 20% 이상 달성하세요.',
      progress: Math.min(favorability, 20),
      max: 20,
      isCompleted: favorability >= 20,
      reward: '캐릭터 코스튬 해금'
    },
    {
      id: '3',
      title: '트리플 챗!',
      description: '3명 이상의 캐릭터와 동시에 대화하세요.',
      progress: Math.min(characterCount, 3),
      max: 3,
      isCompleted: characterCount >= 3,
      reward: '그룹 채팅 배경 해금'
    }
  ];

  const completedCount = quests.filter(q => q.isCompleted).length;

  return (
    <div className={`fixed right-4 top-24 z-40 transition-all duration-500 ${isOpen ? 'w-72' : 'w-12'}`}>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${
          isOpen ? 'bg-primary text-white scale-90 -mb-2' : 'bg-surface/80 backdrop-blur-xl text-primary hover:scale-110 active:scale-95 border border-white/5'
        }`}
      >
        {isOpen ? <ChevronRight className="w-6 h-6" /> : <Target className="w-6 h-6 animate-pulse" />}
      </button>

      {/* Quest List */}
      {isOpen && (
        <div className="mt-4 glass-card border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-right-4 duration-300">
          <div className="p-4 bg-primary/10 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-yellow-500" /> 오늘의 퀘스트
            </h3>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {completedCount}/{quests.length}
            </span>
          </div>

          <div className="p-2 space-y-1">
            {quests.map((quest) => (
              <div 
                key={quest.id}
                className={`p-3 rounded-2xl transition-all ${
                  quest.isCompleted ? 'bg-white/[0.02] opacity-60' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {quest.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-black mb-0.5 ${quest.isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {quest.title}
                    </p>
                    <p className="text-[9px] text-gray-500 leading-tight mb-2">
                      {quest.description}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${quest.isCompleted ? 'bg-green-500' : 'bg-primary'}`}
                        style={{ width: `${(quest.progress / quest.max) * 100}%` }}
                      />
                    </div>

                    {!quest.isCompleted && (
                       <div className="mt-2 flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-yellow-500" />
                          <span className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">Reward: {quest.reward}</span>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-white/[0.02] border-t border-white/5">
             <p className="text-[9px] text-gray-500 text-center font-bold">퀘스트 완료 시 특별한 보상이 지급됩니다.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestWidget;
