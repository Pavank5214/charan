import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import SideBar from '../common/SideBar'; 
import AiCommandModal from '../modals/AiCommandModal';

const UserLayout = () => {
  const [isAiOpen, setIsAiOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-200 font-sans">
      <SideBar />

      <main className="flex-1 min-h-screen transition-all duration-300 lg:ml-72 peer-checked:lg:ml-20 relative">
        <div className="pt-16 lg:pt-8 px-4 sm:px-6 lg:px-8 pb-20">
          <Outlet />
        </div>
      </main>

      {/* --- FLOATING AI BUTTON (Enhanced with Deep Breathing) --- */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setIsAiOpen(true)}
          className="group relative flex items-center justify-center p-1 rounded-full transition-all duration-500 hover:scale-105 active:scale-95"
        >
          {/* Layer 1: Wide Breathing Aura (Slow, Soft, Large) */}
          <div className="absolute -inset-6 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
          
          {/* Layer 2: Core Glow (Vibrant, Tight border) */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 group-hover:blur-md transition-all duration-500"></div>

          {/* Layer 3: Main Button Surface */}
          <div className="relative flex items-center gap-0 group-hover:gap-3 bg-slate-950 text-white p-4 rounded-full ring-1 ring-white/10 shadow-2xl overflow-hidden transition-all duration-500">
            
            {/* Subtle Inner Shine */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <Sparkles 
              className="w-6 h-6 text-indigo-300 group-hover:text-white group-hover:rotate-12 transition-all duration-500 relative z-10" 
              fill="currentColor" 
              fillOpacity={0.2} 
            />
            
            {/* Smooth Text Reveal */}
            <span className="max-w-0 overflow-hidden group-hover:max-w-[80px] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap font-bold text-sm relative z-10 text-indigo-50">
              Ask AI
            </span>
          </div>
        </button>
      </div>

      {/* --- THE STANDALONE COMPONENT --- */}
      <AiCommandModal 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
      />

    </div>
  );
};

export default UserLayout;