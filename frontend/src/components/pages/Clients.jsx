import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, Phone, Mail, MapPin,
  Filter, ChevronDown, UserCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AddClientModal from '../modals/AddClientModal';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/clients`;


const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Helper to get token
  const getToken = () => localStorage.getItem('token');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(API_BASE, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch clients");
        toast.error("Failed to load client list");
        setClients([]); 
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
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
            <h3 className="font-medium text-gray-900 text-sm">Delete Client?</h3>
            <p className="text-gray-500 text-xs mt-1">This will permanently remove the client.</p>
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
    const loadingToast = toast.loading('Deleting client...');

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setClients(prev => prev.filter(c => c._id !== id));
        toast.success('Client deleted successfully', { id: loadingToast });
      } else {
        toast.error('Failed to delete client', { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to server', { id: loadingToast });
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingClient(null);
  };

  const handleSave = (savedClient) => {
    if (editingClient) {
      setClients(prev => prev.map(c => c._id === savedClient._id ? savedClient : c));
    } else {
      setClients(prev => [savedClient, ...prev]);
    }
    handleCloseModal();
  };

  const filteredClients = clients.filter(c => 
    (c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.gstin?.includes(searchTerm) ||
    c.mobile?.includes(searchTerm)) &&
    (filterState === 'all' || c.state === filterState)
  );

  const uniqueStates = [...new Set(clients.map(c => c.state).filter(Boolean))];

  return (
    <div className="min-h-screen bg-slate-200 pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
          <div className="flex shrink-0">
            <button
              onClick={() => { setEditingClient(null); setShowAddModal(true); }}
              className="w-full md:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Client
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, GSTIN, mobile..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
              />
            </div>
            <div className="w-full md:w-48 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filterState}
                onChange={e => setFilterState(e.target.value)}
                className="block w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm appearance-none cursor-pointer"
              >
                <option value="all">All States</option>
                {uniqueStates.map(state => <option key={state} value={state}>{state}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 md:p-20 text-center text-gray-500">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No clients found</h3>
            <p className="text-sm mt-1">Add a new client to get started.</p>
          </div>
        ) : (
          <>
            {/* DESKTOP VIEW: Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Client Details
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Contact Info
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        GSTIN
                      </th>
                      <th scope="col" className="relative px-6 py-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredClients.map((client) => (
                      <tr key={client._id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{client.name}</div>
                              {client.remarks && <div className="text-xs text-gray-500 max-w-[150px] truncate">{client.remarks}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {client.mobile && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                {client.mobile}
                              </div>
                            )}
                            {client.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                {client.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm text-gray-900">{client.state}</div>
                           <div className="text-xs text-gray-500 max-w-[150px] truncate">{client.address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           {client.gstin ? (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                               {client.gstin}
                             </span>
                           ) : (
                             <span className="text-xs text-gray-400 italic">Unregistered</span>
                           )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(client)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(client._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
              {filteredClients.map((client) => (
                <div key={client._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{client.name}</h3>
                        {client.gstin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-100 mt-1">
                            {client.gstin}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {client.mobile && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {client.mobile}
                      </div>
                    )}
                    {client.email && (
                        <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {client.email}
                      </div>
                    )}
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                        <span>
                          {client.address}, {client.state} {client.pincode && `- ${client.pincode}`}
                        </span>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => handleEdit(client)} className="flex items-center justify-center py-2 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium border border-gray-200">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button onClick={() => handleDelete(client._id)} className="flex items-center justify-center py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium border border-gray-200">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AddClientModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingClient={editingClient}
        apiBase={API_BASE}
      />
    </div>
  );
};

export default ClientsPage;