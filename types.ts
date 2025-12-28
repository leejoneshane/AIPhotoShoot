export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  images?: string[]; // Changed from single image to array
  generatedImage?: string; // URL for AI generated image attached to this message
  isGenerating?: boolean;
}

export interface GeneratedImageResult {
  imageUrl: string;
  prompt: string;
}

export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  ADVERTISING = '4:5'
}

export interface ToolCallData {
    name: string;
    args: any;
}

export type ScenarioType = 'product' | 'portrait' | 'food' | 'interior' | 'model-showcase' | 'custom';
export type ModuleType = 'standard' | 'slider';

export interface ModuleData {
  id: string;
  type?: ModuleType; // Defaults to 'standard' if undefined
  label: string;
  description: string; // Placeholder text
  textValue: string;
  imageValue?: string; // Base64
  required?: boolean;
  disableImageUpload?: boolean; // If true, hides the image upload button
  // Slider specific properties
  sliderValue?: number;
  options?: string[]; // Labels for slider steps
  // Advanced Consistency Settings
  inspirationSelection?: string[]; // For "Inspiration" mode: ['Face', 'Pose', etc.]
  timeShiftValue?: number; // For "Time Shift" mode: -30 to 30
  tweakDescription?: string; // For "Minor Tweaks" mode
}

export interface ScenarioConfig {
  id: ScenarioType;
  label: string;
  icon: string;
  modules: ModuleData[];
}

export type WorkflowStep = 'select-scenario' | 'configure-modules' | 'preview-brief' | 'post-production';