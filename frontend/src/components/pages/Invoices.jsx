import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FileText, Search, Eye,
  Download, X, Plus, Edit, Trash2,
  Filter, ChevronDown, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'react-hot-toast';
import CreateInvoiceModal from '../modals/CreateInvoiceModal';
import InvoicePDF from '../pdf/InvoicePDF';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/invoice`;

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [aiData, setAiData] = useState(null);

  // PDF Preview States
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // --- LISTENER: Catch AI Data from Navigation ---
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openModal && location.state?.aiData) {
      console.log("AI Data Received:", location.state.aiData);
      setEditingInvoice(null);
      setAiData(location.state.aiData);
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Fetch invoices
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleInvoiceSaved = (updatedInvoice) => {
    if (updatedInvoice) {
      setInvoices(prev => {
        const existingIndex = prev.findIndex(inv => inv._id === updatedInvoice._id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = updatedInvoice;
          return updated;
        } else {
          return [updatedInvoice, ...prev];
        }
      });
    } else {
      fetchInvoices();
    }
    setIsModalOpen(false);
    setEditingInvoice(null);
    setAiData(null);
  };

  // --- Status Change Logic ---
  const handleStatusChange = (id, newStatus, currentStatus) => {
    if (newStatus === currentStatus) return;

    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[240px]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-full shrink-0">
            <AlertCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">Update Status?</h3>
            <p className="text-gray-500 text-xs mt-1">
              Change status to <span className="font-bold text-gray-800 capitalize">{newStatus}</span>?
            </p>
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
            onClick={() => executeStatusChange(id, newStatus, t.id)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-center' });
  };

  const executeStatusChange = async (id, newStatus, toastId) => {
    toast.dismiss(toastId);
    const loadingToast = toast.loading('Updating status...');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("Failed to update");

      setInvoices(prev => prev.map(inv => inv._id === id ? { ...inv, status: newStatus } : inv));
      toast.success(`Status updated to ${newStatus}`, { id: loadingToast });
    } catch (err) {
      console.error("Status update failed", err);
      toast.error("Failed to update status", { id: loadingToast });
    }
  };

  // --- Helpers ---
  const getStatusStyle = (status) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100';
      case 'overdue': return 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100';
      case 'sent': return 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'overdue': return <AlertCircle className="w-3.5 h-3.5" />;
      case 'sent': return <Clock className="w-3.5 h-3.5" />;
      default: return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const numberToWords = (num) => {
    if (!num) return 'Zero Rupees Only';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convert = (n) => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      for (let i = 0; i < 4; i++) { // Simplified scale loop
        const unit = Math.pow(1000, i + 1);
        if (n < unit) return convert(Math.floor(n / Math.pow(1000, i))) + ' ' + ['', 'Thousand', 'Lakh', 'Crore'][i] +
          (n % Math.pow(1000, i) ? ' ' + convert(n % Math.pow(1000, i)) : '');
      }
      return '';
    };
    return convert(Math.round(num)) + ' Rupees Only';
  };

  // --- PDF & Render Logic ---
  const handleCloseModal = () => { setIsModalOpen(false); setEditingInvoice(null); setAiData(null); };
  const handleEdit = (inv) => { setEditingInvoice(inv); setAiData(null); setIsModalOpen(true); };

  const generatePDFBlob = async (invoiceFromList) => {
    setPdfLoading(true);
    try {
      const token = localStorage.getItem('token');
      const settingsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/settings/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const settingsData = await settingsRes.json();
      const company = settingsData.company || {};

      const pdfData = {
        company: { name: company.name || 'Your Business', address: company.address || '', gstin: company.gstin || '', phone: company.phone || '', email: company.email || '' },
        client: {
          name: invoiceFromList.clientId?.name || 'Customer',
          address: invoiceFromList.clientId?.address || '',
          state: invoiceFromList.clientId?.state || 'KARNATAKA',
          gstin: invoiceFromList.clientId?.gstin || '',
          email: invoiceFromList.clientId?.email || '',
          mobile: invoiceFromList.clientId?.mobile || '',
          pincode: invoiceFromList.clientId?.pincode || ''
        },
        number: invoiceFromList.invoiceNumber,
        date: new Date(invoiceFromList.invoiceDate).toLocaleDateString('en-IN'),
        items: (invoiceFromList.items || []).map(item => ({ ...item, amount: (item.qty * item.rate * (100 - (item.discount || 0)) / 100).toFixed(2) })),
        totals: {
          itemsSubtotal: Number(invoiceFromList.items?.reduce((acc, item) => acc + (item.qty * item.rate * (100 - (item.discount || 0)) / 100), 0) || 0).toFixed(2),
          basicPrice: Number(invoiceFromList.basicPrice || 0).toFixed(2),
          subtotal: Number(invoiceFromList.subtotal || 0).toFixed(2),
          gst: Number(invoiceFromList.gst || 0).toFixed(2),
          total: Number(invoiceFromList.total || 0).toFixed(2),
          inWords: numberToWords(invoiceFromList.total || 0)
        },
        bank: company.bankDetails || {}, gstRate: invoiceFromList.gstRate || 18, terms: company.terms || ['E & O.E.']
      };

      const blob = await pdf(<InvoicePDF invoice={pdfData} />).toBlob();
      return URL.createObjectURL(blob);
    } catch (err) { console.error(err); toast.error('PDF error'); return null; } finally { setPdfLoading(false); }
  };

  const handleView = async (inv) => { const url = await generatePDFBlob(inv); if (url) { window.open(url, '_blank'); } };
  const handleDownload = async (inv) => { const url = await generatePDFBlob(inv); if (url) { const a = document.createElement('a'); a.href = url; a.download = `${inv.invoiceNumber}.pdf`; a.click(); URL.revokeObjectURL(url); } };
  const closePreview = () => { if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); setPreviewInvoice(null); };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[240px]">
        <div className="flex items-start gap-3"><div className="p-2 bg-red-50 rounded-full shrink-0"><Trash2 className="w-4 h-4 text-red-600" /></div><div><h3 className="font-medium text-gray-900 text-sm">Delete Invoice?</h3></div></div>
        <div className="flex gap-2 justify-end mt-1"><button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button><button onClick={() => executeDelete(id, t.id)} className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg">Delete</button></div>
      </div>
    ));
  };
  const executeDelete = async (id, toastId) => {
    toast.dismiss(toastId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setInvoices(prev => prev.filter(i => i._id !== id));
      toast.success('Invoice deleted');
    } catch (err) { toast.error("Failed to delete"); }
  };

  const filteredInvoices = invoices.filter(inv => {
    const search = searchTerm.toLowerCase();
    const clientName = inv.clientId?.name || inv.client?.name || '';
    return (
      (search === '' || inv.invoiceNumber?.toLowerCase().includes(search) || clientName.toLowerCase().includes(search)) &&
      (filterStatus === 'all' || (inv.status || 'draft') === filterStatus)
    );
  });

  return (
    <div className="min-h-screen bg-slate-200 pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
          <div className="flex shrink-0">
            <button
              onClick={() => { setEditingInvoice(null); setAiData(null); setIsModalOpen(true); }}
              className="w-full md:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm hover:shadow"
            >
              <Plus className="w-5 h-5 mr-2" /> Create Invoice
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
              <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm" />
            </div>
            <div className="w-full md:w-48 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Filter className="h-4 w-4 text-gray-400" /></div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="block w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none cursor-pointer">
                <option value="all">All Status</option><option value="paid">Paid</option><option value="sent">Sent</option><option value="overdue">Overdue</option><option value="draft">Draft</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown className="h-4 w-4 text-gray-400" /></div>
            </div>
          </div>
        </div>

        {/* List */}
        {/* List */}
        <div className="mt-6"> {/* Removed the outer bg-white wrapper here */}
          
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-20 text-center text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No invoices found</p>
            </div>
          ) : (
            <>
              {/* --- DESKTOP VIEW (Table inside a White Box) --- */}
              <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice Details</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredInvoices.map((inv) => (
                        <tr key={inv._id} className="hover:bg-gray-50/80 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">#</div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">{inv.invoiceNumber}</div>
                                <div className="text-xs text-gray-500">GST Invoice</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{inv.clientId?.name || inv.client?.name}</div>
                            <div className="text-xs text-gray-500">{inv.clientId?.email || inv.client?.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="relative inline-block text-left">
                              <select
                                value={inv.status || 'draft'}
                                onChange={(e) => handleStatusChange(inv._id, e.target.value, inv.status)}
                                className={`appearance-none pl-8 pr-8 py-1.5 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all ${getStatusStyle(inv.status)}`}
                              >
                                <option value="draft">Draft</option>
                                <option value="sent">Sent</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                              </select>
                              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">{getStatusIcon(inv.status)}</div>
                              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-50"><ChevronDown className="w-3 h-3" /></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                            ₹{Number(inv.total || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleView(inv)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => handleDownload(inv)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"><Download className="w-4 h-4" /></button>
                              <button onClick={() => handleEdit(inv)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(inv._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* --- MOBILE VIEW (Independent Cards) --- */}
              <div className="md:hidden space-y-4">
                {filteredInvoices.map((inv) => (
                  <div key={inv._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">#</div>
                        <div>
                          <h3 className="font-bold text-gray-900">{inv.invoiceNumber}</h3>
                          <p className="text-xs text-gray-500">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <select
                          value={inv.status || 'draft'}
                          onChange={(e) => handleStatusChange(inv._id, e.target.value, inv.status)}
                          className={`appearance-none pl-7 pr-6 py-1 rounded-full text-[10px] font-medium border cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 transition-all ${getStatusStyle(inv.status)}`}
                        >
                          <option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
                        </select>
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">{React.cloneElement(getStatusIcon(inv.status), { className: "w-3 h-3" })}</div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-50"><ChevronDown className="w-2.5 h-2.5" /></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Client</p>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{inv.clientId?.name || inv.client?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
                        <p className="text-lg font-bold text-gray-900">₹{Number(inv.total || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100">
                      <button onClick={() => handleView(inv)} className="flex flex-col items-center justify-center py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-xs"><Eye className="w-5 h-5 mb-1" /> Preview</button>
                      <button onClick={() => handleDownload(inv)} className="flex flex-col items-center justify-center py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-xs"><Download className="w-5 h-5 mb-1" /> Save</button>
                      <button onClick={() => handleEdit(inv)} className="flex flex-col items-center justify-center py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-xs"><Edit className="w-5 h-5 mb-1" /> Edit</button>
                      <button onClick={() => handleDelete(inv._id)} className="flex flex-col items-center justify-center py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs"><Trash2 className="w-5 h-5 mb-1" /> Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <CreateInvoiceModal
        key={aiData ? 'ai-data' : (editingInvoice ? editingInvoice._id : 'new')}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onInvoiceCreated={handleInvoiceSaved}
        invoiceToEdit={editingInvoice}
        aiPrefillData={aiData}
      />

      {previewInvoice && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full h-full md:h-[90vh] md:w-[90vw] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Preview: {previewInvoice.invoiceNumber}
              </h3>
              <button onClick={closePreview} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* PDF Content Area */}
            <div className="flex-1 overflow-hidden relative bg-gray-100">
              {pdfLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-600">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                  <p className="font-medium">Generating PDF...</p>
                </div>
              ) : (
                <div className="w-full h-full">
                  {/* Mobile View: Download Prompt */}
                  <div className="md:hidden flex flex-col items-center justify-center h-full p-8 text-center bg-white">
                    <div className="bg-blue-50 rounded-full p-4 mb-6">
                      <FileText className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">View PDF</h3>
                    <p className="text-gray-600 mb-6 max-w-sm">
                      Mobile browsers often block embedded PDFs. Please download the file to view it clearly.
                    </p>
                    <button
                      onClick={() => handleDownload(previewInvoice)}
                      className="w-full max-w-xs px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                    >
                      <Download className="w-5 h-5" />
                      Download PDF
                    </button>
                  </div>

                  {/* Desktop View: Iframe */}
                  <iframe src={pdfBlobUrl} className="hidden md:block w-full h-full border-0" title="PDF Preview" />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex flex-col md:flex-row justify-end gap-3 bg-white">
              <button
                onClick={closePreview}
                className="w-full md:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(previewInvoice)}
                className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;