import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  FileText, Search, IndianRupee, Eye, Download, Plus, Edit, Trash2,
  Filter, ChevronDown, CheckCircle, Clock, AlertCircle, Truck, X, Save,
  Building, ShoppingCart, Loader2, Calendar
} from 'lucide-react';
import CreatePurchaseOrderModal from '../modals/CreatePurchaseOrderModal';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/purchase-orders`;

// --- HELPERS ---
const numberToWords = (num) => {
  if (!num) return 'Zero Rupees Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    return '';
  };
  return convert(Math.round(num)) + ' Rupees Only';
};




// --- MAIN PAGE COMPONENT ---
const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Fetch Orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } else {
        // Mock Data
        setOrders([
            { _id: '1', poNumber: 'PO-2025-001', vendor: { name: 'Steel Supplies Co.', mobile: '9876543210' }, orderDate: new Date().toISOString(), totalAmount: 45000, status: 'sent' },
            { _id: '2', poNumber: 'PO-2025-002', vendor: { name: 'Tech Components Ltd', mobile: '8877665544' }, orderDate: new Date(Date.now() - 86400000 * 2).toISOString(), totalAmount: 12500, status: 'received' },
        ]);
        toast.error("Failed to load orders (Using Mock)");
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // HTML Preview Generator
  const generateHTMLPreview = (order) => {
    const html = `
      <html>
        <head>
            <title>${order.poNumber}</title>
            <style>
                body { font-family: Helvetica, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; line-height: 1.5; }
                .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; }
                .title { font-size: 28px; font-weight: bold; color: #4f46e5; margin: 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 30px; }
                th { background: #f8fafc; text-align: left; padding: 12px; font-size: 12px; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
                td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
                .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 30px; color: #1e293b; }
                .section-title { font-weight: bold; margin-bottom: 5px; color: #475569; font-size: 14px; text-transform: uppercase; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="title">PURCHASE ORDER</div>
                    <div style="color: #64748b; font-size: 14px; margin-top: 5px;">My Company Name</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: bold; font-size: 16px;">${order.poNumber}</div>
                    <div style="color: #64748b; font-size: 13px; margin-top: 4px;">Date: ${new Date(order.orderDate).toLocaleDateString()}</div>
                </div>
            </div>
            <div style="margin-bottom: 40px; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
                <div class="section-title">Vendor</div>
                <div style="font-size: 16px; font-weight: bold;">${order.vendor?.name}</div>
                <div>${order.vendor?.address || ''}</div>
                <div style="margin-top: 5px; font-size: 13px; color: #64748b;">
                   ${order.vendor?.mobile ? 'Ph: ' + order.vendor.mobile : ''} 
                   ${order.vendor?.email ? ' | Email: ' + order.vendor.email : ''}
                </div>
            </div>
            <table>
                <thead><tr><th width="50%">Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>
                <tbody>
                    ${(order.items || []).map(i => `<tr><td>${i.description}</td><td style="text-align:right">${i.qty} ${i.unit}</td><td style="text-align:right">₹${i.rate}</td><td style="text-align:right">₹${(i.qty * i.rate).toLocaleString('en-IN')}</td></tr>`).join('')}
                </tbody>
            </table>
            <div class="total">Total: ₹${Number(order.totalAmount).toLocaleString('en-IN')}</div>
            <div style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                Generated automatically. This is a computer generated document.
            </div>
        </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // --- EXPORT FUNCTION ---
  const handleExport = () => {
    if (filteredOrders.length === 0) {
      toast.error("No orders to export.");
      return;
    }

    const headers = ['PO Number', 'Vendor', 'Date', 'Status', 'Total Amount'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(o => [
        o.poNumber,
        `"${o.vendor.name}"`,
        new Date(o.orderDate).toLocaleDateString(),
        o.status,
        o.totalAmount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `purchase_orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export successful");
  };

  // Handlers
  const handleSave = (order) => {
    setOrders(prev => {
        const exists = prev.find(o => o._id === order._id);
        return exists ? prev.map(o => o._id === order._id ? order : o) : [order, ...prev];
    });
    setIsModalOpen(false);
    setEditingOrder(null);
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
            <h3 className="font-medium text-gray-900 text-sm">Delete Purchase Order?</h3>
            <p className="text-gray-500 text-xs mt-1">This action cannot be undone.</p>
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
    const loadingToast = toast.loading('Deleting order...');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setOrders(prev => prev.filter(o => o._id !== id));
        toast.success('Purchase Order deleted', { id: loadingToast });
      } else {
        // Fallback for demo/error
        toast.error('Failed to delete', { id: loadingToast });
      }
    } catch(e) { 
      console.warn("Delete failed on API"); 
      // Optimistic delete for demo if API fails
      setOrders(prev => prev.filter(o => o._id !== id));
      toast.success('Deleted (Demo Mode)', { id: loadingToast });
    }
  };

  // --- STATUS UPDATE HANDLER ---
  const handleStatusChange = async (id, newStatus) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
    
    try {
      const token = localStorage.getItem('token');
      // Simulated API call for status update
      /*
      await fetch(`${API_BASE}/${id}/status`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
         body: JSON.stringify({ status: newStatus })
      });
      */
      toast.success("Status updated");
    } catch(e) { console.error("Status update failed", e); }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) || o.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // UI Helpers
  const getStatusStyle = (status) => {
    switch(status) {
        case 'received': return 'bg-green-50 text-green-700 border-green-200';
        case 'sent': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
          <div className="flex shrink-0 gap-3">
             {/* Export Button Added */}
             <button 
              onClick={handleExport}
              className="hidden md:inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
            <button
              onClick={() => { setEditingOrder(null); setIsModalOpen(true); }}
              className="w-full md:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow"
            >
              <Plus className="w-5 h-5 mr-2" /> Create PO
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search PO Number or Vendor..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
              />
            </div>
            <div className="w-full md:w-48 relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="block w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 md:p-20 text-center text-gray-500">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <ShoppingCart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No purchase orders found</h3>
            <p className="text-sm mt-1">Create a new PO to get started.</p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">PO Details</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Date</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs mr-3">PO</div>
                            <div className="text-sm font-semibold text-gray-900">{order.poNumber}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.vendor?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.orderDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {/* Status Dropdown */}
                          <div className="relative inline-block text-left">
                             <select
                               value={order.status}
                               onChange={(e) => handleStatusChange(order._id, e.target.value)}
                               className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-500 transition-all ${getStatusStyle(order.status)}`}
                             >
                               <option value="draft">Draft</option>
                               <option value="sent">Sent</option>
                               <option value="received">Received</option>
                               <option value="cancelled">Cancelled</option>
                             </select>
                             <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-50">
                               <ChevronDown className="w-3 h-3" />
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                          ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                           <div className="flex items-center justify-end space-x-2">
                             <button onClick={() => generateHTMLPreview(order)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors" title="View PDF"><Eye className="w-4 h-4"/></button>
                             <button onClick={() => { setEditingOrder(order); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors" title="Edit"><Edit className="w-4 h-4"/></button>
                             <button onClick={() => handleDelete(order._id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors" title="Delete"><Trash2 className="w-4 h-4"/></button>
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
              {filteredOrders.map((order) => (
                <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">PO</div>
                      <div>
                        <h3 className="font-bold text-gray-900">{order.poNumber}</h3>
                        <p className="text-xs text-gray-500">{new Date(order.orderDate).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    {/* Mobile Status Dropdown */}
                    <div className="relative inline-block text-left">
                         <select
                           value={order.status}
                           onChange={(e) => handleStatusChange(order._id, e.target.value)}
                           className={`appearance-none pl-3 pr-7 py-1 rounded-full text-[10px] font-medium border cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-500 transition-all ${getStatusStyle(order.status)}`}
                         >
                           <option value="draft">Draft</option>
                           <option value="sent">Sent</option>
                           <option value="received">Received</option>
                           <option value="cancelled">Cancelled</option>
                         </select>
                         <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-50">
                           <ChevronDown className="w-3 h-3" />
                         </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Vendor</p>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{order.vendor?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
                      <p className="text-lg font-bold text-gray-900">₹{Number(order.totalAmount).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => generateHTMLPreview(order)} className="flex flex-col items-center justify-center py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-xs"><Eye className="w-5 h-5 mb-1"/> View</button>
                    <button onClick={() => { setEditingOrder(order); setIsModalOpen(true); }} className="flex flex-col items-center justify-center py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-xs"><Edit className="w-5 h-5 mb-1"/> Edit</button>
                    <button onClick={() => handleDelete(order._id)} className="flex flex-col items-center justify-center py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs"><Trash2 className="w-5 h-5 mb-1"/> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <CreatePurchaseOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        orderToEdit={editingOrder}
        apiBase={API_BASE}
      />
    </div>
  );
};

export default PurchaseOrders;