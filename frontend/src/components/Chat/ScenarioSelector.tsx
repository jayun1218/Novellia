import React from 'react';
import { X, Trophy, Flame, Utensils, ChevronRight } from 'lucide-react';

interface Scenario {
  id: string;
  title: string;
  description: string;
  goal: string;
}

interface ScenarioSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (scenarioId: string) => void;
  scenarios: Scenario[];
}

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ isOpen, onClose, onSelect, scenarios }) => {
  if (!isOpen) return null;

  const getIcon = (id: string) => {
    switch (id) {
      case 'practice': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'training_camp': return <Utensils className="w-5 h-5 text-green-400" />;
      case 'match_verge': return <Trophy className="w-5 h-5 text-yellow-400" />;
      default: return <ChevronRight className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card p-8 space-y-6 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-xl text-primary">
              <Trophy className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white">시나리오 선택</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-400 leading-relaxed font-medium">
          특정 상황에 몰입하여 캐릭터와 더욱 깊은 대화를 나눠보세요.
        </p>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => {
                onSelect(scenario.id);
                onClose();
              }}
              className="w-full group relative p-5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/50 rounded-[28px] text-left transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1.5 bg-white/5 rounded-lg group-hover:scale-110 transition-transform">
                  {getIcon(scenario.id)}
                </div>
                <h3 className="font-bold text-white group-hover:text-primary transition-colors">{scenario.title}</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">{scenario.description}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full">
                <span className="text-[10px] font-black text-primary uppercase tracking-wider">Goal: {scenario.goal}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScenarioSelector;
