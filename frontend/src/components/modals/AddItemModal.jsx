import React, { useState, useEffect } from 'react';
import { Layers, X, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AddItemModal = ({ isOpen, onClose, onSave, editingItem, apiBase }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', hsn: '', unit: 'NOS', price: ''
  });

  // Populate form when editing
  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setForm({
          name: editingItem.name || '',
          description: editingItem.description || '',
          hsn: editingItem.hsn || '',
          unit: editingItem.unit || 'NOS',
          price: editingItem.price || ''
        });
      } else {
        // Reset for new entry
        setForm({
          name: '', description: '', hsn: '', unit: 'NOS', price: ''
        });
      }
    }
  }, [isOpen, editingItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading(editingItem ? 'Updating item...' : 'Saving new item...');

    try {
      const token = localStorage.getItem('token');
      const url = editingItem ? `${apiBase}/${editingItem._id}` : apiBase;
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        // If response is not JSON, check if it's a success response
        if (res.ok) {
          // For successful responses that aren't JSON, create a mock response
          data = { ...form, _id: editingItem ? editingItem._id : Date.now().toString() };
        } else {
          throw new Error('Invalid response from server');
        }
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save item');
      }

      onSave(data);
      toast.success(editingItem ? 'Item updated successfully' : 'Item added successfully', { id: loadingToast });
      onClose();
    } catch (err) {
      console.error("Failed to save item", err);
      toast.error(err.message || "Operation failed", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input required type="number" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white">
                <option value="NOS">NOS</option>
                <option value="PCS">PCS</option>
                <option value="KG">KG</option>
                <option value="MTR">MTR</option>
                <option value="SET">SET</option>
                <option value="BOX">BOX</option>
                <option value="SQFT">SQFT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HSN / SAC Code</label>
            <input value={form.hsn} onChange={e => setForm({...form, hsn: e.target.value})}
              placeholder="e.g. 9983"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition" />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button type="button" onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center font-medium disabled:opacity-70">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingItem ? 'Update Item' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
