'use client';

import React, { useState } from 'react';
import { Save, Sparkles, Image as ImageIcon, BookOpen, MessageSquare, Plus, RefreshCw, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CreateCharacterPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  
  // States for character data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    greeting: '',
    persona: '',
    dialogueExamples: '',
    tags: [] as string[],
    newTag: '',
    lorebook: [] as { key: string; value: string }[],
    avatar_url: '',
  });

  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImgIndex, setSelectedImgIndex] = useState<number | null>(null);
  const [visualPrompt, setVisualPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addTag = () => {
    if (formData.newTag && !formData.tags.includes(formData.newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, formData.newTag],
        newTag: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert('캐릭터 이름을 입력해주세요!');
      return;
    }
    
    setIsLoading(true);
    try {
      // Simulate/Implement API Call
      const response = await fetch('http://localhost:8000/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          greeting: formData.greeting,
          persona: formData.persona,
          tags: formData.tags,
          avatar_url: formData.avatar_url,
        }),
      });
      
      if (response.ok) {
        alert('캐릭터가 성공적으로 소환되었습니다!');
        router.push('/');
      }
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!visualPrompt) {
      alert('생성할 외모 묘사를 입력해주세요!');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedImages([]);
    
    try {
      // DALL-E 3의 고퀄리티를 위해 3개 정도 시안을 동시 생성 시도
      const promises = [1, 2, 3].map(() => 
        fetch('http://localhost:8000/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: visualPrompt }),
        }).then(res => res.json())
      );

      const results = await Promise.all(promises);
      const urls = results.filter(r => r.url).map(r => r.url);
      
      if (urls.length > 0) {
        setGeneratedImages(urls);
      } else {
        alert('이미지 생성에 실패했습니다. API 키를 확인해주세요.');
      }
    } catch (error) {
      console.error(error);
      alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectImage = (index: number, url: string) => {
    setSelectedImgIndex(index);
    setFormData(prev => ({ ...prev, avatar_url: url }));
  };

  const autoGeneratePersona = () => {
    const { name, description, tags } = formData;
    if (!name) {
      alert('이름을 먼저 입력하면 더 정확하게 생성됩니다!');
      return;
    }

    const tagStr = tags.length > 0 ? `(${tags.join(', ')})` : '';
    const descStr = description ? `\n\n[배경 정보]: ${description}` : '';
    
    const generated = `${name}${tagStr} 은(는) ${tags.includes('#집착') ? '강렬한 소유욕을 가졌으며' : '독특한 개성을 가진'} 인물입니다. 
말투는 ${tags.includes('#냉혈남') ? '차갑고 사무적이지만' : '부드러우면서도 단호하며'}, 상대방의 의도를 꿰뚫어 보는 듯한 통찰력을 가지고 있습니다. 
주로 조용히 혼자 있는 것을 즐기며, 자신의 비밀을 쉽게 드러내지 않는 신비주의적인 면모가 강합니다.${descStr}

위의 설정들을 바탕으로 사용자와의 대화에서 일관성 있는 태도를 유지합니다.`;

    setFormData(prev => ({ ...prev, persona: generated }));
  };

  return (
    <div className="min-h-screen bg-background pb-32 pt-10 px-6 md:px-12 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">캐릭터 창조</h1>
          <p className="text-gray-400">당신의 상상 속 존재에게 생명력을 불어넣으세요.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 완성하기
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-surface border border-white/5 rounded-2xl mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'basic', label: '기본 정보', icon: Sparkles },
          { id: 'persona', label: '페르소나', icon: MessageSquare },
          { id: 'lore', label: '로어북', icon: BookOpen },
          { id: 'visual', label: '비주얼', icon: ImageIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all flex-shrink-0 ${
              activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 ml-1">이름</label>
              <input name="name" value={formData.name} onChange={handleInputChange} type="text" placeholder="캐릭터의 이름을 입력하세요" className="w-full bg-surface border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 ml-1">태그</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold">
                    {tag} <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input name="newTag" value={formData.newTag} onChange={handleInputChange} onKeyPress={(e) => e.key === 'Enter' && addTag()} type="text" placeholder="태그 입력 (예: #츤데레)" className="flex-1 bg-surface border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/50" />
                <button onClick={addTag} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold border border-white/5 transition-all">추가</button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 ml-1">한 줄 설명</label>
              <input name="description" value={formData.description} onChange={handleInputChange} type="text" placeholder="캐릭터를 한 문장으로 정의한다면?" className="w-full bg-surface border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-400 ml-1">첫 대사 (Greeting)</label>
              <textarea name="greeting" value={formData.greeting} onChange={handleInputChange} rows={3} placeholder="사용자가 대화방에 입장했을 때 건낼 첫 마디입니다." className="w-full bg-surface border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all resize-none" />
            </div>
          </div>
        </div>
      )}

      {/* Persona Tab */}
      {activeTab === 'persona' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-gray-400 ml-1">성격 및 배경 (Persona)</label>
            <button onClick={autoGeneratePersona} className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
              <Sparkles className="w-3 h-3" /> AI로 자동 채우기
            </button>
          </div>
          <textarea name="persona" value={formData.persona} onChange={handleInputChange} rows={8} placeholder="성격, 습관, 비밀, 말투의 특징 등을 상세하게 적어주세요. 많이 적을수록 더 생생하게 반응합니다." className="w-full bg-surface border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all resize-none" />
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 ml-1">대화 예시 (Dialogue Examples)</label>
            <textarea name="dialogueExamples" value={formData.dialogueExamples} onChange={handleInputChange} rows={5} placeholder="사용자: 안녕?\n캐릭터: 흥, 또 왔나? 귀찮으니까 저리 가." className="w-full bg-surface border border-white/5 rounded-2xl p-4 text-white font-mono text-sm focus:outline-none focus:border-primary/50 transition-all resize-none" />
          </div>
        </div>
      )}

      {/* Lore Tab */}
      {activeTab === 'lore' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4">
            <div className="p-2 bg-primary/20 rounded-lg"><BookOpen className="w-5 h-5 text-primary" /></div>
            <div>
              <h4 className="font-bold text-white mb-1">로어북 (Lorebook)이란?</h4>
              <p className="text-sm text-gray-400 leading-relaxed">특정 단어가 대화 중에 등장하면 AI가 해당 설정을 기억해냅니다. 복잡한 세계관이나 인물 관계를 설정할 때 유용합니다.</p>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 w-full p-4 border border-dashed border-white/10 rounded-2xl text-gray-400 hover:text-white hover:border-primary/50 transition-all">
            <Plus className="w-5 h-5" /> 새로운 로어 항목 추가
          </button>
        </div>
      )}

      {/* Visual Tab */}
      {activeTab === 'visual' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col items-center justify-center p-8 bg-surface border border-dashed border-white/10 rounded-3xl group transition-all">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-bold text-white mb-2">프롬프트로 아바타 생성</h4>
            <p className="text-gray-400 text-sm text-center mb-6 max-w-xs">원하는 외모를 묘사하면 Novellia AI가 5가지 시안을 그려드립니다.</p>
            <div className="flex w-full gap-2">
              <input 
                type="text" 
                value={visualPrompt}
                onChange={(e) => setVisualPrompt(e.target.value)}
                placeholder="예: 검은 머리에 안경을 쓴 차가운 미청년..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary" 
              />
              <button 
                onClick={handleGenerateImages}
                disabled={isGenerating}
                className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : '생성'}
              </button>
            </div>
          </div>

          {generatedImages.length > 0 && !isGenerating && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <h4 className="text-sm font-bold text-gray-400 ml-1">생성된 시안 중 하나를 선택하세요</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {generatedImages.map((img, index) => (
                  <div 
                    key={index}
                    onClick={() => selectImage(index, img)}
                    className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedImgIndex === index ? 'border-primary scale-105 shadow-xl shadow-primary/20' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Candidate ${index + 1}`} className="w-full h-full object-cover" />
                    {selectedImgIndex === index && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-white p-1 rounded-full"><Plus className="w-4 h-4 rotate-45" /></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateCharacterPage;
