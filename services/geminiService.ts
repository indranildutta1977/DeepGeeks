import { GoogleGenAI, type Part } from "@google/genai";
import { Attachment, Message, ModelType } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateChatResponse = async (
  history: Message[],
  newMessage: string,
  attachments: Attachment[],
  model: string,
  systemInstruction?: string,
  useSearch: boolean = false
): Promise<{ text: string; groundingMetadata?: any }> => {
  try {
    const parts: Part[] = [];

    // Add attachments
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data,
          },
        });
      }
    }

    // Add text
    if (newMessage && newMessage.trim().length > 0) {
      parts.push({ text: newMessage });
    }
    
    // CRITICAL FIX: Ensure parts is never empty. The API requires at least one part.
    if (parts.length === 0) {
      parts.push({ text: " " });
    }

    // Build chat history with strict validation
    const chatHistory = history.map(msg => {
      const msgParts: Part[] = [];
      
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(a => {
           msgParts.push({ inlineData: { mimeType: a.mimeType, data: a.data } });
        });
      }
      
      if (msg.content && msg.content.trim().length > 0) {
        msgParts.push({ text: msg.content });
      }

      // Fallback for history items that might be effectively empty
      if (msgParts.length === 0) {
         msgParts.push({ text: " " }); 
      }

      return {
        role: msg.role,
        parts: msgParts
      };
    });

    // Configure tools
    const tools: any[] = [];
    if (useSearch || model === ModelType.PRO) { 
       tools.push({ googleSearch: {} });
    }

    const config: any = {};
    
    // Only add systemInstruction if it's a non-empty string
    if (systemInstruction && systemInstruction.trim().length > 0) {
      config.systemInstruction = systemInstruction;
    }

    if (tools.length > 0) {
      config.tools = tools;
    }

    const chat = ai.chats.create({
      model: model,
      config: config,
      history: chatHistory
    });

    // Pass 'message' property with the parts array.
    // We strictly use the { message: parts } format to support multi-modal inputs.
    const result = await chat.sendMessage({
      message: parts
    });

    const text = result.text || "No response generated.";
    const groundingMetadata = result.candidates?.[0]?.groundingMetadata;

    return { text, groundingMetadata };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { text: `Error: ${error.message || "Something went wrong with the AI service. Please try again."}` };
  }
};

export const fileToPart = (file: File): Promise<Attachment> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64String,
        name: file.name
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
