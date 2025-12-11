import React, { useState, useEffect, useMemo } from 'react';
import {
  IndianRupee, Search, Filter, Download,
  CreditCard, Wallet, Building2, FileText, ChevronDown,
  Trash2, Edit, PieChart, Briefcase, Zap, Coffee, Plus, Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import CreateExpenseModal from '../modals/CreateExpenseModal';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/expenses`;

// --- MAIN COMPONENT: Expenses Page ---
const Expenses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Expenses
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setExpenses(Array.isArray(data) ? data : []);
      } else {
        toast.error("Failed to load expenses");
        setExpenses([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSave = (expense) => {
    setExpenses(prev => {
      const exists = prev.find(e => e._id === expense._id);
      return exists ? prev.map(e => e._id === expense._id ? expense : e) : [expense, ...prev];
    });
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  // --- Custom Delete Confirmation Toast ---
  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[240px]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-50 rounded-full shrink-0">
            <Trash2 className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">Delete Expense?</h3>
            <p className="text-gray-500 text-xs mt-1">This will permanently remove the record.</p>
          </div>
        </div>
        
        <div className="flex gap-2 justify-end mt-1">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => executeDelete(id, t.id)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-center',
      style: {
        background: '#fff',
        padding: '12px',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #f3f4f6'
      },
    });
  };

  const executeDelete = async (id, toastId) => {
    toast.dismiss(toastId);
    const loadingToast = toast.loading('Deleting expense...');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setExpenses(prev => prev.filter(e => e._id !== id));
        toast.success('Expense deleted successfully', { id: loadingToast });
      } else {
        toast.error('Failed to delete expense', { id: loadingToast });
      }
    } catch(e) { 
      console.error(e);
      toast.error('Connection error', { id: loadingToast });
    }
  };

  const handleExport = () => {
    if (expenses.length === 0) {
      toast.error("No expenses to export.");
      return;
    }
    const headers = ['Payee', 'Category', 'Amount', 'Date', 'Method', 'Status', 'Description'];
    const csvContent = [
      headers.join(','),
      ...expenses.map(e => [
        `"${e.payee.replace(/"/g, '""')}"`,
        e.category,
        e.amount,
        new Date(e.date).toLocaleDateString(),
        e.method,
        e.status,
        `"${(e.description || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Expenses exported to CSV");
  };

  // Calculations
  const totalSpend = useMemo(() => expenses.reduce((acc, e) => acc + Number(e.amount), 0), [expenses]);
  const pendingAmount = useMemo(() => expenses.reduce((acc, e) => e.status === 'pending' ? acc + Number(e.amount) : acc, 0), [expenses]);

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.payee.toLowerCase().includes(searchTerm.toLowerCase()) || (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterCategory === 'all' || e.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const getCategoryIcon = (cat) => {
    switch(cat) {
      case 'Operational': return <Building2 className="w-4 h-4"/>;
      case 'Travel': return <Briefcase className="w-4 h-4"/>;
      case 'Utilities': return <Zap className="w-4 h-4"/>;
      case 'Food': return <Coffee className="w-4 h-4"/>;
      default: return <FileText className="w-4 h-4"/>;
    }
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'paid': return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
          <div className="flex shrink-0 gap-3">
            <button onClick={handleExport} className="hidden md:inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition shadow-sm">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
            <button 
              onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
              className="w-full md:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm hover:shadow"
            >
              <Plus className="w-5 h-5 mr-2" /> Record Expense
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <p className="text-gray-500 font-medium text-sm">Total Spending</p>
             <p className="text-3xl font-bold text-gray-900 mt-2 flex items-center">
              <IndianRupee className="w-6 h-6 mr-1 text-gray-400" />
              {totalSpend.toLocaleString('en-IN')}
            </p>
             <div className="mt-4 flex items-center text-red-600 text-sm font-medium">
              <PieChart className="w-4 h-4 mr-1" /> 
              <span>All time</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <p className="text-gray-500 font-medium text-sm">Pending Payments</p>
             <p className="text-3xl font-bold text-gray-900 mt-2 flex items-center">
              <IndianRupee className="w-6 h-6 mr-1 text-gray-400" />
              {pendingAmount.toLocaleString('en-IN')}
            </p>
             <div className="mt-4 flex items-center text-yellow-600 text-sm font-medium">
              <Clock className="w-4 h-4 mr-1" /> 
              <span>To be cleared</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <p className="text-gray-500 font-medium text-sm">Total Transactions</p>
             <p className="text-3xl font-bold text-gray-900 mt-2">{expenses.length}</p>
             <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
              <FileText className="w-4 h-4 mr-1" /> 
              <span>Records found</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search payee or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors text-sm"
              />
            </div>
            <div className="w-full md:w-48 relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="block w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="Operational">Operational</option>
                <option value="Salary">Salary</option>
                <option value="Utilities">Utilities</option>
                <option value="Travel">Travel</option>
                <option value="Purchase">Purchase</option>
                <option value="Other">Other</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading expenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 md:p-20 text-center text-gray-500">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No expenses found</h3>
            <p className="text-sm mt-1">Record a new expense to get started.</p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payee / Description</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mode</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredExpenses.map((expense) => (
                      <tr key={expense._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{expense.payee}</div>
                          <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{expense.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                             {getCategoryIcon(expense.category)}
                             {expense.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(expense.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {expense.method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(expense.status)}`}>
                            <span className="capitalize">{expense.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                          ₹{Number(expense.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                           <div className="flex items-center justify-end space-x-2">
                             <button onClick={() => { setEditingExpense(expense); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors" title="Edit"><Edit className="w-4 h-4"/></button>
                             <button onClick={() => handleDelete(expense._id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors" title="Delete"><Trash2 className="w-4 h-4"/></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="md:hidden space-y-4">
              {filteredExpenses.map((expense) => (
                <div key={expense._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600 font-bold text-sm">
                         {getCategoryIcon(expense.category)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{expense.payee}</h3>
                        <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">₹{Number(expense.amount).toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="mb-3 text-xs text-gray-600 line-clamp-2 bg-gray-50 p-2 rounded">
                    {expense.description || 'No description provided'}
                  </div>

                  <div className="flex justify-between items-center mb-4">
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Wallet className="w-3 h-3"/> {expense.method}
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(expense.status)}`}>
                        <span className="capitalize">{expense.status}</span>
                      </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => { setEditingExpense(expense); setIsModalOpen(true); }} className="flex items-center justify-center py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-xs border border-gray-200"><Edit className="w-4 h-4 mr-1.5"/> Edit</button>
                    <button onClick={() => handleDelete(expense._id)} className="flex items-center justify-center py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs border border-gray-200"><Trash2 className="w-4 h-4 mr-1.5"/> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <CreateExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        expenseToEdit={editingExpense}
        apiBase={API_BASE}
      />
    </div>
  );
};

export default Expenses;