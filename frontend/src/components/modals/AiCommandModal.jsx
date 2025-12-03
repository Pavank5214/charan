import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, ArrowRight, MessageSquarePlus, FileText, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Ensure this matches your .env variable
const API_URL = import.meta.env.VITE_API_BASE_URL;

const AiCommandModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Focus input & Lock Scroll when open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setIsLoading(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!query.trim()) {
      toast.error('Please describe the invoice you want to create.');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Call Backend to parse text
      const response = await fetch(`${API_URL}/ai/parse-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: query })
      });

      if (!response.ok) {
        throw new Error('Failed to parse invoice data');
      }

      const invoiceData = await response.json();
      
      toast.success('Invoice details extracted!');
      onClose();
      
      // Navigate to Invoices page with the parsed data
      navigate('/invoices', { state: { aiData: invoiceData, openModal: true } });

    } catch (error) {
      console.error('AI Error:', error);
      toast.error('Could not understand the request. Please try again.');
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
      
      {/* 1. Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />

      {/* 2. Modal Container */}
      <div className="relative w-full max-w-2xl group animate-in fade-in zoom-in-95 duration-300">
        
        {/* Breathing Glow Layer */}
        <div 
          className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-20 animate-pulse group-hover:opacity-40 transition-all duration-700"
        ></div>

        {/* 3. Inner Content */}
        <div className="relative bg-slate-900 border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl">

          {/* Top Reflection Line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

          <div className="p-6 sm:p-8 relative z-10">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-inner">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">BillFlow AI</h2>
                  <p className="text-sm text-slate-400">Describe your invoice naturally...</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Field (TextArea) */}
            <form onSubmit={handleGenerate} className="relative mb-8">
              <div className="relative bg-slate-800/50 border border-white/10 rounded-2xl shadow-inner focus-within:ring-1 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all overflow-hidden">
                 <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe the invoice you want to create..."
                  className="w-full pl-5 pr-5 pt-5 pb-16 text-lg bg-transparent text-white placeholder:text-slate-500 focus:outline-none resize-none min-h-[140px] leading-relaxed"
                  autoFocus
                  disabled={isLoading}
                />
                
                {/* Submit Button (Bottom Right) */}
                <button 
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className={`absolute right-3 bottom-3 p-3 rounded-xl flex items-center justify-center transition-all duration-200 
                    ${isLoading 
                      ? 'bg-transparent text-indigo-400' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="text-xs text-slate-500 mt-2 text-right">
                Press <strong>Enter</strong> to submit, <strong>Shift+Enter</strong> for new line
              </div>
            </form>

            {/* Quick Actions */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 pl-1">Examples</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <QuickAction 
                  onClick={() => setQuery("Create invoice for ClientName: Web Dev Services $5000")}
                  icon={<MessageSquarePlus className="w-4 h-4" />} 
                  label="New Invoice" 
                  desc="Draft from description" 
                  delay="delay-0"
                />
                <QuickAction 
                   onClick={() => setQuery("Invoice for AWS Server Costs: $150")}
                  icon={<FileText className="w-4 h-4" />} 
                  label="Expense Entry" 
                  desc="Quick expense invoice" 
                   delay="delay-75"
                />
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