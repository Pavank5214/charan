import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Layers, Search, Eye,
  Download, X, Plus, Edit, Trash2,
  Filter, ChevronDown, CheckCircle, Clock, AlertCircle, FileText, Loader2
} from 'lucide-react';
import CreateBOMModal from '../modals/CreateBOMModal';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;

// --- Internal Utility: Generate BOM HTML (Integrated to avoid import issues) ---
const generateBOMHTML = (data) => {
  const { bomNumber, bomDate, items = [], client } = data;
  const formattedDate = new Date(bomDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const getSerial = (i) => String.fromCharCode(97 + (i % 26));

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>BOM - ${bomNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        body { font-family: 'Roboto', Helvetica, Arial, sans-serif; padding: 20px; color: #000; }
        .container { border: 1.5pt solid #000; max-width: 1000px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; padding: 15px; height: 100px; }
        .company-name { color: #D32F2F; font-weight: bold; font-size: 14px; margin-bottom: 5px; text-transform: uppercase; }
        .header-right .logo { color: #03A9F4; font-size: 40px; font-weight: bold; }
        .info-bar { background-color: #FFFF00; border-top: 1pt solid #000; border-bottom: 1pt solid #000; padding: 4px 10px; display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; }
        .title { text-align: center; font-weight: bold; font-size: 12px; padding: 6px; }
        table { width: 100%; border-collapse: collapse; border-top: 1pt solid #000; }
        th { background-color: #00897B; border-bottom: 1pt solid #000; border-right: 1pt solid #000; padding: 6px; font-size: 10px; color: #000; font-weight: bold; }
        td { border-bottom: 1pt solid #000; border-right: 1pt solid #000; padding: 4px; font-size: 10px; }
        th:last-child, td:last-child { border-right: none; }
        .text-center { text-align: center; }
        .section-header { background-color: #FFF176; font-weight: bold; }
        .footer { padding: 15px; font-weight: bold; font-size: 11px; margin-top: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="width: 60%;">
            <div class="company-name">SRI MANJUNATHA ELECTRICAL & CONTROLS</div>
            <div style="font-size: 10px; font-weight: bold; margin-bottom: 8px;">Mfg All Type power switchboards, control panels & Bus Ducts</div>
            <div style="font-size: 10px; line-height: 1.4;">
              No.19, 3rd Main road, Kasturba Nagar<br>Near Mysore road old tollgate<br>Bangalore - 560026<br>Mob: 9535982016
            </div>
          </div>
          <div class="header-right" style="width: 40%; display: flex; align-items: center; justify-content: flex-end; padding-right: 20px;">
            <div class="logo">SMEC</div>
          </div>
        </div>
        <div class="info-bar">
          <span>${bomNumber}</span>
          <span>${formattedDate}</span>
        </div>
        <div class="title">Bill Of Materials</div>
        <table>
          <thead>
            <tr><th width="8%">S.No</th><th width="50%">Description</th><th width="15%">Qty</th><th width="27%">Make</th></tr>
          </thead>
          <tbody>
            <tr class="section-header">
              <td class="text-center">1.1</td><td style="text-align: left;">DISTRIBUTION PANEL</td><td class="text-center"></td><td class="text-center"></td>
            </tr>
            ${items.map((item, index) => `
              <tr>
                <td class="text-center">${getSerial(index)}</td>
                <td style="text-align: left; padding-left: 8px;">${item.description}</td>
                <td class="text-center">${item.qty} ${item.unit}</td>
                <td class="text-center">${item.make || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">Thanking You,</div>
      </div>
    </body>
    </html>
  `;
};

const BOMList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [generatingId, setGeneratingId] = useState(null);
  
  // Modal & Preview States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState(null);
  const [previewBOM, setPreviewBOM] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);

  // Fetch all BOMs
  const fetchBOMs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setBoms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      // alert('Failed to load BOMs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBOMs();
  }, []);

  // Handlers
  const handleCreate = () => {
    setEditingBOM(null);
    setIsModalOpen(true);
  };

  const handleEdit = (bom) => {
    setEditingBOM(bom);
    setIsModalOpen(true);
  };

  const handleBOMSaved = (updatedBOM) => {
    if (updatedBOM) {
      // Update the BOM in the list
      setBoms(prev => {
        const existingIndex = prev.findIndex(bom => bom._id === updatedBOM._id);
        if (existingIndex >= 0) {
          // Update existing BOM
          const updated = [...prev];
          updated[existingIndex] = updatedBOM;
          return updated;
        } else {
          // Add new BOM
          return [updatedBOM, ...prev];
        }
      });
    } else {
      // Fallback: refetch if no data provided
      fetchBOMs();
    }
    setIsModalOpen(false);
    setEditingBOM(null);
  };

  const handleDelete = async (id) => {
    toast((t) => (
      <div>
        <p>Are you sure you want to delete this BOM?</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              performDelete(id);
            }}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
    });
  };

  const performDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/bom/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success("BOM deleted successfully");
      fetchBOMs();
    } catch (err) {
      toast.error("Failed to delete BOM");
    }
  };

  // Generate HTML Blob
  const generateBlob = (bom) => {
    const htmlContent = generateBOMHTML(bom);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return URL.createObjectURL(blob);
  };

  // View / Preview
  const handleView = (bom) => {
    setGeneratingId(bom._id);
    setTimeout(() => {
      const url = generateBlob(bom);
      window.open(url, '_blank');
      setGeneratingId(null);
    }, 300);
  };

  // Download
  const handleDownload = (bom) => {
    setGeneratingId(bom._id);
    setTimeout(() => {
      try {
        const url = generateBlob(bom);
        const link = document.createElement('a');
        link.href = url;
        const filename = bom.bomNumber ? bom.bomNumber.replace(/\//g, '-') : 'BOM-Document';
        link.download = `${filename}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        alert("Failed to generate document");
      } finally {
        setGeneratingId(null);
      }
    }, 500);
  };

  const closePreview = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setPreviewBOM(null);
  };

  // Filter Logic
  const filtered = boms.filter(
    (b) =>
      (filterStatus === 'all' || (b.status || 'draft') === filterStatus) &&
      (b.bomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Styling Helpers
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'in-production': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'approved': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto px-4sm:px-6 lg:px-8 pt-6 md:pt-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Bill of Materials</h1>
            <p className="text-gray-500 mt-1 text-sm">Manage, edit, and print BOMs for production</p>
          </div>
          <div className="flex shrink-0">
             <button
              onClick={handleCreate}
              className="w-full md:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm hover:shadow"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create BOM
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by BOM # or Client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm outline-none"
              />
            </div>
            <div className="w-full md:w-48 relative">
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="in-production">In Production</option>
                <option value="completed">Completed</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
               <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
               <p className="text-gray-500">Loading BOMs...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-20 text-center text-gray-500">
              <Layers className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No BOMs found</h3>
              <p className="text-sm mt-1">Create a new BOM to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ref No.</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filtered.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">
                            <Layers className="w-5 h-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{b.bomNumber}</div>
                            <div className="text-xs text-gray-500">{b.items?.length || 0} Items</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{b.client?.name}</div>
                        <div className="text-xs text-gray-500">{b.client?.city || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(b.bomDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getStatusStyle(b.status)}`}>
                            {b.status || 'draft'}
                          </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleView(b)} 
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Preview"
                          >
                            {generatingId === b._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleDownload(b)} 
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEdit(b)} 
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(b._id)} 
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CreateBOMModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingBOM(null); }}
        onSaved={handleBOMSaved}
        bomToEdit={editingBOM}
      />

      {/* Preview Modal */}
      {previewBOM && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">BOM Preview</h2>
                <p className="text-sm text-gray-500">{previewBOM.bomNumber}</p>
              </div>
              <button onClick={closePreview} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden bg-gray-50 relative">
              <iframe src={blobUrl} className="w-full h-full border-0 shadow-inner" title="BOM Preview" />
            </div>

            <div className="p-6 border-t flex justify-end gap-3 bg-white rounded-b-2xl">
              <button onClick={closePreview} className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                Close
              </button>
              <button onClick={() => handleDownload(previewBOM)} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center shadow-sm">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BOMList;