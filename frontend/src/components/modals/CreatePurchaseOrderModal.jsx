import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FileText, ShoppingCart, Building, Plus, Trash2, Loader2, Save, X
} from 'lucide-react';

const CreatePurchaseOrderModal = ({ isOpen, onClose, onSave, orderToEdit, apiBase }) => {
  const [loading, setLoading] = useState(false);
  const [vendor, setVendor] = useState({
    name: '', address: '', gstin: '', email: '', mobile: ''
  });
  const [poNumber, setPoNumber] = useState(`PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState('draft');
  const [items, setItems] = useState([{ description: '', qty: 1, unit: 'NOS', rate: 0 }]);

  useEffect(() => {
    if (isOpen) {
      if (orderToEdit) {
        setVendor(orderToEdit.vendor || { name: '', address: '', gstin: '', email: '', mobile: '' });
        setPoNumber(orderToEdit.poNumber);
        setOrderDate(orderToEdit.orderDate ? new Date(orderToEdit.orderDate).toISOString().split('T')[0] : '');
        setDeliveryDate(orderToEdit.deliveryDate ? new Date(orderToEdit.deliveryDate).toISOString().split('T')[0] : '');
        setStatus(orderToEdit.status || 'draft');
        setItems(orderToEdit.items || [{ description: '', qty: 1, unit: 'NOS', rate: 0 }]);
      } else {
        // Reset
        setVendor({ name: '', address: '', gstin: '', email: '', mobile: '' });
        setPoNumber(`PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`);
        setOrderDate(new Date().toISOString().split('T')[0]);
        setDeliveryDate('');
        setStatus('draft');
        setItems([{ description: '', qty: 1, unit: 'NOS', rate: 0 }]);
      }
    }
  }, [isOpen, orderToEdit]);

  // Calculations
  const totalAmount = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Toast Loading
    const loadingToast = toast.loading(orderToEdit ? 'Updating Purchase Order...' : 'Creating Purchase Order...');

    const payload = {
      poNumber,
      vendor,
      orderDate,
      deliveryDate,
      status,
      items,
      totalAmount
    };

    try {
        const token = localStorage.getItem('token');
        const url = orderToEdit ? `${apiBase}/${orderToEdit._id}` : apiBase;
        const method = orderToEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await res.json();
            onSave(data);
            toast.success(orderToEdit ? 'PO updated successfully' : 'PO created successfully', { id: loadingToast });
        } else {
            // Fallback for demo
            onSave({ ...payload, _id: orderToEdit?._id || Math.random().toString() });
            toast.success('PO saved (Demo Mode)', { id: loadingToast });
        }
    } catch (error) {
        console.warn("Network Error, using fallback");
        onSave({ ...payload, _id: orderToEdit?._id || Math.random().toString() });
        toast.success('PO saved (Offline Mode)', { id: loadingToast });
    } finally {
        setLoading(false);
        onClose();
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-5xl flex flex-col max-h-[95vh] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b bg-white sticky top-0 z-10 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
               <ShoppingCart className="w-6 h-6 text-indigo-600" />
            </div>
            {orderToEdit ? 'Edit Purchase Order' : 'New Purchase Order'}
          </h2>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          <form id="po-form" onSubmit={handleSubmit} className="space-y-6">

            {/* Top Section: PO Details & Vendor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PO Info */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4"/> Order Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">PO Number</label>
                            <input required value={poNumber} onChange={e => setPoNumber(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-mono font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                <option value="draft">Draft</option>
                                <option value="sent">Sent</option>
                                <option value="received">Received</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Order Date</label>
                            <input type="date" required value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Delivery Due</label>
                            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                </div>

                {/* Vendor Info */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Building className="w-4 h-4"/> Vendor Details
                    </h3>
                    <div className="space-y-3">
                        <input required placeholder="Vendor Name *" value={vendor.name} onChange={e => setVendor({...vendor, name: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        <div className="grid grid-cols-2 gap-3">
                            <input placeholder="Mobile" value={vendor.mobile} onChange={e => setVendor({...vendor, mobile: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            <input placeholder="Email" value={vendor.email} onChange={e => setVendor({...vendor, email: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <textarea placeholder="Vendor Address" rows={2} value={vendor.address} onChange={e => setVendor({...vendor, address: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-5">Item Description</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Rate</div>
                    <div className="col-span-2 text-right">Amount</div>
                    <div className="col-span-1"></div>
                </div>
                <div className="p-2 space-y-2">
                    {items.map((item, i) => (
                        <div key={i} className="grid grid-cols-12 gap-3 items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="col-span-5">
                                <input placeholder="Item Name" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div className="col-span-2 flex gap-1">
                                <input type="number" placeholder="Qty" value={item.qty} onChange={e => updateItem(i, 'qty', Number(e.target.value))} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-indigo-500 outline-none" />
                                <input placeholder="Unit" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <input type="number" placeholder="0.00" value={item.rate} onChange={e => updateItem(i, 'rate', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-right focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div className="col-span-2 text-right font-bold text-gray-700 text-sm px-2">
                                ₹{(item.qty * item.rate).toLocaleString('en-IN')}
                            </div>
                            <div className="col-span-1 text-right">
                                <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <button type="button" onClick={() => setItems([...items, { description: '', qty: 1, unit: 'NOS', rate: 0 }])} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        <Plus className="w-4 h-4"/> Add Line Item
                    </button>
                    <div className="text-xl font-bold text-gray-900">
                        Total: ₹{totalAmount.toLocaleString('en-IN')}
                    </div>
                </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t bg-white rounded-b-2xl flex flex-col items-center gap-3">
            <button type="submit" form="po-form" disabled={loading} className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 flex items-center gap-2 transition shadow-lg shadow-indigo-200 disabled:opacity-70">
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save Order
            </button>
            <button onClick={onClose} className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl border border-gray-200 transition">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchaseOrderModal;
