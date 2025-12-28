import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { geminiService } from './services/geminiService';
import { Message, GeneratedImageResult, ScenarioType, ScenarioConfig, ModuleData, WorkflowStep } from './types';
import ChatMessage from './components/ChatMessage';
import ModuleForm from './components/ModuleForm';

// --- CONFIGURATION ---
const SCENARIOS: ScenarioConfig[] = [
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
        options: [
            '正面平視 (Front)', 
            '45度俯角 (45° High)', 
            '頂視/平鋪 (Flat Lay)', 
            '仰角 (Low Angle)', 
            '微距特寫 (Macro)', 
            '魚眼 (Fisheye)'
        ]
      },
      { id: 'lighting', label: '光影與氛圍 (Lighting)', description: '輪廓光、柔光箱、高對比、神秘感...', textValue: '' },
      { id: 'fluid', label: '空氣/流體 (Fluid)', description: '是否有煙霧、水花、粉塵爆炸？', textValue: '' },
      { id: 'camera', label: '相機參數 (Camera)', description: '鏡頭焦段 (e.g., 50mm, 100mm Macro)、光圈 (f/2.8)、底片風格...', textValue: '', disableImageUpload: true },
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
      { id: 'product', label: '展示商品 (Product)', description: '服裝、飾品、3C產品、美妝用品...', textValue: '', required: true },
      { id: 'model', label: '模特兒形象 (Model)', description: '使用魔法棒推薦形象：如「科技宅」、「歐美超模」、「鄰家女孩」、「日系高中生」...', textValue: '', required: true },
      { 
        id: 'consistency', 
        label: '一致性 (Consistency)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 2, 
        inspirationSelection: [], 
        timeShiftValue: 0, 
        tweakDescription: '', 
        options: [
            '靈感來源 (Inspiration)', 
            '時間轉移 (Time Shift)', 
            '允許微調 (Minor Tweaks)', 
            '完全一致 (Full Match)'
        ]
      },
      { id: 'pose', label: '動作與互動 (Interaction)', description: '手持產品特寫、伸展台走步、使用情境...', textValue: '' },
      { id: 'scene', label: '展示場景 (Scene)', description: '時尚伸展台、專業攝影棚、戶外街拍、居家情境...', textValue: '' },
      { 
        id: 'composition', 
        label: '構圖視角 (Composition)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 0, 
        options: [
            '全身照 (Full Body)', 
            '膝上景 (3/4 Body)', 
            '半身特寫 (Close-up)', 
            '低角度 (Low Angle)', 
            '高角度 (High Angle)', 
            '魚眼 (Fisheye)'
        ]
      },
      { id: 'lighting', label: '光影 (Lighting)', description: '時尚大片光、聚光燈、自然柔光...', textValue: '' },
      { id: 'camera', label: '相機參數 (Camera)', description: '鏡頭焦段 (e.g., 85mm Portrait)、光圈 (f/1.8)、底片風格...', textValue: '', disableImageUpload: true },
      { 
        id: 'ratio', 
        label: '尺寸比例 (Aspect Ratio)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 2, // Default to Portrait for models
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
        options: [
            '45度標準 (Standard)', 
            '90度頂視 (Flat Lay)', 
            '平視 (Eye Level)', 
            '微距特寫 (Macro)', 
            '全景 (Wide)', 
            '魚眼 (Fisheye)'
        ]
      },
      { id: 'plating', label: '擺盤與道具 (Plating)', description: '木質砧板、復古刀叉、香草裝飾...', textValue: '' },
      { id: 'appetite', label: '食慾感 (Appetite)', description: '熱氣蒸騰、醬汁滴落、起司拉絲...', textValue: '' },
      { id: 'lighting', label: '光線 (Lighting)', description: '自然窗光、逆光拍攝...', textValue: '' },
      { id: 'camera', label: '相機參數 (Camera)', description: '鏡頭焦段 (e.g., 50mm, 35mm)、光圈 (f/2.8)、景深控制...', textValue: '', disableImageUpload: true },
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
      { id: 'subject', label: '人物特徵 (Character)', description: '年齡、性別、臉部特徵...', textValue: '', required: true },
      { 
        id: 'consistency', 
        label: '一致性 (Consistency)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 2, 
        inspirationSelection: [], 
        timeShiftValue: 0, 
        tweakDescription: '', 
        options: [
            '靈感來源 (Inspiration)', 
            '時間轉移 (Time Shift)', 
            '允許微調 (Minor Tweaks)', 
            '完全一致 (Full Match)'
        ]
      },
      { id: 'clothing', label: '服裝配件 (Clothing & Accessories)', description: '時尚風格、材質、飾品細節...', textValue: '' },
      { id: 'expression', label: '表情氛圍 (Expression & Mood)', description: '眼神、微表情、情緒基調...', textValue: '' },
      { id: 'pose', label: '姿勢 (Pose)', description: '站姿、坐姿、手部動作...', textValue: '' },
      { 
        id: 'composition', 
        label: '構圖視角 (Composition)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 1, 
        options: [
            '臉部特寫 (Close-up)', 
            '半身肖像 (Upper Body)', 
            '全身照 (Full Body)', 
            '仰角 (Low Angle)', 
            '俯角 (High Angle)', 
            '魚眼 (Fisheye)'
        ]
      },
      { id: 'lighting', label: '光影色調 (Lighting & Tone)', description: '林布蘭光、蝴蝶光、冷暖色調...', textValue: '' },
      { id: 'environment', label: '場景 (Environment)', description: '都市街頭、純色棚拍、自然森林...', textValue: '' },
      { id: 'camera', label: '相機參數 (Camera)', description: '鏡頭焦段 (e.g., 85mm)、光圈 (f/1.4)、快門速度、底片風格...', textValue: '', disableImageUpload: true },
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
      { id: 'space', label: '空間類型 (Space)', description: '客廳、辦公室、咖啡廳...', textValue: '', required: true },
      { id: 'style', label: '風格 (Style)', description: '極簡北歐、工業風、日式侘寂...', textValue: '' },
      { 
        id: 'composition', 
        label: '構圖視角 (Composition)', 
        description: '', 
        textValue: '', 
        type: 'slider', 
        sliderValue: 0, 
        options: [
            '廣角全景 (Wide)', 
            '一點透視 (1-Point)', 
            '二點透視 (2-Point)', 
            '局部特寫 (Detail)', 
            '45度俯角 (High Angle)', 
            '魚眼 (Fisheye)'
        ]
      },
      { id: 'elements', label: '場景配置 (Configuration)', description: '描述空間中的傢俱、盆栽、造景（如：懶骨頭、鳥巢吊椅、噴水池、游泳池...）', textValue: '' },
      { id: 'lighting', label: '採光與時間 (Lighting)', description: '午後陽光、夜晚氛圍燈...', textValue: '' },
      { id: 'camera', label: '相機參數 (Camera)', description: '鏡頭焦段 (e.g., 24mm Wide, 16mm)、光圈 (f/8)、ISO...', textValue: '', disableImageUpload: true },
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
      { id: 'requirements', label: '拍攝需求 (Brief)', description: '一句話描述您想拍攝的畫面，或是上傳參考圖，其餘細節由 AI 導演自動補足...', textValue: '', required: true },
      { id: 'camera', label: '相機參數 (Camera)', description: '鏡頭焦段、光圈、底片風格... (選填)', textValue: '', disableImageUpload: true },
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
    // Deep copy to avoid reference issues
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
      // 1. Validate required
    const missing = activeModules.filter(m => m.required && !m.textValue.trim());
    if (missing.length > 0) {
      alert(`請填寫以下必填欄位: ${missing.map(m => m.label).join(', ')}`);
      return;
    }

    setIsLoading(true);
    // 2. Generate Summary
    try {
        const summary = await geminiService.summarizeBrief(selectedScenario?.label || "", activeModules);
        setBriefSummary(summary);
        setStep('preview-brief');
    } catch (e) {
        console.error(e);
        alert("無法產生簡報摘要，請重試");
    } finally {
        setIsLoading(false);
    }
  };

  const handleStartShooting = async () => {
    setStep('post-production');
    setIsLoading(true);

    // 1. Construct Prompt Bundle for the AI to "Execute"
    let promptText = `指令：EXECUTE_FILMING\n\n應用場合：${selectedScenario?.label}\n完整攝前計畫：\n${briefSummary}\n\n`;
    const imagesToSend: string[] = [];

    activeModules.forEach(m => {
        if (m.imageValue) {
            imagesToSend.push(m.imageValue);
            promptText += `[參考圖附件: ${m.label}]\n`;
        }
        // Append specific slider details if needed for context
         if (m.type === 'slider' && m.options && m.sliderValue !== undefined) {
             const selectedOption = m.options[m.sliderValue];
             promptText += `【${m.label}】: ${selectedOption}\n`;
         } else if (m.textValue) {
             promptText += `【${m.label}】: ${m.textValue}\n`;
         }
    });

    // 2. Add system start message
    const userMsg: Message = {
        id: uuidv4(),
        role: 'user',
        content: `**[系統指令]**: 開始拍攝 (Start Filming)。請根據計畫書生成影像。`,
    };
    setMessages([userMsg]);

    // 3. Send to API
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

  // --- CHAT LOGIC (POST PRODUCTION) ---

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
    
    // Check if user is referencing a previous image (not strictly needed for logic, but for UI context)
    // The previous implementation used "edit" button which is removed.
    // Now we rely on natural language context.

    // If there is a last generated image, we might want to attach it? 
    // For now, let's trust the context window of Gemini 1.5/2.0 to remember the last image.
    // However, for explicit "Edit this image" API calls (if we used specific edit endpoints), we'd need the ID.
    // Since we are using chat, we send the text. 
    
    // BUT, `geminiService.editImage` was a specific function that sent image bytes + prompt.
    // If we just use `geminiService.sendMessage`, it continues the chat session.
    // The previous implementation of `handleEditImage` used a fresh call with `editImage`.
    // Let's integrate "Editing" into the chat flow properly.
    
    // STRATEGY: 
    // If the user types in the chat, we assume they are refining the *last generated image*.
    // We can continue the chat session normally. The model (Gemini) should understand "make it darker".
    // HOWEVER, the `generate_image` tool needs a full prompt. 
    // The System Instruction says: "When user asks for modification... use edit_image OR confirm details".
    // We haven't implemented `edit_image` tool yet, only `generate_image`.
    // Let's stick to the existing flow: The Model decides to call `generate_image` again with an UPDATED prompt based on history.
    
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
          setMessages(prev => [...prev, { 
            id: generatingMsgId, 
            role: 'model', 
            content: `**[Action]** 拍攝中...\n\nPrompt: ${prompt}`
          }]);

          try {
            const imageUrl = await geminiService.generateActualImage(prompt, aspectRatio);
            
            // ATTACH IMAGE TO MESSAGE
            setMessages(prev => [...prev, { 
              id: uuidv4(), 
              role: 'model', 
              content: `拍攝完成。`,
              generatedImage: imageUrl
            }]);

          } catch (err) {
             if ((err as Error).message.includes("Requested entity was not found")) {
                setHasApiKey(false); 
                setMessages(prev => [...prev, { 
                    id: uuidv4(), 
                    role: 'model', 
                    content: `生產錯誤：API 金鑰無效或未找到。請重新選取金鑰。`
                  }]);
             } else {
                setMessages(prev => [...prev, { 
                    id: uuidv4(), 
                    role: 'model', 
                    content: `生產錯誤：無法生成影像。 ${(err as Error).message}`
                  }]);
             }
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

  // --- RENDER HELPERS ---

  if (!hasApiKey) {
      return (
        <div className="flex flex-col h-screen bg-studio-black text-gray-200 items-center justify-center p-6">
             <div className="max-w-md w-full text-center space-y-8">
                <div className="w-16 h-16 rounded bg-gradient-to-tr from-gold-accent to-yellow-600 flex items-center justify-center text-black font-bold text-3xl mx-auto">D</div>
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">AI 商業攝影導演</h1>
                    <p className="text-gray-400">請連結您的 Google Cloud 專案以使用 Gemini 高畫質影像生成模型。</p>
                </div>
                <div className="p-6 bg-studio-gray rounded-xl border border-gray-800 shadow-xl">
                    <button onClick={handleSelectKey} className="w-full py-3 px-4 bg-gold-accent hover:bg-gold-hover text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                        選取 API 金鑰
                    </button>
                    <div className="mt-4 text-xs text-gray-500">
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-gold-accent">了解更多關於 Gemini API 計費資訊</a>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- RENDER MAIN UI ---

  return (
    <div className="flex flex-col h-screen bg-studio-black text-gray-200 overflow-hidden font-sans">
      {/* Header */}
      <header className="flex-none p-4 border-b border-gray-800 bg-[#151515] flex justify-between items-center z-10 shadow-md">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStep('select-scenario')}>
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-gold-accent to-yellow-600 flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-gold-accent/20">
            D
          </div>
          <div>
            <h1 className="font-semibold text-white tracking-wide leading-tight">AI Director</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold-accent opacity-80">
                {step === 'post-production' ? 'On Air / Post-Production' : 'Pre-Production'}
            </p>
          </div>
        </div>
        
        {step !== 'select-scenario' && (
             <button 
                onClick={() => setStep('select-scenario')}
                className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
             >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                </svg>
                {step === 'post-production' ? '新專案' : '重新開始'}
             </button>
        )}
      </header>

      {/* STEP 1: SCENARIO SELECTION */}
      {step === 'select-scenario' && (
        <main className="flex-1 overflow-y-auto p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-light text-white mb-2 text-center">請選擇本次拍攝的應用場合</h2>
                <p className="text-gray-500 text-center mb-10 text-sm">Director 將根據您的選擇，提供專屬的攝前規劃模塊</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {SCENARIOS.map(scenario => (
                        <button
                            key={scenario.id}
                            onClick={() => handleScenarioSelect(scenario)}
                            className="group relative flex flex-col items-center justify-center p-8 bg-studio-gray/50 border border-gray-800 rounded-2xl hover:border-gold-accent hover:bg-gray-800/80 transition-all duration-300 shadow-lg hover:shadow-gold-accent/10"
                        >
                            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 filter grayscale group-hover:grayscale-0">{scenario.icon}</span>
                            <span className="font-semibold text-gray-200 group-hover:text-white">{scenario.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </main>
      )}

      {/* STEP 2: MODULE CONFIGURATION */}
      {step === 'configure-modules' && (
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-2xl mx-auto pb-20">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-light text-white">攝前簡報配置</h2>
                        <p className="text-sm text-gold-accent opacity-80 mt-1">
                             <span className="mr-2">{selectedScenario?.icon}</span>
                             {selectedScenario?.label}
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {activeModules.map(module => {
                        // Conditional rendering for Consistency module
                        if (module.id === 'consistency') {
                            const subjectModule = activeModules.find(m => m.id === 'subject');
                            // Only show if subject has an image
                            if (!subjectModule?.imageValue) return null;
                        }

                        // Also check 'product' for model-showcase consistency visibility
                        if (module.id === 'consistency' && selectedScenario?.id === 'model-showcase') {
                             const productModule = activeModules.find(m => m.id === 'product');
                             if (!productModule?.imageValue) return null;
                        }

                        return (
                            <ModuleForm 
                                key={module.id} 
                                moduleData={module} 
                                onChange={handleModuleChange} 
                                onGenerateSuggestion={handleGenerateSuggestion}
                                onImageAnalysis={handleImageAnalysis}
                                scenarioLabel={selectedScenario?.label}
                            />
                        );
                    })}
                </div>

                <div className="mt-10 flex justify-end">
                    <button
                        onClick={handleProceedToPreview}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-gradient-to-r from-gold-accent to-yellow-600 text-black px-8 py-3 rounded-full font-bold hover:brightness-110 transition-all shadow-lg shadow-gold-accent/20 disabled:opacity-50"
                    >
                        {isLoading ? (
                             <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                產生計畫書...
                             </>
                        ) : (
                             <>
                                <span>下一步：確認拍攝計畫</span>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" clipRule="evenodd" />
                                </svg>
                             </>
                        )}
                    </button>
                </div>
            </div>
        </main>
      )}

      {/* STEP 3: PREVIEW BRIEF */}
      {step === 'preview-brief' && (
        <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in">
             <div className="max-w-2xl mx-auto pb-20">
                <h2 className="text-2xl font-light text-white mb-6 text-center">拍攝計畫確認 (Production Brief)</h2>
                
                <div className="bg-studio-gray border border-gray-700 rounded-xl p-8 mb-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-accent to-yellow-600"></div>
                    
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-3xl">{selectedScenario?.icon}</span>
                        <div>
                            <h3 className="text-lg font-bold text-white">{selectedScenario?.label}</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Nano Banana Pro Engine</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h4 className="text-gold-accent text-xs font-bold uppercase mb-2">計畫總覽 (Summary)</h4>
                            <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap border-l-2 border-gold-accent/30 pl-4">
                                {briefSummary}
                            </p>
                        </div>

                        {/* Show Images if any */}
                        {activeModules.some(m => m.imageValue) && (
                            <div>
                                <h4 className="text-gold-accent text-xs font-bold uppercase mb-3">參考附件 (References)</h4>
                                <div className="flex gap-4 overflow-x-auto pb-2">
                                    {activeModules.filter(m => m.imageValue).map((m, i) => (
                                        <div key={i} className="flex-none w-24 h-24 rounded border border-gray-600 overflow-hidden relative group">
                                            <img src={m.imageValue} className="w-full h-full object-cover" alt={m.label} />
                                            <div className="absolute bottom-0 w-full bg-black/70 text-[10px] text-white p-1 text-center truncate">
                                                {m.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center gap-4">
                    <button 
                        onClick={() => setStep('configure-modules')}
                        className="px-6 py-3 rounded-full border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-all text-sm font-medium"
                    >
                        返回修改
                    </button>
                    
                    <button
                        onClick={handleStartShooting}
                        className="flex-1 bg-gold-accent hover:bg-gold-hover text-black px-8 py-3 rounded-full font-bold transition-all shadow-lg shadow-gold-accent/20 flex items-center justify-center gap-2"
                    >
                        <span>開始拍攝 (Action)</span>
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    </button>
                </div>
             </div>
        </main>
      )}

      {/* STEP 4: POST PRODUCTION (Modified Chat Interface) */}
      {step === 'post-production' && (
        <>
            <main className="flex-1 overflow-y-auto relative p-4 md:p-0">
                <div className="max-w-4xl mx-auto min-h-full flex flex-col pb-32 pt-8">
                
                {/* Chat History (Images are now inside ChatMessage) */}
                {messages.map(msg => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}

                {isLoading && (
                    <div className="flex w-full mb-6 justify-start animate-pulse">
                        <div className="max-w-[75%] rounded-2xl rounded-tl-sm p-6 bg-studio-gray border border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="flex space-x-2 items-center">
                                    <div className="w-2 h-2 bg-gold-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-gold-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-gold-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-xs text-gold-accent uppercase tracking-wider">Filming in progress...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
                </div>
            </main>

            <footer className="flex-none p-4 md:p-6 bg-[#151515] border-t border-gray-800 z-20">
                <div className="max-w-4xl mx-auto space-y-4">
                <div className="relative flex items-end gap-2 bg-studio-gray rounded-xl border border-gray-700 p-2 shadow-lg focus-within:border-gold-accent focus-within:ring-1 focus-within:ring-gold-accent/50 transition-all">
                    <textarea
                    className="w-full bg-transparent text-gray-200 placeholder-gray-500 text-base p-3 focus:outline-none resize-none max-h-32"
                    placeholder="輸入後製修圖指令 (例如：背景再暗一點、人物向左看)..."
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    />
                    <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim()}
                    className="mb-1 p-3 rounded-lg bg-gold-accent text-black hover:bg-gold-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
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