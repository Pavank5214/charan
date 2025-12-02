import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, Package, Tag, FileText, 
  IndianRupee, Filter, ChevronDown, Box, Save, Layers, Loader2, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/items`;


const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Form state matches the Mongoose model structure
  const [form, setForm] = useState({
    name: '', description: '', hsn: '', unit: 'NOS', price: ''
  });

  // Fetch Items (GET /api/items)
  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } else {
        console.warn("API call failed or unauthorized");
        toast.error("Failed to load inventory");
        setItems([]); 
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Handle Form Submit (POST /api/items or PUT /api/items/:id)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    
    // Toast Loading State
    const loadingToast = toast.loading(editingItem ? 'Updating item...' : 'Saving new item...');
    
    const token = localStorage.getItem('token');
    const url = editingItem ? `${API_BASE}/${editingItem._id}` : API_BASE;
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save item');
      }

      // Update UI state
      if (editingItem) {
        setItems(prev => prev.map(i => i._id === data._id ? data : i));
        toast.success('Item updated successfully', { id: loadingToast });
      } else {
        setItems(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success('Item added successfully', { id: loadingToast });
      }

      handleCloseModal();
    } catch (err) {
      toast.error(err.message || "Operation failed", { id: loadingToast });
    } finally {
      setSaveLoading(false);
    }
  };

  // --- Custom Delete Confirmation Toast ---
  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[240px]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-50 rounded-full shrink-0">
            <Trash2 className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">Delete Item?</h3>
            <p className="text-gray-500 text-xs mt-1">This will permanently remove the item.</p>
          </div>
        </div>
        
        <div className="flex gap-2 justify-end mt-1">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => executeDelete(id, t.id)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-center',
      style: {
        background: '#fff',
        padding: '12px',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #f3f4f6'
      },
    });
  };

  const executeDelete = async (id, toastId) => {
    toast.dismiss(toastId);
    const loadingToast = toast.loading('Deleting item...');

    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${API_BASE}/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setItems(prev => prev.filter(i => i._id !== id));
        toast.success('Item deleted successfully', { id: loadingToast });
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete item", { id: loadingToast });
      }
    } catch (err) {
      console.error("Delete failed on server", err);
      toast.error("Connection error", { id: loadingToast });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      hsn: item.hsn || '',
      unit: item.unit || 'NOS',
      price: item.price || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({ name: '', description: '', hsn: '', unit: 'NOS', price: '' });
  };

  const filteredItems = items.filter(i => 
    i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.hsn?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
          <div className="flex shrink-0">
            <button
              onClick={() => { setEditingItem(null); setShowModal(true); }}
              className="w-full md:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Item
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search items by name or HSN..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading inventory...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 md:p-20 text-center text-gray-500">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No items found</h3>
            <p className="text-sm mt-1">Add your first product or service to get started.</p>
          </div>
        ) : (
          <>
            {/* DESKTOP VIEW: Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">HSN/SAC</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                      <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredItems.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">
                              <Box className="w-5 h-5" />
                            </div>
                            <div className="ml-4 font-medium text-gray-900">{item.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">{item.description || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.hsn ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.hsn}
                            </span>
                          ) : <span className="text-gray-400 text-xs">-</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                          ₹{Number(item.price).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(item._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE VIEW: Card Layout */}
            <div className="md:hidden space-y-4">
              {filteredItems.map((item) => (
                <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">
                          <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        <p className="text-xs text-gray-500">{item.hsn ? `HSN: ${item.hsn}` : 'No HSN'}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-indigo-600">₹{Number(item.price).toLocaleString('en-IN')}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description || 'No description provided.'}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg w-fit">
                    <span>Unit:</span> <span className="font-semibold text-gray-700">{item.unit}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => handleEdit(item)} className="flex items-center justify-center py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium border border-gray-200 transition-colors">
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </button>
                    <button onClick={() => handleDelete(item._id)} className="flex items-center justify-center py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium border border-gray-200 transition-colors">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Item Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                <button type="button" onClick={handleCloseModal}
                  className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={saveLoading}
                  className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center font-medium disabled:opacity-70">
                  {saveLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingItem ? 'Update Item' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsPage;