'use client';

import React from 'react';
import { MapPin, X, Navigation, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Location {
  id: string;
  name: string;
  description: string;
  coords: [number, number]; // [x, y] percentage
  bg_url?: string;
}

interface MapOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  currentLocationId: string;
  onMove: (loc: Location) => void;
  thumbnailUrl: string;
}

export default function MapOverlay({ isOpen, onClose, locations, currentLocationId, onMove, thumbnailUrl }: MapOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
        >
          <div className="relative w-full max-w-2xl bg-[#121212] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Navigation className="w-5 h-5 text-primary" />
                <h2 className="font-black text-xl">월드맵 네비게이션</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Map Area */}
            <div className="relative aspect-video bg-[#0a0a0a] overflow-hidden">
               {/* Map Background (Blurred Thumbnail) */}
               <div 
                 className="absolute inset-0 opacity-30 grayscale saturate-0"
                 style={{ backgroundImage: `url(${thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
               />
               
               {/* Grid Pattern */}
               <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px]" />

               {/* Location Markers */}
               {locations.map((loc) => (
                 <motion.button
                   key={loc.id}
                   whileHover={{ scale: 1.1 }}
                   whileTap={{ scale: 0.9 }}
                   onClick={() => onMove(loc)}
                   className="absolute group z-10"
                   style={{ left: `${loc.coords[0]}%`, top: `${loc.coords[1]}%`, transform: 'translate(-50%, -50%)' }}
                 >
                   {/* Marker Aura */}
                   {currentLocationId === loc.id && (
                     <div className="absolute inset-0 bg-primary/40 rounded-full animate-ping" />
                   )}
                   
                   <div className={`relative p-2 rounded-full border-2 transition-all duration-300 ${
                     currentLocationId === loc.id 
                     ? 'bg-primary border-white scale-110 shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]' 
                     : 'bg-zinc-900 border-white/20 group-hover:border-primary'
                   }`}>
                     <MapPin className={`w-5 h-5 ${currentLocationId === loc.id ? 'text-white' : 'text-gray-400 group-hover:text-primary'}`} />
                   </div>

                   {/* Label */}
                   <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-black">{loc.name}</span>
                   </div>
                 </motion.button>
               ))}
            </div>

            {/* Info Footer */}
            <div className="p-8 bg-zinc-900/50">
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-2xl">
                    <Info className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black mb-1">장소 이동 안내</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      지도의 마커를 선택하여 해당 장소로 이동할 수 있습니다. <br/>
                      새로운 장소로 이동하면 서사가 그곳에 맞춰 새롭게 전개됩니다.
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
