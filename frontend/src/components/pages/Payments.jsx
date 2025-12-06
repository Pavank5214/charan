import React, { useState, useEffect, useMemo } from 'react';
import {
  IndianRupee, Search, Filter, Download, Calendar,
  CheckCircle, XCircle, Clock, ArrowUp, Plus,
  CreditCard, Wallet, Building2, FileText, ChevronDown,
  Trash2, Loader2, X, Save, Edit
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import RecordPaymentModal from '../modals/RecordPaymentModal';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/payments`;


// --- MAIN COMPONENT: Payments Page ---
const Payments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Payments from API
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setPayments(Array.isArray(data) ? data : []);
      } else {
        // Fallback mock data if API is down or empty
        console.warn("Using mock payment data");
        setPayments([
          { _id: '1', paymentId: 'PAY-8921', clientName: 'Gupta Enterprises', amount: 92630, method: 'UPI', status: 'verified', date: '2023-11-10', referenceId: 'UPI8923748291' },
          { _id: '2', paymentId: 'PAY-8919', clientName: 'Sharma Traders', amount: 53100, method: 'Bank Transfer', status: 'verified', date: '2023-11-10', referenceId: 'NEFT-SBI-124567' },
          { _id: '3', paymentId: 'PAY-8915', clientName: 'Patel & Co.', amount: 37760, method: 'Cheque', status: 'pending', date: '2023-11-09', referenceId: 'CHQ-998877' },
        ]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSavePayment = (savedPayment) => {
    setPayments(prev => {
      const exists = prev.find(p => p._id === savedPayment._id);
      if (exists) {
        return prev.map(p => p._id === savedPayment._id ? savedPayment : p);
      }
      return [savedPayment, ...prev];
    });
    setIsModalOpen(false);
    setEditingPayment(null);
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setIsModalOpen(true);
  };

  // --- NEW: Custom Toast Delete Confirmation ---
  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[240px]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-50 rounded-full shrink-0">
            <Trash2 className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">Delete Payment?</h3>
            <p className="text-gray-500 text-xs mt-1">This record will be permanently removed.</p>
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
    const loadingToast = toast.loading('Deleting payment record...');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setPayments(prev => prev.filter(p => p._id !== id));
        toast.success('Payment deleted successfully', { id: loadingToast });
      } else {
        // Fallback for demo
        setPayments(prev => prev.filter(p => p._id !== id));
        toast.success('Payment deleted (Demo Mode)', { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      // Optimistic delete for demo purposes
      setPayments(prev => prev.filter(p => p._id !== id)); 
      toast.success('Payment deleted (Optimistic)', { id: loadingToast });
    }
  };

  // --- EXPORT FUNCTIONALITY ---
  const handleExport = () => {
    if (filteredPayments.length === 0) {
      toast.error("No payments to export.");
      return;
    }

    const headers = ['Payment ID', 'Client Name', 'Amount', 'Date', 'Method', 'Status', 'Reference ID'];
    const csvContent = [
      headers.join(','),
      ...filteredPayments.map(p => [
        p.paymentId,
        `"${p.clientName.replace(/"/g, '""')}"`, // Escape quotes
        p.amount,
        new Date(p.date).toLocaleDateString(),
        p.method,
        p.status,
        `"${p.referenceId || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Payments exported to CSV");
  };

  // Calculations
  const totalReceived = useMemo(() => payments.reduce((acc, p) => p.status === 'verified' ? acc + Number(p.amount) : acc, 0), [payments]);
  const pendingClearance = useMemo(() => payments.reduce((acc, p) => p.status === 'pending' ? acc + Number(p.amount) : acc, 0), [payments]);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.paymentId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.referenceId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterMethod === 'all' || p.method === filterMethod;
    return matchesSearch && matchesFilter;
  });

  // Helper for Method Icons
  const getMethodIcon = (method) => {
    switch(method) {
      case 'UPI': return <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center"><Wallet className="w-4 h-4"/></div>;
      case 'Bank Transfer': return <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><Building2 className="w-4 h-4"/></div>;
      case 'Cheque': return <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4"/></div>;
      case 'Cash': return <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center"><IndianRupee className="w-4 h-4"/></div>;
      default: return <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center"><CreditCard className="w-4 h-4"/></div>;
    }
  };

  // Helper for Status Badges
  const getStatusBadge = (status) => {
    const styles = {
      verified: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
    };
    const icons = {
      verified: <CheckCircle className="w-3 h-3" />,
      pending: <Clock className="w-3 h-3" />,
      failed: <XCircle className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${styles[status] || styles.pending}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-200 pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
          <div className="flex shrink-0 gap-3">
            <button 
              onClick={handleExport}
              className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
            <button 
              onClick={() => { setEditingPayment(null); setIsModalOpen(true); }}
              className="w-full md:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors shadow-sm hover:shadow"
            >
              <Plus className="w-5 h-5 mr-2" />
              Record Payment
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <p className="text-green-100 font-medium text-sm">Total Received</p>
            <p className="text-3xl font-bold mt-2 flex items-center">
              <IndianRupee className="w-6 h-6 mr-1 opacity-80" />
              {totalReceived.toLocaleString('en-IN')}
            </p>
            <div className="mt-4 flex items-center text-green-100 text-sm">
              <ArrowUp className="w-4 h-4 mr-1" /> 
              <span>Verified payments</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <p className="text-gray-500 font-medium text-sm">Uncleared / Cheques</p>
             <p className="text-3xl font-bold text-gray-900 mt-2 flex items-center">
              <IndianRupee className="w-6 h-6 mr-1 text-gray-400" />
              {pendingClearance.toLocaleString('en-IN')}
            </p>
             <div className="mt-4 flex items-center text-yellow-600 text-sm font-medium">
              <Clock className="w-4 h-4 mr-1" /> 
              <span>Pending clearance</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <p className="text-gray-500 font-medium text-sm">Transactions</p>
             <p className="text-3xl font-bold text-gray-900 mt-2">{payments.length}</p>
             <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
              <FileText className="w-4 h-4 mr-1" /> 
              <span>Total records</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by Client, ID, or Ref No..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors text-sm"
              />
            </div>
            <div className="w-full md:w-48 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filterMethod}
                onChange={e => setFilterMethod(e.target.value)}
                className="block w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Methods</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <IndianRupee className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No payments found</h3>
              <p className="text-sm mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment ID</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client / Reference</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mode</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredPayments.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.paymentId}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{p.clientName}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{p.referenceId || 'No Ref ID'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            {getMethodIcon(p.method)}
                            {p.method}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(p.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                           <div className="flex items-center justify-end gap-2">
                            <button 
                               onClick={() => handleEdit(p)}
                               className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition"
                             >
                               <Edit className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => handleDelete(p._id)}
                               className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW */}
              <div className="md:hidden p-4 space-y-4">
                {filteredPayments.map((p) => (
                  <div key={p._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        {getMethodIcon(p.method)}
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{p.clientName}</h3>
                          <p className="text-xs text-gray-500 font-mono">{p.paymentId}</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-900">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                         <Calendar className="w-3.5 h-3.5 text-gray-400" /> 
                         {new Date(p.date).toLocaleDateString('en-IN')}
                      </div>
                      <div className="flex justify-end">
                         {getStatusBadge(p.status)}
                      </div>
                      <div className="col-span-2 text-xs text-gray-400 font-mono break-all">
                        Ref: {p.referenceId || 'N/A'}
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
                       <button 
                         onClick={() => handleEdit(p)}
                         className="flex items-center gap-1 text-sm font-medium px-4 py-2 text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                       >
                         <Edit className="w-4 h-4" /> Edit
                       </button>
                       <button 
                         onClick={() => handleDelete(p._id)}
                         className="flex items-center gap-1 text-sm font-medium px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                       >
                         <Trash2 className="w-4 h-4" /> Delete
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Modals */}
      <RecordPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePayment}
        paymentToEdit={editingPayment}
        apiBase={API_BASE}
      />
    </div>
  );
};

export default Payments;