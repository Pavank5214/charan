import React, { useState, useEffect } from 'react';
import {
  FileText, IndianRupee, Clock, TrendingUp, Users, AlertCircle,
  CheckCircle, ArrowUp, RefreshCcw, Bell, ChevronRight, Activity
} from 'lucide-react';

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
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

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
        invoices = [
            { id: 1, invoiceNumber: 'INV-001', invoiceDate: new Date().toISOString(), total: 15000, status: 'paid', client: { name: 'Acme Corp' } },
            { id: 2, invoiceNumber: 'INV-002', invoiceDate: new Date().toISOString(), total: 8500, status: 'sent', client: { name: 'Globex Inc' } },
        ];
      }
      if (!Array.isArray(invoices)) invoices = [];

      // Process Clients
      let clientsCount = 0;
      if (clientsRes && clientsRes.ok) {
        const clientsData = await clientsRes.json();
        clientsCount = Array.isArray(clientsData) ? clientsData.length : 0;
      } else {
        // Fallback: Count unique clients from invoices if client API fails
        clientsCount = new Set(
          invoices
            .map(inv => inv.client?.name)
            .filter(name => name)
        ).size;
      }

      // Filter by current month
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const monthInvoices = invoices.filter(inv => {
        if (!inv.invoiceDate) return false;
        const date = new Date(inv.invoiceDate);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      });

      const paidInvoices = monthInvoices.filter(inv => inv.status === 'paid');
      
      // FIXED: Overdue Logic
      // An invoice is overdue if:
      // 1. Status is explicitly 'overdue' OR
      // 2. Status is NOT 'paid' AND the date + 30 days is in the past
      const overdueInvoices = invoices.filter(inv => {
        if (inv.status === 'overdue') return true; // Explicitly marked
        
        if (!inv.invoiceDate || inv.status === 'paid') return false;
        
        const due = new Date(inv.invoiceDate);
        due.setDate(due.getDate() + 30); // assume 30-day due terms
        return due < now;
      });

      // Total Revenue calculation (sum of all invoices)
      // Note: If you only want PAID revenue, change filter to `inv.status === 'paid'`
      const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

      setStats({
        totalRevenue,
        paidCount: paidInvoices.length,
        totalSent: monthInvoices.length,
        overdueAmount,
        overdueCount: overdueInvoices.length,
        activeClients: clientsCount,
      });

      // Recent activity (last 5)
      const recent = invoices
        .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
        .slice(0, 5)
        .map(inv => {
          const date = new Date(inv.invoiceDate);
          const timeAgo = formatTimeAgo(date);
          const isPaid = inv.status === 'paid';
          const clientName = inv.client?.name || 'Unknown Client';
          
          return {
            id: inv.id || Math.random(),
            client: clientName,
            invoiceNumber: inv.invoiceNumber,
            status: inv.status,
            action: isPaid ? 'Payment received' : 'Invoice sent',
            description: isPaid ? `from ${clientName}` : `to ${clientName}`,
            amount: `₹${(Number(inv.total) || 0).toLocaleString('en-IN')}`,
            icon: isPaid ? CheckCircle : FileText,
            iconColor: isPaid ? 'text-emerald-500' : 'text-blue-500',
            bgColor: isPaid ? 'bg-emerald-50' : 'bg-blue-50',
            time: timeAgo,
          };
        });

      // Add overdue alerts to top of recent
      if (overdueInvoices.length > 0) {
        const overdue = overdueInvoices[0];
        const clientName = overdue.client?.name || 'Unknown Client'; 
        recent.unshift({
          id: 'overdue-' + (overdue.id || Math.random()),
          client: clientName,
          invoiceNumber: overdue.invoiceNumber,
          status: 'overdue',
          action: 'Overdue Alert',
          description: `Invoice #${overdue.invoiceNumber} is overdue`,
          amount: `₹${(Number(overdue.total) || 0).toLocaleString('en-IN')}`,
          icon: AlertCircle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          time: `${daysOverdue(overdue.invoiceDate)} days late`,
        });
      }

      setRecentActivity(recent.slice(0, 5));
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

  // ------------------ HELPERS ------------------
  const formatTimeAgo = (date) => {
    if (!date || isNaN(date.getTime())) return 'Unknown date';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const daysOverdue = (dateStr) => {
    if (!dateStr) return 0;
    const due = new Date(dateStr);
    due.setDate(due.getDate() + 30);
    const diff = Math.floor((new Date() - due) / 86400000);
    return diff > 0 ? diff : 0;
  };

  // ------------------ RENDER ------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center animate-pulse">
          <Activity className="w-10 h-10 text-blue-600 mb-4" />
          <p className="text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="bg-white border-l-4 border-red-500 p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="text-red-600 mt-1">{error}</p>
              <button 
                onClick={fetchDashboard}
                className="mt-4 px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header Section */}
        {/* <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 mt-1 flex items-center text-sm">
              Overview of your financial activity
              <span className="mx-2">•</span>
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <button 
              onClick={fetchDashboard}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
              title="Refresh Data"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-6 h-6" />
              {stats.overdueCount > 0 && (
                <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-white ml-2">
              JD
            </div>
          </div>
        </div> */}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue Card */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 hover:border-blue-100 transition-all duration-300 hover:shadow-md group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <IndianRupee className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span className="font-medium">+12.5%</span>
            </div>
          </div>

          {/* Paid Invoices Card */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 hover:border-emerald-100 transition-all duration-300 hover:shadow-md group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Paid Invoices</p>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  {stats.paidCount}
                </h3>
                <p className="text-xs text-gray-400 mt-1">/ {stats.totalSent} sent</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000" 
                style={{ width: `${stats.totalSent ? (stats.paidCount / stats.totalSent) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Overdue Card */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 hover:border-red-100 transition-all duration-300 hover:shadow-md group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Outstanding</p>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                  ₹{stats.overdueAmount.toLocaleString('en-IN')}
                </h3>
                <p className="text-xs text-red-500 mt-1 font-medium">{stats.overdueCount} invoices overdue</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              Due within 30 days
            </div>
          </div>

          {/* Clients Card */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 hover:border-indigo-100 transition-all duration-300 hover:shadow-md group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Active Clients</p>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {stats.activeClients}
                </h3>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 flex -space-x-2 overflow-hidden">
               {/* Mock avatars for visual appeal */}
               {[1,2,3].map(i => (
                 <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                   {String.fromCharCode(64 + i)}
                 </div>
               ))}
               <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs text-gray-500">+</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Activity List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">View All</button>
              </div>
              <div className="divide-y divide-gray-100">
                {recentActivity.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No recent activity found</p>
                  </div>
                ) : (
                  recentActivity.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors group cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${item.bgColor}`}>
                          <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {item.action}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {item.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{item.amount}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Tips */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full group flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-100 transition-all">
                  <div className="flex items-center">
                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="ml-3 font-medium text-gray-700 group-hover:text-blue-700">Send Reminder</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400" />
                </button>

                <button className="w-full group flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-100 transition-all">
                  <div className="flex items-center">
                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                      <IndianRupee className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="ml-3 font-medium text-gray-700 group-hover:text-emerald-700">Record Payment</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-400" />
                </button>

                <button className="w-full group flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 transition-all">
                  <div className="flex items-center">
                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="ml-3 font-medium text-gray-700 group-hover:text-indigo-700">Add New Client</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400" />
                </button>
              </div>
            </div>

            {/* Mini Insight */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-md p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
              <h3 className="text-lg font-bold mb-2 relative z-10">Pro Tip</h3>
              <p className="text-indigo-100 text-sm mb-4 relative z-10">
                You have {stats.overdueCount} overdue invoices. Sending a reminder on Tuesdays increases payment probability by 14%.
              </p>
              <button className="text-xs font-semibold bg-white text-indigo-600 px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-50 transition-colors relative z-10">
                Send Reminders Now
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;