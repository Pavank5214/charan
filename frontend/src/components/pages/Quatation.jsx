import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FileText, Search, Eye, Download, X, Plus, Edit, Trash2,
  Filter, ChevronDown, CheckCircle, Clock, AlertCircle,
  XCircle, RefreshCw, FileCheck
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import CreateQuotationModal from '../modals/CreateQuotationModal';
import QuotationPDF from '../pdf/QuotationPDF';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/quotation`;

const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [aiPrefillData, setAiPrefillData] = useState(null);

  // Preview States (Left these for safety, though used less now)
  const [previewQuotation, setPreviewQuotation] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.openModal && location.state?.aiData) {
      setAiPrefillData(location.state.aiData);
      setIsModalOpen(true);
    }
  }, [location]);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setQuotations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuotations(); }, []);

  const handleQuotationSaved = () => {
    fetchQuotations();
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQuotation(null);
    setAiPrefillData(null);
    if (location.state?.openModal) {
       window.history.replaceState({}, document.title);
    }
  };

  const handleEdit = (q) => {
    setEditingQuotation(q);
    setAiPrefillData(null);
    setIsModalOpen(true);
  };

  const handleStatusChange = (id, newStatus, currentStatus) => {
    if (newStatus === currentStatus) return;
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[240px]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-full shrink-0">
            <RefreshCw className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">Change Status?</h3>
            <p className="text-gray-500 text-xs mt-1">Update status to <span className="capitalize font-medium">{newStatus}</span></p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={() => executeStatusChange(id, newStatus, t.id)} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">Update</button>
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed');
      setQuotations(prev => prev.map(q => q._id === id ? { ...q, status: newStatus } : q));
      toast.success('Status updated successfully', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to update status', { id: loadingToast });
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[240px]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-50 rounded-full shrink-0">
            <Trash2 className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">Delete Quotation?</h3>
            <p className="text-gray-500 text-xs mt-1">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={() => executeDelete(id, t.id)} className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm">Delete</button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-center' });
  };

  const executeDelete = async (id, toastId) => {
    toast.dismiss(toastId);
    const loadingToast = toast.loading('Deleting...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      setQuotations(prev => prev.filter(q => q._id !== id));
      toast.success('Deleted successfully', { id: loadingToast });
    } catch (err) {
      toast.error("Failed to delete", { id: loadingToast });
    }
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scale = ['', 'Thousand', 'Lakh', 'Crore'];
    const convert = (n) => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      for (let i = 0; i < scale.length; i++) {
        const unit = Math.pow(1000, i + 1);
        if (n < unit) return convert(Math.floor(n / Math.pow(1000, i))) + ' ' + scale[i] +
          (n % Math.pow(1000, i) ? ' ' + convert(n % Math.pow(1000, i)) : '');
      }
      return '';
    };
    return convert(Math.round(num)) + ' Only';
  };

  // --- PDF GENERATOR (Updated: Removed state side-effects) ---
  const generatePDFBlob = async (quotation) => {
    setPdfLoading(true);
    try {
      const token = localStorage.getItem('token');
      const settingsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/settings/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let company = {};
      let quotationDefaults = {};

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        company = settingsData.company || {};
        quotationDefaults = company.quotationSettings || {};
      }

      const defaults = {
        defaultSubject: quotationDefaults.defaultSubject || 'Quotation for Services',
        defaultIntro: quotationDefaults.defaultIntro || 'Thank you for considering our services.',
        terms: quotationDefaults.terms || ''
      };

      const pdfData = {
        company: {
            name: company.name || 'Company Name',
            subTitle: company.subTitle || '',
            address: company.address || '',
            city: company.city || '',
            zip: company.pincode || '',
            email: company.email || '',
            phone: company.phone || '',
            gstin: company.gstin || '',
        },
        client: quotation.client || {},
        number: quotation.quotationNumber || 'Q-000',
        date: quotation.quotationDate, 
        validUntil: quotation.validUntil,
        gstRate: quotation.gstRate || 18,
        defaults,
        items: (quotation.items || []).map(item => ({
          description: item.description || 'Service/Item',
          hsn: item.hsn || 'N/A',
          qty: item.qty || 0,
          unit: item.unit || 'Nos',
          rate: item.rate || 0,
          amount: (item.qty * item.rate * (1 - (item.discount || 0) / 100)) || 0,
          make: item.make || '-'
        })),
        totals: {
          basicPrice: Number(quotation.basicPrice) || 0, 
          subtotal: Number(quotation.subtotal) || 0,
          gst: Number(quotation.gst) || 0,
          total: Number(quotation.total) || 0,
          inWords: quotation.total ? numberToWords(quotation.total) : 'Zero Only'
        }
      };

      const blob = await pdf(<QuotationPDF quotation={pdfData} />).toBlob();
      // REMOVED: setPreviewQuotation(quotation) to prevent modal from opening
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error(err);
      toast.error("PDF generation failed");
      return null;
    } finally {
      setPdfLoading(false);
    }
  };

  // --- UPDATED VIEW HANDLER: Opens New Tab ---
  const handleView = async (q) => {
    const url = await generatePDFBlob(q);
    if (url) { 
        // Open PDF in new tab
        window.open(url, '_blank');
    }
  };

  const handleDownload = async (q) => {
    const url = await generatePDFBlob(q);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${q.quotationNumber || 'quotation'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const closePreview = () => {
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    setPreviewQuotation(null);
  };

  const filteredQuotations = quotations.filter(q => {
    const search = searchTerm.toLowerCase();
    return (
      (search === '' ||
        q.quotationNumber?.toLowerCase().includes(search) ||
        q.client?.name?.toLowerCase().includes(search)
      ) &&
      (filterStatus === 'all' || (q.status || 'draft') === filterStatus)
    );
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-100';
      case 'sent': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'converted': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-3.5 h-3.5 mr-1" />;
      case 'approved': return <CheckCircle className="w-3.5 h-3.5 mr-1" />;
      case 'rejected': return <XCircle className="w-3.5 h-3.5 mr-1" />;
      case 'sent': return <Clock className="w-3.5 h-3.5 mr-1" />;
      case 'converted': return <RefreshCw className="w-3.5 h-3.5 mr-1" />;
      default: return <FileText className="w-3.5 h-3.5 mr-1" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
          <div className="flex shrink-0">
            <button
              onClick={() => { setEditingQuotation(null); setAiPrefillData(null); setIsModalOpen(true); }}
              className="w-full md:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Quotation
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by quotation # or client..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
              />
            </div>
            <div className="w-full md:w-48 relative">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="block w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="converted">Converted</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading quotations...</p>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 md:p-20 text-center text-gray-500">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No quotations found</h3>
            <p className="text-sm mt-1">Create your first quotation to get started.</p>
          </div>
        ) : (
          <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto min-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quotation Details</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date / Valid</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredQuotations.map((q) => (
                      <tr key={q._id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">Q</div>
                            <div className="ml-4"><div className="text-sm font-semibold text-gray-900">{q.quotationNumber}</div></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{q.client?.name}</div><div className="text-xs text-gray-500">{q.client?.email || 'No email'}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-500">{new Date(q.quotationDate).toLocaleDateString('en-IN')}</div><div className="text-xs text-gray-400">Valid: {new Date(q.validUntil).toLocaleDateString('en-IN')}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative inline-block text-left">
                            <select
                              value={q.status || 'draft'}
                              onChange={(e) => handleStatusChange(q._id, e.target.value, q.status)}
                              className={`appearance-none pl-8 pr-8 py-1.5 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-all ${getStatusStyle(q.status)}`}
                            >
                              <option value="draft">Draft</option><option value="sent">Sent</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="converted">Converted</option>
                            </select>
                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">{getStatusIcon(q.status)}</div>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-50"><ChevronDown className="w-3 h-3" /></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">₹{Number(q.total || 0).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleView(q)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => handleDownload(q)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"><Download className="w-4 h-4" /></button>
                            <button onClick={() => { setEditingQuotation(q); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(q._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            {/* MOBILE VIEW */}
            <div className="md:hidden space-y-4">
              {filteredQuotations.map((q) => (
                <div key={q._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">Q</div>
                      <div>
                        <h3 className="font-bold text-gray-900">{q.quotationNumber}</h3>
                        <p className="text-xs text-gray-500">{new Date(q.quotationDate).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Client</p>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{q.client?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
                      <p className="text-lg font-bold text-gray-900">₹{Number(q.total || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => handleView(q)} className="flex flex-col items-center justify-center py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-xs"><Eye className="w-5 h-5 mb-1" /> Preview</button>
                    <button onClick={() => handleDownload(q)} className="flex flex-col items-center justify-center py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-xs"><Download className="w-5 h-5 mb-1" /> Save</button>
                    <button onClick={() => handleEdit(q)} className="flex flex-col items-center justify-center py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-xs"><Edit className="w-5 h-5 mb-1" /> Edit</button>
                    <button onClick={() => handleDelete(q._id)} className="flex flex-col items-center justify-center py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs"><Trash2 className="w-5 h-5 mb-1" /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <CreateQuotationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreated={handleQuotationSaved}
        quotationToEdit={editingQuotation}
        aiPrefillData={aiPrefillData}
      />

      {/* Preview Modal (Will not open on Eye click, only via state if needed, but logic removed from eye) */}
      {previewQuotation && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-6">
          <div className="bg-white md:rounded-2xl w-full h-full md:max-w-5xl md:h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-4 md:p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Quotation Preview</h2>
                <p className="text-xs md:text-sm text-gray-500">{previewQuotation.quotationNumber}</p>
              </div>
              <button onClick={closePreview} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 bg-gray-50 overflow-hidden relative">
              {pdfLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                  <p className="text-gray-500 font-medium">Generating PDF...</p>
                </div>
              ) : (
                <iframe src={pdfBlobUrl} className="w-full h-full border-0" title="Quotation PDF" />
              )}
            </div>
            <div className="p-4 md:p-5 border-t border-gray-100 flex flex-col md:flex-row justify-end gap-3 bg-white md:rounded-b-2xl">
              <button onClick={closePreview} className="w-full md:w-auto px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50">Close</button>
              <button onClick={() => handleDownload(previewQuotation)} className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 flex items-center justify-center"><Download className="w-4 h-4 mr-2" /> Download PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotations;