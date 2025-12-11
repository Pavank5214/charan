import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  X, Plus, User, Trash2, Loader2,
  Building, FileText, Calendar, Layers, Save, Wrench
} from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;

const CreateBOMModal = ({ isOpen, onClose, onSaved, bomToEdit }) => {
  // --- Company Settings for Defaults ---
  const [company, setCompany] = useState(null);
  
  // --- Form State ---
  const [client, setClient] = useState({ name: '', address: '', city: '', mobile: '', email: '' });
  const [bomNumber, setBomNumber] = useState('');
  const [bomDate, setBomDate] = useState('');
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('draft');
  
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Settings on Mount
  useEffect(() => {
    if (isOpen) {
      const fetchSettings = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_BASE}/settings/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.company) setCompany(data.company);
          }
        } catch (err) {
          console.error("Failed to load settings");
        }
      };
      fetchSettings();
    }
  }, [isOpen]);

  // Initialize Form
  useEffect(() => {
    if (isOpen) {
      if (bomToEdit) {
        // Edit Mode
        setClient(bomToEdit.client || { name: '', address: '', city: '', mobile: '', email: '' });
        setBomNumber(bomToEdit.bomNumber);
        setBomDate(bomToEdit.bomDate ? new Date(bomToEdit.bomDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setItems(bomToEdit.items || []);
        setStatus(bomToEdit.status || 'draft');
      } else {
        // Create Mode
        setClient({ name: '', address: '', city: '', mobile: '', email: '' });
        
        // Generate BOM Number (Simple Random Logic - replace with backend logic if preferred)
        const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
        const year = new Date().getFullYear().toString().slice(-2);
        setBomNumber(`SMEC/${year}-${parseInt(year)+1}/BOM-${rand}`);
        
        setBomDate(new Date().toISOString().split('T')[0]);
        setItems([{ description: '', make: '', qty: 1, unit: 'NOS' }]);
        setStatus('draft');
      }
    }
  }, [isOpen, bomToEdit]);

  const addItem = () => setItems([...items, { description: '', make: '', qty: 1, unit: 'NOS' }]);
  
  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!client.name || items.length === 0) {
      toast.error("Please fill in Client Name and at least one Item.");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        bomNumber,
        bomDate,
        client,
        items,
        status
      };

      if (bomToEdit) {
        const res = await fetch(`${API_BASE}/bom/${bomToEdit._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update BOM');
      } else {
        const res = await fetch(`${API_BASE}/bom`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to create BOM');
      }

      toast.success(bomToEdit ? 'BOM updated successfully!' : 'BOM saved successfully!');
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save BOM");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            {bomToEdit ? 'Edit Bill of Materials' : 'New Bill of Materials'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Sidebar: Meta Info */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Company Preview */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building className="w-4 h-4" /> From (Internal)
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <h4 className="font-bold text-gray-900 mb-2">{company?.name || 'Loading...'}</h4>
                  <p>{company?.address}</p>
                  <p>{company?.email}</p>
                </div>
              </div>

              {/* BOM Details */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> BOM Details
                </h3>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">BOM Reference No.</label>
                  <input 
                    value={bomNumber} 
                    onChange={(e) => setBomNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 bg-blue-50 rounded-lg font-mono text-sm font-bold text-blue-700" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={bomDate} 
                      onChange={(e) => setBomDate(e.target.value)} 
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm" 
                    />
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm capitalize"
                  >
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="in-production">In Production</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Content: Client & Items */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Client Info */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" /> Client Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-1">
                    <input 
                      placeholder="Client Name *" 
                      value={client.name} 
                      onChange={(e) => setClient({...client, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                    />
                  </div>
                  <div className="md:col-span-1">
                    <input 
                      placeholder="Location / City" 
                      value={client.city} 
                      onChange={(e) => setClient({...client, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input 
                      placeholder="Full Address" 
                      value={client.address} 
                      onChange={(e) => setClient({...client, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                    />
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="hidden sm:grid bg-gray-50 px-4 py-3 border-b border-gray-200 grid-cols-12 gap-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-3">Make / Brand</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-center">Unit</div>
                </div>

                <div className="p-2 space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 items-center p-2 rounded-lg hover:bg-gray-50 group border sm:border-none border-gray-100">
                      <div className="w-full sm:col-span-5">
                        <input 
                          placeholder="Description" 
                          value={item.description} 
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" 
                        />
                      </div>
                      <div className="w-full sm:col-span-3">
                        <input 
                          placeholder="Make (e.g. Siemens)" 
                          value={item.make} 
                          onChange={(e) => updateItem(index, 'make', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" 
                        />
                      </div>
                      <div className="w-full sm:col-span-2">
                        <input 
                          type="number" 
                          placeholder="Qty" 
                          value={item.qty} 
                          onChange={(e) => updateItem(index, 'qty', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-center" 
                        />
                      </div>
                      <div className="w-full sm:col-span-2 flex items-center gap-2">
                        <input 
                          placeholder="Unit" 
                          value={item.unit} 
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-center" 
                        />
                        <button 
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
                  <button onClick={addItem} className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 z-10">
          <button onClick={onClose} className="px-6 py-2.5 text-sm text-gray-700 font-medium hover:bg-gray-50 rounded-xl border border-gray-200">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-8 py-2.5 text-sm bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save BOM
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateBOMModal;