import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, Package, Box
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AddItemModal from '../modals/AddItemModal';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/items`;


const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

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
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSave = (savedItem) => {
    if (editingItem) {
      setItems(prev => prev.map(i => i._id === savedItem._id ? savedItem : i));
    } else {
      setItems(prev => [...prev, savedItem].sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  const filteredItems = items.filter(i => 
    i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.hsn?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-200 pb-20 md:pb-12">
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
      <AddItemModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingItem={editingItem}
        apiBase={API_BASE}
      />
    </div>
  );
};

export default ItemsPage;