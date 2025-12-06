import React, { useCallback } from 'react';
import { ScrollText, Calendar, Hash, PenTool, LayoutTemplate } from 'lucide-react';

// Custom Input Component
const Input = React.memo(({ label, value, onChange, placeholder, icon: Icon, type="text" }) => (
  <div className="group">
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1 transition-colors group-focus-within:text-indigo-600">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />}
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-11' : 'px-4'} py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm`}
      />
    </div>
  </div>
));

const QuotationSettingsTab = ({
  quotationDefaults = {},
  setQuotationDefaults,
  isEditing
}) => {

  const handlePrefixChange = useCallback((e) => setQuotationDefaults(prev => ({ ...prev, prefix: e.target.value })), [setQuotationDefaults]);
  const handleValidityDaysChange = useCallback((e) => setQuotationDefaults(prev => ({ ...prev, defaultValidityDays: e.target.value })), [setQuotationDefaults]);
  const handleDefaultSubjectChange = useCallback((e) => setQuotationDefaults(prev => ({ ...prev, defaultSubject: e.target.value })), [setQuotationDefaults]);
  const handleTermsChange = useCallback((e) => setQuotationDefaults(prev => ({ ...prev, terms: e.target.value })), [setQuotationDefaults]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT: Configuration Stats */}
      <div className="lg:col-span-4 space-y-6">
         <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <LayoutTemplate className="w-10 h-10 mb-6 text-indigo-200" />
            <h3 className="text-2xl font-bold mb-2">Configuration</h3>
            <p className="text-indigo-100 text-sm leading-relaxed opacity-90">
              Define the numbering rules and validity periods for your automated quotations.
            </p>
         </div>

         <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Current Rules</h4>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-600">Prefix</span>
                  <span className="text-sm font-bold font-mono text-gray-900">{quotationDefaults.prefix || 'QTN'}</span>
               </div>
               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-600">Validity</span>
                  <span className="text-sm font-bold text-gray-900">{quotationDefaults.defaultValidityDays || '30'} Days</span>
               </div>
            </div>
         </div>
      </div>

      {/* RIGHT: Edit Forms */}
      <div className="lg:col-span-8 space-y-6">
        
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
             <Hash className="w-5 h-5 text-indigo-500" />
             Parameters
          </h3>

          {isEditing ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <Input 
                  label="Prefix Format" 
                  value={quotationDefaults.prefix} 
                  onChange={(e) => setQuotationDefaults({...quotationDefaults, prefix: e.target.value})} 
                  placeholder="QTN" 
                  icon={PenTool}
                />
                <Input 
                  label="Validity (Days)" 
                  value={quotationDefaults.defaultValidityDays} 
                  onChange={(e) => setQuotationDefaults({...quotationDefaults, defaultValidityDays: e.target.value})} 
                  placeholder="30" 
                  type="number"
                  icon={Calendar}
                />
             </div>
          ) : (
             <p className="text-gray-500 text-sm">Switch to edit mode to change prefix and validity days.</p>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
             <ScrollText className="w-5 h-5 text-indigo-500" />
             Content Defaults
          </h3>
          
          {isEditing ? (
             <div className="space-y-5">
               <Input
                  label="Default Subject"
                  value={quotationDefaults.defaultSubject}
                  onChange={handleDefaultSubjectChange}
                  placeholder="Quotation for..."
               />
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Standard Terms</label>
                  <textarea
                     value={quotationDefaults.terms}
                     onChange={handleTermsChange}
                     rows={5}
                     className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-mono text-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                   />
               </div>
             </div>
          ) : (
             <div className="space-y-5">
                <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subject</span>
                   <p className="font-medium text-gray-900 mt-1">{quotationDefaults.defaultSubject || 'Not set'}</p>
                </div>
                <div>
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-2 block">Terms Preview</span>
                   <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                      <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">
                        {quotationDefaults.terms || 'No terms configured'}
                      </pre>
                   </div>
                </div>
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default QuotationSettingsTab;