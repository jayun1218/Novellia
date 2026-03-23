'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Download, Share2, ZoomIn, X, Clock, User } from 'lucide-react';
import Sidebar from '@/components/Layout/Sidebar';
import BottomNav from '@/components/Layout/BottomNav';

interface GalleryImage {
  url: string;
  char_id: string;
  timestamp: string;
  content: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/gallery');
      if (res.ok) {
        const data = await res.json();
        setImages(data);
      }
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Sidebar />
      <main className="md:ml-64 min-h-screen pb-32">
        {/* Header Section */}
        <div className="relative h-[300px] flex items-center justify-center overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent z-0" />
          <div className="relative z-10 text-center px-6">
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">AI 갤러리</h1>
            <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto font-medium">
              대화 중 생성된 모든 순간들이 이곳에 기록됩니다. 당신만의 특별한 추억을 간직하세요.
            </p>
          </div>
          {/* Decorative elements */}
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-[80px]" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-[80px]" />
        </div>

        {/* Gallery Grid */}
        <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-3xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.02]">
              <ImageIcon className="w-16 h-16 text-gray-700 mb-6" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">아직 기록된 순간이 없어요</h3>
              <p className="text-gray-600 text-sm">캐릭터와 대화하며 특별한 이미지를 생성해보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((image, index) => (
                <div 
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  className="group relative aspect-[3/4] rounded-[32px] overflow-hidden cursor-pointer bg-white/5 hover:ring-4 hover:ring-primary/30 transition-all duration-500"
                >
                  <img 
                    src={image.url} 
                    alt="" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Overlay Info */}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-bold text-white/90">{image.timestamp}</span>
                     </div>
                     <p className="text-[11px] text-gray-300 line-clamp-2 leading-snug">{image.content}</p>
                  </div>
                  {/* Quick Action Button */}
                  <div className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Image Detail View Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-black/98 backdrop-blur-xl"
            onClick={() => setSelectedImage(null)}
          />
          <div className="relative w-full max-w-5xl max-h-full flex flex-col md:flex-row gap-8 z-10 animate-in zoom-in-95 duration-300">
            {/* Image Side */}
            <div className="flex-1 relative rounded-[40px] overflow-hidden shadow-2xl bg-white/5 flex items-center justify-center">
              <img 
                src={selectedImage.url} 
                className="max-w-full max-h-[80vh] object-contain shadow-2xl"
                alt="Enlarged" 
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-6 left-6 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all backdrop-blur-md"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Info Side */}
            <div className="w-full md:w-[350px] flex flex-col justify-center">
              <div className="glass-card p-8 space-y-8 h-fit">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-primary/20 rounded-xl text-primary">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">Moment Info</span>
                  </div>
                  <h2 className="text-2xl font-black text-white mb-4 leading-tight">생성된 장면</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <User className="w-4 h-4" />
                      <span className="font-bold">{selectedImage.char_id}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="font-bold">{selectedImage.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-sm text-gray-300 leading-relaxed font-medium italic">
                    "{selectedImage.content}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedImage.url;
                      link.download = `moment-${Date.now()}.png`;
                      link.click();
                    }}
                    className="flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    <Download className="w-5 h-5" /> 저장
                  </button>
                  <button className="flex items-center justify-center gap-2 py-4 bg-white/5 text-white rounded-2xl font-black hover:bg-white/10 transition-all border border-white/10">
                    <Share2 className="w-5 h-5" /> 공유
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
