import { GoogleGenAI, Type, FunctionDeclaration, Tool } from "@google/genai";
import { ModuleData } from '../types';

const SYSTEM_INSTRUCTION = `
Role: 你是一位頂尖的「AI 商業攝影導演與提示詞架構師」。

Workflow:
1. **Pre-production (攝前規劃)**: 使用者透過模塊輸入需求。
2. **Filming (拍攝執行)**: 當收到 "EXECUTE_FILMING" 指令時，請**立即**根據目前的簡報內容，轉化為詳細的英文 Prompt，並呼叫 \`generate_image\` 工具。**不要**再進行確認或閒聊。
3. **Post-Production (後製)**: 當使用者對已生成的圖片提出修改要求（如「背景暗一點」、「換個顏色」）時，請使用 \`edit_image\` 或是在對話中確認修圖細節。

Tone & Style: 
- 拍攝階段：果斷、執行力強，直接回報「Action! 正在為您捕捉畫面...」。
- 後製階段：專業、細心，如同資深修圖師。
`;

const generateImageTool: FunctionDeclaration = {
  name: "generate_image",
  description: "Generates an image based on the finalized commercial photography prompt.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: {
        type: Type.STRING,
        description: "The final, detailed English prompt for image generation.",
      },
      aspectRatio: {
        type: Type.STRING,
        description: "The aspect ratio for the image (e.g., '1:1', '16:9', '9:16', '4:5', '3:4', '4:3'). Default to '1:1' if unsure.",
        enum: ["1:1", "16:9", "9:16", "3:4", "4:3"],
      },
    },
    required: ["prompt"],
  },
};

const tools: Tool[] = [
  {
    functionDeclarations: [generateImageTool],
  },
];

