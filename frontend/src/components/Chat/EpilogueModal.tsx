'use client';

import React from 'react';
import { Book, X, Sparkles, Download, Share2, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface EpilogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  epilogue: string;
  loading: boolean;
  onRestart: () => void;
}

export default function EpilogueModal({ isOpen, onClose, epilogue, loading, onRestart }: EpilogueModalProps) {
  const router = useRouter();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-[48px] overflow-hidden shadow-2xl my-auto"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
        
        <div className="p-10 pt-16">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-8">
               <div className="relative">
                 <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                 <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
               </div>
               <div className="text-center">
                 <h2 className="text-2xl font-black mb-3 italic">당신의 여정을 기록하는 중...</h2>
                 <p className="text-gray-500 text-sm animate-pulse">함께했던 시간들이 한 권의 소설로 엮이고 있습니다.</p>
               </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-10">
                <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center border border-primary/20">
                  <Book className="w-10 h-10 text-primary" />
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-300 leading-relaxed font-serif text-lg text-center px-4">
                  {epilogue}
                </div>
              </div>

              <div className="mt-16 grid grid-cols-2 gap-4">
                <button 
                  onClick={() => router.push('/library')}
                  className="py-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-3xl border border-white/5 transition-all flex items-center justify-center gap-3"
                >
                  <Home className="w-5 h-5" />
                  서재로 돌아가기
                </button>
                <button 
                  onClick={onRestart}
                  className="py-5 bg-primary text-white font-black rounded-3xl shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  <Sparkles className="w-5 h-5" />
                  새로운 시작
                </button>
              </div>

              <div className="mt-8 flex justify-center gap-6">
                 <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">
                    <Download className="w-4 h-4" /> 기록 저장
                 </button>
                 <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">
                    <Share2 className="w-4 h-4" /> 소문내기
                 </button>
              </div>
            </>
          )}
        </div>

        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6 border-white/20" />
        </button>
      </motion.div>
    </div>
  );
}
