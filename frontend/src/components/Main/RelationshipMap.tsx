'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, User } from 'lucide-react';

interface CharacterNode {
  id: string;
  name: string;
  avatar: string;
  favorability: number;
}

interface RelationshipMapProps {
  characters: CharacterNode[];
  userName?: string;
}

const RelationshipMap: React.FC<RelationshipMapProps> = ({ characters, userName = "나" }) => {
  const radius = 220; // 배치 반경

  return (
    <div className="relative w-full aspect-square max-w-[600px] mx-auto flex items-center justify-center overflow-visible p-12">
      {/* Background Rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="absolute rounded-full border border-white/5"
            style={{ 
              width: `${(i / 3) * 100}%`, 
              height: `${(i / 3) * 100}%`,
              opacity: 1 - (i * 0.2)
            }}
          />
        ))}
      </div>

      {/* Center Node (User) */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 p-1 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]"
      >
        <div className="w-full h-full rounded-full bg-surface-dark flex items-center justify-center overflow-hidden border-2 border-white/10">
          <User className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-black text-white/50 uppercase tracking-widest whitespace-nowrap">
          {userName}
        </div>
      </motion.div>

      {/* Character Nodes */}
      {characters.map((char, index) => {
        const angle = (index / characters.length) * Math.PI * 2;
        // 호감도가 높을수록 중심에 더 가까워짐
        const favFactor = 0.5 + (1 - char.favorability / 100) * 0.5;
        const x = Math.cos(angle) * (radius * favFactor);
        const y = Math.sin(angle) * (radius * favFactor);

        return (
          <motion.div
            key={char.id}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: 1, x, y }}
            transition={{ delay: index * 0.1, type: 'spring', damping: 12 }}
            className="absolute z-20"
          >
            <div className="relative group flex flex-col items-center">
              {/* Connection Line */}
              <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none overflow-visible opacity-20 group-hover:opacity-50 transition-opacity">
                <line 
                  x1={200} y1={200} 
                  x2={200 - x} y2={200 - y} 
                  stroke="currentColor" 
                  strokeWidth="1" 
                  strokeDasharray="4 4"
                  className="text-primary"
                />
              </svg>

              <div className="relative">
                <div className={`w-14 h-14 rounded-full p-0.5 bg-gradient-to-br transition-all duration-500 group-hover:scale-110 ${
                  char.favorability > 80 ? 'from-rose-500 to-pink-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' :
                  char.favorability > 50 ? 'from-blue-500 to-indigo-500' :
                  'from-gray-500 to-slate-500'
                }`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-surface-dark border border-white/10">
                    <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Favorability Badge */}
                <div className="absolute -top-1 -right-1 bg-surface-dark border border-white/10 px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                  <Heart className={`w-2.5 h-2.5 ${char.favorability > 50 ? 'text-rose-500 fill-rose-500' : 'text-gray-400'}`} />
                  <span className="text-[9px] font-bold text-white">{char.favorability}</span>
                </div>
              </div>

              <div className="mt-3 text-center">
                <div className="text-[12px] font-bold text-white group-hover:text-primary transition-colors">{char.name}</div>
                <div className="text-[9px] text-gray-500 font-medium">{char.favorability > 80 ? '운명의 상대' : char.favorability > 50 ? '가까운 동료' : '아는 사이'}</div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default RelationshipMap;
