import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Building, FileText, Save, Loader2, Upload, Edit, X, ClipboardList } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;


const Settings = () => {
  const [activeTab, setActiveTab] = useState('business');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  // 1. Initial State
  const [business, setBusiness] = useState({
    name: '', gstin: '', address: '', city: '', state: '', pincode: '', phone: '', email: '',
  });

  const [invoiceDefaults, setInvoiceDefaults] = useState({
    bankName: '', accountNumber: '', ifsc: '', upiId: '', paymentTerms: '', notes: '', footerText: '', logo: '',
  });

  const [quotationDefaults, setQuotationDefaults] = useState({
    prefix: '', defaultValidityDays: '', defaultSubject: '', defaultIntro: '', terms: ''
  });

  // 2. Fetch Data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_BASE}/settings/me`, headers);
      const { user, company } = res.data;

      if (company) {
        setBusiness({
          name: company.name || '',
          gstin: company.gstin || '',
          address: company.address || '',
          city: company.city || '',
          state: company.state || '',
          pincode: company.pincode || '',
          phone: company.phone || user.phone || '',
          email: company.email || user.email || '',
        });

        setInvoiceDefaults({
          bankName: company.bankDetails?.bankName || '',
          accountNumber: company.bankDetails?.accountNumber || '',
          ifsc: company.bankDetails?.ifsc || '',
          upiId: company.bankDetails?.upiId || '',
          paymentTerms: company.invoiceSettings?.paymentTerms || '',
          notes: company.invoiceSettings?.notes || '',
          footerText: company.invoiceSettings?.footerText || '',
          logo: company.logo || '',
        });

        if (company.quotationSettings) {
           setQuotationDefaults({
             prefix: company.quotationSettings.prefix || '',
             defaultValidityDays: company.quotationSettings.defaultValidityDays || '',
             defaultSubject: company.quotationSettings.defaultSubject || '',
             defaultIntro: company.quotationSettings.defaultIntro || '',
             terms: company.quotationSettings.terms || '',
           });
        }

        if (company.logo) setLogoPreview(company.logo);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        axios.put(`${API_URL}/settings/business`, business, headers),
        axios.put(`${API_URL}/settings/invoice-defaults`, invoiceDefaults, headers),
        axios.put(`${API_URL}/settings/quotation-defaults`, quotationDefaults, headers)
      ]);
      toast.success('Settings saved successfully!');
      setIsEditing(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setLogoPreview(base64);
      setInvoiceDefaults({ ...invoiceDefaults, logo: base64 });
    };
    reader.readAsDataURL(file);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    fetchData(); 
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Tabs - Horizontal Scroll on Mobile */}
        <div className="flex border-b mb-6 md:mb-8 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {[
            { id: 'business', label: 'Business', icon: Building },
            { id: 'invoice', label: 'Invoice', icon: FileText },
            { id: 'quotation', label: 'Quotation', icon: ClipboardList },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 font-medium transition-colors border-b-2 -mb-px whitespace-nowrap text-sm md:text-base ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Card - Responsive Padding */}
        <div className="bg-white rounded-xl shadow-sm border p-4 md:p-8">
          
          {/* Business Details Tab */}
          {activeTab === 'business' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Business Info</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {isEditing ? (
                  <>
                    <input
                      value={business.name}
                      onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                      placeholder="Business Name *"
                      className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                    />
                    <input
                      value={business.gstin}
                      onChange={(e) => setBusiness({ ...business, gstin: e.target.value.toUpperCase() })}
                      placeholder="GSTIN"
                      className="px-4 py-3 border rounded-lg font-mono uppercase w-full"
                    />
                    <textarea
                      value={business.address}
                      onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                      placeholder="Full Address *"
                      rows={3}
                      className="md:col-span-2 px-4 py-3 border rounded-lg w-full"
                    />
                    <input
                      value={business.city}
                      onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                      placeholder="City"
                      className="px-4 py-3 border rounded-lg w-full"
                    />
                    <input
                      value={business.state}
                      onChange={(e) => setBusiness({ ...business, state: e.target.value })}
                      placeholder="State"
                      className="px-4 py-3 border rounded-lg w-full"
                    />
                    <input
                      value={business.pincode}
                      onChange={(e) => setBusiness({ ...business, pincode: e.target.value })}
                      placeholder="Pincode"
                      className="px-4 py-3 border rounded-lg w-full"
                    />
                    <input
                      value={business.phone}
                      onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                      placeholder="Phone"
                      className="px-4 py-3 border rounded-lg w-full"
                    />
                    <input
                      value={business.email}
                      onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                      placeholder="Email"
                      className="px-4 py-3 border rounded-lg w-full"
                    />
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Business Name</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg min-h-[46px] text-gray-900">{business.name || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">GSTIN</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg font-mono min-h-[46px] text-gray-900">{business.gstin || '-'}</p>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Address</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg whitespace-pre-wrap min-h-[46px] text-gray-900">{business.address || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">City</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg min-h-[46px] text-gray-900">{business.city || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">State</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg min-h-[46px] text-gray-900">{business.state || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Pincode</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg min-h-[46px] text-gray-900">{business.pincode || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Phone</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg min-h-[46px] text-gray-900">{business.phone || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Email</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg min-h-[46px] text-gray-900">{business.email || '-'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Invoice Defaults Tab */}
          {activeTab === 'invoice' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Invoice Settings</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {/* Logo - Stacked on Mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Business Logo</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-24 w-24 object-contain border rounded-lg bg-white" />
                  ) : (
                    <div className="h-24 w-24 bg-gray-100 border-2 border-dashed rounded-lg flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  {isEditing && (
                    <div className="w-full sm:w-auto">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo" />
                        <label htmlFor="logo" className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 inline-flex items-center justify-center gap-2">
                          <Upload className="w-4 h-4" />
                          Upload Logo
                        </label>
                        <p className="text-sm text-gray-500 mt-2">Recommended: Square image</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-6 border-t">
                <h3 className="md:col-span-2 text-lg font-semibold text-gray-800">Bank & UPI Details</h3>
                {isEditing ? (
                  <>
                    <input
                      value={invoiceDefaults.bankName}
                      onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, bankName: e.target.value })}
                      placeholder="Bank Name"
                      className="px-4 py-3 border rounded-lg w-full"
                    />
                    <input
                      value={invoiceDefaults.accountNumber}
                      onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, accountNumber: e.target.value })}
                      placeholder="Account Number"
                      className="px-4 py-3 border rounded-lg w-full"
                    />
                    <input
                      value={invoiceDefaults.ifsc}
                      onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, ifsc: e.target.value.toUpperCase() })}
                      placeholder="IFSC Code"
                      className="px-4 py-3 border rounded-lg uppercase font-mono w-full"
                    />
                    <input
                      value={invoiceDefaults.upiId}
                      onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, upiId: e.target.value })}
                      placeholder="UPI ID"
                      className="px-4 py-3 border rounded-lg w-full"
                    />
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Bank Name</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg min-h-[46px] text-gray-900">{invoiceDefaults.bankName || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Account Number</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg min-h-[46px] text-gray-900">{invoiceDefaults.accountNumber || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">IFSC Code</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg font-mono min-h-[46px] text-gray-900">{invoiceDefaults.ifsc || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">UPI ID</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg min-h-[46px] text-gray-900">{invoiceDefaults.upiId || '-'}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Terms & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 border-t pt-6">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                      <input
                        value={invoiceDefaults.paymentTerms}
                        onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, paymentTerms: e.target.value })}
                        placeholder="e.g. Due in 15 days"
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Footer</label>
                      <input
                        value={invoiceDefaults.footerText}
                        onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, footerText: e.target.value })}
                        placeholder="Footer text..."
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Notes</label>
                      <textarea
                        value={invoiceDefaults.notes}
                        onChange={(e) => setInvoiceDefaults({ ...invoiceDefaults, notes: e.target.value })}
                        rows={3}
                        placeholder="Thank you for your business!"
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Payment Terms</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg min-h-[46px] text-gray-900">{invoiceDefaults.paymentTerms || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Invoice Footer</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg min-h-[46px] text-gray-900">{invoiceDefaults.footerText || '-'}</p>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Default Notes</label>
                      <p className="px-4 py-3 bg-gray-50 rounded-lg whitespace-pre-wrap min-h-[46px] text-gray-900">{invoiceDefaults.notes || '-'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

           {/* Quotation Defaults Tab */}
           {activeTab === 'quotation' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Quotation Settings</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                 {isEditing ? (
                   <>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Prefix / Format</label>
                       <input
                         value={quotationDefaults.prefix}
                         onChange={(e) => setQuotationDefaults({ ...quotationDefaults, prefix: e.target.value })}
                         placeholder="e.g. SMEC/25-26/QUO"
                         className="w-full px-4 py-3 border rounded-lg"
                       />
                        <p className="text-xs text-gray-500 mt-1">Used as base for generating numbers</p>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Validity (Days)</label>
                       <input
                         type="number"
                         value={quotationDefaults.defaultValidityDays}
                         onChange={(e) => setQuotationDefaults({ ...quotationDefaults, defaultValidityDays: e.target.value })}
                         placeholder="15"
                         className="w-full px-4 py-3 border rounded-lg"
                       />
                     </div>
                     <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-gray-700 mb-2">Default Subject</label>
                       <input
                         value={quotationDefaults.defaultSubject}
                         onChange={(e) => setQuotationDefaults({ ...quotationDefaults, defaultSubject: e.target.value })}
                         placeholder="e.g. SUB: QUOTATION FOR..."
                         className="w-full px-4 py-3 border rounded-lg font-medium"
                       />
                     </div>
                     <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-gray-700 mb-2">Introduction Text</label>
                       <textarea
                         value={quotationDefaults.defaultIntro}
                         onChange={(e) => setQuotationDefaults({ ...quotationDefaults, defaultIntro: e.target.value })}
                         rows={2}
                         className="w-full px-4 py-3 border rounded-lg"
                       />
                     </div>
                       <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
                        <textarea
                          value={quotationDefaults.terms}
                          onChange={(e) => setQuotationDefaults({ ...quotationDefaults, terms: e.target.value })}
                          rows={6}
                          placeholder="List your standard terms here..."
                          className="w-full px-4 py-3 border rounded-lg font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Appears at the bottom of every quotation</p>
                      </div>
                   </>
                 ) : (
                   <>
                     <div className="space-y-1">
                       <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Prefix / Format</label>
                       <p className="px-4 py-3 bg-gray-50 rounded-lg font-mono min-h-[46px] text-gray-900">{quotationDefaults.prefix || '-'}</p>
                     </div>
                     <div className="space-y-1">
                       <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Default Validity</label>
                       <p className="px-4 py-3 bg-gray-50 rounded-lg min-h-[46px] text-gray-900">{quotationDefaults.defaultValidityDays ? `${quotationDefaults.defaultValidityDays} Days` : '-'}</p>
                     </div>
                     <div className="md:col-span-2 space-y-1">
                       <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Default Subject</label>
                       <p className="px-4 py-3 bg-gray-50 rounded-lg font-medium min-h-[46px] text-gray-900">{quotationDefaults.defaultSubject || '-'}</p>
                     </div>
                     <div className="md:col-span-2 space-y-1">
                        <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Introduction Text</label>
                       <p className="px-4 py-3 bg-gray-50 rounded-lg min-h-[46px] text-gray-900">{quotationDefaults.defaultIntro || '-'}</p>
                     </div>
                     <div className="md:col-span-2 space-y-1">
                        <label className="text-xs md:text-sm font-medium text-gray-500 uppercase">Terms & Conditions</label>
                       <pre className="px-4 py-3 bg-gray-50 rounded-lg whitespace-pre-wrap font-mono text-sm min-h-[46px] text-gray-900 overflow-x-auto">{quotationDefaults.terms || '-'}</pre>
                     </div>
                   </>
                 )}
               </div>
            </div>
           )}

          {/* Action Buttons - Stacked on Mobile */}
          {isEditing && (
            <div className="mt-8 pt-6 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4">
              <button
                onClick={cancelEdit}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 w-full sm:w-auto"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
              <button
                onClick={saveAll}
                disabled={isSaving}
                className="flex items-center justify-center gap-3 px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
              >
                {isSaving ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Save className="w-6 h-6" />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;