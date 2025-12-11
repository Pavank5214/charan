import React, { useCallback } from 'react';
import { Upload, Wallet, Receipt, CreditCard, Landmark, FileText, ImagePlus, ShieldCheck } from 'lucide-react';

// Custom Input Component
const Input = React.memo(({ label, value, onChange, placeholder, icon: Icon, className = "" }) => (
  <div className={`group ${className}`}>
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1 transition-colors group-focus-within:text-indigo-600">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />}
      <input
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-11' : 'px-4'} py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm`}
      />
    </div>
  </div>
));

const InvoiceSettingsTab = ({
  invoiceDefaults = {},
  setInvoiceDefaults,
  logoPreview,
  isEditing,
  handleLogoUpload
}) => {

  const handleBankNameChange = useCallback((e) => setInvoiceDefaults(prev => ({ ...prev, bankName: e.target.value })), [setInvoiceDefaults]);
  const handleAccountNumberChange = useCallback((e) => setInvoiceDefaults(prev => ({ ...prev, accountNumber: e.target.value })), [setInvoiceDefaults]);
  const handleIfscChange = useCallback((e) => setInvoiceDefaults(prev => ({ ...prev, ifsc: e.target.value.toUpperCase() })), [setInvoiceDefaults]);
  const handleUpiIdChange = useCallback((e) => setInvoiceDefaults(prev => ({ ...prev, upiId: e.target.value })), [setInvoiceDefaults]);
  const handleDefaultSubjectChange = useCallback((e) => setInvoiceDefaults(prev => ({ ...prev, defaultSubject: e.target.value })), [setInvoiceDefaults]);
  const handlePaymentTermsChange = useCallback((e) => setInvoiceDefaults(prev => ({ ...prev, paymentTerms: e.target.value })), [setInvoiceDefaults]);
  const handleTermsChange = useCallback((e) => setInvoiceDefaults(prev => ({ ...prev, terms: e.target.value })), [setInvoiceDefaults]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT: Branding & Preview */}
      <div className="lg:col-span-5 space-y-8">
        
        {/* Logo Section */}
        {/* <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Invoice Branding</h3>
           <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors relative group overflow-hidden">
              
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-32 w-auto object-contain transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-3">
                    <ImagePlus className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">No Logo Uploaded</p>
                </div>
              )}

              {isEditing && (
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                  <Upload className="w-8 h-8 text-white mb-2" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Update Logo</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              )}
           </div>
           {isEditing && <p className="text-xs text-center text-gray-400 mt-3">Recommended: 200x200px PNG transparent</p>}
        </div> */}

        {/* Bank Card Preview */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
           <div className="flex justify-between items-start mb-8">
              <Landmark className="w-6 h-6 text-gray-400" />
              <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded">DEBIT</span>
           </div>
           <div className="space-y-1 mb-6">
             <p className="text-xs text-gray-400 uppercase tracking-widest">Bank Name</p>
             <p className="text-lg font-bold tracking-wide">{invoiceDefaults.bankName || 'BANK NAME'}</p>
           </div>
           <div className="flex justify-between items-end">
             <div>
               <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Account Number</p>
               <p className="font-mono text-xl tracking-widest">{invoiceDefaults.accountNumber ? `•••• ${invoiceDefaults.accountNumber.slice(-4)}` : '•••• 0000'}</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">IFSC</p>
                <p className="font-mono text-sm">{invoiceDefaults.ifsc || '---'}</p>
             </div>
           </div>
        </div>

      </div>

      {/* RIGHT: Forms */}
      <div className="lg:col-span-7 space-y-8">
        
        {/* Bank Details Form */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-500" />
            Payment Details
          </h3>
          
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Bank Name" icon={Landmark} value={invoiceDefaults.bankName} onChange={handleBankNameChange} placeholder="HDFC Bank" />
              <Input label="Account Number" icon={CreditCard} value={invoiceDefaults.accountNumber} onChange={handleAccountNumberChange} placeholder="0000 0000 0000" />
              <Input label="IFSC Code" icon={FileText} value={invoiceDefaults.ifsc} onChange={handleIfscChange} placeholder="HDFC000123" />
              <Input label="UPI ID" icon={Wallet} value={invoiceDefaults.upiId} onChange={handleUpiIdChange} placeholder="user@upi" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[
                 { label: 'Bank Name', value: invoiceDefaults.bankName },
                 { label: 'Account No', value: invoiceDefaults.accountNumber, mono: true },
                 { label: 'IFSC Code', value: invoiceDefaults.ifsc, mono: true },
                 { label: 'UPI ID', value: invoiceDefaults.upiId }
               ].map((item, i) => (
                 <div key={i} className="p-4 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
                    <p className={`text-sm font-semibold text-gray-900 mt-1 ${item.mono ? 'font-mono' : ''}`}>{item.value || '-'}</p>
                 </div>
               ))}
            </div>
          )}
        </section>

        {/* Defaults Form */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
           <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-500" />
            Content Defaults
          </h3>
          
          {isEditing ? (
             <div className="space-y-5">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <Input label="Default Subject" value={invoiceDefaults.defaultSubject} onChange={handleDefaultSubjectChange} placeholder="Invoice for Services" />
                 <Input label="Payment Terms" value={invoiceDefaults.paymentTerms} onChange={handlePaymentTermsChange} placeholder="Due in 15 days" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Terms & Conditions</label>
                 <textarea
                   value={invoiceDefaults.terms}
                   onChange={handleTermsChange}
                   rows={5}
                   className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-mono text-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                   placeholder="1. Goods once sold..."
                 />
               </div>
             </div>
          ) : (
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="flex-1 p-4 border border-gray-100 rounded-xl">
                      <span className="text-xs font-bold text-gray-400 uppercase">Subject</span>
                      <p className="font-medium text-gray-900 mt-1">{invoiceDefaults.defaultSubject || '-'}</p>
                   </div>
                   <div className="flex-1 p-4 border border-gray-100 rounded-xl">
                      <span className="text-xs font-bold text-gray-400 uppercase">Terms</span>
                      <p className="font-medium text-gray-900 mt-1">{invoiceDefaults.paymentTerms || '-'}</p>
                   </div>
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Terms Preview</span>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">
                        {invoiceDefaults.terms || 'No terms configured.'}
                      </pre>
                   </div>
                </div>
             </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default InvoiceSettingsTab;