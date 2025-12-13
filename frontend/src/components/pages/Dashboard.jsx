import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, IndianRupee, Clock, TrendingUp, Users, AlertCircle,
  CheckCircle, ArrowUp, RefreshCcw, ChevronRight, Activity,
  Wallet, BarChart3, FileQuestion, Send, Briefcase,
  ArrowRight, Sparkles, Lightbulb , Zap
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';

// --- UTILS ---

// API_BASE from environment
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Helper to prevent Tailwind Purge issues
const getColorStyles = (color) => {
  const styles = {
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700' },
    red: { bg: 'bg-red-100', text: 'text-red-600', icon: 'text-red-600', badge: 'bg-red-50 text-red-700' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-600', badge: 'bg-blue-50 text-blue-700' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-600', badge: 'bg-purple-50 text-purple-700' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', icon: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-700' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', icon: 'text-amber-600', badge: 'bg-amber-50 text-amber-700' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'text-gray-600', badge: 'bg-gray-50 text-gray-700' },
  };
  return styles[color] || styles.gray;
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidCount: 0,
    totalSent: 0,
    overdueAmount: 0,
    overdueCount: 0,
    activeClients: 0,
    pipelineValue: 0,
    pipelineCount: 0,
    monthlyRevenue: [],
    quoteFunnel: { draft: 0, sent: 0, approved: 0, converted: 0, rejected: 0 },
    conversionRate: 0,
    totalQuotes: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [expiringQuotes, setExpiringQuotes] = useState([]);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(''); // Removed unused error var usage
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [dataVersion, setDataVersion] = useState(0);
  const [previousInvoices, setPreviousInvoices] = useState([]);
  const [lastAiRefresh, setLastAiRefresh] = useState(0);

  const navigate = useNavigate();
  const { user } = useAuth();

  // ------------------ FETCH AI INSIGHT ------------------
  const fetchAiInsight = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const lastAiCall = localStorage.getItem('lastAiCall');

    // Simple throttle: Don't call if called < 5 mins ago, unless forced
    if (!forceRefresh && lastAiCall && now - parseInt(lastAiCall) < 5 * 60 * 1000) {
      // Restore previous insight if available to prevent empty box
      const cachedInsight = localStorage.getItem('cachedInsight');
      if (cachedInsight) setAiInsight(cachedInsight);
      return;
    }

    setAiLoading(true);
    try {
      const token = localStorage.getItem('token');
      // const response = await fetch(`${API_BASE}/ai/insight${forceRefresh ? '?force=true' : ''}`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });

      if (response.ok) {
        const data = await response.json();
        const insightText = data.insight || 'Optimization pending...';
        setAiInsight(insightText);
        localStorage.setItem('lastAiCall', now.toString());
        localStorage.setItem('cachedInsight', insightText);
      } else {
        throw new Error('AI Service Unavailable');
      }
    } catch (error) {
      console.warn('AI Insight fallback used');
      const fallbackInsight = "Based on current trends, focus on following up with overdue invoices to improve cash flow immediately.";
      setAiInsight(fallbackInsight);
    } finally {
      setAiLoading(false);
    }
  }, []);

  // ------------------ FETCH DASHBOARD DATA ------------------
  const fetchDashboard = useCallback(async (shouldRefreshAi = false) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: token ? `Bearer ${token}` : '' };

      const [invoicesRes, clientsRes, quotationsRes] = await Promise.all([
        fetch(`${API_BASE}/invoice`, { headers }).catch(() => null),
        fetch(`${API_BASE}/clients`, { headers }).catch(() => null),
        fetch(`${API_BASE}/quotation`, { headers }).catch(() => null)
      ]);

      // --- Process Invoices ---
      let invoices = [];
      if (invoicesRes && invoicesRes.ok) {
        const data = await invoicesRes.json();
        invoices = Array.isArray(data) ? data : [];
      }

      // --- Process Quotations ---
      let quotations = [];
      if (quotationsRes && quotationsRes.ok) {
        const data = await quotationsRes.json();
        quotations = Array.isArray(data) ? data : [];
      }

      // --- Process Clients ---
      let clientsCount = 0;
      if (clientsRes && clientsRes.ok) {
        const clientsData = await clientsRes.json();
        clientsCount = Array.isArray(clientsData) ? clientsData.length : 0;
      } else {
        const clientSet = new Set([...invoices, ...quotations].map(x => x.client?.name).filter(n => n));
        clientsCount = clientSet.size;
      }

      // --- CALCULATIONS ---
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      // 1. Invoice Stats
      const monthInvoices = invoices.filter(inv => {
        if (!inv.invoiceDate) return false;
        const d = new Date(inv.invoiceDate);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      });

      const totalRevenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
        
      const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

      // 2. Quotation / Pipeline Stats
      const quoteFunnel = { draft: 0, sent: 0, approved: 0, converted: 0, rejected: 0 };
      let pipelineValue = 0;

      quotations.forEach(q => {
        const s = (q.status || 'draft').toLowerCase();
        if (quoteFunnel[s] !== undefined) quoteFunnel[s]++;
        if (['sent', 'approved'].includes(s)) {
          pipelineValue += (Number(q.total) || 0);
        }
      });

      const totalQuotes = quotations.length;
      const convertedCount = quoteFunnel.converted;
      const conversionRate = totalQuotes > 0 ? Math.round((convertedCount / totalQuotes) * 100) : 0;

      // 3. Expiring Quotes Logic
      const expiring = quotations
        .filter(q => ['sent', 'draft'].includes(q.status))
        .map(q => ({ ...q, validDate: new Date(q.validUntil || 0) }))
        .filter(q => q.validDate > now && q.validDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))
        .sort((a, b) => a.validDate - b.validDate)
        .slice(0, 4);

      setExpiringQuotes(expiring);

      // 4. Chart Data (Revenue)
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const monthRev = invoices
          .filter(inv => {
            const invDate = new Date(inv.invoiceDate);
            return inv.status === 'paid' && 
                   invDate.getMonth() === d.getMonth() && 
                   invDate.getFullYear() === d.getFullYear();
          })
          .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
        last6Months.push({ label: monthName, value: monthRev });
      }

      setStats({
        totalRevenue,
        paidCount: invoices.filter(i => i.status === 'paid').length,
        totalSent: monthInvoices.length,
        overdueAmount,
        overdueCount: overdueInvoices.length,
        activeClients: clientsCount,
        pipelineValue,
        pipelineCount: quoteFunnel.sent + quoteFunnel.approved,
        monthlyRevenue: last6Months,
        quoteFunnel,
        conversionRate,
        totalQuotes
      });

      // 5. Combined Recent Activity
      const recent = [...invoices.map(i => ({ ...i, type: 'inv' })), ...quotations.map(q => ({ ...q, type: 'qt' }))]
        .sort((a, b) => {
           const dateA = new Date(a.invoiceDate || a.quotationDate || 0);
           const dateB = new Date(b.invoiceDate || b.quotationDate || 0);
           return dateB - dateA;
        })
        .slice(0, 6)
        .map(item => {
          const isInv = item.type === 'inv';
          const status = item.status || 'draft';
          let action, color, Icon;

          if (isInv) {
            if (status === 'paid') { action = 'Payment Received'; color = 'emerald'; Icon = CheckCircle; }
            else if (status === 'overdue') { action = 'Invoice Overdue'; color = 'red'; Icon = AlertCircle; }
            else { action = 'Invoice Sent'; color = 'blue'; Icon = ArrowUp; }
          } else {
            if (status === 'converted') { action = 'Quote Converted'; color = 'purple'; Icon = RefreshCcw; }
            else if (status === 'approved') { action = 'Quote Approved'; color = 'indigo'; Icon = CheckCircle; }
            else if (status === 'sent') { action = 'Quote Sent'; color = 'amber'; Icon = Send; }
            else { action = 'Quote Drafted'; color = 'gray'; Icon = FileText; }
          }
          
          // Fallback for missing dates
          const itemDate = new Date(item.invoiceDate || item.quotationDate);
          const validDate = !isNaN(itemDate) ? itemDate : new Date();

          return {
            id: item._id,
            action, color, Icon,
            ref: isInv ? item.invoiceNumber : item.quotationNumber,
            client: item.client?.name || 'Unknown',
            amount: Number(item.total).toLocaleString('en-IN'),
            date: validDate
          };
        });

      setRecentActivity(recent);
      setLastUpdated(new Date());

      // Check for invoice changes to trigger AI
      const currentInvoicesStr = JSON.stringify(invoices.map(i => i._id + i.status));
      const prevInvoicesStr = JSON.stringify(previousInvoices.map(i => i._id + i.status));
      
      if (currentInvoicesStr !== prevInvoicesStr) {
        setDataVersion(prev => prev + 1);
        setPreviousInvoices(invoices);
      }

      if (shouldRefreshAi) {
        await fetchAiInsight();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [previousInvoices, fetchAiInsight]); 

  // Initial Load
  useEffect(() => { 
    fetchDashboard(); 
    // Load cached insight initially
    const cached = localStorage.getItem('cachedInsight');
    if(cached) setAiInsight(cached);
    else fetchAiInsight();
  }, []); 

  // AI Refresh on Data Change
  useEffect(() => {
    if (dataVersion > 0) {
      const now = Date.now();
      if (now - lastAiRefresh > 5 * 60 * 1000) {
        fetchAiInsight();
        setLastAiRefresh(now);
      }
    }
  }, [dataVersion, lastAiRefresh, fetchAiInsight]);

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
  };

  if (loading && !stats.totalRevenue) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-pulse flex flex-col items-center">
        <Activity className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
        <span className="text-gray-500 font-medium">Loading Dashboard...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-200 pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{getGreeting()}, <span className="text-indigo-600">{user?.name || 'User'}</span></h1>
            <p className="text-gray-500 mt-2 text-sm flex items-center gap-2">
              Financial & Pipeline Overview <span className="h-1 w-1 rounded-full bg-gray-300"></span>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchDashboard(true)} className="p-2.5 bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 rounded-xl shadow-sm"><RefreshCcw className="w-5 h-5" /></button>
            <button onClick={() => navigate('/quotations')} className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium shadow-sm">Quotations</button>
            <button onClick={() => navigate('/invoices')} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 font-medium">
              <span>Invoices</span><ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
         
       {/* AI Insights Widget - High Impact / Highlighted */}
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-xl shadow-indigo-200 text-white transform transition-all duration-300 hover:scale-[1.01] mb-7">
  
  {/* Decorative Background Glows for Depth */}
  <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
  <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-purple-400 opacity-20 rounded-full blur-xl"></div>
  
  <div className="relative p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg shadow-sm border border-white/10">
          <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
        </div>
        <h3 className="text-lg font-bold tracking-widest text-indigo-100 ">AI Insight</h3>
      </div>
      
      <button 
        onClick={() => fetchAiInsight(true)}
        disabled={aiLoading}
        className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg transition-all disabled:opacity-50 border border-white/10 group"
        title="Generate new insight"
      >
        <RefreshCcw className={`w-4 h-4 text-white ${aiLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
      </button>
    </div>

    <div className="min-h-[60px] flex items-center">
      {aiLoading ? (
        <div className="w-full space-y-2 animate-pulse opacity-80">
          <div className="h-2 bg-white/30 rounded w-3/4"></div>
          <div className="h-2 bg-white/30 rounded w-1/2"></div>
        </div>
      ) : (
        <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="mt-1">
             <Lightbulb className="w-5 h-5 text-yellow-300 fill-yellow-300" />
          </div>
          <p className="text-base md:text-lg font-medium leading-relaxed text-white drop-shadow-sm">
            {aiInsight}
          </p>
        </div>
      )}
    </div>
  </div>
</div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Revenue */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet className="w-16 h-16 text-indigo-600 rotate-12" /></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600"><IndianRupee className="w-6 h-6" /></div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">₹{(stats.totalRevenue / 1000).toFixed(1)}k</h3>
            <p className="text-sm text-emerald-600 font-medium flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Collected this year</p>
          </div>

          {/* Pipeline */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Briefcase className="w-16 h-16 text-amber-500 rotate-6" /></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600"><FileQuestion className="w-6 h-6" /></div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pipeline Value</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">₹{(stats.pipelineValue / 1000).toFixed(1)}k</h3>
            <p className="text-sm text-amber-600 font-medium">{stats.pipelineCount} Open Quotations</p>
          </div>

          {/* Conversion */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><CheckCircle className="w-16 h-16 text-purple-500 -rotate-12" /></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600"><RefreshCcw className="w-6 h-6" /></div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Win Rate</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.conversionRate}%</h3>
            <p className="text-sm text-purple-600 font-medium">{stats.quoteFunnel.converted} / {stats.totalQuotes} Quotes Converted</p>
          </div>

          {/* Overdue */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><AlertCircle className="w-16 h-16 text-red-600 -rotate-12" /></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-50 rounded-xl text-red-600"><Clock className="w-6 h-6" /></div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Overdue</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">₹{stats.overdueAmount.toLocaleString()}</h3>
            <p className="text-sm text-red-500 font-medium">{stats.overdueCount} Invoices Pending</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COL: Charts & Activity */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Revenue Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /> Revenue Overview</h3>
              </div>
              <div className="h-56 relative w-full pt-4 flex items-end justify-between px-2 gap-4">
                {stats.monthlyRevenue.map((item, index) => {
                  const maxVal = Math.max(...stats.monthlyRevenue.map(d => d.value), 1000); 
                  const heightPercent = Math.max((item.value / maxVal) * 100, 10); 
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                      <div className={`w-full max-w-[30px] md:max-w-[40px] rounded-t-md relative transition-all duration-500 ${item.value === 0 ? 'bg-gray-100' : 'bg-indigo-500 hover:bg-indigo-600'}`} style={{ height: item.value === 0 ? '4px' : `${heightPercent}%` }}>
                          <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded z-20 whitespace-nowrap">₹{item.value.toLocaleString()}</div>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-2">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Quotation Funnel */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><FileQuestion className="w-5 h-5 text-amber-500" /> Quotation Status</h3>
              
              <div className="space-y-4">
                {/* Visual Bar Breakdown */}
                <div className="flex h-4 w-full rounded-full overflow-hidden bg-gray-100">
                  <div style={{ width: `${stats.totalQuotes ? (stats.quoteFunnel.draft/stats.totalQuotes)*100 : 0}%` }} className="bg-gray-300 hover:bg-gray-400 transition-colors" title="Draft" />
                  <div style={{ width: `${stats.totalQuotes ? (stats.quoteFunnel.sent/stats.totalQuotes)*100 : 0}%` }} className="bg-amber-400 hover:bg-amber-500 transition-colors" title="Sent" />
                  <div style={{ width: `${stats.totalQuotes ? (stats.quoteFunnel.approved/stats.totalQuotes)*100 : 0}%` }} className="bg-indigo-500 hover:bg-indigo-600 transition-colors" title="Approved" />
                  <div style={{ width: `${stats.totalQuotes ? (stats.quoteFunnel.converted/stats.totalQuotes)*100 : 0}%` }} className="bg-emerald-500 hover:bg-emerald-600 transition-colors" title="Converted" />
                  <div style={{ width: `${stats.totalQuotes ? (stats.quoteFunnel.rejected/stats.totalQuotes)*100 : 0}%` }} className="bg-red-400 hover:bg-red-500 transition-colors" title="Rejected" />
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                  <div className="text-center p-3 rounded-xl bg-gray-50">
                    <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Drafts</div>
                    <div className="text-lg font-bold text-gray-700">{stats.quoteFunnel.draft}</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-amber-50">
                    <div className="text-xs font-medium text-amber-600 mb-1 uppercase tracking-wide">Sent</div>
                    <div className="text-lg font-bold text-amber-700">{stats.quoteFunnel.sent}</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-indigo-50">
                    <div className="text-xs font-medium text-indigo-600 mb-1 uppercase tracking-wide">Approved</div>
                    <div className="text-lg font-bold text-indigo-700">{stats.quoteFunnel.approved}</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-emerald-50">
                    <div className="text-xs font-medium text-emerald-600 mb-1 uppercase tracking-wide">Converted</div>
                    <div className="text-lg font-bold text-emerald-700">{stats.quoteFunnel.converted}</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-red-50">
                    <div className="text-xs font-medium text-red-600 mb-1 uppercase tracking-wide">Rejected</div>
                    <div className="text-lg font-bold text-red-700">{stats.quoteFunnel.rejected}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Recent Activity */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
              </div>
              <div className="space-y-6">
                {recentActivity.map((activity, idx) => {
                  const styles = getColorStyles(activity.color);
                  return (
                    <div key={`${activity.id}-${idx}`} className="relative pl-8 group">
                      {idx !== recentActivity.length - 1 && <div className="absolute top-8 left-3 w-px h-full bg-gray-100 group-hover:bg-indigo-100 transition-colors"></div>}
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 ${styles.bg}`}>
                        <activity.Icon className={`w-3 h-3 ${styles.icon}`} />
                      </div>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{activity.action}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{activity.ref} • {activity.client}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${styles.badge}`}>₹{activity.amount}</span>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {activity.date instanceof Date && !isNaN(activity.date) ? activity.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>


          {/* RIGHT COL: Quick Actions & Alerts */}
          <div className="space-y-6">
            
           

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button onClick={() => navigate('/quotations')} className="w-full flex items-center p-3 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50 transition-all group text-left">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:bg-white"><FileQuestion className="w-5 h-5" /></div>
                  <div className="ml-3"><span className="block text-sm font-semibold text-gray-900">New Quotation</span><span className="block text-xs text-gray-500">Draft an estimate</span></div>
                  <ChevronRight className="ml-auto w-4 h-4 text-gray-300 group-hover:text-amber-400" />
                </button>
                <button onClick={() => navigate('/invoices')} className="w-full flex items-center p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group text-left">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-white"><FileText className="w-5 h-5" /></div>
                  <div className="ml-3"><span className="block text-sm font-semibold text-gray-900">Create Invoice</span><span className="block text-xs text-gray-500">Bill a client now</span></div>
                  <ChevronRight className="ml-auto w-4 h-4 text-gray-300 group-hover:text-blue-400" />
                </button>
                <button onClick={() => navigate('/clients')} className="w-full flex items-center p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group text-left">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-white"><Users className="w-5 h-5" /></div>
                  <div className="ml-3"><span className="block text-sm font-semibold text-gray-900">Add Client</span><span className="block text-xs text-gray-500">Register new customer</span></div>
                  <ChevronRight className="ml-auto w-4 h-4 text-gray-300 group-hover:text-emerald-400" />
                </button>
              </div>
            </div>

            {/* Expiring Quotes Widget */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> Expiring Soon</h3>
                <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">Next 7 Days</span>
              </div>
              
              {expiringQuotes.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No quotes expiring this week.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringQuotes.map((q) => (
                    <div key={q._id} className="p-3 rounded-xl bg-orange-50/50 border border-orange-100 flex justify-between items-center group hover:bg-orange-50 transition-colors cursor-pointer" onClick={() => navigate('/quotations')}>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{q.client?.name}</p>
                        <p className="text-xs text-gray-500">{q.quotationNumber} • ₹{Number(q.total).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-orange-600 block">{new Date(q.validDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                        <span className="text-[10px] text-orange-400">Due Date</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;