'use client'

import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Sparkles } from 'lucide-react';

const mockFeedPosts = [
  {
    id: 1,
    characterName: '미야 아츠무',
    avatarUrl: 'http://127.0.0.1:8000/uploads/atsumu.png',
    content: '배구공 만지고 싶다. 연습하러 갈 사람? 🏐',
    imageUrl: 'http://127.0.0.1:8000/uploads/atsumu.png',
    time: '방금 전',
    likes: 124,
    comments: 18,
    isLiked: false
  },
  {
    id: 2,
    characterName: '코즈메 켄마',
    avatarUrl: 'http://127.0.0.1:8000/uploads/59994031-e4c1-4309-a1bb-6de10bd7d3e6.webp',
    content: '신작 게임 너무 어렵네... (집에서 안 나갈 거야)',
    time: '2시간 전',
    likes: 89,
    comments: 5,
    isLiked: false
  },
  {
    id: 3,
    characterName: '쿠로오 테츠로',
    avatarUrl: 'http://127.0.0.1:8000/uploads/99dc26ec-5ab7-426a-8380-a138e248231f.webp',
    content: '오늘도 혈액 순환이 잘 되는군. 오야오야?',
    time: '5시간 전',
    likes: 210,
    comments: 32,
    isLiked: false
  }
];

export default function FeedPage() {
  const [posts, setPosts] = useState(mockFeedPosts);

  const handleLike = (id: number) => {
    setPosts(prev => prev.map(post => {
      if (post.id === id) {
        const isCurrentlyLiked = post.isLiked;
        return { 
          ...post, 
          isLiked: !isCurrentlyLiked,
          likes: isCurrentlyLiked ? post.likes - 1 : post.likes + 1 
        };
      }
      return post;
    }));
  };

  return (
    <main className="min-h-screen bg-background pb-32">
      {/* Feed Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          Feed <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        </h1>
        <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400">
          <Sparkles className="w-5 h-5" />
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
        {posts.map((post) => (
          <article key={post.id} className="bg-surface border border-white/5 rounded-3xl overflow-hidden transition-transform hover:scale-[1.01] duration-300">
            {/* Post Header */}
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                  <img src={post.avatarUrl} alt={post.characterName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-tight">{post.characterName}</h3>
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">{post.time}</p>
                </div>
              </div>
              <button className="text-gray-500 hover:text-white transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Post Content */}
            <div className="px-5 pb-4">
              <p className="text-gray-300 text-[15px] leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            {/* Post Image (Optional) */}
            {post.imageUrl && (
              <div className="px-5 pb-5">
                <div className="rounded-2xl overflow-hidden border border-white/5 aspect-video bg-black/20">
                  <img src={post.imageUrl} alt="post content" className="w-full h-full object-cover opacity-90 transition-opacity hover:opacity-100 duration-500" />
                </div>
              </div>
            )}

            {/* Post Actions */}
            <div className="px-5 py-4 border-t border-white/5 flex items-center gap-6">
              <button 
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-2 group transition-colors ${post.isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
              >
                <div className={`p-2 rounded-full transition-colors ${post.isLiked ? 'bg-red-400/10' : 'group-hover:bg-red-400/10'}`}>
                  <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-red-400 text-red-400' : ''}`} />
                </div>
                <span className="text-sm font-medium">{post.likes}</span>
              </button>
              <button className="flex items-center gap-2 group text-gray-400 hover:text-primary transition-colors">
                <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{post.comments}</span>
              </button>
              <button className="flex items-center gap-2 ml-auto group text-gray-400 hover:text-white transition-colors">
                <div className="p-2 rounded-full group-hover:bg-white/10 transition-colors">
                  <Share2 className="w-5 h-5" />
                </div>
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
