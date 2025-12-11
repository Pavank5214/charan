import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  X, Plus, User, Trash2, Download, Loader2,
  Building, FileText, Save
} from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;

// Helper – Indian number to words
const numberToWords = (num) => {
  if (!num) return 'Zero Rupees Only';
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

const CreateQuotationModal = ({ isOpen, onClose, onCreated, quotationToEdit, aiPrefillData }) => {
  // State for Company & Defaults
  const [company, setCompany] = useState({
    name: 'Loading...', subTitle: '', address: '', city: '', email: '', phone: '', gstin: '',
  });

  const [quotationDefaults, setQuotationDefaults] = useState({});

  // Form State
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  const [client, setClient] = useState({
    name: '', address: '', city: '', mobile: '', email: '', gstin: '', state: 'KARNATAKA', pincode: '', accountNumber: ''
  });
  const [quotationNumber, setQuotationNumber] = useState('');
  const [quotationDate, setQuotationDate] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [gstRate, setGstRate] = useState(18);
  const [status, setStatus] = useState('draft');
  
  // RESTORED MANUAL BASIC PRICE STATE
  const [basicPrice, setBasicPrice] = useState(0); 
  const [items, setItems] = useState([]);

  // Loading States
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // 1. Fetch Settings
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoadingSettings(true);
    try {
      const token = localStorage.getItem('token');
      let companyData = {};
      let clientsList = [];

      try {
        const res = await fetch(`${API_BASE}/settings/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          companyData = data.company || {};
        }

        const clientsRes = await fetch(`${API_BASE}/clients`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (clientsRes.ok) {
          const data = await clientsRes.json();
          clientsList = Array.isArray(data) ? data : [];
        }
      } catch (e) {
        console.warn("API Fetch failed");
      }

      setCompany({
        name: companyData.name || '',
        subTitle: companyData.subTitle || '',
        address: companyData.address || '',
        city: companyData.city ? `${companyData.city} - ${companyData.pincode || ''}` : '',
        email: companyData.email || '',
        phone: companyData.phone || '',
        gstin: companyData.gstin || '',
      });

      setQuotationDefaults({
        prefix: companyData.quotationSettings?.prefix || 'QUO',
        defaultValidityDays: companyData.quotationSettings?.defaultValidityDays || 30,
        defaultSubject: companyData.quotationSettings?.defaultSubject || 'Quotation for Services',
        defaultIntro: companyData.quotationSettings?.defaultIntro || 'Thank you for considering our services. We are pleased to provide the following quotation.',
        terms: companyData.quotationSettings?.terms || '1. Payment terms: 50% advance, 50% on completion.\n2. Validity: 30 days from date of quotation.\n3. All prices are exclusive of GST.'
      });

      setClients(clientsList);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // 2. Initialize Form
  useEffect(() => {
    if (isOpen && !isLoadingSettings) {
      if (quotationToEdit) {
        setClient(quotationToEdit.client || { name: '', address: '', city: '', mobile: '', email: '' });
        setQuotationNumber(quotationToEdit.quotationNumber);
        setQuotationDate(quotationToEdit.quotationDate ? new Date(quotationToEdit.quotationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setValidUntil(quotationToEdit.validUntil ? new Date(quotationToEdit.validUntil).toISOString().split('T')[0] : '');
        setGstRate(quotationToEdit.gstRate || 18);
        setStatus(quotationToEdit.status || 'draft');
        setBasicPrice(quotationToEdit.basicPrice || 0); // Load Manual Basic Price
        setItems(quotationToEdit.items || [{ description: '', make: '', qty: 1, unit: 'NOS', rate: 0, discount: 0 }]);
      } else if (aiPrefillData) {
         setClient({
           name: aiPrefillData.client?.name || '',
           address: aiPrefillData.client?.address || '',
           city: aiPrefillData.client?.city || '',
           mobile: aiPrefillData.client?.mobile || '',
           email: aiPrefillData.client?.email || '',
           gstin: aiPrefillData.client?.gstin || '',
           state: aiPrefillData.client?.state || 'KARNATAKA',
           pincode: '',
           accountNumber: ''
         });

         if (aiPrefillData.items && aiPrefillData.items.length > 0) {
           setItems(aiPrefillData.items.map(it => ({
               description: it.description || '',
               make: it.make || '',
               qty: it.qty || 1,
               unit: it.unit || 'NOS',
               rate: it.rate || 0,
               discount: it.discount || 0
           })));
         } else {
           setItems([{ description: '', make: '', qty: 1, unit: 'NOS', rate: 0, discount: 0 }]);
         }
         
         setBasicPrice(0);
         const rand = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
         setQuotationNumber(`${quotationDefaults.prefix || 'QUO'} - ${rand}`);
         const today = new Date();
         setQuotationDate(today.toISOString().split('T')[0]);
         const validDate = new Date();
         const days = parseInt(quotationDefaults.defaultValidityDays) || 15;
         validDate.setDate(today.getDate() + days);
         setValidUntil(validDate.toISOString().split('T')[0]);
         setGstRate(18);
      } else {
        setClient({ name: '', address: '', city: '', mobile: '', email: '' });
        const rand = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
        setQuotationNumber(`${quotationDefaults.prefix || 'QUO'} - ${rand}`);
        const today = new Date();
        setQuotationDate(today.toISOString().split('T')[0]);
        const validDate = new Date();
        const days = parseInt(quotationDefaults.defaultValidityDays) || 15;
        validDate.setDate(today.getDate() + days);
        setValidUntil(validDate.toISOString().split('T')[0]);
        setGstRate(18);
        setBasicPrice(0);
        setItems([{ description: '', make: '', qty: 1, unit: 'NOS', rate: 0, discount: 0 }]);
      }
    }
  }, [isOpen, isLoadingSettings, quotationToEdit, aiPrefillData]);

  // --- CALCULATIONS ---
  const { itemsOnlyTotal, subtotal, gst, total } = useMemo(() => {
    // 1. Calculate items total only
    const iTotal = items.reduce((s, it) => {
      const qty = Number(it.qty) || 0;
      const rate = Number(it.rate) || 0;
      const disc = Number(it.discount) || 0;
      return s + qty * rate * (1 - disc / 100);
    }, 0);

    // 2. Subtotal = Items Total + Manual Basic Price
    const sub = iTotal + Number(basicPrice || 0);
    
    // 3. GST on the Subtotal
    const g = Number((sub * (gstRate / 100)).toFixed(2));
    
    // 4. Grand Total
    const tot = Number((sub + g).toFixed(2));
    
    return { itemsOnlyTotal: iTotal, subtotal: sub, gst: g, total: tot };
  }, [items, gstRate, basicPrice]);

  // Updated HTML Preview
  const generateHTMLPreview = (data) => {
    const termsList = quotationDefaults.terms 
      ? quotationDefaults.terms.split('\n').map(t => t.trim()).filter(t => t) 
      : [];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation ${data.number}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
          body { font-family: 'Roboto', Helvetica, Arial, sans-serif; padding: 20px; color: #000; max-width: 800px; margin: 0 auto; line-height: 1.3; font-size: 14px; }
          .container { border: 2px solid #000; padding: 10px; min-height: 900px; position: relative; }
          .header { text-align: center; margin-bottom: 20px; }
          .company-name { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
          .company-sub { font-size: 12px; font-weight: bold; margin-bottom: 5px; }
          .company-details { font-size: 12px; margin-bottom: 5px; }
          .header-title { text-decoration: underline; font-weight: bold; font-size: 16px; margin: 10px 0; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .meta-left, .meta-right { width: 45%; }
          .field-row { display: flex; margin-bottom: 5px; }
          .label { width: 100px; font-weight: bold; }
          .to-section { margin-top: 15px; margin-left: 20px; }
          .subject { text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 10px; }
          .intro { text-align: justify; margin-bottom: 15px; font-size: 13px; }
          .price-offer-header { background: #e0e0e0; padding: 5px; border: 1px solid #000; font-weight: bold; font-size: 13px; border-bottom: none; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 5px; }
          th { border: 1px solid #000; padding: 5px; text-align: center; font-size: 12px; background: #fff; }
          td { border: 1px solid #000; padding: 5px; font-size: 12px; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .terms-box { margin-top: 10px; font-size: 12px; }
          .terms-title { font-weight: bold; text-decoration: underline; margin-bottom: 5px; }
          .term-item { display: flex; margin-bottom: 3px; }
          .term-text { flex: 1; }
          .footer { display: flex; justify-content: space-between; margin-top: 40px; align-items: flex-end; }
          .sign-area { text-align: right; }
          .auth-sign { margin-top: 40px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-name">${company.name}</div>
            <div class="company-sub">${company.subTitle}</div>
            <div class="company-details">${company.address}</div>
            <div class="company-details">${company.city}</div>
            <div class="company-details" style="font-weight: bold;">Email : ${company.email}</div>
            <div class="company-details" style="font-weight: bold;">Ph No : ${company.phone}</div>
            <div class="header-title">QUOTATION</div>
          </div>

          <div class="meta-row">
            <div class="meta-left">
              <div class="field-row"><span class="label">Quotation No:</span> <span>${data.number}</span></div>
              <div class="field-row"><span class="label">Date :</span> <span>${new Date(data.date).toLocaleDateString('en-GB')}</span></div>
              <div class="to-section">
                <div>To,</div>
                <div style="font-weight: bold; margin-left: 20px; margin-top: 5px;">${data.client.name}</div>
                <div style="margin-left: 20px;">${data.client.address}</div>
                <div style="margin-left: 20px;">${data.client.city}</div>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 10px;">Dear Sir,</div>
          <div class="subject">${quotationDefaults.defaultSubject}</div>
          <div class="intro">${quotationDefaults.defaultIntro}</div>

          <div class="price-offer-header">(I) Price Offer</div>
          <table>
            <thead>
              <tr>
                <th width="5%">Sl No</th>
                <th width="40%">Description</th>
                <th width="10%">Qty Nos</th>
                <th width="15%">Price</th>
                <th width="15%">Make</th>
                <th width="15%">Total (Rs)</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map((item, i) => `
                <tr>
                  <td class="text-center">${i + 1}</td>
                  <td>${item.description}</td>
                  <td class="text-center">${item.qty} ${item.unit}</td>
                  <td class="text-center">${item.rate ? parseFloat(item.rate).toFixed(2) : '-'}</td>
                  <td class="text-center">${item.make || '-'}</td>
                  <td class="text-right">${item.amount}</td>
                </tr>
              `).join('')}
              
              <tr>
                <td colspan="5" class="text-right" style="padding-right: 10px;">BASIC</td>
                <td class="text-right">${data.totals.basicPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="5" class="text-right" style="padding-right: 10px;">TOTAL (Items + Basic)</td>
                <td class="text-right">${data.totals.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="5" class="text-right" style="padding-right: 10px;">GST @ ${data.gstRate}%</td>
                <td class="text-right">${data.totals.gst.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="5" class="text-right" style="font-weight: bold; padding-right: 10px;">GRAND TOTAL</td>
                <td class="text-right" style="font-weight: bold;">${data.totals.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div style="font-weight: bold; text-decoration: underline; margin-top: 5px;">Note:</div>
          <div class="terms-box">
            <div class="terms-title">(II) TERMS & CONDITIONS</div>
            ${termsList.map(term => `
              <div class="term-item">
                <div class="term-text">${term}</div>
              </div>
            `).join('')}
            <div style="margin-top: 15px; text-align: center;">
              We hope you will find our offer acceptable and we look forward to the pleasure of receiving your valued order.
            </div>
          </div>

          <div class="footer">
            <div>
              <div style="font-weight: bold;">Thanking you,</div>
              <div style="font-weight: bold;">Sincerely Yours,</div>
              <div style="font-weight: bold; margin-top: 5px;">for ${company.name}</div>
            </div>
            <div class="sign-area">
              <div class="auth-sign">AUTHORIZED SIGNATORY</div>
              <div>${company.phone}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    return URL.createObjectURL(new Blob([htmlContent], { type: 'text/html' }));
  };

  const addItem = () => setItems([...items, { description: '', make: '', qty: 1, unit: 'NOS', rate: 0, discount: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    setItems(updated);
  };

  const generatePDF = async () => {
    if (!client.name.trim() || items.every(i => !i.description)) {
      toast.error('Fill client name and at least one item description.');
      return;
    }
    setPdfLoading(true);
    
    // PASSING THE MANUAL BASIC PRICE TO PDF
    const previewData = {
      number: quotationNumber,
      date: quotationDate,
      validUntil,
      client,
      gstRate,
      items: items.map(it => ({
        ...it,
        amount: (Number(it.qty) * Number(it.rate) * (1 - Number(it.discount) / 100)).toFixed(2)
      })),
      totals: { basicPrice: Number(basicPrice), subtotal, gst, total, inWords: numberToWords(total) }
    };

    setTimeout(() => {
        const url = generateHTMLPreview(previewData);
        setPdfBlob(url);
        setPdfLoading(false);
    }, 500);
  };

  const saveQuotation = async () => {
    if (!client.name.trim() || items.every(i => !i.description)) {
      toast.error('Client name and item description are required.');
      return;
    }

    setSaveLoading(true);
    try {
      const filteredItems = items.filter(it => it.description.trim() !== '');
      if (filteredItems.length === 0) {
        toast.error('At least one item with description is required.');
        return;
      }

      const payload = {
        quotationNumber,
        quotationDate,
        validUntil,
        client,
        gstRate,
        basicPrice: Number(basicPrice), // Saving the manual input
        items: filteredItems.map(it => ({
          description: it.description,
          make: it.make,
          qty: Number(it.qty),
          unit: it.unit,
          rate: Number(it.rate),
          discount: Number(it.discount)
        })),
        subtotal: Number(subtotal),
        gst: Number(gst),
        total: Number(total),
        status,
      };

      const token = localStorage.getItem('token');
      const method = quotationToEdit ? 'PUT' : 'POST';
      const url = quotationToEdit ? `${API_BASE}/quotation/${quotationToEdit._id}` : `${API_BASE}/quotation`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Save failed');
      }

      const data = await res.json();
      onCreated?.(data);

      toast.success(quotationToEdit ? 'Quotation updated successfully!' : 'Quotation saved successfully!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(`Error: ${err.message || 'Save failed'}`);
    } finally {
      setSaveLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            {quotationToEdit ? 'Edit Quotation' : 'New Quotation'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column: Company & Meta */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Company Info */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building className="w-4 h-4" /> From (Dynamic)
                </h3>
                {isLoadingSettings ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading settings...
                  </div>
                ) : (
                  <div className="space-y-1 text-sm text-gray-600">
                    <h4 className="font-bold text-gray-900 mb-2">{company.name}</h4>
                    <p>{company.subTitle}</p>
                    <p>{company.address}</p>
                    <p>{company.city}</p>
                    <p className="font-semibold text-indigo-600">{company.phone}</p>
                  </div>
                )}
              </div>

              {/* Quotation Meta */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Quotation No.</label>
                    <input value={quotationNumber} onChange={e => setQuotationNumber(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm font-bold text-indigo-700" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                      <input type="date" value={quotationDate} onChange={e => setQuotationDate(e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Valid Until</label>
                      <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">GST Rate %</label>
                    <input type="number" value={gstRate} onChange={e => setGstRate(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="approved">Approved</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="converted">Converted</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Client & Items */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Client Details */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" /> To Client
                </h3>
                <div className="space-y-4">
                  {/* Client Selection */}
                  <div className="flex gap-2">
                    <select
                      value={selectedClientId}
                      onChange={(e) => {
                        const clientId = e.target.value;
                        setSelectedClientId(clientId);
                        if (clientId) {
                          const selectedClient = clients.find(c => c._id === clientId);
                          if (selectedClient) {
                            setClient({
                              name: selectedClient.name || '',
                              address: selectedClient.address || '',
                              city: selectedClient.city || '',
                              mobile: selectedClient.mobile || '',
                              email: selectedClient.email || '',
                              gstin: selectedClient.gstin || '',
                              state: selectedClient.state || 'KARNATAKA',
                              pincode: selectedClient.pincode || '',
                              accountNumber: selectedClient.accountNumber || ''
                            });
                          }
                        } else {
                          setClient({
                            name: '', address: '', city: '', mobile: '', email: '', gstin: '', state: 'KARNATAKA', pincode: '', accountNumber: ''
                          });
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select Existing Client</option>
                      {clients.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowAddClient(!showAddClient)}
                      className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm font-medium"
                    >
                      {showAddClient ? 'Cancel' : '+ New'}
                    </button>
                  </div>

                  {/* Client Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input placeholder="Client Name *" value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    <input placeholder="City / Location" value={client.city} onChange={e => setClient({ ...client, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    <input placeholder="Full Address" value={client.address} onChange={e => setClient({ ...client, address: e.target.value })} className="md:col-span-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    {showAddClient && (
                      <>
                        <input placeholder="Mobile" value={client.mobile} onChange={e => setClient({ ...client, mobile: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        <input placeholder="Email" value={client.email} onChange={e => setClient({ ...client, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        <input placeholder="GSTIN" value={client.gstin} onChange={e => setClient({ ...client, gstin: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        <input placeholder="State" value={client.state} onChange={e => setClient({ ...client, state: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        <input placeholder="Pincode" value={client.pincode} onChange={e => setClient({ ...client, pincode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        <input placeholder="Account Number" value={client.accountNumber} onChange={e => setClient({ ...client, accountNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="hidden sm:grid bg-gray-50 px-4 py-3 border-b border-gray-200 grid-cols-12 gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-4">Description</div>
                  <div className="col-span-2 text-center">Make</div>
                  <div className="col-span-2 text-center">Qty / Unit</div>
                  <div className="col-span-2 text-right">Rate</div>
                  <div className="col-span-2 text-right">Amt</div>
                </div>

                <div className="p-2 space-y-2">
                  {items.map((it, i) => (
                    <div key={i} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 items-center group relative p-3 sm:p-2 rounded-lg bg-gray-50 sm:bg-transparent border sm:border-none border-gray-100">
                      <div className="w-full sm:col-span-4">
                        <input value={it.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Item Description" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                      </div>
                      <div className="w-full sm:col-span-2">
                        <input value={it.make} onChange={e => updateItem(i, 'make', e.target.value)} placeholder="Make" className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-center" />
                      </div>
                      <div className="w-full sm:col-span-2 flex gap-1">
                        <input type="number" value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)} placeholder="Qty" className="w-1/2 px-2 py-2 border border-gray-300 rounded-md text-sm text-center" />
                        <input value={it.unit} onChange={e => updateItem(i, 'unit', e.target.value)} placeholder="Unit" className="w-1/2 px-2 py-2 border border-gray-300 rounded-md text-sm text-center" />
                      </div>
                      <div className="w-full sm:col-span-2">
                        <input type="number" value={it.rate} onChange={e => updateItem(i, 'rate', e.target.value)} placeholder="0.00" className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-right" />
                      </div>
                      <div className="w-full sm:col-span-2 text-right font-bold text-gray-900 px-1 flex justify-between sm:block">
                        <span className="sm:hidden text-gray-500 font-normal text-sm">Amount:</span>
                        ₹{(Number(it.qty) * Number(it.rate) * (1 - Number(it.discount) / 100)).toFixed(0)}
                      </div>
                      <button onClick={() => removeItem(i)} className="sm:absolute sm:-right-2 sm:top-1/2 sm:-translate-y-1/2 p-1.5 bg-red-100 text-red-600 rounded-full sm:opacity-0 group-hover:opacity-100 transition-opacity mt-2 sm:mt-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
                  <button onClick={addItem} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 items-center">
                    <span>Basic Price (Manual)</span>
                    <input
                      type="number"
                      value={basicPrice}
                      onChange={e => setBasicPrice(e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right font-medium"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600"><span>Items Total</span> <span>₹{itemsOnlyTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm font-medium text-gray-800 border-t border-dashed pt-2 mt-2"><span>Subtotal (Basic + Items)</span> <span>₹{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm text-gray-600"><span>GST ({gstRate}%)</span> <span>₹{gst.toFixed(2)}</span></div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex justify-between items-center text-lg font-bold text-gray-900"><span>Grand Total</span> <span className="text-indigo-700">₹{total.toFixed(2)}</span></div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex flex-col-reverse sm:flex-row sm:justify-end gap-3 z-10">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 sm:px-6 sm:py-2.5 text-sm sm:text-base text-gray-700 font-medium hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={generatePDF}
            disabled={pdfLoading}
            className="w-full sm:w-auto px-4 py-3 sm:px-6 sm:py-2.5 text-sm sm:text-base bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            Preview PDF
          </button>

          {pdfBlob && (
            <a
              href={pdfBlob}
              download={`${quotationNumber.replace(/[\/\\]/g, '-')}.html`}
              className="hidden"
              id="pdf-download-link"
            >
              Download
            </a>
          )}

          <button
            onClick={saveQuotation}
            disabled={saveLoading}
            className="w-full sm:w-auto px-4 py-3 sm:px-8 sm:py-2.5 text-sm sm:text-base bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {saveLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {quotationToEdit ? 'Update Quotation' : 'Save Quotation'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateQuotationModal;