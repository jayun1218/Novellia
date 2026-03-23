'use client';

import React, { useState } from 'react';
import { Save, Sparkles, Image as ImageIcon, BookOpen, MessageSquare, Plus, RefreshCw, X, Settings, Zap, ChevronDown, ChevronUp, Upload, Compass } from 'lucide-react';
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
    speech_style: '일반',
    response_length: '보통',
    expression_mode: '균형',
    plot_speed: '보통',
    atmosphere: '일반',
    storytelling_style: '1인칭',
    use_status_window: false,
    status_config: {
      background: ["날짜", "시간", "장소", "날씨", "상황"],
      character: ["기분", "컨디션", "착장", "포즈", "목표", "관계성", "속마음", "소지품"]
    },
    lorebook: [] as { name: string; keywords: string[]; content: string }[],
    avatar_url: '',
    is_public: true,
  });

  const [newLore, setNewLore] = useState({ name: '', keywords: '', content: '' });

  const addLoreEntry = () => {
    if (newLore.name && newLore.content) {
      setFormData(prev => ({
        ...prev,
        lorebook: [
          ...prev.lorebook, 
          { 
            name: newLore.name, 
            keywords: newLore.keywords.split(',').map(k => k.trim()).filter(k => k), 
            content: newLore.content 
          }
        ]
      }));
      setNewLore({ name: '', keywords: '', content: '' });
    } else {
      alert('이름과 내용은 필수입니다.');
    }
  };

  const removeLoreEntry = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lorebook: prev.lorebook.filter((_, i) => i !== index)
    }));
  };

  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImgIndex, setSelectedImgIndex] = useState<number | null>(null);
  const [visualPrompt, setVisualPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false); // For image generation

  // New states for Namuwiki auto-fill
  const [namuUrl, setNamuUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

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
      const response = await fetch('http://127.0.0.1:8000/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          greeting: formData.greeting,
          persona: formData.persona,
          tags: formData.tags,
          speech_style: formData.speech_style,
          response_length: formData.response_length,
          expression_mode: formData.expression_mode,
          plot_speed: formData.plot_speed,
          atmosphere: formData.atmosphere,
          storytelling_style: formData.storytelling_style,
          use_status_window: formData.use_status_window,
          status_config: formData.status_config,
          lorebook: formData.lorebook,
          avatar_url: formData.avatar_url,
          is_public: formData.is_public,
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
        fetch('http://127.0.0.1:8000/generate-image', {
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    setIsGenerating(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });
      const data = await response.json();
      if (data.url) {
        setFormData(prev => ({ ...prev, avatar_url: data.url }));
        setSelectedImgIndex(-1); // Special index for custom upload
      }
    } catch (error) {
      console.error(error);
      alert('업로드 중 오류가 발생했습니다.');
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

  const handleNamuAutoFill = async () => {
    if (!namuUrl) {
      alert('나무위키 URL을 입력해주세요!');
      return;
    }
    setIsScraping(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/scrape-namuwiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: namuUrl }),
      });
      const data = await response.json();
      if (response.ok && data) {
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          description: data.description || prev.description,
          persona: data.persona || prev.persona,
          greeting: data.greeting || prev.greeting,
          speech_style: data.speech_style || prev.speech_style,
          tags: data.tags ? [...new Set([...prev.tags, ...data.tags.map((t: string) => t.replace('#', ''))])] : prev.tags,
          lorebook: data.lorebook || prev.lorebook,
        }));
        alert('나무위키 정보로 캐릭터가 마법처럼 채워졌습니다! ✨');
      } else {
        alert(data.error || '나무위키 정보를 가져오는 데 실패했습니다.');
      }
    } catch (error) {
      console.error('나무위키 스크래핑 오류:', error);
      alert('나무위키 정보를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsScraping(false);
    }
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
          { id: 'advanced', label: '고급 설정', icon: Settings },
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
          {/* Public/Private Toggle */}
          <div className="p-6 bg-surface border border-white/5 rounded-3xl flex items-center justify-between group hover:border-primary/30 transition-all">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl transition-all ${formData.is_public ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-500'}`}><Compass className="w-6 h-6" /></div>
              <div>
                <h4 className="font-bold text-white mb-1">공개 캐릭터 설정</h4>
                <p className="text-xs text-gray-500">활성화하면 다른 사용자들이 이 캐릭터를 검색하고 대화할 수 있습니다.</p>
              </div>
            </div>
            <button 
              onClick={() => setFormData(prev => ({ ...prev, is_public: !prev.is_public }))}
              className={`w-14 h-8 rounded-full transition-all relative ${formData.is_public ? 'bg-primary' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.is_public ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* Namuwiki Auto-fill */}
          <div className="p-6 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold text-white">나무위키 링크로 자동 완성</h4>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={namuUrl}
                onChange={(e) => setNamuUrl(e.target.value)}
                placeholder="https://namu.wiki/w/캐릭터이름" 
                className="flex-1 bg-surface border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all text-sm" 
              />
              <button 
                onClick={handleNamuAutoFill}
                disabled={isScraping}
                className="px-6 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isScraping ? <RefreshCw className="w-4 h-4 animate-spin" /> : '마법봉 클릭'}
              </button>
            </div>
          </div>

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
              <label className="text-sm font-bold text-gray-400 ml-1">인트로 (상황극/첫 대사)</label>
              <textarea name="greeting" value={formData.greeting} onChange={handleInputChange} rows={4} placeholder="사용자가 대화방에 입장했을 때의 상황과 첫 마디를 적어주세요. 예: (당신을 빤히 바라보며) '드디어 왔네. 기다리고 있었어.'" className="w-full bg-surface border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all resize-none" />
              <p className="text-[10px] text-gray-500 ml-1">* 여러 줄을 입력하여 상세한 초기 상황을 설정할 수 있습니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* Persona Tab */}
      {activeTab === 'persona' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-400 ml-1">대화 스타일 (Manner of Speech)</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { id: '일반', label: '일반', desc: '표준' },
                { id: '반말', label: '반말', desc: '친근함' },
                { id: '존댓말', label: '존댓말', desc: '정중함' },
                { id: '시크함', label: '시크함', desc: '무심함' },
                { id: '다정함', label: '다정함', desc: '따뜻함' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setFormData(prev => ({ ...prev, speech_style: style.id }))}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                    formData.speech_style === style.id 
                      ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10' 
                      : 'bg-surface border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  <span className="text-sm font-bold mb-1">{style.label}</span>
                  <span className="text-[10px] opacity-60">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-400 ml-1">성격 및 배경 (Persona)</label>
              <button onClick={autoGeneratePersona} className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
                <Sparkles className="w-3 h-3" /> AI로 자동 채우기
              </button>
            </div>
            <textarea name="persona" value={formData.persona} onChange={handleInputChange} rows={8} placeholder="성격, 습관, 비밀, 말투의 특징 등을 상세하게 적어주세요. 많이 적을수록 더 생생하게 반응합니다." className="w-full bg-surface border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all resize-none" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 ml-1">대화 예시 (Dialogue Examples)</label>
            <textarea name="dialogueExamples" value={formData.dialogueExamples} onChange={handleInputChange} rows={5} placeholder="사용자: 안녕?\n캐릭터: 흥, 또 왔나? 귀찮으니까 저리 가." className="w-full bg-surface border border-white/5 rounded-2xl p-4 text-white font-mono text-sm focus:outline-none focus:border-primary/50 transition-all resize-none" />
          </div>
        </div>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-400 ml-1">응답 길이</label>
              <div className="flex gap-2">
                {['짧음', '보통', '긺'].map(v => (
                  <button key={v} onClick={() => setFormData(prev => ({ ...prev, response_length: v }))} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${formData.response_length === v ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-white/5 text-gray-400'}`}>{v}</button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-400 ml-1">전개 속도</label>
              <div className="flex gap-2">
                {['느림', '보통', '빠름'].map(v => (
                  <button key={v} onClick={() => setFormData(prev => ({ ...prev, plot_speed: v }))} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${formData.plot_speed === v ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-white/5 text-gray-400'}`}>{v}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-400 ml-1">표현 방식</label>
              <div className="flex gap-2">
                {['대화 위주', '균형', '지문 위주'].map(v => (
                  <button key={v} onClick={() => setFormData(prev => ({ ...prev, expression_mode: v }))} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${formData.expression_mode === v ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-white/5 text-gray-400'}`}>{v}</button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-400 ml-1">시점 (Perspective)</label>
              <div className="flex gap-2">
                {['1인칭', '3인칭', '관찰자'].map(v => (
                  <button key={v} onClick={() => setFormData(prev => ({ ...prev, storytelling_style: v }))} className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${formData.storytelling_style === v ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-white/5 text-gray-400'}`}>{v}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-400 ml-1">스토리 분위기 (Atmosphere)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['일반', '로맨틱', '다크', '코믹', '스릴러', '피폐', '일상'].map(v => (
                <button key={v} onClick={() => setFormData(prev => ({ ...prev, atmosphere: v }))} className={`py-3 rounded-xl border text-sm font-bold transition-all ${formData.atmosphere === v ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-white/5 text-gray-400'}`}>{v}</button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-surface border border-white/5 rounded-3xl flex items-center justify-between group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl transition-all ${formData.use_status_window ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-500'}`}><Zap className="w-6 h-6" /></div>
                <div>
                  <h4 className="font-bold text-white mb-1">상태창 활성화</h4>
                  <p className="text-xs text-gray-500">답변 끝에 호감도와 현재 상태를 요약해 보여줍니다.</p>
                </div>
              </div>
              <button 
                onClick={() => setFormData(prev => ({ ...prev, use_status_window: !prev.use_status_window }))}
                className={`w-14 h-8 rounded-full transition-all relative ${formData.use_status_window ? 'bg-primary' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.use_status_window ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {formData.use_status_window && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Background Status */}
                <div className="bg-surface border border-white/5 rounded-3xl overflow-hidden">
                  <div className="p-4 bg-white/5 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">배경 상태창</h4>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="p-4 space-y-3">
                    {["날짜", "시간", "장소", "날씨", "상황"].map(field => (
                      <div key={field} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-300">{field}</span>
                        <button 
                          onClick={() => {
                            const current = formData.status_config.background;
                            const next = current.includes(field) ? current.filter(f => f !== field) : [...current, field];
                            setFormData(prev => ({ ...prev, status_config: { ...prev.status_config, background: next } }));
                          }}
                          className={`w-10 h-5 rounded-full relative transition-all ${formData.status_config.background.includes(field) ? 'bg-primary' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.status_config.background.includes(field) ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Character Status */}
                <div className="bg-surface border border-white/5 rounded-3xl overflow-hidden">
                  <div className="p-4 bg-white/5 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">캐릭터 상태창</h4>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="p-4 space-y-3">
                    {["기분", "컨디션", "착장", "포즈", "목표", "관계성", "속마음", "소지품"].map(field => (
                      <div key={field} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-300">{field}</span>
                        <button 
                          onClick={() => {
                            const current = formData.status_config.character;
                            const next = current.includes(field) ? current.filter(f => f !== field) : [...current, field];
                            setFormData(prev => ({ ...prev, status_config: { ...prev.status_config, character: next } }));
                          }}
                          className={`w-10 h-5 rounded-full relative transition-all ${formData.status_config.character.includes(field) ? 'bg-primary' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.status_config.character.includes(field) ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
          {/* Lore List */}
          <div className="space-y-4">
            {formData.lorebook.map((entry, index) => (
              <div key={index} className="bg-surface border border-white/5 p-4 rounded-2xl relative group">
                <button 
                  onClick={() => removeLoreEntry(index)}
                  className="absolute top-4 right-4 p-1 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <h5 className="font-bold text-white mb-1 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" /> {entry.name}
                </h5>
                <p className="text-xs text-primary font-bold mb-2">Keywords: {entry.keywords.join(', ')}</p>
                <p className="text-sm text-gray-400 line-clamp-2">{entry.content}</p>
              </div>
            ))}
          </div>

          {/* Add New Lore Form */}
          <div className="bg-surface border border-white/5 p-6 rounded-2xl space-y-4">
            <h4 className="font-bold text-white text-sm">새로운 로어 항목 추가</h4>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">이름</label>
                  <input 
                    value={newLore.name}
                    onChange={(e) => setNewLore(prev => ({ ...prev, name: e.target.value }))}
                    type="text" placeholder="예: 검은 숲" className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/50" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">키워드 (쉼표 구분)</label>
                  <input 
                    value={newLore.keywords}
                    onChange={(e) => setNewLore(prev => ({ ...prev, keywords: e.target.value }))}
                    type="text" placeholder="예: 숲, 어둠, 나무" className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/50" 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">상세 내용</label>
                <textarea 
                  value={newLore.content}
                  onChange={(e) => setNewLore(prev => ({ ...prev, content: e.target.value }))}
                  rows={3} placeholder="AI가 인지할 상세 설정을 적어주세요." className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/50 resize-none" 
                />
              </div>
              <button 
                onClick={addLoreEntry}
                className="flex items-center justify-center gap-2 w-full p-4 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold hover:bg-primary/20 transition-all"
              >
                <Plus className="w-4 h-4" /> 항목 추가하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Tab */}
      {activeTab === 'visual' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-400 ml-1">AI로 모습 소환하기</label>
                <textarea 
                  value={visualPrompt} 
                  onChange={(e) => setVisualPrompt(e.target.value)} 
                  rows={4} 
                  placeholder="예: 은발에 푸른 눈을 가진, 차가운 분위기의 10대 후반 소년. 검은색 코트를 입고 있다." 
                  className="w-full bg-surface border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-primary/50 transition-all resize-none text-sm" 
                />
                <button 
                  onClick={handleGenerateImages} 
                  disabled={isGenerating}
                  className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  시안 생성 시작 (DALL-E 3)
                </button>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <label className="text-sm font-bold text-gray-400 ml-1">직접 사진 업로드</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    id="image-upload" 
                  />
                  <label 
                    htmlFor="image-upload" 
                    className="w-full bg-surface border border-dashed border-white/10 hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
                  >
                    <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                      <Upload className="w-6 h-6 text-gray-400 group-hover:text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-300">이미지 파일 선택</p>
                      <p className="text-[10px] text-gray-500 mt-1">또는 파일을 여기로 드래그하세요</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-400 ml-1">미리보기 및 선택</label>
              <div className="bg-surface border border-white/5 rounded-3xl p-6 min-h-[300px] flex flex-col items-center justify-center">
                {formData.avatar_url ? (
                  <div className="relative group">
                    <img 
                      src={formData.avatar_url} 
                      alt="Avatar Preview" 
                      className="w-48 h-48 rounded-full object-cover border-4 border-primary shadow-2xl shadow-primary/20" 
                    />
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <p className="text-xs font-bold text-white">현재 선택됨</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="w-24 h-24 rounded-full bg-white/5 mx-auto flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-xs text-gray-500">이미지를 생성하거나 업로드하면<br/>여기에 표시됩니다.</p>
                  </div>
                )}

                {generatedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-8 w-full overflow-y-auto max-h-40 p-1">
                    {generatedImages.map((url, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => selectImage(idx, url)}
                        className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${selectedImgIndex === idx ? 'border-primary' : 'border-transparent hover:border-white/20'}`}
                      >
                        <img src={url} alt={`Option ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-12 flex justify-center">
        <button 
          onClick={handleSave}
          disabled={isLoading}
          className="bg-primary hover:bg-primary-hover text-white px-12 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
        >
          {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          캐릭터 소환하기
        </button>
      </div>
    </div>
  );
};

export default CreateCharacterPage;
