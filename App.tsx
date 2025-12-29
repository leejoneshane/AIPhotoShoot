import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { geminiService } from './services/geminiService';
import { Message, GeneratedImageResult, ScenarioType, ScenarioConfig, ModuleData, WorkflowStep } from './types';
import ChatMessage from './components/ChatMessage';
import ModuleForm from './components/ModuleForm';

// --- CONFIGURATION ---
const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'ad-poster' as any,
    label: '廣告海報',
    icon: '🎨',
    modules: [
      { id: 'subject', label: '產品原圖 (Product Image)', description: '請上傳產品高清原圖，AI 將自動提取品牌、賣點與視覺特徵...', textValue: '', required: true },
      { 
        id: 'style', 
        label: '視覺風格 (Visual Style)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 0, 
        options: [
            '雜誌編輯 (Magazine)', 
            '水彩藝術 (Watercolor)', 
            '科技未來 (Tech)', 
            '復古膠片 (Retro)', 
            '極簡北歐 (Nordic)', 
            '霓虹賽博 (Cyber)',
            '自然有機 (Organic)'
        ]
      },
      { 
        id: 'typography', 
        label: '排版效果 (Typography)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 0, 
        options: [
            '雜誌風標題 (Serif)', 
            '玻璃擬態 (Glass)', 
            '3D 浮雕 (Embossed)', 
            '手寫藝術 (Handwritten)', 
            '霓虹描邊 (Neon)', 
            '極簡留白 (Minimal)'
        ]
      },
      { id: 'extra', label: '特殊需求 (Extra)', description: '是否需要模特？場景類型？數據視覺化？或其他特殊要求...', textValue: '' },
      { 
        id: 'ratio', 
        label: '尺寸比例 (Aspect Ratio)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 4, // Default to 9:16 for Ad posters
        options: ['1:1 (Square)', '4:3 (Landscape)', '3:4 (Portrait)', '16:9 (Widescreen)', '9:16 (Story)'] 
      }
    ]
  },
  {
    id: 'product',
    label: '商品攝影',
    icon: '🛍️',
    modules: [
      { id: 'subject', label: '主體 (Subject)', description: '商品的名稱、品牌、核心特徵...', textValue: '', required: true },
      { id: 'material', label: '材質與細節 (Material)', description: '光滑金屬、粗糙皮革、透明玻璃...', textValue: '' },
      { 
        id: 'composition', 
        label: '構圖視角 (Composition)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 1, 
        options: ['正面平視 (Front)', '45度俯角 (45° High)', '頂視/平鋪 (Flat Lay)', '仰角 (Low Angle)', '微距特寫 (Macro)', '魚眼 (Fisheye)']
      },
      { id: 'lighting', label: '光影與氛圍 (Lighting)', description: '輪廓光、柔光箱、高對比、神秘感...', textValue: '' },
      { id: 'fluid', label: '空氣/流體 (Fluid)', description: '是否有煙霧、水花、粉塵爆炸？', textValue: '' },
      { id: 'camera', label: '相機參數 (Camera)', description: '鏡頭焦段 (e.g., 50mm)、光圈 (f/2.8)...', textValue: '', disableImageUpload: true },
      { 
        id: 'ratio', 
        label: '尺寸比例 (Aspect Ratio)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 0, 
        options: ['1:1 (Square)', '4:3 (Landscape)', '3:4 (Portrait)', '16:9 (Widescreen)', '9:16 (Story)'] 
      }
    ]
  },
  {
    id: 'model-showcase',
    label: '模特展示',
    icon: '💃',
    modules: [
      { id: 'product', label: '展示商品 (Product)', description: '服裝、飾品、美妝...', textValue: '', required: true },
      { id: 'model', label: '模特兒形象 (Model)', description: '特徵、風格、族裔...', textValue: '', required: true },
      { 
        id: 'composition', 
        label: '構圖視角 (Composition)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 0, 
        options: ['全身照 (Full)', '膝上景 (3/4)', '半身特寫 (Close-up)', '低角度 (Low)', '高角度 (High)', '魚眼 (Fisheye)']
      },
      { id: 'pose', label: '動作與互動 (Interaction)', description: '姿勢描述...', textValue: '' },
      { id: 'lighting', label: '光影 (Lighting)', description: '時尚光、柔光...', textValue: '' },
      { id: 'camera', label: '相機參數 (Camera)', description: '鏡頭、底片風格...', textValue: '', disableImageUpload: true },
      { 
        id: 'ratio', 
        label: '尺寸比例 (Aspect Ratio)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 2, 
        options: ['1:1 (Square)', '4:3 (Landscape)', '3:4 (Portrait)', '16:9 (Widescreen)', '9:16 (Story)'] 
      }
    ]
  },
  {
    id: 'food',
    label: '餐飲美食',
    icon: '🍔',
    modules: [
      { id: 'subject', label: '食物主體 (Food)', description: '漢堡、牛排、飲料...', textValue: '', required: true },
      { 
        id: 'composition', 
        label: '構圖視角 (Composition)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 0, 
        options: ['45度標準 (45°)', '90度頂視 (Top)', '平視 (Eye)', '微距 (Macro)', '全景 (Wide)', '魚眼 (Fisheye)']
      },
      { id: 'plating', label: '擺盤與道具 (Plating)', description: '餐具、裝飾...', textValue: '' },
      { id: 'lighting', label: '光線 (Lighting)', description: '自然窗光...', textValue: '' },
      { id: 'camera', label: '相機參數 (Camera)', description: '焦段、景深...', textValue: '', disableImageUpload: true },
      { 
        id: 'ratio', 
        label: '尺寸比例 (Aspect Ratio)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 0, 
        options: ['1:1 (Square)', '4:3 (Landscape)', '3:4 (Portrait)', '16:9 (Widescreen)', '9:16 (Story)'] 
      }
    ]
  },
  {
    id: 'portrait',
    label: '人像攝影',
    icon: '👤',
    modules: [
      { id: 'subject', label: '人物特徵 (Character)', description: '細節描述...', textValue: '', required: true },
      { 
        id: 'composition', 
        label: '構圖視角 (Composition)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 1, 
        options: ['臉部特寫', '半身肖像', '全身照', '仰角', '俯角', '魚眼']
      },
      // Fixed: Added description to resolve missing property error
      { id: 'clothing', label: '服裝配件', description: '描述服裝細節、材質或配飾...', textValue: '' },
      // Fixed: Added description to resolve missing property error
      { id: 'expression', label: '表情氛圍', description: '人物的神態、目光、情緒表現...', textValue: '' },
      // Fixed: Added description to resolve missing property error
      { id: 'lighting', label: '光影色調', description: '柔光、硬光、冷暖色調偏好...', textValue: '' },
      // Fixed: Added description to resolve missing property error
      { id: 'camera', label: '相機參數', description: '焦段、光圈、底片顆粒感...', textValue: '', disableImageUpload: true },
      { 
        id: 'ratio', 
        label: '尺寸比例 (Aspect Ratio)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 0, 
        options: ['1:1 (Square)', '4:3 (Landscape)', '3:4 (Portrait)', '16:9 (Widescreen)', '9:16 (Story)'] 
      }
    ]
  },
  {
    id: 'interior',
    label: '空間設計',
    icon: '🏠',
    modules: [
      { id: 'space', label: '空間類型 (Space)', description: '客廳、辦公室...', textValue: '', required: true },
      // Fixed: Added description to resolve missing property error
      { id: 'style', label: '風格 (Style)', description: '空間的設計風格，如北歐、工業、日式...', textValue: '' },
      { 
        id: 'composition', 
        label: '構圖視角 (Composition)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 0, 
        options: ['廣角全景', '一點透視', '二點透視', '局部特寫', '45度俯角', '魚眼']
      },
      // Fixed: Added description to resolve missing property error
      { id: 'elements', label: '場景配置', description: '傢俱佈置、裝飾品、植物等元素...', textValue: '' },
      // Fixed: Added description to resolve missing property error
      { id: 'lighting', label: '採光與時間', description: '晨曦、午後陽光、室內燈光...', textValue: '' },
      // Fixed: Added description to resolve missing property error
      { id: 'camera', label: '相機參數', description: '廣角鏡頭、景深設定...', textValue: '', disableImageUpload: true },
      { 
        id: 'ratio', 
        label: '尺寸比例 (Aspect Ratio)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 0, 
        options: ['1:1 (Square)', '4:3 (Landscape)', '3:4 (Portrait)', '16:9 (Widescreen)', '9:16 (Story)'] 
      }
    ]
  },
  {
    id: 'custom',
    label: '快拍模式',
    icon: '⚡',
    modules: [
      { id: 'requirements', label: '拍攝需求 (Brief)', description: '一句話描述，其餘細節 AI 補足...', textValue: '', required: true },
      // Fixed: Added description to resolve missing property error
      { id: 'camera', label: '相機參數 (Camera)', description: '設定專業攝影參數以精確控制畫面...', textValue: '', disableImageUpload: true },
      { 
        id: 'ratio', 
        label: '尺寸比例 (Aspect Ratio)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 0, 
        options: ['1:1 (Square)', '4:3 (Landscape)', '3:4 (Portrait)', '16:9 (Widescreen)', '9:16 (Story)'] 
      }
    ]
  }
];

