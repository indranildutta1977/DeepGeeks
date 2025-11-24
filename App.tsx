import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import { AppMode } from './types';
import { Sparkles, Briefcase } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.GENERAL);

  return (
    <div className="flex h-screen w-full bg-black font-sans selection:bg-blue-500/30">
      
      {/* Sidebar - Simplified for layout */}
      <div className="hidden md:flex flex-col w-[260px] bg-gray-950 border-r border-gray-800 p-4">
        <div className="flex items-center gap-2 mb-8 px-2">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
             <Sparkles className="w-5 h-5 text-white" />
           </div>
           <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
             OmniMind
           </h1>
        </div>

        <nav className="space-y-2 flex-1">
           <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Workspaces</div>
           
           <button 
             onClick={() => setMode(AppMode.GENERAL)}
             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
               mode === AppMode.GENERAL 
                 ? 'bg-gray-800 text-white shadow-lg shadow-purple-900/10 border border-gray-700' 
                 : 'text-gray-400 hover:text-white hover:bg-gray-900'
             }`}
           >
             <Sparkles className={`w-4 h-4 ${mode === AppMode.GENERAL ? 'text-purple-400' : ''}`} />
             General Intelligence
           </button>

           <button 
             onClick={() => setMode(AppMode.CAREER)}
             className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
               mode === AppMode.CAREER 
                 ? 'bg-gray-800 text-white shadow-lg shadow-blue-900/10 border border-gray-700' 
                 : 'text-gray-400 hover:text-white hover:bg-gray-900'
             }`}
           >
             <Briefcase className={`w-4 h-4 ${mode === AppMode.CAREER ? 'text-blue-400' : ''}`} />
             Career Architect
           </button>
        </nav>
        
        <div className="mt-auto pt-4 border-t border-gray-900">
          <div className="px-2 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <p className="text-xs text-gray-500 text-center">Powered by Google Gemini</p>
          </div>
        </div>
      </div>

      {/* Mobile Top Toggle (Slide Switch Style) */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-50 p-2 bg-gray-950/80 backdrop-blur border-b border-gray-800 flex justify-center">
         <div className="relative flex bg-gray-900 p-1 rounded-full border border-gray-800">
            {/* Animated Slider Background */}
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gray-800 rounded-full transition-all duration-300 shadow-sm border border-gray-700 ${mode === AppMode.GENERAL ? 'left-1' : 'left-[calc(50%+2px)]'}`}
            ></div>
            
            <button 
              onClick={() => setMode(AppMode.GENERAL)}
              className={`relative z-10 px-6 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === AppMode.GENERAL ? 'text-white' : 'text-gray-400'}`}
            >
              General
            </button>
            <button 
              onClick={() => setMode(AppMode.CAREER)}
              className={`relative z-10 px-6 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === AppMode.CAREER ? 'text-white' : 'text-gray-400'}`}
            >
              Career
            </button>
         </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-full md:ml-0 pt-12 md:pt-0">
        <ChatInterface mode={mode} />
      </main>
    </div>
  );
};

export default App;