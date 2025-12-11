import React, { useCallback } from 'react';
import { Building2, MapPin, Phone, Mail, Globe, Hash, Briefcase } from 'lucide-react';

// Custom Input Component
const Input = React.memo(({ label, value, onChange, placeholder, icon: Icon, type = "text" }) => (
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

const BusinessSettingsTab = ({ business, setBusiness, isEditing }) => {

  const handleNameChange = useCallback((e) => setBusiness(prev => ({ ...prev, name: e.target.value })), [setBusiness]);
  const handleSubTitleChange = useCallback((e) => setBusiness(prev => ({ ...prev, subTitle: e.target.value })), [setBusiness]);
  const handleGstinChange = useCallback((e) => setBusiness(prev => ({ ...prev, gstin: e.target.value.toUpperCase() })), [setBusiness]);
  const handleAddressChange = useCallback((e) => setBusiness(prev => ({ ...prev, address: e.target.value })), [setBusiness]);
  const handleCityChange = useCallback((e) => setBusiness(prev => ({ ...prev, city: e.target.value })), [setBusiness]);
  const handleStateChange = useCallback((e) => setBusiness(prev => ({ ...prev, state: e.target.value })), [setBusiness]);
  const handlePincodeChange = useCallback((e) => setBusiness(prev => ({ ...prev, pincode: e.target.value })), [setBusiness]);
  const handlePhoneChange = useCallback((e) => setBusiness(prev => ({ ...prev, phone: e.target.value })), [setBusiness]);
  const handleEmailChange = useCallback((e) => setBusiness(prev => ({ ...prev, email: e.target.value })), [setBusiness]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT: Preview Card (Like a Business Card) */}
      <div className="lg:col-span-5 order-first lg:order-last">
        <div className="sticky top-28 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Live Preview</h3>
          
          {/* The Card */}
          <div className="aspect-[1.58/1] w-full h-62 rounded-2xl bg-gradient-to-br from-gray-900 via-slate-800 to-slate-900 p-6 md:p-8 text-white shadow-2xl relative overflow-hidden group">
             
             {/* Abstract Background Shapes */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-colors duration-700"></div>
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
             
             <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                   <div>
                     <div className="flex items-center gap-2 mb-2 opacity-80">
                       <Briefcase className="w-5 h-5" />
                       <span className="text-xs font-bold tracking-widest uppercase">Business Profile</span>
                     </div>
                     <h2 className="text-2xl md:text-3xl font-bold leading-tight text-white">{business.name || 'Company Name'}</h2>
                     <p className="text-indigo-200 font-medium mt-1">{business.subTitle || 'Tagline goes here'}</p>
                   </div>
                   <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                     <Building2 className="w-5 h-5 text-white" />
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-3 text-sm text-gray-300">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="line-clamp-2">{business.city || 'City'}, {business.state || 'State'}</span>
                   </div>
                   <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                      <div>
                      <p className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
  <span>GSTIN</span>
  <span className="font-mono text-lg tracking-wide text-gray-200">
    {business.gstin || '----------------'}
  </span>
</p>

                      </div>
                      <Globe className="w-16 h-16 text-white/5 absolute -bottom-4 -right-4" />
                   </div>
                </div>
             </div>
          </div>
          <p className="text-xs text-gray-500 text-center">This data is used on your PDF headers.</p>
        </div>
      </div>

      {/* RIGHT: Edit Form */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Identity Section */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            Identity
          </h3>
          
          {isEditing ? (
            <div className="space-y-5">
              <Input label="Business Name" value={business.name} onChange={handleNameChange} placeholder="e.g. Acme Corp" />
              <Input label="Subtitle / Tagline" value={business.subTitle} onChange={handleSubTitleChange} placeholder="e.g. Solutions for Tomorrow" />
              <Input label="GSTIN / Tax ID" value={business.gstin} onChange={handleGstinChange} placeholder="29ABCDE1234F1Z5" icon={Hash} />
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {[
                { label: 'Name', value: business.name },
                { label: 'Subtitle', value: business.subTitle },
                { label: 'GSTIN', value: business.gstin, mono: true }
              ].map((item, i) => (
                <div key={i} className="py-3 flex justify-between items-center group">
                  <span className="text-sm font-medium text-gray-500">{item.label}</span>
                  <span className={`text-sm font-semibold text-gray-900 ${item.mono ? 'font-mono' : ''}`}>
                    {item.value || <span className="text-gray-300 italic">Empty</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Contact Section */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-500" />
            Address & Contact
          </h3>

          {isEditing ? (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Full Address</label>
                <textarea 
                  value={business.address}
                  onChange={(e) => setBusiness({...business, address: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm resize-none"
                  placeholder="Street Address..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" value={business.city} onChange={handleCityChange} placeholder="City" />
                <Input label="State" value={business.state} onChange={handleStateChange} placeholder="State" />
              </div>
              <Input label="Pincode" value={business.pincode} onChange={handlePincodeChange} placeholder="000000" />
              <div className="pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input label="Phone" icon={Phone} value={business.phone} onChange={handlePhoneChange} placeholder="Phone" />
                 <Input label="Email" icon={Mail} value={business.email} onChange={handleEmailChange} placeholder="Email" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
               <div className="p-4 bg-gray-50 rounded-2xl">
                 <p className="text-gray-900 whitespace-pre-line leading-relaxed text-sm font-medium">
                   {business.address ? `${business.address}\n${business.city} - ${business.pincode}\n${business.state}` : <span className="text-gray-400 italic">Address not set</span>}
                 </p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                   <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Phone className="w-4 h-4"/></div>
                   <span className="text-sm font-medium text-gray-700">{business.phone || '-'}</span>
                 </div>
                 <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                   <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Mail className="w-4 h-4"/></div>
                   <span className="text-sm font-medium text-gray-700">{business.email || '-'}</span>
                 </div>
               </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default BusinessSettingsTab;