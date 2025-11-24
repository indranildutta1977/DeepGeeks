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
    if (attachments.length > 0) {
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
    // Ensure we don't send an empty text part if there are attachments, 
    // unless the API requires text. Usually mixed content is fine.
    // If there are no attachments, text is required.
    if (newMessage && newMessage.trim().length > 0) {
      parts.push({ text: newMessage });
    } else if (parts.length === 0) {
      // Fallback: No attachments and no text? Should not happen due to UI checks.
      // But if it does, send a space to avoid empty content error.
      parts.push({ text: " " });
    }

    // Build chat history
    const chatHistory = history.map(msg => {
      const msgParts: Part[] = [];
      
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(a => {
           msgParts.push({ inlineData: { mimeType: a.mimeType, data: a.data } });
        });
      }
      
      // Add text part if content exists
      if (msg.content && msg.content.trim().length > 0) {
        msgParts.push({ text: msg.content });
      } else if (msgParts.length === 0) {
         // Fallback for history items that might be empty
         msgParts.push({ text: " " }); 
      }

      return {
        role: msg.role,
        parts: msgParts
      };
    });

    // Configure tools
    const tools = [];
    if (useSearch || model === ModelType.PRO) { 
       tools.push({ googleSearch: {} });
    }

    const config: any = {
      systemInstruction,
      tools: tools.length > 0 ? tools : undefined,
    };

    if (model === ModelType.PRO && (!config.tools || config.tools.length === 0)) {
        config.tools = [{ googleSearch: {} }];
    }

    const chat = ai.chats.create({
      model: model,
      config: config,
      history: chatHistory
    });

    // Correct usage of sendMessage according to @google/genai SDK
    // Pass 'message' property with the parts array
    const result = await chat.sendMessage({
      message: parts
    });

    const text = result.text || "No response generated.";
    const groundingMetadata = result.candidates?.[0]?.groundingMetadata;

    return { text, groundingMetadata };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { text: `Error: ${error.message || "Something went wrong with the AI service."}` };
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