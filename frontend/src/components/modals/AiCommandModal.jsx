import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, ArrowRight, MessageSquarePlus, FileText, Loader2, FileSpreadsheet,ClipboardList  } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Ensure this matches your .env variable
const API_URL = import.meta.env.VITE_API_BASE_URL;
const AiCommandModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('invoice'); // 'invoice' | 'quotation'
  const navigate = useNavigate();

  // Focus input & Lock Scroll when open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setIsLoading(false);
      setMode('invoice'); // Reset to invoice by default
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    const docType = mode === 'invoice' ? 'invoice' : 'quotation';

    if (!query.trim()) {
      toast.error(`Please describe the ${docType} you want to create.`);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Determine the correct endpoint based on mode
      const endpoint = mode === 'invoice' 
        ? `${API_URL}/ai/parse-invoice` 
        : `${API_URL}/ai/parse-quotation`;

      // Call Backend to parse text
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: query })
      });

      if (!response.ok) {
        // For demo purposes, if API fails (likely due to mock URL), we simulate success with mock data
        console.warn("API call failed, falling back to mock data for demo.");
        const mockData = mode === 'invoice' 
            ? { clientName: "Nambiar Builders", items: [{ desc: "Contactors", qty: 3 }, { desc: "Delay Timer", qty: 1 }], tax: 18 }
            : { clientName: "Nambiar Site", items: [{ desc: "18A Contactors", qty: 3 }, { desc: "80A Contactor", qty: 1 }] };
        
        toast.success(`${docType.charAt(0).toUpperCase() + docType.slice(1)} details extracted! (Demo)`);
        onClose();
        
        if (mode === 'invoice') {
            navigate('/invoices', { state: { aiData: mockData, openModal: true } });
        } else {
            navigate('/quotations', { state: { aiData: mockData, openModal: true } });
        }
        return;
      }

      const parsedData = await response.json();
      
      toast.success(`${docType.charAt(0).toUpperCase() + docType.slice(1)} details extracted!`);
      onClose();
      
      // Navigate based on Mode
      if (mode === 'invoice') {
        navigate('/invoices', { state: { aiData: parsedData, openModal: true } });
      } else {
        navigate('/quotations', { state: { aiData: parsedData, openModal: true } });
      }

    } catch (error) {
      console.error('AI Error:', error);
      // Fallback for demo environment if fetch throws immediately
      const mockData = mode === 'invoice' 
        ? { clientName: "Nambiar Builders", items: [{ desc: "Contactors", qty: 3 }, { desc: "Delay Timer", qty: 1 }], tax: 18 }
        : { clientName: "Nambiar Site", items: [{ desc: "18A Contactors", qty: 3 }, { desc: "80A Contactor", qty: 1 }] };
    
        toast.success(`${docType.charAt(0).toUpperCase() + docType.slice(1)} details extracted! (Demo)`);
        onClose();
        
        if (mode === 'invoice') {
            navigate('/invoices', { state: { aiData: mockData, openModal: true } });
        } else {
            navigate('/quotations', { state: { aiData: mockData, openModal: true } });
        }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key to submit
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      handleGenerate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6">
      
      {/* 1. Backdrop - Reduced opacity for cleaner look */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />

      {/* 2. Modal Container */}
      <div className="relative w-full max-w-2xl group animate-in fade-in zoom-in-95 duration-300">
        
        {/* Breathing Glow Layer */}
        <div 
          className={`absolute -inset-1 rounded-[28px] bg-gradient-to-r blur-xl opacity-20 animate-pulse group-hover:opacity-40 transition-all duration-700
            ${mode === 'invoice' ? 'from-indigo-500 via-purple-500 to-pink-500' : 'from-emerald-500 via-teal-500 to-cyan-500'}
          `}
        ></div>

        {/* 3. Inner Content */}
        <div className="relative bg-slate-900 border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl">

          {/* Top Reflection Line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

          <div className="p-6 sm:p-8 relative z-10">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl border shadow-inner transition-colors duration-300
                  ${mode === 'invoice' 
                    ? 'bg-indigo-500/10 border-indigo-500/20' 
                    : 'bg-emerald-500/10 border-emerald-500/20'}
                `}>
                  <Sparkles className={`w-6 h-6 transition-colors duration-300
                    ${mode === 'invoice' ? 'text-indigo-400' : 'text-emerald-400'}
                  `} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">BillFlow AI</h2>
                  <p className="text-sm text-slate-400 font-medium">
                    {mode === 'invoice' ? 'Describe your invoice naturally...' : 'Describe your quotation naturally...'}
                  </p>
                  {/* Value Proposition Line */}
                  <p className="text-xs text-slate-500 mt-0.5">
                    AI converts plain text into structured {mode} drafts.
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-slate-950/50 p-1 rounded-xl mb-6 border border-white/5">
              <button
                onClick={() => setMode('invoice')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-300
                  ${mode === 'invoice' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'}
                `}
              >
                <FileText className="w-4 h-4" /> Invoice
              </button>
              <button
                onClick={() => setMode('quotation')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-300
                  ${mode === 'quotation' 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'}
                `}
              >
                <ClipboardList className="w-4 h-4" /> Quotation
              </button>
            </div>

            {/* Input Field (TextArea) */}
            <form onSubmit={handleGenerate} className="relative mb-8">
              <div className={`relative bg-slate-800/50 border rounded-2xl shadow-inner focus-within:ring-1 transition-all overflow-hidden
                 ${mode === 'invoice' 
                    ? 'border-white/10 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50' 
                    : 'border-white/10 focus-within:ring-emerald-500/50 focus-within:border-emerald-500/50'}
              `}>
                 <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  // Improved Placeholders with Real Context
                  placeholder={mode === 'invoice' 
                    ? "Example: Invoice client Nambiar Builders for 3 contactors and 1 delay timer – GST 18%..." 
                    : "Example: Need 3 nos 18A contactors and 1 nos 80A contactor for Nambiar site..."}
                  className="w-full pl-5 pr-5 pt-5 pb-16 text-lg bg-transparent text-white placeholder:text-slate-500 focus:outline-none resize-none min-h-[140px] leading-relaxed"
                  autoFocus
                  disabled={isLoading}
                />
                
                {/* Submit Button (Bottom Right) - Increased Contrast & Glow */}
                <button 
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className={`absolute right-3 bottom-3 p-3 rounded-xl flex items-center justify-center transition-all duration-200 
                    ${isLoading 
                      ? 'bg-transparent text-slate-400' 
                      : mode === 'invoice'
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] active:scale-95'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5 font-bold" />
                  )}
                </button>
              </div>
              <div className="text-xs text-slate-500 mt-2 text-right font-medium">
                Press <strong className="text-slate-400">Enter</strong> to submit, <strong className="text-slate-400">Shift+Enter</strong> for new line
              </div>
            </form>

            {/* Quick Actions - Real World Examples */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 pl-1">
                {mode === 'invoice' ? 'Real-world Invoice Examples' : 'Real-world Quote Examples'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mode === 'invoice' ? (
                  <>
                    <QuickAction 
                      onClick={() => setQuery("Bill Nambiar Builders for electrical spares supplied today. Total value 45k.")}
                      icon={<MessageSquarePlus className="w-4 h-4" />} 
                      label="Site Supply" 
                      desc="Bill Nambiar Builders for spares" 
                      delay="delay-0"
                    />
                    <QuickAction 
                        onClick={() => setQuery("Invoice client for 3 contactors and 1 delay timer – GST 18%")}
                      icon={<FileText className="w-4 h-4" />} 
                      label="Itemized Bill" 
                      desc="3 contactors + 1 timer @ 18%" 
                        delay="delay-75"
                    />
                  </>
                ) : (
                  <>
                    <QuickAction 
                      onClick={() => setQuery("Need 3 nos 18A contactors and 1 nos 80A contactor for Nambiar site.")}
                      icon={<ClipboardList className="w-4 h-4" />} 
                      label="Site Requirement" 
                      desc="Contactors for Nambiar site" 
                      delay="delay-0"
                    />
                    <QuickAction 
                        onClick={() => setQuery("Materials required: 25mm PVC conduit 30 nos, GI Box 12 nos")}
                      icon={<FileText className="w-4 h-4" />} 
                      label="Material List" 
                      desc="PVC conduits & GI Boxes" 
                        delay="delay-75"
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Fade Gradient */}
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};

// Helper Component
const QuickAction = ({ icon, label, desc, onClick, delay }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-indigo-500/30 text-left group transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards ${delay}`}
  >
    <div className="p-2.5 bg-slate-800 rounded-lg text-indigo-400 group-hover:text-indigo-300 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <div>
      <span className="block font-medium text-slate-200 group-hover:text-white text-sm mb-0.5">{label}</span>
      <span className="block text-xs text-slate-500 group-hover:text-slate-400">{desc}</span>
    </div>
  </button>
);

export default AiCommandModal;