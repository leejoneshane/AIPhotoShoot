import { GoogleGenAI, Type, FunctionDeclaration, Tool } from "@google/genai";
import { ModuleData } from '../types';

const SYSTEM_INSTRUCTION = `
Role: 你是一位頂尖的「AI 商業攝影導演與提示詞架構師」。

Workflow:
1. **Pre-production (攝前規劃)**: 使用者透過模塊輸入需求。
2. **Filming (拍攝執行)**: 
   - 當收到 "EXECUTE_FILMING" 且應用場合為「廣告海報」時，請執行「完整提示詞系統生成」。
   - 你必須生成 10 張系列海報的詳細 Prompt（中英雙語），並附帶排版佈局說明。
   - 同時，請呼叫 \`generate_image\` 生成「海報 01 - 主 KV」的影像。
3. **Advertising Poster (廣告海報) 專屬指令**:
   - **還原要求**: 必須在提示詞中強調「嚴格還原上傳的產品圖細節」，包含包裝、LOGO、材質。
   - **排版佈局**: 每張海報必須說明中英文排版格式（堆疊、並列或分離）。
   - **系列完整性**: 包含主 KV、生活場景、概念視覺、細節特寫 (x4)、品牌故事、參數表、使用指南。
4. **Post-Production (後製)**: 當使用者對已生成的圖片提出修改要求時，請使用工具或對話確認細節。
`;

const generateImageTool: FunctionDeclaration = {
  name: "generate_image",
  description: "Generates a high-quality commercial image based on a specific prompt.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: "Detailed English prompt for image generation." },
      aspectRatio: { 
        type: Type.STRING, 
        description: "Aspect ratio.",
        enum: ["1:1", "16:9", "9:16", "3:4", "4:3"]
      },
    },
    required: ["prompt"],
  },
};

const tools: Tool[] = [{ functionDeclarations: [generateImageTool] }];

class GeminiService {
  private chatSession: any;

  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  startChat() {
    const ai = this.getAI();
    this.chatSession = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: tools, temperature: 0.7 },
    });
    return this.chatSession;
  }

  async sendMessage(message: string, images?: string[]) {
    if (!this.chatSession) this.startChat();
    const parts: any[] = [];
    if (images && images.length > 0) {
        images.forEach(img => {
            const base64Data = img.split(',')[1] || img;
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
        });
    }
    parts.push({ text: message });
    return await this.chatSession.sendMessage({ message: parts });
  }

  async summarizeBrief(scenario: string, activeModules: ModuleData[]): Promise<string> {
    try {
        const ai = this.getAI();
        let promptText = `Context: 商業攝影專案「${scenario}」。\n`;
        const hasImage = activeModules.find(m => m.id === 'subject')?.imageValue;

        activeModules.forEach(m => {
            let val = m.textValue;
            if (m.type === 'slider' && m.options && m.sliderValue !== undefined) val = m.options[m.sliderValue];
            if (val || m.imageValue) promptText += `【${m.label}】: ${val || (m.imageValue ? "[已上傳圖片]" : "")}\n`;
        });

        if (scenario === '廣告海報' && hasImage) {
            promptText += `\nTask: 請先進行「產品信息智能提取」，並以此為基礎撰寫完整的「攝前計畫確認報告」。報告應包含：品牌名稱、產品類型、賣點、配色方案、視覺風格建議、中英文排版建議。請使用繁體中文，格式需包含【識別報告】。`;
        } else {
            promptText += `\nTask: 請彙整為一段流暢專業的「攝前計畫書」。繁體中文，語氣專業。`;
        }

        // Fixed: Wrapped parts in a content object to follow the latest API specification
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: hasImage ? {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: hasImage.split(',')[1] } },
                    { text: promptText }
                ]
            } : promptText,
        });

        return response.text?.trim() || "";
    } catch (error) {
        console.error(error);
        return "無法產生摘要。";
    }
  }

  async generateModuleSuggestion(scenario: string, moduleLabel: string, currentText: string, allModules: ModuleData[]): Promise<string> {
    const ai = this.getAI();
    const prompt = `Context: 商業攝影導演。場景「${scenario}」。Task: 為「${moduleLabel}」模塊提供 50 字內繁體中文專業建議。Input: "${currentText}"。`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text?.trim() || "";
  }

  async analyzeImageForModule(base64Image: string, moduleLabel: string, scenario: string): Promise<string> {
    const ai = this.getAI();
    const prompt = `Analyze specifically for "【${moduleLabel}】" in context of "${scenario}". Return concise descriptive paragraph in Traditional Chinese. Focus on technical terms.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } }, { text: prompt }] }
    });
    return response.text?.trim() || "";
  }

  async generateActualImage(prompt: string, aspectRatio: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: aspectRatio as any, imageSize: "1K" } },
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("影像生成失敗");
  }
}

export const geminiService = new GeminiService();