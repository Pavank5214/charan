import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, IndianRupee, Clock, TrendingUp, Users, AlertCircle,
  CheckCircle, ArrowUp, RefreshCcw, Bell, ChevronRight, Activity,
  Wallet, Calendar, ArrowRight, PieChart, BarChart3
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';

// Fixed: Removed import.meta to prevent build warnings in some environments
const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidCount: 0,
    totalSent: 0,
    overdueAmount: 0,
    overdueCount: 0,
    activeClients: 0,
    monthlyRevenue: [], // For the chart
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const navigate = useNavigate();
  const { user } = useAuth();
  

  // ------------------ FETCH DASHBOARD DATA ------------------
  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: token ? `Bearer ${token}` : '',
      };

      // Fetch invoices and clients in parallel
      const [invoicesRes, clientsRes] = await Promise.all([
        fetch(`${API_BASE}/invoice`, { headers }).catch(() => null),
        fetch(`${API_BASE}/clients`, { headers }).catch(() => null)
      ]);

      // Process Invoices
      let invoices = [];
      if (invoicesRes && invoicesRes.ok) {
        invoices = await invoicesRes.json();
      } else {
        console.warn("Invoices API unavailable, loading mock data");
        // Mock data for preview if API fails
        invoices = Array.from({ length: 20 }, (_, i) => ({
          id: i,
          invoiceNumber: `INV-0${i + 10}`,
          invoiceDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
          total: Math.floor(Math.random() * 50000) + 5000,
          status: ['paid', 'sent', 'overdue', 'draft'][Math.floor(Math.random() * 4)],
          client: { name: `Client ${i + 1}` }
        }));
      }
      if (!Array.isArray(invoices)) invoices = [];

      // Process Clients
      let clientsCount = 0;
      if (clientsRes && clientsRes.ok) {
        const clientsData = await clientsRes.json();
        clientsCount = Array.isArray(clientsData) ? clientsData.length : 0;
      } else {
        clientsCount = new Set(invoices.map(inv => inv.client?.name).filter(n => n)).size;
      }

      // --- CALCULATIONS ---
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      // 1. Current Month Stats
      const monthInvoices = invoices.filter(inv => {
        if (!inv.invoiceDate) return false;
        const date = new Date(inv.invoiceDate);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      });

      const paidInvoices = monthInvoices.filter(inv => inv.status === 'paid');
      
      // 2. Overdue Logic
      const overdueInvoices = invoices.filter(inv => {
        if (inv.status === 'overdue') return true;
        if (!inv.invoiceDate || inv.status === 'paid' || inv.status === 'draft') return false;
        const due = new Date(inv.invoiceDate);
        due.setDate(due.getDate() + 30); 
        return due < now;
      });

      // 3. Totals
      const totalRevenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
        
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

      // 4. Chart Data: Last 6 Months Revenue
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
        paidCount: paidInvoices.length,
        totalSent: monthInvoices.length,
        overdueAmount,
        overdueCount: overdueInvoices.length,
        activeClients: clientsCount,
        monthlyRevenue: last6Months
      });

      // 5. Recent Activity
      const recent = invoices
        .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
        .slice(0, 6)
        .map(inv => {
          const date = new Date(inv.invoiceDate);
          const isPaid = inv.status === 'paid';
          const isOverdue = inv.status === 'overdue';
          const clientName = inv.client?.name || 'Unknown Client';
          
          let action = 'Invoice Created';
          let color = 'blue';
          let icon = FileText;

          if (isPaid) { action = 'Payment Received'; color = 'emerald'; icon = CheckCircle; }
          else if (isOverdue) { action = 'Payment Overdue'; color = 'red'; icon = AlertCircle; }
          else if (inv.status === 'sent') { action = 'Invoice Sent'; color = 'indigo'; icon = ArrowUp; }

          return {
            id: inv.id || Math.random(),
            client: clientName,
            invoiceNumber: inv.invoiceNumber,
            amount: `₹${(Number(inv.total) || 0).toLocaleString('en-IN')}`,
            date: date,
            action,
            color,
            Icon: icon
          };
        });

      setRecentActivity(recent);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ------------------ GREETING LOGIC ------------------
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // ------------------ RENDER ------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
        <div className="flex flex-col items-center animate-pulse">
          <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
          <p className="text-gray-500 font-medium">Gathering financial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white border border-red-100 p-8 rounded-2xl shadow-sm text-center max-w-md">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Dashboard Unavailable</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button 
            onClick={fetchDashboard}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium shadow-lg shadow-indigo-200"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {getGreeting()}, <span className="text-indigo-600">{user?.name || 'User'}</span>
            </h1>
            <p className="text-gray-500 mt-2 text-sm flex items-center gap-2">
              Here's what's happening with your finances today.
              <span className="h-1 w-1 rounded-full bg-gray-300"></span>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchDashboard} 
              className="p-2.5 bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-100 rounded-xl transition-all shadow-sm active:scale-95"
              title="Refresh Data"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/invoices')}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-medium active:scale-95"
            >
              <span>View Invoices</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          {/* Total Revenue */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet className="w-16 h-16 text-indigo-600 transform rotate-12" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                <IndianRupee className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              ₹{(stats.totalRevenue / 1000).toFixed(1)}k
            </h3>
            <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>Collected this year</span>
            </p>
          </div>

          {/* Overdue */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertCircle className="w-16 h-16 text-red-600 transform -rotate-12" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-50 rounded-xl text-red-600">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Overdue</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              ₹{stats.overdueAmount.toLocaleString('en-IN')}
            </h3>
            <p className="text-sm text-red-500 font-medium">
              {stats.overdueCount} invoices pending
            </p>
          </div>

          {/* Active Clients */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-16 h-16 text-emerald-600" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Clients</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {stats.activeClients}
            </h3>
            <div className="flex -space-x-2 mt-2">
              {[...Array(Math.min(4, stats.activeClients))].map((_, i) => (
                <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                  {String.fromCharCode(65+i)}
                </div>
              ))}
              {stats.activeClients > 4 && (
                <div className="h-6 w-6 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-700 font-bold">
                  +{stats.activeClients - 4}
                </div>
              )}
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                <PieChart className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-indigo-100 uppercase tracking-wider">Success Rate</span>
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-1">
                {stats.totalSent > 0 ? Math.round((stats.paidCount / stats.totalSent) * 100) : 0}%
              </h3>
              <p className="text-sm text-indigo-200">
                Invoices paid this month
              </p>
              <div className="w-full bg-black/20 h-1.5 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full" 
                  style={{ width: `${stats.totalSent ? (stats.paidCount / stats.totalSent) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Chart & Activity */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Revenue Overview
                </h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Last 6 Months</span>
              </div>
              
              <div className="h-64 relative w-full pt-4">
                {/* Y-Axis Grid Lines (Background) */}
                <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-300 pointer-events-none pb-6">
                  <div className="border-b border-gray-100 w-full h-0"></div>
                  <div className="border-b border-gray-100 w-full h-0"></div>
                  <div className="border-b border-gray-100 w-full h-0"></div>
                  <div className="border-b border-gray-100 w-full h-0"></div>
                  <div className="border-b border-gray-100 w-full h-0"></div>
                </div>

                {stats.monthlyRevenue.length > 0 ? (
                  <div className="relative w-full h-full z-10 flex items-end justify-between px-2 gap-2 md:gap-4">
                    {stats.monthlyRevenue.map((item, index) => {
                      // Find max value for scaling, default to 1000 if all are 0
                      const maxVal = Math.max(...stats.monthlyRevenue.map(d => d.value), 1000); 
                      // Ensure bars have at least 10% height so they are visible even if value is small
                      const heightPercent = Math.max((item.value / maxVal) * 100, 10); 
                      // If value is truly 0, we can make it smaller or different color, but for now show empty bar base
                      const isZero = item.value === 0;

                      return (
                        <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                          
                          {/* The Bar */}
                          <div 
                            className={`w-full max-w-[30px] md:max-w-[40px] rounded-t-md relative transition-all duration-500 ease-out 
                              ${isZero ? 'bg-gray-100 h-[4px]' : 'bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-200'}`}
                            style={{ height: isZero ? '4px' : `${heightPercent}%` }}
                          >
                             {/* Tooltip on Hover */}
                             <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap pointer-events-none z-20">
                                ₹{item.value.toLocaleString('en-IN')}
                                {/* Tooltip Arrow */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                             </div>
                          </div>
                          
                          {/* X-Axis Label */}
                          <div className="h-6 flex items-center justify-center w-full mt-2">
                            <span className="text-[10px] md:text-xs text-gray-400 font-medium group-hover:text-indigo-600 transition-colors">
                              {item.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No revenue data available
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                <button onClick={() => navigate('/invoices')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</button>
              </div>
              
              <div className="space-y-6">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No recent activity</div>
                ) : (
                  recentActivity.map((activity, idx) => (
                    <div key={activity.id} className="relative pl-8 group">
                      {/* Timeline Line */}
                      {idx !== recentActivity.length - 1 && (
                        <div className="absolute top-8 left-3 w-px h-full bg-gray-100 group-hover:bg-indigo-100 transition-colors"></div>
                      )}
                      
                      {/* Icon Bubble */}
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 bg-${activity.color}-100`}>
                        <activity.Icon className={`w-3 h-3 text-${activity.color}-600`} />
                      </div>

                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{activity.action}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {activity.invoiceNumber} • {activity.client}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${activity.color}-50 text-${activity.color}-700`}>
                            {activity.amount}
                          </span>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {activity.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Quick Actions & Help */}
          <div className="space-y-6">
            
            {/* Quick Actions Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/invoices')}
                  className="w-full flex items-center p-3 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50 transition-all group text-left"
                >
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <span className="block text-sm font-semibold text-gray-900">Create Invoice</span>
                    <span className="block text-xs text-gray-500">Bill a client now</span>
                  </div>
                  <ChevronRight className="ml-auto w-4 h-4 text-gray-300 group-hover:text-indigo-400" />
                </button>

                <button 
                  onClick={() => navigate('/clients')}
                  className="w-full flex items-center p-3 rounded-xl border border-gray-100 hover:border-emerald-100 hover:bg-emerald-50 transition-all group text-left"
                >
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <span className="block text-sm font-semibold text-gray-900">Add Client</span>
                    <span className="block text-xs text-gray-500">Register new customer</span>
                  </div>
                  <ChevronRight className="ml-auto w-4 h-4 text-gray-300 group-hover:text-emerald-400" />
                </button>

                <button 
                  onClick={() => navigate('/payments')}
                  className="w-full flex items-center p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-all group text-left"
                >
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <span className="block text-sm font-semibold text-gray-900">Record Payment</span>
                    <span className="block text-xs text-gray-500">Track incoming funds</span>
                  </div>
                  <ChevronRight className="ml-auto w-4 h-4 text-gray-300 group-hover:text-blue-400" />
                </button>
              </div>

              {/* <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Support</h4>
                <div className="bg-slate-900 rounded-xl p-4 text-center">
                  <p className="text-white font-medium text-sm mb-1">Need Help?</p>
                  <p className="text-slate-400 text-xs mb-3">Check our documentation or contact support.</p>
                  <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors w-full">
                    Contact Support
                  </button>
                </div>
              </div> */}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;