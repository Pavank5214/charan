import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Building2, 
  FileText, 
  Save, 
  Loader2, 
  Edit3, 
  X, 
  ScrollText, 
  Settings2,
  Check
} from 'lucide-react';
import BusinessSettingsTab from '../settings/BusinessSettingsTab';
import InvoiceSettingsTab from '../settings/InvoiceSettingsTab';
import QuotationSettingsTab from '../settings/QuotationSettingsTab';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;

const Settings = () => {
  const [activeTab, setActiveTab] = useState('business');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  // --- State ---
  const [business, setBusiness] = useState({
    name: '', subTitle: '', gstin: '', address: '', city: '', state: '', pincode: '', phone: '', email: '',
  });

  const [invoiceDefaults, setInvoiceDefaults] = useState({
    bankName: '', accountNumber: '', ifsc: '', upiId: '', paymentTerms: '', notes: '', footerText: '', logo: '',
    defaultSubject: '', defaultIntro: '', terms: ''
  });

  const [quotationDefaults, setQuotationDefaults] = useState({
    prefix: '', defaultValidityDays: '', defaultSubject: '', defaultIntro: '', terms: ''
  });

  // --- Fetching ---
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_BASE}/settings/me`, headers);
      const { user, company } = res.data;

      if (company) {
        setBusiness({
          name: company.name || '',
          subTitle: company.subTitle || '',
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
          defaultSubject: company.invoiceSettings?.defaultSubject || '',
          defaultIntro: company.invoiceSettings?.defaultIntro || '',
          terms: company.invoiceSettings?.terms || '',
        });

        setQuotationDefaults({
          prefix: company.quotationSettings?.prefix || 'QUO',
          defaultValidityDays: company.quotationSettings?.defaultValidityDays || 30,
          defaultSubject: company.quotationSettings?.defaultSubject || 'Quotation for Services',
          defaultIntro: company.quotationSettings?.defaultIntro || 'Thank you for considering our services. We are pleased to provide the following quotation.',
          terms: company.quotationSettings?.terms || '1. Payment terms: 50% advance, 50% on completion.\n2. Validity: 30 days from date of quotation.\n3. All prices are exclusive of GST.',
        });

        if (company.logo) setLogoPreview(company.logo);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      toast.error("Could not load settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Saving ---
  const saveAll = async () => {
    setIsSaving(true);
    try {
      await axios.put(`${API_BASE}/settings/business`, business, headers);
      await axios.put(`${API_BASE}/settings/invoice-defaults`, invoiceDefaults, headers);
      await axios.put(`${API_BASE}/settings/quotation-defaults`, quotationDefaults, headers);
      toast.success('Settings saved successfully!');
      setIsEditing(false);
      await fetchData();
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
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const tabs = [
    { id: 'business', label: 'Profile', icon: Building2 },
    { id: 'invoice', label: 'Invoice', icon: FileText },
    { id: 'quotation', label: 'Quotation', icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-slate-200 font-sans text-gray-900 pb-28 md:pb-12">
      
      {/* 1. Glassmorphism Sticky Header */}
      <div className="sticky top-0 mt-5  z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all rounded-2xl">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title & Mobile Edit */}
            <div className="flex items-center justify-between w-full md:w-auto">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <Settings2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                   <h1 className="text-lg font-bold text-gray-900 leading-tight">Settings</h1>
                </div>
              </div>
              
              {/* Mobile Edit Button */}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full active:scale-95 transition-transform"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Desktop Actions & Tabs Container */}
            <div className="flex items-center justify-between md:gap-6 w-full md:w-auto overflow-x-auto scrollbar-hide">
              
              {/* Segmented Control Tabs */}
              <div className="flex p-1 bg-gray-100/80 rounded-xl">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                        ${isActive 
                          ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                          : 'text-gray-500 hover:text-gray-700'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Desktop Edit Button */}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'business' && (
            <BusinessSettingsTab
              business={business}
              setBusiness={setBusiness}
              isEditing={isEditing}
            />
          )}

          {activeTab === 'invoice' && (
            <InvoiceSettingsTab
              invoiceDefaults={invoiceDefaults}
              setInvoiceDefaults={setInvoiceDefaults}
              logoPreview={logoPreview}
              setLogoPreview={setLogoPreview}
              isEditing={isEditing}
              handleLogoUpload={handleLogoUpload}
            />
          )}

          {activeTab === 'quotation' && (
            <QuotationSettingsTab
              quotationDefaults={quotationDefaults}
              setQuotationDefaults={setQuotationDefaults}
              isEditing={isEditing}
            />
          )}
        </div>
      </div>

      {/* 3. Floating Action Bar (Mobile & Desktop) */}
      {isEditing && (
        <div className="fixed bottom-2 left-0 right-25 z-50 p-4 animate-in slide-in-from-bottom-20 duration-300">
          <div className="max-w-3xl mx-auto bg-gray-900/90 backdrop-blur-md text-white p-2 pl-6 pr-2 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-white/10">
            <span className="text-sm font-medium text-gray-300 hidden sm:block">
              You have unsaved changes
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={cancelEdit}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveAll}
                disabled={isSaving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;