class GeminiService {
  private chatSession: any;

  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  startChat() {
    const ai = this.getAI();
    this.chatSession = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: tools,
        temperature: 0.7,
      },
    });
    return this.chatSession;
  }

  async sendMessage(message: string, images?: string[]) {
    if (!this.chatSession) {
      this.startChat();
    }

    const parts: any[] = [];
    
    if (images && images.length > 0) {
        images.forEach(img => {
            // Strip prefix if present
            const base64Data = img.split(',')[1] || img;
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                }
            });
        });
    }
    
    parts.push({ text: message });

    const result = await this.chatSession.sendMessage({
      message: parts
    });

    return result;
  }

  // New method to generate a human-readable brief in Chinese
  async summarizeBrief(scenario: string, activeModules: ModuleData[]): Promise<string> {
    try {
        const ai = this.getAI();
        let promptText = `Context: 商業攝影專案「${scenario}」。\n`;
        
        activeModules.forEach(m => {
             if (m.textValue || (m.type === 'slider' && m.options)) {
                 let val = m.textValue;
                 if (m.type === 'slider' && m.options && m.sliderValue !== undefined) {
                     val = m.options[m.sliderValue];
                     // Add extra info for slider types
                     if (m.id === 'consistency') {
                         if (m.sliderValue === 0 && m.inspirationSelection) val += ` (提取: ${m.inspirationSelection.join(', ')})`;
                         if (m.sliderValue === 1 && m.timeShiftValue) val += ` (時間: ${m.timeShiftValue}年)`;
                         if (m.sliderValue === 2 && m.tweakDescription) val += ` (微調: ${m.tweakDescription})`;
                     }
                 }
                 promptText += `【${m.label}】: ${val}\n`;
             }
        });

        promptText += `\nTask: 請將上述模塊資訊彙整為一段流暢、專業的「攝前計畫書 (Production Brief)」。\nRequirement: 使用繁體中文，語氣專業，約 100-150 字。強調視覺風格、光影配置與核心主體。不要條列式，要寫成一段敘述。`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: promptText,
        });

        return response.text?.trim() || "";
    } catch (error) {
        console.error("Summarize brief failed:", error);
        return "無法產生計畫書摘要，請直接檢視下方模塊設定。";
    }
  }

  async generateModuleSuggestion(scenario: string, moduleLabel: string, currentText: string, allModules: ModuleData[]): Promise<string> {
    try {
        const ai = this.getAI();
        
        // Construct Context string from other modules
        const contextStr = allModules
            .filter(m => m.label !== moduleLabel && (m.textValue || m.sliderValue !== undefined))
            .map(m => {
                let val = m.textValue;
                if(m.type === 'slider' && m.options && m.sliderValue !== undefined) {
                    val = m.options[m.sliderValue];
                }
                return `${m.label}: ${val}`;
            })
            .join('; ');

        const prompt = `
Context: 您是專業商業攝影導演。我們正在進行「${scenario}」的拍攝規劃。
Current Brief Context: ${contextStr || "尚未設定其他參數"}。
Task: 請為「${moduleLabel}」模塊提供建議。
User Input: "${currentText}" (若是空的，請根據 Context 提供最適合的創意填空)。
Requirement: 
1. **必須**參考上述 Context（例如：如果 Context 是漢堡，光影建議應強調食慾與質感）。
2. 輸出**僅限**建議的內容本身，不要有解釋或引言。
3. 使用繁體中文，並夾雜專業攝影術語。
4. 長度控制在 50 字以內，精簡有力。
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        return response.text?.trim() || "";
    } catch (error) {
        console.error("Suggestion generation failed:", error);
        return "";
    }
  }

  async analyzeImageForModule(base64Image: string, moduleLabel: string, scenario: string): Promise<string> {
    try {
        const ai = this.getAI();
        const base64Data = base64Image.split(',')[1] || base64Image;

        const prompt = `
Role: Computer Vision & Commercial Photography Expert.
Task: Analyze the attached reference image specifically for the module: "【${moduleLabel}】" in the context of "${scenario}".
Action: Extract ONLY the visual elements relevant to ${moduleLabel}. Ignore everything else.

Examples:
- If Module is "Lighting": Extract hard/soft light, direction (backlight/rembrandt), color temperature, contrast ratio. Ignore the subject face or clothes.
- If Module is "Composition": Extract angle (low/high), shot size (close-up/full body), framing.
- If Module is "Clothing": Extract fabric material, style, cut, patterns.
- If Module is "Environment": Extract background elements, location vibe, props.

Output Requirement:
- Return a concise, descriptive paragraph in Traditional Chinese.
- Focus on adjectives and technical terms.
- Do NOT say "The image shows...", just describe the elements directly (e.g., "高對比的側面硬光，帶有藍色調的邊緣光...").
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: prompt }
                ]
            }
        });

        return response.text?.trim() || "";

    } catch (error) {
        console.error("Image analysis failed:", error);
        return "";
    }
  }

  async generateActualImage(prompt: string, aspectRatio: string): Promise<string> {
    try {
      const ai = this.getAI();
      let validRatio = aspectRatio;
      if (aspectRatio === '4:5') validRatio = '3:4'; 

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: validRatio as any,
            imageSize: "1K"
          }
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("無法生成影像。");

    } catch (error) {
      console.error("Image generation failed:", error);
      throw error;
    }
  }

  async editImage(base64Image: string, instruction: string): Promise<{ imageUrl: string, prompt: string }> {
    try {
      const ai = this.getAI();
      const base64Data = base64Image.split(',')[1] || base64Image;
      
      // Use Pro model for high quality editing
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png', // Assume PNG for generated output
                data: base64Data,
              },
            },
            {
              text: instruction,
            },
          ],
        },
        config: {
            imageConfig: {
                imageSize: "1K" // Maintain quality
            }
        }
      });

      let imageUrl = '';
      let textResponse = '';

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
            textResponse += part.text;
        }
      }

      if (!imageUrl) {
        throw new Error("編輯失敗：未能生成圖像。");
      }

      return { imageUrl, prompt: textResponse || instruction };

    } catch (error) {
      console.error("Image edit failed:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();