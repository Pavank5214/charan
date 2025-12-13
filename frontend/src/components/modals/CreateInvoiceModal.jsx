import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Plus, User, Trash2, Download, Loader2,
  Building, Phone, Mail, MapPin, FileText, Edit3,
  Calendar, Percent, ChevronDown, CreditCard, Save, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}`;

// --- Utility: Convert Number to Words ---
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
  return convert(Math.round(num)) + ' Rupees Only';
};

// --- Main Component ---
const CreateInvoiceModal = ({ isOpen, onClose, onInvoiceCreated, invoiceToEdit, aiPrefillData }) => {
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);

  // Form State
  const [client, setClient] = useState({
    name: '', address: '', gstin: '', email: '', mobile: '', state: 'KARNATAKA', pincode: '', accountNumber: ''
  });
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  const [gstRate, setGstRate] = useState(18);

  const [basicPrice, setBasicPrice] = useState(0);
  const [items, setItems] = useState([
    { description: '', hsn: '', qty: 1, unit: 'NOS', rate: 0, discount: 0 }
  ]);
  const [terms, setTerms] = useState('');

  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');

  const token = localStorage.getItem('token');

  const generatePrefix = (name) => {
    if (!name) return 'INV';
    return name.trim().split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 6) || 'INV';
  };

  // --- 1. INITIALIZATION & DATA FETCHING ---
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Company & Client Data
        let company = { name: 'Your Company', state: 'KARNATAKA', address: '', email: '', phone: '' };
        let clientsList = [];

        try {
          const res = await fetch(`${API_URL}/settings/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            company = data.company || company;
          }
          const clientsRes = await fetch(`${API_URL}/clients`, { headers: { Authorization: `Bearer ${token}` } });
          if (clientsRes.ok) {
            const data = await clientsRes.json();
            clientsList = Array.isArray(data) ? data : [];
          }
        } catch (e) {
          console.warn("API Fetch failed, using defaults/mock");
        }

        setCompanyData(company);
        setClients(clientsList);

        // --- Logic Branching: Edit vs AI vs New ---
        
        if (invoiceToEdit) {
          // MODE: EDIT EXISTING INVOICE
          const loadedClient = invoiceToEdit.clientId || {};
          setClient({
            name: loadedClient.name || '',
            address: loadedClient.address || '',
            gstin: loadedClient.gstin || '',
            email: loadedClient.email || '',
            mobile: loadedClient.mobile || '',
            state: loadedClient.state || 'KARNATAKA',
            pincode: loadedClient.pincode || '',
            accountNumber: loadedClient.accountNumber || ''
          });

          if (invoiceToEdit.clientId?._id) {
            setSelectedClientId(invoiceToEdit.clientId._id);
          }


          setInvoiceNumber(invoiceToEdit.invoiceNumber);
          setInvoiceDate(invoiceToEdit.invoiceDate ? new Date(invoiceToEdit.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
          setPlaceOfSupply(invoiceToEdit.placeOfSupply || loadedClient.state || 'KARNATAKA');
          setGstRate(invoiceToEdit.gstRate || 18);
          setBasicPrice(invoiceToEdit.basicPrice || 0);
          setTerms(invoiceToEdit.terms || company?.invoiceSettings?.terms || '1. Payment due within 30 days.\n2. All disputes subject to jurisdiction.\n3. Goods once sold will not be taken back.');
          setItems(invoiceToEdit.items?.map(item => ({ ...item, unit: item.unit || 'NOS' })) || [{ description: '', hsn: '', qty: 1, unit: 'NOS', rate: 0, discount: 0 }]);

        } else if (aiPrefillData) {
          // MODE: AI PREFILL (NEW INVOICE)
          toast.success("AI extracted invoice details!", { icon: "✨" });

          const aiClient = aiPrefillData.client || {};
          
          // Try to match AI client name with existing clients
          const existingClient = clientsList.find(c => c.name.toLowerCase() === aiClient.name?.toLowerCase());

          if (existingClient) {
             // Match Found: Use existing client ID
             setSelectedClientId(existingClient._id);
             setClient({
                name: existingClient.name,
                address: existingClient.address,
                gstin: existingClient.gstin,
                email: existingClient.email,
                mobile: existingClient.mobile,
                state: existingClient.state,
                pincode: existingClient.pincode,
                accountNumber: existingClient.accountNumber
             });
             setPlaceOfSupply(existingClient.state || company?.state);
          } else {
             // No Match: Fill form and enable "Add New" mode
             setSelectedClientId('');
             setShowAddClient(true);
             setClient({
               name: aiClient.name || '',
               address: aiClient.address || '',
               gstin: aiClient.gstin || '',
               email: aiClient.email || '',
               mobile: aiClient.mobile || '',
               state: aiClient.state || company?.state || 'KARNATAKA',
               pincode: '',
               accountNumber: ''
             });
             setPlaceOfSupply(aiClient.state || company?.state || 'KARNATAKA');
          }

          // Items
          if (aiPrefillData.items && aiPrefillData.items.length > 0) {
            setItems(aiPrefillData.items.map(i => ({
              description: i.description || '',
              hsn: i.hsn || '',
              qty: Number(i.qty) || 1,
              unit: 'NOS',
              rate: Number(i.rate) || 0,
              discount: Number(i.discount) || 0
            })));
          }

          // Generate New Invoice Number logic
          const today = new Date();
          const fyStart = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
          const fyEnd = fyStart + 1;
          const fyString = `${fyStart.toString().slice(2)}-${fyEnd.toString().slice(2)}`;
          const prefix = company?.invoicePrefix || generatePrefix(company?.name);
          setInvoiceNumber(company?.nextInvoiceNumber || `${prefix}/${fyString}/001`);
          setInvoiceDate(today.toISOString().split('T')[0]);
          setGstRate(18);


        } else {
          // MODE: STANDARD NEW INVOICE
          setSelectedClientId('');
          setShowAddClient(false);
          setClient({ name: '', address: '', gstin: '', email: '', mobile: '', state: company?.state || 'KARNATAKA', pincode: '', accountNumber: '' });
          setPlaceOfSupply(company?.state || 'KARNATAKA');
          setGstRate(18);
          setItems([{ description: '', hsn: '', qty: 1, unit: 'NOS', rate: 0, discount: 0 }]);

          // Load terms from invoice settings
          const defaultTerms = company?.invoiceSettings?.terms || '1. Payment due within 30 days.\n2. All disputes subject to jurisdiction.\n3. Goods once sold will not be taken back.';
          setTerms(defaultTerms);

          const today = new Date();
          const fyStart = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
          const fyEnd = fyStart + 1;
          const fyString = `${fyStart.toString().slice(2)}-${fyEnd.toString().slice(2)}`;

          if (company?.nextInvoiceNumber) {
            setInvoiceNumber(company.nextInvoiceNumber);
          } else {
            const prefix = company?.invoicePrefix || generatePrefix(company?.name);
            setInvoiceNumber(`${prefix}/${fyString}/001`);
          }
          setInvoiceDate(new Date().toISOString().split('T')[0]);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, token, invoiceToEdit, aiPrefillData]);

  // --- 2. HANDLERS ---

  const handleClientSelect = (e) => {
    const id = e.target.value;
    setSelectedClientId(id);
    
    if (id) {
      const selected = clients.find(c => String(c._id) === String(id));
      if (selected) {
        setClient({
          name: selected.name || '',
          address: selected.address || '',
          gstin: selected.gstin || '',
          email: selected.email || '',
          mobile: selected.mobile || '',
          state: selected.state || 'KARNATAKA',
          pincode: selected.pincode || '',
          accountNumber: selected.accountNumber || ''
        });
        setPlaceOfSupply(selected.state || companyData?.state || 'KARNATAKA');
      }
    } else {
      setClient({ name: '', address: '', gstin: '', email: '', mobile: '', state: companyData?.state || 'KARNATAKA', pincode: '', accountNumber: '' });
      setPlaceOfSupply(companyData?.state || 'KARNATAKA');
    }
  };

  const { itemsSubtotal, subtotal, gst, total } = useMemo(() => {
    const itemsSubtotalCalc = items.reduce((acc, item) => {
      const amount = item.qty * item.rate * (100 - (item.discount || 0)) / 100;
      return acc + amount;
    }, 0);
    const basic = Number(basicPrice || 0);
    const subtotalCalc = itemsSubtotalCalc + basic;
    const gstAmt = Number((subtotalCalc * gstRate / 100).toFixed(2));
    const totalAmt = subtotalCalc + gstAmt;
    return { itemsSubtotal: Number(itemsSubtotalCalc.toFixed(2)), subtotal: Number(subtotalCalc.toFixed(2)), gst: gstAmt, total: totalAmt };
  }, [items, gstRate, basicPrice]);

  const generateHTMLPreview = (data) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${data.number}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
          .invoice-title { font-size: 32px; font-weight: bold; color: #1e293b; text-align: right; }
          .meta-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-value { font-size: 14px; font-weight: 600; color: #334155; }
          .row { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .col { width: 48%; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { text-align: left; padding: 12px 8px; background: #f8fafc; color: #475569; font-size: 12px; text-transform: uppercase; font-weight: 600; }
          td { padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .text-right { text-align: right; }
          .totals { width: 300px; margin-left: auto; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
          .grand-total { border-top: 2px solid #334155; border-bottom: none; font-size: 18px; font-weight: bold; color: #0f172a; padding-top: 15px; margin-top: 5px; }
          .amount-words { margin-top: 30px; font-style: italic; color: #64748b; font-size: 13px; border-top: 1px solid #f1f5f9; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">${data.company.name}</div>
            <div style="font-size: 13px; color: #64748b;">
              ${data.company.address}<br>
              GSTIN: ${data.company.gstin}<br>
              ${data.company.email}
            </div>
          </div>
          <div>
            <div class="invoice-title">INVOICE</div>
            <div class="text-right" style="margin-top: 10px;">
              <div class="meta-label">Invoice #</div>
              <div class="meta-value">${data.number}</div>
              <div class="meta-label" style="margin-top: 8px;">Date</div>
              <div class="meta-value">${new Date(data.date).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col">
            <div class="meta-label">Bill To</div>
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">${data.client.name}</div>
            <div style="font-size: 13px; color: #475569;">
              ${data.client.address}<br>
              ${data.client.state}<br>
              GSTIN: ${data.client.gstin || 'N/A'}<br>
            </div>
          </div>
          <div class="col text-right">
            <div class="meta-label">Place of Supply</div>
            <div class="meta-value">${data.placeOfSupply}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="5%">S.No.</th>
              <th width="35%">Description</th>
              <th width="10%" class="text-right">Qty</th>
              <th width="10%" class="text-right">Unit</th>
              <th width="15%" class="text-right">Unit Price</th>
              <th width="20%" class="text-right">Amount(₹)</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.description}</td>
                <td class="text-right">${item.qty}</td>
                <td class="text-right">${item.unit}</td>
                <td class="text-right">₹${item.rate}</td>
                <td class="text-right">₹${item.amount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class='totals'>
          ${Number(data.totals.basicPrice) > 0 ? `<div class='total-row'><span>Basic Price</span><span>₹ ${data.totals.basicPrice}</span></div>` : ''}
          <div class='total-row'>
            <span>Subtotal</span>
            <span>₹ ${data.totals.subtotal}</span>
          </div>
          <div class='total-row'>
            <span>CGST + SGST (${data.gstRate}%)</span>
            <span>₹ ${data.totals.gst}</span>
          </div>
          <div class='total-row grand-total'>
            <span>Total Amount</span>
            <span>₹ ${data.totals.total}</span>
          </div>
        </div>


        <div class="amount-words">
          Amount in words: ${data.totals.inWords}
        </div>

        ${data.terms && data.terms.length > 0 ? `
        <div style="margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
          <h3 style="font-size: 14px; font-weight: bold; color: #334155; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Terms & Conditions</h3>
          <div style="font-size: 12px; color: #64748b; line-height: 1.6;">
            ${data.terms.map((term, index) => `
              <div style="margin-bottom: 4px;">${term}</div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </body>
      </html>
    `;
    return URL.createObjectURL(new Blob([htmlContent], { type: 'text/html' }));
  };

  const addItem = () => setItems([...items, { description: '', hsn: '', qty: 1, unit: 'NOS', rate: 0, discount: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = ['qty', 'rate', 'discount'].includes(field) ? Number(value) || 0 : value;
    setItems(updated);
  };

  const generatePDF = async () => {
    if (!client.name?.trim()) return toast.error('Please enter Client Name');
    if (!items.some(i => i.description?.trim())) return toast.error('Please add at least one item');

    setPdfLoading(true);


    const previewData = {
        company: companyData || {},
        client: client,
        number: invoiceNumber,
        date: invoiceDate,
        placeOfSupply: placeOfSupply || client.state,
        gstRate,
        items: items.map(i => ({
            ...i,
            amount: (i.qty * i.rate * (100 - (i.discount || 0)) / 100).toFixed(2)
        })),
        totals: {
            basicPrice: basicPrice.toFixed(2),
            itemsSubtotal: itemsSubtotal.toFixed(2),
            subtotal: subtotal.toFixed(2),
            gst: gst.toFixed(2),
            total: total.toFixed(2),
            inWords: numberToWords(total)
        },
        terms: terms ? terms.split('\n').filter(t => t.trim()) : (companyData?.invoiceSettings?.terms ? companyData.invoiceSettings.terms.split('\n').filter(t => t.trim()) : ['1. Payment due within 30 days.', '2. All disputes subject to jurisdiction.', '3. Goods once sold will not be taken back.'])
    };

    setTimeout(() => {
        const url = generateHTMLPreview(previewData);
        setPdfBlob(url);
        setPdfLoading(false);
        toast.success("Preview generated!");
    }, 500);
  };

  const saveInvoice = async () => {
    if (!client.name?.trim()) return toast.error('Client name is required');
    if (!selectedClientId && !showAddClient) return toast.error('Please select a client or add a new one');
    if (!items.some(i => i.description?.trim())) return toast.error('Add at least one item');
    if (!invoiceNumber.trim()) return toast.error('Invoice number cannot be empty');

    setSaveLoading(true);
    setSaveError('');
    try {
      let clientId = selectedClientId;

      // Handle "Add New Client" on the fly
      if (showAddClient && client.name?.trim()) {
        try {
          const clientRes = await fetch(`${API_URL}/clients`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(client)
          });
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            clientId = clientData._id;
            // Update local cache if needed, but we are closing modal anyway
            toast.success("New client saved!");
          }
        } catch (clientErr) {
          console.warn("Client creation failed:", clientErr);
          toast.error("Failed to save new client");
          setSaveLoading(false);
          return;
        }
      }



      const payload = {
        clientId,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        placeOfSupply,
        gstRate,
        basicPrice,
        terms: terms.trim(),
        items: items.filter(i => i.description?.trim()).map(item => {
          if (item.unit === "NONE") {
            return { ...item, unit: "NOS" };
          }
          return item;
        })
      };

      // If aiPrefillData is present, it's a POST (New), even if not explicitly "Editing"
      const res = await fetch(invoiceToEdit ? `${API_URL}/invoice/${invoiceToEdit._id}` : `${API_URL}/invoice`, {
        method: invoiceToEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        onInvoiceCreated?.(data.invoice);
        toast.success(invoiceToEdit ? 'Invoice updated successfully!' : 'Invoice created successfully!');
        onClose();
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.message || 'Failed to save invoice';
        setSaveError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSaveError('Failed to save invoice');
      toast.error('Network error. Check console.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-600 font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white z-10">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
             {aiPrefillData ? (
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/30">
                    <Sparkles className="w-6 h-6 text-white animate-pulse" />
                </div>
            ) : (
                <div className="p-2 bg-indigo-50 rounded-lg">
                    <FileText className="w-6 h-6 text-indigo-600" />
                </div>
            )}
            
            {invoiceToEdit ? 'Edit Invoice' : aiPrefillData ? 'AI Generated Invoice (Draft)' : 'Create New Invoice'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

            {/* Left Column: Company & Invoice Details */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Company Card */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building className="w-4 h-4" /> Bill From
                </h3>
                
                <div className="flex items-start gap-4">
                  {companyData?.logo ? (
                    <img src={companyData.logo} alt="Logo" className="w-16 h-16 object-contain rounded-lg border border-gray-100" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      <Building className="w-8 h-8" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{companyData?.name || 'Your Company'}</h4>
                    <div className="text-sm text-gray-500 space-y-1 mt-1">
                      <p className="truncate">{companyData?.address}</p>
                      <p>{companyData?.city} {companyData?.pincode}</p>
                      {companyData?.gstin && <p className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded w-fit mt-2">GSTIN: {companyData.gstin}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Invoice Details
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Invoice Number</label>
                    <div className="relative">
                      <input 
                        value={invoiceNumber} 
                        onChange={(e) => setInvoiceNumber(e.target.value)} 
                        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                        placeholder="INV-001"
                      />
                      <Edit3 className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          value={invoiceDate} 
                          onChange={(e) => setInvoiceDate(e.target.value)} 
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">GST Rate %</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={gstRate} 
                          onChange={(e) => setGstRate(Number(e.target.value))} 
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <Percent className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Place of Supply</label>
                    <div className="relative">
                      <input 
                        value={placeOfSupply} 
                        readOnly 
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                      />
                      <MapPin className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Client & Items */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Client Selection */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4" /> Bill To
                  </h3>
                  <button 
                    onClick={() => setShowAddClient(!showAddClient)}
                    className="text-xs text-indigo-600 font-bold hover:text-indigo-700 flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {showAddClient ? 'Select Existing' : 'Add New Client'}
                  </button>
                </div>

                {!showAddClient ? (
                  <div className="relative mb-4">
                    <select
                      value={selectedClientId}
                      onChange={handleClientSelect}
                      className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none bg-white text-gray-900 shadow-sm"
                    >
                      <option value="">Select Existing Client...</option>
                      {clients.length > 0 ? (
                        clients.map(c => (
                          <option key={c._id} value={c._id}>
                            {c.name} {c.gstin ? `(${c.gstin})` : ''}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No clients found</option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                ) : (
                  <div className="p-4 bg-indigo-50 rounded-xl mb-4 border border-indigo-100 flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-indigo-900">New Client Details</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input 
                      placeholder="Client Name *" 
                      value={client.name} 
                      onChange={e => setClient({ ...client, name: e.target.value })} 
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input 
                      placeholder="GSTIN" 
                      value={client.gstin} 
                      onChange={e => setClient({ ...client, gstin: e.target.value.toUpperCase() })} 
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input 
                      placeholder="Mobile" 
                      value={client.mobile} 
                      onChange={e => setClient({ ...client, mobile: e.target.value })} 
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="Email"
                      value={client.email}
                      onChange={e => setClient({ ...client, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <select
                      value={client.state}
                      onChange={e => setClient({ ...client, state: e.target.value })}
                      className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white appearance-none"
                    >
                      <option>KARNATAKA</option>
                      <option>TAMIL NADU</option>
                      <option>MAHARASHTRA</option>
                      <option>ANDHRA PRADESH</option>
                      <option>TELANGANA</option>
                      <option>KERALA</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="Pincode"
                      value={client.pincode}
                      onChange={e => setClient({ ...client, pincode: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="Address"
                      value={client.address}
                      onChange={e => setClient({ ...client, address: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="hidden sm:grid bg-gray-50 px-5 py-3 border-b border-gray-200 grid-cols-13 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-4">Description</div>
                  <div className="col-span-2 text-center">HSN/SAC</div>
                  <div className="col-span-1 text-center">Qty</div>
                  <div className="col-span-1 text-center">Unit</div>
                  <div className="col-span-2 text-right">Rate</div>
                  <div className="col-span-3 text-right">Amount</div>
                </div>
                
                <div className="p-2 space-y-4 sm:space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex flex-col sm:grid sm:grid-cols-13 gap-3 items-center group relative p-3 sm:p-2 rounded-lg bg-gray-50 sm:bg-transparent sm:hover:bg-gray-50 transition-colors border sm:border-none border-gray-100">
                      <div className="w-full sm:col-span-4">
                        <label className="sm:hidden text-xs text-gray-500 mb-1 block">Description</label>
                        <input
                          value={item.description}
                          onChange={e => updateItem(i, 'description', e.target.value)}
                          placeholder="Item Name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="w-full sm:col-span-2 flex sm:block gap-2">
                          <div className="flex-1">
                             <label className="sm:hidden text-xs text-gray-500 mb-1 block">HSN</label>
                             <input
                              value={item.hsn}
                              onChange={e => updateItem(i, 'hsn', e.target.value)}
                              placeholder="HSN"
                              className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-center"
                            />
                          </div>
                      </div>
                      <div className="w-full flex gap-3 sm:contents">
                        <div className="flex-1 sm:col-span-1">
                           <label className="sm:hidden text-xs text-gray-500 mb-1 block">Qty</label>
                           <input
                            type="number"
                            value={item.qty}
                            onChange={e => updateItem(i, 'qty', e.target.value)}
                            className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-center"
                          />
                        </div>
                        <div className="flex-1 sm:col-span-1">
                           <label className="sm:hidden text-xs text-gray-500 mb-1 block">Unit</label>
                          <select
                            value={item.unit}
                            onChange={e => updateItem(i, 'unit', e.target.value)}
                            className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-center bg-white"
                          >
                            <option value="NOS">None</option>
                            <option value="PCS">PCS</option>
                            <option value="QTY">QTY</option>
                            <option value="NOS">NOS</option>
                          </select>
                        </div>
                        <div className="flex-1 sm:col-span-2">
                           <label className="sm:hidden text-xs text-gray-500 mb-1 block">Rate</label>
                           <input
                            type="number"
                            value={item.rate}
                            onChange={e => updateItem(i, 'rate', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-right"
                          />
                        </div>
                      </div>

                      <div className="w-full sm:col-span-3 text-right flex justify-between sm:justify-end items-center px-2 pt-2 sm:pt-0 border-t sm:border-0 border-gray-200 mt-2 sm:mt-0">
                        <span className="sm:hidden text-sm font-medium text-gray-600">Total:</span>
                        <span className="font-bold text-gray-900">
                          ₹{(item.qty * item.rate * (100 - item.discount) / 100).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <button
                        onClick={() => removeItem(i)}
                        className="sm:absolute sm:-right-2 sm:top-1/2 sm:-translate-y-1/2 p-2 sm:p-1.5 bg-red-100 text-red-600 rounded-full sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-sm w-full sm:w-auto flex justify-center mt-2 sm:mt-0"
                      >
                        <Trash2 className="w-4 h-4 sm:w-3 sm:h-3" /> <span className="sm:hidden ml-2">Remove Item</span>
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
                  <button 
                    onClick={addItem} 
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Basic Price</span>
                    <input
                      type="number"
                      value={basicPrice}
                      onChange={e => setBasicPrice(Number(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>CGST + SGST ({gstRate}%)</span>
                    <span className="font-medium text-indigo-600">₹{gst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-dashed border-gray-200 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Total Amount</span>
                    <span className="text-xl font-bold text-indigo-700">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-right text-gray-400 italic mt-1">{numberToWords(total)}</p>
                </div>
              </div>


              {/* Terms and Conditions */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Terms & Conditions
                </h3>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  placeholder="Enter terms and conditions for this invoice..."
                />
              </div>

              {/* Persistent Error Message */}
              {saveError && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm text-center animate-pulse">
                  {saveError}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer - Responsive */}
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
              download={`${invoiceNumber.replace(/[\/\\]/g, '-')}.html`} 
              className="hidden" 
              id="pdf-download-link"
            >
              Download
            </a>
          )}

          <button 
            onClick={saveInvoice} 
            disabled={saveLoading} 
            className="w-full sm:w-auto px-4 py-3 sm:px-8 sm:py-2.5 text-sm sm:text-base bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {saveLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {invoiceToEdit ? 'Update Invoice' : 'Save Invoice'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateInvoiceModal;