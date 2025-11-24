import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Brain, Briefcase, FileText, Bot, User, Search, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { Message, Attachment, ModelType, AppMode } from '../types';
import { generateChatResponse, fileToPart } from '../services/geminiService';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatInterfaceProps {
  mode: AppMode;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(ModelType.FLASH);
  const [useSearch, setUseSearch] = useState(false);
  const [systemInstruction, setSystemInstruction] = useState('');
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset state when switching modes
  useEffect(() => {
    setMessages([]);
    setAttachments([]);
    setInputValue('');
    if (mode === AppMode.CAREER) {
      setSystemInstruction(
        `You are an expert Career Architect, HR Specialist, and Recruiter. 
        Your goal is to analyze resumes, identify skill gaps, and suggest real-world job opportunities.
        ALWAYS use Google Search to find CURRENT job openings, salary trends, and specific company vacancies when asked.
        Structure your response clearly: 
        1. Professional Summary Analysis 
        2. ATS Compatibility Check 
        3. Job Market Fit & Eligible Roles 
        4. Skill Gap Analysis 
        5. REAL Job Openings (Links required)`
      );
      setSelectedModel(ModelType.PRO); // Default to pro for resume analysis
      setUseSearch(true); // Force search for career mode
    } else {
      setSystemInstruction('');
      setSelectedModel(ModelType.FLASH);
      setUseSearch(false);
    }
  }, [mode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAttachments: Attachment[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        try {
          const attachment = await fileToPart(file);
          newAttachments.push(attachment);
        } catch (error) {
          console.error("File upload failed", error);
        }
      }
      setAttachments(prev => [...prev, ...newAttachments]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if ((!inputValue.trim() && attachments.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      attachments: [...attachments],
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachments([]);
    setIsLoading(true);

    // Prepare context for API
    // If in Career mode and attachments exist but no text, assume resume analysis request
    let promptToSend = userMessage.content;
    if (mode === AppMode.CAREER && !promptToSend && userMessage.attachments && userMessage.attachments.length > 0) {
      promptToSend = "Analyze this resume. Provide a detailed report on job prospects, eligible roles, available jobs with links, and current market trends.";
    }

    try {
      const response = await generateChatResponse(
        messages, 
        promptToSend,
        userMessage.attachments || [],
        selectedModel,
        systemInstruction,
        useSearch || mode === AppMode.CAREER
      );

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text,
        timestamp: Date.now(),
        groundingMetadata: response.groundingMetadata
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
         id: (Date.now() + 1).toString(),
         role: 'model',
         content: "I encountered an error processing your request. Please try again.",
         timestamp: Date.now(),
         isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 relative">
      
      {/* Header / Top Bar */}
      <div className="flex-none p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/95 backdrop-blur z-20">
        <div className="flex items-center space-x-3">
          {mode === AppMode.GENERAL ? (
             <div className="p-2 bg-purple-600/20 rounded-lg"><Brain className="w-6 h-6 text-purple-400" /></div>
          ) : (
             <div className="p-2 bg-blue-600/20 rounded-lg"><Briefcase className="w-6 h-6 text-blue-400" /></div>
          )}
          <div>
            <h2 className="font-semibold text-lg">{mode === AppMode.GENERAL ? 'OmniChat' : 'Career Architect'}</h2>
            <p className="text-xs text-gray-400 hidden sm:block">
              {mode === AppMode.GENERAL ? 'Ask anything, explore ideas.' : 'Resume analysis & Job Market Intelligence.'}
            </p>
          </div>
        </div>

        {/* Model & Search Toggles */}
        <div className="flex items-center space-x-3">
          {mode === AppMode.GENERAL && (
            <button 
              onClick={() => setUseSearch(!useSearch)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                useSearch ? 'bg-blue-600/20 text-blue-300 border-blue-500/50' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Web Search</span>
            </button>
          )}

          <div className="relative group">
             <button className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 rounded-full text-xs border border-gray-700 hover:border-gray-500 transition-all">
               <span>{selectedModel === ModelType.FLASH ? 'Gemini Flash' : 'Gemini Pro'}</span>
               <ChevronDown className="w-3 h-3" />
             </button>
             <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-1 hidden group-hover:block z-50">
                <button 
                  onClick={() => setSelectedModel(ModelType.FLASH)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${selectedModel === ModelType.FLASH ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                  <span>Flash (Fast)</span>
                </button>
                <button 
                  onClick={() => setSelectedModel(ModelType.PRO)}
                   className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${selectedModel === ModelType.PRO ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                >
                  <span>Pro (Reasoning)</span>
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Prompt Engineer Section (Collapsible) */}
      <div className="flex-none px-4">
        <button 
          onClick={() => setShowPromptEditor(!showPromptEditor)}
          className="w-full flex items-center justify-center py-1 mt-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {showPromptEditor ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
          {showPromptEditor ? 'Hide Prompt Engineer' : 'Enhance System Prompt'}
        </button>
        
        {showPromptEditor && (
          <div className="mt-2 p-3 bg-gray-800/50 border border-gray-700 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
             <label className="block text-xs font-medium text-gray-400 mb-1">Custom System Instruction / Context</label>
             <textarea 
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 h-24 resize-none"
                placeholder="E.g., You are a senior software engineer helping me debug..."
             />
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
             {mode === AppMode.GENERAL ? (
               <>
                <Brain className="w-16 h-16 mb-4 text-purple-500/50" />
                <p className="text-lg font-medium">How can I help you today?</p>
               </>
             ) : (
                <>
                 <FileText className="w-16 h-16 mb-4 text-blue-500/50" />
                 <p className="text-lg font-medium">Upload your resume to get started</p>
                 <p className="text-sm mt-2 max-w-xs text-center">I can analyze job prospects, finding matching vacancies, and suggest skill improvements.</p>
                </>
             )}
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`flex max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                
                {/* Avatar */}
                <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center mt-1 ${msg.role === 'user' ? 'bg-gray-700' : (mode === AppMode.GENERAL ? 'bg-purple-600' : 'bg-blue-600')}`}>
                   {msg.role === 'user' ? <User className="w-5 h-5 text-gray-300" /> : <Bot className="w-5 h-5 text-white" />}
                </div>

                {/* Content */}
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                   <div className={`px-4 py-3 rounded-2xl ${
                     msg.role === 'user' 
                       ? 'bg-gray-800 text-white rounded-tr-sm border border-gray-700' 
                       : 'bg-transparent text-gray-100 rounded-tl-sm'
                   }`}>
                      
                      {/* Attachments Display */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {msg.attachments.map((att, idx) => (
                             <div key={idx} className="bg-gray-900/50 p-2 rounded border border-gray-700/50 text-xs flex items-center space-x-2">
                                <span className="uppercase font-bold text-gray-500 text-[10px]">{att.mimeType.split('/')[1]}</span>
                                <span className="truncate max-w-[150px]">{att.name || 'Attachment'}</span>
                             </div>
                          ))}
                        </div>
                      )}

                      <MarkdownRenderer content={msg.content} />
                      
                      {/* Search Grounding Sources */}
                      {msg.groundingMetadata?.groundingChunks && (
                        <div className="mt-4 pt-3 border-t border-gray-800">
                          <p className="text-xs text-gray-500 font-semibold mb-2 flex items-center gap-1"><Search className="w-3 h-3"/> Sources</p>
                          <div className="grid grid-cols-1 gap-2">
                             {msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => {
                                if (chunk.web?.uri) {
                                  return (
                                    <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="block text-xs text-blue-400 hover:underline truncate bg-gray-900/30 p-1.5 rounded hover:bg-gray-800 transition-colors">
                                      {chunk.web.title || chunk.web.uri}
                                    </a>
                                  )
                                }
                                return null;
                             })}
                          </div>
                        </div>
                      )}

                   </div>
                </div>
             </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="flex flex-row gap-3">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${mode === AppMode.GENERAL ? 'bg-purple-600' : 'bg-blue-600'}`}>
                  <Bot className="w-5 h-5 text-white" />
               </div>
               <div className="flex items-center space-x-1 h-10 px-4">
                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
               </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-none p-4 bg-gray-900/95 backdrop-blur border-t border-gray-800 z-20">
         {attachments.length > 0 && (
           <div className="flex space-x-2 mb-2 overflow-x-auto pb-2">
             {attachments.map((att, idx) => (
               <div key={idx} className="relative group flex-none">
                  <div className="w-16 h-16 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center overflow-hidden">
                     {att.mimeType.startsWith('image/') ? (
                        <img src={`data:${att.mimeType};base64,${att.data}`} alt="preview" className="w-full h-full object-cover" />
                     ) : (
                        <FileText className="w-8 h-8 text-gray-500" />
                     )}
                  </div>
                  <button 
                    onClick={() => removeAttachment(idx)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
               </div>
             ))}
           </div>
         )}
         
         <div className="relative flex items-end gap-2 bg-gray-800/50 p-2 rounded-xl border border-gray-700 focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-500 transition-all">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
              title="Upload files, images, music, videos"
            >
               <Paperclip className="w-5 h-5" />
            </button>
            <input 
               type="file" 
               multiple 
               ref={fileInputRef} 
               className="hidden" 
               onChange={handleFileUpload}
            />
            
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === AppMode.GENERAL ? "Message OmniChat..." : "Upload resume or ask about jobs..."}
              className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 p-2 focus:outline-none resize-none max-h-48 min-h-[44px] overflow-y-auto"
              rows={1}
              style={{ height: 'auto', minHeight: '44px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 192)}px`;
              }}
            />

            <button 
              onClick={sendMessage}
              disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}
              className={`p-2 rounded-lg transition-colors ${
                (!inputValue.trim() && attachments.length === 0) || isLoading 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
              }`}
            >
               <Send className="w-5 h-5" />
            </button>
         </div>
         <p className="text-center text-[10px] text-gray-600 mt-2">
           AI can make mistakes. Please double-check important information.
         </p>
      </div>
    </div>
  );
};

export default ChatInterface;