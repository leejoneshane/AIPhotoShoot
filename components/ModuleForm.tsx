import React, { useRef, useState } from 'react';
import { ModuleData } from '../types';

interface ModuleFormProps {
  moduleData: ModuleData;
  onChange: (id: string, field: keyof ModuleData, value: any) => void;
  onGenerateSuggestion?: (moduleLabel: string, currentText: string) => Promise<string>;
  onImageAnalysis?: (base64: string, moduleLabel: string) => Promise<string>;
  scenarioLabel?: string;
}

const INSPIRATION_OPTIONS = ['面孔', '表情', '姿勢', '服裝', '場景', '光影與色調'];

const ModuleForm: React.FC<ModuleFormProps> = ({ moduleData, onChange, onGenerateSuggestion, onImageAnalysis }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false);
  
  const isSlider = moduleData.type === 'slider';

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        // 1. Update the image value immediately
        onChange(moduleData.id, 'imageValue', base64);
        
        // 2. Trigger Image Analysis if handler exists
        if (onImageAnalysis) {
            setIsImageAnalyzing(true);
            try {
                const description = await onImageAnalysis(base64, moduleData.label);
                if (description) {
                    onChange(moduleData.id, 'textValue', description);
                }
            } catch (err) {
                console.error("Image analysis error", err);
            } finally {
                setIsImageAnalyzing(false);
            }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    onChange(moduleData.id, 'imageValue', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleInspiration = (option: string) => {
    const current = moduleData.inspirationSelection || [];
    const updated = current.includes(option)
      ? current.filter(item => item !== option)
      : [...current, option];
    onChange(moduleData.id, 'inspirationSelection', updated);
  };

  const handleMagicWand = async () => {
    if (!onGenerateSuggestion) return;
    setIsMagicLoading(true);
    try {
        const suggestion = await onGenerateSuggestion(moduleData.label, moduleData.textValue);
        if (suggestion) {
            onChange(moduleData.id, 'textValue', suggestion);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsMagicLoading(false);
    }
  };

  // --- SLIDER RENDERER ---
  if (isSlider && moduleData.options) {
    const max = moduleData.options.length - 1;
    const currentVal = moduleData.sliderValue ?? 0;
    
    return (
        <div className="bg-studio-gray/50 border border-gray-800 rounded-xl p-6 transition-all hover:border-gold-accent/50">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-gold-accent font-semibold text-sm uppercase tracking-wider">{moduleData.label}</h3>
                <span className="text-xs text-white bg-gold-accent/20 px-2 py-1 rounded border border-gold-accent/30">
                    {moduleData.options[currentVal]}
                </span>
            </div>

            {/* Main Mode Slider */}
            <div className="relative w-full px-2 mb-8">
                <input
                    type="range"
                    min={0}
                    max={max}
                    step={1}
                    value={currentVal}
                    onChange={(e) => onChange(moduleData.id, 'sliderValue', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gold-accent focus:outline-none focus:ring-0"
                />
                <div className="flex justify-between mt-3 px-1">
                    {moduleData.options.map((option, idx) => (
                        <div key={idx} className="flex flex-col items-center cursor-pointer" onClick={() => onChange(moduleData.id, 'sliderValue', idx)}>
                            <div className={`w-1 h-2 mb-2 ${idx === currentVal ? 'bg-gold-accent' : 'bg-gray-600'}`}></div>
                            <span className={`text-[10px] text-center max-w-[60px] leading-tight transition-colors ${idx === currentVal ? 'text-white font-medium' : 'text-gray-500'}`}>
                                {option.split(' ')[0]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dynamic Sub-Controls Area - Only for Consistency Module */}
            {moduleData.id === 'consistency' && (
                <div className="bg-[#151515] rounded-lg p-4 border border-gray-800">
                    {/* 0: 靈感來源 - Checkboxes */}
                    {currentVal === 0 && (
                        <div className="animate-fade-in">
                            <p className="text-xs text-gray-400 mb-3">請選擇您想從參考圖中提取的元素 (可複選)：</p>
                            <div className="grid grid-cols-3 gap-2">
                                {INSPIRATION_OPTIONS.map(opt => {
                                    const isSelected = moduleData.inspirationSelection?.includes(opt);
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => toggleInspiration(opt)}
                                            className={`text-xs py-2 px-1 rounded border transition-all ${
                                                isSelected 
                                                ? 'bg-gold-accent/20 border-gold-accent text-white' 
                                                : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 1: 時間轉移 - Time Slider */}
                    {currentVal === 1 && (
                        <div className="animate-fade-in px-2">
                            <div className="flex justify-between items-end mb-4">
                                <p className="text-xs text-gray-400">設定時間跨度：</p>
                                <span className="text-sm font-mono text-gold-accent">
                                    {moduleData.timeShiftValue === 0 
                                        ? '現在 (Present)' 
                                        : (moduleData.timeShiftValue || 0) > 0 
                                            ? `+${moduleData.timeShiftValue} 年 (Older)` 
                                            : `${moduleData.timeShiftValue} 年 (Younger)`
                                    }
                                </span>
                            </div>
                            <input
                                type="range"
                                min={-30}
                                max={30}
                                step={5}
                                value={moduleData.timeShiftValue || 0}
                                onChange={(e) => onChange(moduleData.id, 'timeShiftValue', parseInt(e.target.value))}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-400 focus:outline-none"
                            />
                            <div className="flex justify-between text-[10px] text-gray-600 mt-2 font-mono">
                                <span>-30y</span>
                                <span>Now</span>
                                <span>+30y</span>
                            </div>
                        </div>
                    )}

                    {/* 2: 允許微調 - Textarea */}
                    {currentVal === 2 && (
                        <div className="animate-fade-in">
                            <p className="text-xs text-gray-400 mb-2">請描述您允許 AI 修改或微調的部分：</p>
                            <textarea
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs text-gray-200 focus:border-gold-accent focus:outline-none resize-none"
                                rows={2}
                                placeholder="例如：保持面部特徵，但改變微笑程度和眼神方向..."
                                value={moduleData.tweakDescription || ''}
                                onChange={(e) => onChange(moduleData.id, 'tweakDescription', e.target.value)}
                            />
                        </div>
                    )}

                    {/* 3: 完全一致 - Static Info */}
                    {currentVal === 3 && (
                        <div className="animate-fade-in flex items-center gap-2 text-green-400/80">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs">啟用高強度 FaceID 鎖定與特徵保留。</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
  }

  // --- STANDARD RENDERER ---
  return (
    <div className="bg-studio-gray/50 border border-gray-800 rounded-xl p-4 transition-all hover:border-gray-600">
      <div className="flex justify-between items-start mb-3">
        <div>
            <h3 className="text-gold-accent font-semibold text-sm uppercase tracking-wider">{moduleData.label}</h3>
            {moduleData.required && <span className="text-[10px] text-red-400 ml-1">*必填</span>}
        </div>
        {isImageAnalyzing && (
            <span className="text-xs text-gold-accent animate-pulse flex items-center gap-1">
                 <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 分析影像中...
            </span>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="relative">
            <textarea
                className={`w-full bg-[#121212] border border-gray-700 rounded-lg p-3 pr-10 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gold-accent transition-colors resize-none ${isImageAnalyzing ? 'opacity-50' : ''}`}
                placeholder={moduleData.description}
                rows={3}
                value={moduleData.textValue}
                onChange={(e) => onChange(moduleData.id, 'textValue', e.target.value)}
                disabled={isImageAnalyzing}
            />
            
            {/* Magic Wand Button */}
            <button
                onClick={handleMagicWand}
                disabled={isMagicLoading || isImageAnalyzing}
                className={`absolute bottom-3 right-3 p-1.5 rounded-full bg-gray-800/80 border border-gray-600 hover:border-gold-accent hover:bg-gold-accent/10 transition-all ${
                    (isMagicLoading || isImageAnalyzing) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-105'
                }`}
                title="AI 魔法改寫與建議"
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.5} 
                    stroke="currentColor" 
                    className={`w-4 h-4 text-gold-accent ${isMagicLoading ? 'animate-spin' : ''}`}
                >
                    {isMagicLoading ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l2.846-.813a1.125 1.125 0 00.463-.263l10.334-10.334a1.125 1.125 0 000-1.591l-2.845-2.845a1.125 1.125 0 00-1.591 0L7.545 11.115a1.125 1.125 0 00-.263.463zM4.5 19.5l3.75 3.75" />
                    )}
                </svg>
            </button>
        </div>

        {!moduleData.disableImageUpload && (
            <div className="flex items-center gap-3">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
                
                {moduleData.imageValue ? (
                    <div className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-600">
                        <img src={moduleData.imageValue} alt="Reference" className="w-full h-full object-cover" />
                        <button 
                            onClick={clearImage}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-white transition-colors border border-gray-700 hover:border-gray-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6v12a2.25 2.25 0 002.25 2.25zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        上傳參考圖
                    </button>
                )}
                <span className="text-[10px] text-gray-600">（選填）提供視覺參考，AI 將自動分析</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default ModuleForm;