const App: React.FC = () => {
  const [step, setStep] = useState<WorkflowStep>('select-scenario');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioConfig | null>(null);
  const [activeModules, setActiveModules] = useState<ModuleData[]>([]);
  const [briefSummary, setBriefSummary] = useState<string>("");
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [hasApiKey, setHasApiKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- API KEY CHECK ---
  useEffect(() => {
    const checkApiKey = async () => {
      const win = window as any;
      if (win.aistudio && win.aistudio.hasSelectedApiKey) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        setHasApiKey(true);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    const win = window as any;
    if (win.aistudio && win.aistudio.openSelectKey) {
        await win.aistudio.openSelectKey();
        setHasApiKey(true); 
    }
  };

  // --- WORKFLOW HANDLERS ---
  
  const handleScenarioSelect = (scenario: ScenarioConfig) => {
    setSelectedScenario(scenario);
    setActiveModules(JSON.parse(JSON.stringify(scenario.modules)));
    setStep('configure-modules');
  };

  const handleModuleChange = (id: string, field: keyof ModuleData, value: any) => {
    setActiveModules(prev => prev.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleGenerateSuggestion = async (moduleLabel: string, currentText: string): Promise<string> => {
    if (!selectedScenario) return "";
    return await geminiService.generateModuleSuggestion(selectedScenario.label, moduleLabel, currentText, activeModules);
  };

  const handleImageAnalysis = async (base64: string, moduleLabel: string): Promise<string> => {
    if (!selectedScenario) return "";
    return await geminiService.analyzeImageForModule(base64, moduleLabel, selectedScenario.label);
  };

  const handleProceedToPreview = async () => {
    const missing = activeModules.filter(m => m.required && !m.textValue.trim() && !m.imageValue);
    if (missing.length > 0) {
      alert(`請填寫以下必填欄位: ${missing.map(m => m.label).join(', ')}`);
      return;
    }

    setIsLoading(true);
    try {
        const summary = await geminiService.summarizeBrief(selectedScenario?.label || "", activeModules);
        setBriefSummary(summary);
        setStep('preview-brief');
    } catch (e) {
        console.error(e);
        alert("無法產生計畫書摘要，請重試");
    } finally {
        setIsLoading(false);
    }
  };

  const handleStartShooting = async () => {
    setStep('post-production');
    setIsLoading(true);

    let promptText = `指令：EXECUTE_FILMING\n\n應用場合：${selectedScenario?.label}\n完整攝前計畫：\n${briefSummary}\n\n`;
    const imagesToSend: string[] = [];

    activeModules.forEach(m => {
        if (m.imageValue) {
            imagesToSend.push(m.imageValue);
            promptText += `[參考圖附件: ${m.label}]\n`;
        }
         if (m.type === 'slider' && m.options && m.sliderValue !== undefined) {
             const selectedOption = m.options[m.sliderValue];
             promptText += `【${m.label}】: ${selectedOption}\n`;
         } else if (m.textValue) {
             promptText += `【${m.label}】: ${m.textValue}\n`;
         }
    });

    const userMsg: Message = {
        id: uuidv4(),
        role: 'user',
        content: `**[系統指令]**: 開始拍攝 (Start Filming)。請根據計畫書產出完整提示詞系統與影像。`,
    };
    setMessages([userMsg]);

    try {
        const result = await geminiService.sendMessage(promptText, imagesToSend);
        await processResponse(result);
    } catch (error) {
        console.error(error);
        setMessages(prev => [...prev, { id: uuidv4(), role: 'model', content: "拍攝執行失敗，請檢查 API 連線。" }]);
    } finally {
        setIsLoading(false);
    }
  };

  // --- CHAT LOGIC ---

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { id: uuidv4(), role: 'user', content: userText }]);
    setIsLoading(true);

    try {
      const result = await geminiService.sendMessage(userText);
      await processResponse(result);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: uuidv4(), role: 'model', content: "通訊錯誤，請檢查您的網路連線。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const processResponse = async (result: any) => {
    const response = result;
    const modelText = response.text;
    const functionCalls = response.functionCalls;
    
    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        if (call.name === 'generate_image') {
          const { prompt, aspectRatio } = call.args;
          const generatingMsgId = uuidv4();
          setMessages(prev => [...prev, { id: generatingMsgId, role: 'model', content: `**[Action]** 拍攝中...\n\nPrompt: ${prompt}` }]);
          try {
            const imageUrl = await geminiService.generateActualImage(prompt, aspectRatio);
            setMessages(prev => [...prev, { id: uuidv4(), role: 'model', content: `拍攝完成。`, generatedImage: imageUrl }]);
          } catch (err) {
             setMessages(prev => [...prev, { id: uuidv4(), role: 'model', content: `生產錯誤：無法生成影像。 ${(err as Error).message}` }]);
          }
          return;
        }
      }
    }
    if (modelText) {
      setMessages(prev => [...prev, { id: uuidv4(), role: 'model', content: modelText }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!hasApiKey) {
      return (
        <div className="flex flex-col h-screen bg-studio-black text-gray-200 items-center justify-center p-6 text-center space-y-8">
            <div className="w-16 h-16 rounded bg-gradient-to-tr from-gold-accent to-yellow-600 flex items-center justify-center text-black font-bold text-3xl mx-auto">D</div>
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">AI 商業攝影導演</h1>
                <p className="text-gray-400">請連結您的 Google Cloud 專案以開始製作。</p>
            </div>
            <button onClick={handleSelectKey} className="py-3 px-8 bg-gold-accent hover:bg-gold-hover text-black font-semibold rounded-lg transition-colors">選取 API 金鑰</button>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-screen bg-studio-black text-gray-200 overflow-hidden font-sans">
      <header className="flex-none p-4 border-b border-gray-800 bg-[#151515] flex justify-between items-center z-10 shadow-md">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStep('select-scenario')}>
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-gold-accent to-yellow-600 flex items-center justify-center text-black font-bold text-lg">D</div>
          <div>
            <h1 className="font-semibold text-white">AI Director</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold-accent opacity-80">{step === 'post-production' ? 'On Air' : 'Pre-Production'}</p>
          </div>
        </div>
        {step !== 'select-scenario' && <button onClick={() => setStep('select-scenario')} className="text-xs text-gray-500 hover:text-white transition-colors">新專案</button>}
      </header>

      {step === 'select-scenario' && (
        <main className="flex-1 overflow-y-auto p-6 md:p-12 max-w-4xl mx-auto w-full">
            <h2 className="text-2xl font-light text-white mb-10 text-center">選擇應用場合</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {SCENARIOS.map(scenario => (
                    <button key={scenario.id} onClick={() => handleScenarioSelect(scenario)} className="group flex flex-col items-center justify-center p-8 bg-studio-gray/50 border border-gray-800 rounded-2xl hover:border-gold-accent transition-all duration-300">
                        <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">{scenario.icon}</span>
                        <span className="font-semibold text-gray-200">{scenario.label}</span>
                    </button>
                ))}
            </div>
        </main>
      )}

      {step === 'configure-modules' && (
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl mx-auto w-full pb-20">
            <h2 className="text-xl font-light text-white mb-6">配置拍攝計畫：{selectedScenario?.label}</h2>
            <div className="space-y-6">
                {activeModules.map(module => (
                    <ModuleForm 
                        key={module.id} 
                        moduleData={module} 
                        onChange={handleModuleChange} 
                        onGenerateSuggestion={handleGenerateSuggestion}
                        onImageAnalysis={handleImageAnalysis}
                    />
                ))}
            </div>
            <div className="mt-10 flex justify-end">
                <button onClick={handleProceedToPreview} disabled={isLoading} className="bg-gold-accent text-black px-8 py-3 rounded-full font-bold shadow-lg disabled:opacity-50">下一步：確認計畫</button>
            </div>
        </main>
      )}

      {step === 'preview-brief' && (
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl mx-auto w-full pb-20">
            <h2 className="text-2xl font-light text-white mb-6 text-center">Production Brief</h2>
            <div className="bg-studio-gray border border-gray-700 rounded-xl p-8 mb-8 shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-accent to-yellow-600"></div>
                <div className="space-y-6">
                    <div>
                        <h4 className="text-gold-accent text-xs font-bold uppercase mb-2">計畫總覽</h4>
                        <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">{briefSummary}</p>
                    </div>
                </div>
            </div>
            <div className="flex justify-between items-center gap-4">
                <button onClick={() => setStep('configure-modules')} className="px-6 py-3 rounded-full border border-gray-600 text-gray-400">返回修改</button>
                <button onClick={handleStartShooting} className="flex-1 bg-gold-accent text-black px-8 py-3 rounded-full font-bold flex items-center justify-center gap-2">開始製作 (Action)</button>
            </div>
        </main>
      )}

      {step === 'post-production' && (
        <>
            <main className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto pb-32 pt-8">
                    {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                    {isLoading && <div className="text-gold-accent text-xs animate-pulse">導演正在製作中...</div>}
                    <div ref={messagesEndRef} />
                </div>
            </main>
            <footer className="flex-none p-4 md:p-6 bg-[#151515] border-t border-gray-800">
                <div className="max-w-4xl mx-auto">
                    <div className="relative flex items-end gap-2 bg-studio-gray rounded-xl border border-gray-700 p-2">
                        <textarea className="w-full bg-transparent text-gray-200 text-base p-3 focus:outline-none resize-none" placeholder="輸入後製指令..." rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={isLoading} />
                        <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="p-3 rounded-lg bg-gold-accent text-black disabled:opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                        </button>
                    </div>
                </div>
            </footer>
        </>
      )}
    </div>
  );
};

export default App;