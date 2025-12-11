import React, { useState, useEffect } from 'react';
import { Building2, X, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AddClientModal = ({ isOpen, onClose, onSave, editingClient, apiBase }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', gstin: '', address: '', mobile: '', email: '', state: 'KARNATAKA', pincode: '', remarks: ''
  });

  // Populate form when editing
  useEffect(() => {
    if (isOpen) {
      if (editingClient) {
        setForm({
          name: editingClient.name || '',
          gstin: editingClient.gstin || '',
          address: editingClient.address || '',
          mobile: editingClient.mobile || '',
          email: editingClient.email || '',
          state: editingClient.state || 'KARNATAKA',
          pincode: editingClient.pincode || '',
          remarks: editingClient.remarks || ''
        });
      } else {
        // Reset for new entry
        setForm({
          name: '', gstin: '', address: '', mobile: '', email: '', state: 'KARNATAKA', pincode: '', remarks: ''
        });
      }
    }
  }, [isOpen, editingClient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading(editingClient ? 'Updating client...' : 'Adding new client...');

    try {
      const token = localStorage.getItem('token');
      const url = editingClient ? `${apiBase}/${editingClient._id}` : apiBase;
      const method = editingClient ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save client');
      }

      onSave(data);
      toast.success(editingClient ? 'Client updated successfully' : 'Client added successfully', { id: loadingToast });
      onClose();
    } catch (err) {
      console.error("Failed to save client", err);
      toast.error(err.message || "Operation failed", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            {editingClient ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
              <input value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})}
                placeholder="29ABCDE1234F1Z5"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea rows={2} value={form.address} onChange={e => setForm({...form, address: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
              <input  type="tel" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select value={form.state} onChange={e => setForm({...form, state: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white">
                <option>KARNATAKA</option>
                <option>TAMIL NADU</option>
                <option>MAHARASHTRA</option>
                <option>ANDHRA PRADESH</option>
                <option>TELANGANA</option>
                <option>KERALA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <input value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})}
              placeholder="Additional notes..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button type="button" onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center font-medium disabled:opacity-70">
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Save className="w-4 h-4 mr-2" />}
              {editingClient ? 'Update Client' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientModal;
