import React, { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, Calendar, Download, TrendingUp, 
  TrendingDown, IndianRupee, ArrowUpRight, ArrowDownRight, 
  FileText, Filter, RefreshCcw, Loader2
} from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/reports`;

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState('thisMonth');
  const [customDates, setCustomDates] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  // Helper to calculate date ranges
  const getDateRange = (rangeType) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (rangeType) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case 'custom':
        return customDates; // Return state directly
      default:
        break;
    }
    return { 
      start: start.toISOString().split('T')[0], 
      end: end.toISOString().split('T')[0] 
    };
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange(dateRange);
      const token = localStorage.getItem('token');
      
      const query = `?startDate=${start}&endDate=${end}`;
      const res = await fetch(`${API_BASE}/summary${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        // Mock data for demo if API fails/doesn't exist yet
        console.warn("Using mock report data");
        setData({
          overview: {
            totalInvoiced: 450000,
            totalCollected: 320000,
            totalExpenses: 180000,
            netProfit: 270000,
            gstCollected: 45000
          },
          expenseByCategory: {
            'Operational': 80000,
            'Salaries': 50000,
            'Utilities': 20000,
            'Travel': 15000,
            'Other': 15000
          },
          invoiceCount: 24,
          expenseCount: 12
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateRange, customDates.start, customDates.end]);

  // --- EXPORT ---
  const handleExport = () => {
    if (!data) return;
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Invoiced', data.overview.totalInvoiced],
      ['Total Collected', data.overview.totalCollected],
      ['Total Expenses', data.overview.totalExpenses],
      ['Net Profit', data.overview.netProfit],
      ['GST Collected', data.overview.gstCollected],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          {/* <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Financial Reports</h1>
            <p className="text-gray-500 mt-1 text-sm"> insights into your business performance</p>
          </div> */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-sm">
               <Calendar className="w-4 h-4 text-gray-400 mr-2" />
               <select 
                 value={dateRange} 
                 onChange={(e) => setDateRange(e.target.value)}
                 className="text-sm font-medium bg-transparent outline-none text-gray-700 cursor-pointer"
               >
                 <option value="thisMonth">This Month</option>
                 <option value="lastMonth">Last Month</option>
                 <option value="thisYear">This Year</option>
                 <option value="custom">Custom Range</option>
               </select>
            </div>

            {dateRange === 'custom' && (
               <div className="flex gap-2">
                 <input type="date" value={customDates.start} onChange={e => setCustomDates({...customDates, start: e.target.value})} className="text-sm border rounded-lg px-2 py-2" />
                 <input type="date" value={customDates.end} onChange={e => setCustomDates({...customDates, end: e.target.value})} className="text-sm border rounded-lg px-2 py-2" />
               </div>
            )}

            <button 
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Revenue Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative">
              <p className="text-gray-500 font-medium text-sm flex items-center gap-2">
                Total Revenue <ArrowUpRight className="w-4 h-4 text-green-500" />
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                ₹{data?.overview.totalInvoiced.toLocaleString('en-IN')}
              </h3>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium text-xs">
                  {(data?.overview.totalCollected / (data?.overview.totalInvoiced || 1) * 100).toFixed(0)}% Collected
                </span>
                <span className="text-xs">from {data?.invoiceCount} invoices</span>
              </div>
            </div>
          </div>

          {/* Expenses Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="relative">
              <p className="text-gray-500 font-medium text-sm flex items-center gap-2">
                Total Expenses <ArrowDownRight className="w-4 h-4 text-red-500" />
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                ₹{data?.overview.totalExpenses.toLocaleString('en-IN')}
              </h3>
               <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium text-xs">
                  -{((data?.overview.totalExpenses / (data?.overview.totalInvoiced || 1)) * 100).toFixed(1)}% margin
                </span>
                <span className="text-xs">across {data?.expenseCount} records</span>
              </div>
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="relative">
              <p className="text-indigo-100 font-medium text-sm">Net Profit</p>
              <h3 className="text-3xl font-bold mt-2">
                ₹{data?.overview.netProfit.toLocaleString('en-IN')}
              </h3>
              <p className="text-indigo-100 text-sm mt-4 opacity-80">
                Approx GST Liability: ₹{data?.overview.gstCollected.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Expense Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-600" /> Expense Breakdown
              </h3>
            </div>
            
            <div className="space-y-5">
              {Object.entries(data?.expenseByCategory || {}).map(([category, amount], index) => {
                const percentage = ((amount / data?.overview.totalExpenses) * 100).toFixed(1);
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">{category}</span>
                      <span className="font-bold text-gray-900">₹{amount.toLocaleString('en-IN')} <span className="text-gray-400 font-normal ml-1">({percentage}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-2.5 rounded-full ${
                          index % 4 === 0 ? 'bg-blue-500' : 
                          index % 4 === 1 ? 'bg-purple-500' : 
                          index % 4 === 2 ? 'bg-pink-500' : 'bg-amber-500'
                        }`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {Object.keys(data?.expenseByCategory || {}).length === 0 && (
                <div className="text-center py-10 text-gray-400">No expense data available for this period.</div>
              )}
            </div>
          </div>

          {/* Tax & Cash Flow Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" /> Cash Flow & Tax
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Cash In</p>
                <p className="text-xl font-bold text-gray-900">₹{data?.overview.totalCollected.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500 mt-1">Received payments</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">Cash Out</p>
                <p className="text-xl font-bold text-gray-900">₹{data?.overview.totalExpenses.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500 mt-1">Expenses paid</p>
              </div>
            </div>

            <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
               <h4 className="font-bold text-gray-800 mb-3 text-sm">Estimated GST Summary</h4>
               <div className="flex justify-between items-center text-sm mb-2">
                 <span className="text-gray-600">Output GST (Collected)</span>
                 <span className="font-bold text-gray-900">₹{data?.overview.gstCollected.toLocaleString('en-IN')}</span>
               </div>
               <div className="flex justify-between items-center text-sm mb-3">
                 <span className="text-gray-600">Input GST (Expenses)</span>
                 <span className="font-bold text-gray-900">₹{(data?.overview.totalExpenses * 0.18).toFixed(0).toLocaleString('en-IN')}</span>
               </div>
               <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                 <span className="font-bold text-indigo-600">Net Payable</span>
                 <span className="font-bold text-xl text-indigo-700">
                    ₹{Math.max(0, data?.overview.gstCollected - (data?.overview.totalExpenses * 0.18)).toFixed(0).toLocaleString('en-IN')}
                 </span>
               </div>
               <p className="text-[10px] text-gray-400 mt-2 text-center">* Estimated values based on 18% standard rate. Consult accountant.</p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Reports;