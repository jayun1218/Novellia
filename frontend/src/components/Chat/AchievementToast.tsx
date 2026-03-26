'use client';

import React from 'react';
import { Trophy, Star, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Achievement {
  id: string;
  name: string;
  description: string;
  title?: string;
}

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export default function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  React.useEffect(() => {
    if (achievement) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.8 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md"
        >
          <div className="relative overflow-hidden bg-zinc-900/90 backdrop-blur-2xl border border-yellow-500/30 rounded-[32px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(234,179,8,0.2)]">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />
            
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/20 rounded-2xl blur-md animate-pulse" />
                <div className="relative w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Trophy className="w-8 h-8 text-white drop-shadow-md" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded-full">New Achievement</span>
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                </div>
                <h3 className="text-lg font-black text-white leading-tight mb-1">{achievement.name}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{achievement.description}</p>
                {achievement.title && (
                   <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 font-bold">획득 칭호:</span>
                      <span className="text-[11px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
                         {achievement.title}
                      </span>
                   </div>
                )}
              </div>
            </div>

            {/* Confetti Particles (CSS Only simple ones) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               <div className="absolute top-0 left-1/4 w-1 h-1 bg-yellow-500 rounded-full animate-ping" />
               <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
