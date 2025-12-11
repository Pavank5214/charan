import React, { useState, useEffect } from 'react';
import {
  IndianRupee, X, Save, Loader2, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CreateExpenseModal = ({ isOpen, onClose, onSave, expenseToEdit, apiBase }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    payee: '',
    category: 'Operational',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'UPI',
    status: 'paid',
    referenceNo: '',
    description: ''
  });

  // Populate form when editing
  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setForm({
          payee: expenseToEdit.payee || '',
          category: expenseToEdit.category || 'Operational',
          amount: expenseToEdit.amount || '',
          date: expenseToEdit.date ? new Date(expenseToEdit.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          method: expenseToEdit.method || 'UPI',
          status: expenseToEdit.status || 'paid',
          referenceNo: expenseToEdit.referenceNo || '',
          description: expenseToEdit.description || ''
        });
      } else {
        // Reset for new entry
        setForm({
          payee: '',
          category: 'Operational',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          method: 'UPI',
          status: 'paid',
          referenceNo: '',
          description: ''
        });
      }
    }
  }, [isOpen, expenseToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Toast Loading State
    const loadingToast = toast.loading(expenseToEdit ? 'Updating expense...' : 'Recording expense...');

    try {
      const token = localStorage.getItem('token');
      const url = expenseToEdit ? `${apiBase}/${expenseToEdit._id}` : apiBase;
      const method = expenseToEdit ? 'PUT' : 'POST';

      const payload = { ...form };

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        // If response is not JSON, check if it's a success response
        if (res.ok) {
          // For successful responses that aren't JSON, create a mock response
          data = { ...form, _id: expenseToEdit ? expenseToEdit._id : Date.now().toString() };
        } else {
          throw new Error('Invalid response from server');
        }
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save expense');
      }

      onSave(data);
      toast.success(expenseToEdit ? 'Expense updated successfully' : 'Expense recorded successfully', { id: loadingToast });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Operation failed", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <IndianRupee className="w-6 h-6 text-red-600" />
            </div>
            {expenseToEdit ? 'Edit Expense' : 'Record Expense'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payee / Vendor *</label>
            <input
              required
              value={form.payee}
              onChange={e => setForm({...form, payee: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition"
              placeholder="e.g. Office Rent, Stationery Shop"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
              <input
                required
                type="number"
                value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-bold text-gray-800 transition"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({...form, date: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-white appearance-none"
                >
                  <option value="Operational">Operational</option>
                  <option value="Salary">Salary</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Travel">Travel</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <div className="relative">
                <select
                  value={form.method}
                  onChange={e => setForm({...form, method: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-white appearance-none"
                >
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-white appearance-none"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference No.</label>
              <input
                value={form.referenceNo}
                onChange={e => setForm({...form, referenceNo: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition"
                placeholder="Txn ID"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none transition"
              placeholder="Details about this expense..."
            />
          </div>

          <div className="pt-4 border-t flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 text-white bg-red-600 rounded-xl font-bold hover:bg-red-700 transition flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {expenseToEdit ? 'Update' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExpenseModal;
