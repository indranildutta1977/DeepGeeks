import { type Part } from '@google/genai';

export enum AppMode {
  GENERAL = 'GENERAL',
  CAREER = 'CAREER',
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  attachments?: Attachment[];
  timestamp: number;
  isError?: boolean;
  groundingMetadata?: any; // For search results
}

export interface Attachment {
  mimeType: string;
  data: string; // Base64
  name: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  mode: AppMode;
}

export interface JobAnalysisRequest {
  resumeFile?: Attachment;
  targetRole?: string;
  additionalContext?: string;
}
