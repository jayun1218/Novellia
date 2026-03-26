'use client';

import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoreTooltipProps {
  name: string;
  content: string;
  show: boolean;
}

export default function LoreTooltip({ name, content, show }: LoreTooltipProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-[150] w-64 pointer-events-none"
        >
          <div className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-2xl relative">
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a1a1a] border-r border-b border-primary/30 rotate-45 -mt-1.5" />
            
            <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-black text-white uppercase tracking-wider">{name}</span>
              <Sparkles className="w-3 h-3 text-primary ml-auto opacity-50" />
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed break-words">
              {content}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
