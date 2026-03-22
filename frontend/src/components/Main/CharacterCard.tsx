import React from 'react';
import Link from 'next/link';
import { MessageSquare, Heart } from 'lucide-react';

interface CharacterCardProps {
  id: string;
  name: string;
  description: string;
  tags: string[];
  chatCount: string;
  avatarUrl: string;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ id, name, description, tags, chatCount, avatarUrl }) => {
  return (
    <Link href={`/chat/${id}`} className="block group">
      <div className="glass-card overflow-hidden hover:border-primary/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
        <div className="relative aspect-[4/5] overflow-hidden">
          <img 
            src={avatarUrl} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80" />
          
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md">{name}</h3>
            <p className="text-xs text-gray-300 line-clamp-2 mb-3 leading-relaxed drop-shadow-sm">
              {description}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-full text-[10px] text-primary-foreground/80 border border-white/5">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
            <MessageSquare className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-medium text-white">{chatCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CharacterCard;
