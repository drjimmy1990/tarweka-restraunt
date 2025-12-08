import React, { useEffect, useState } from 'react';
import { Branch } from '../../types';
import { api } from '../../services/api';
import { Edit, Plus, Save, Trash2, Map, AlertTriangle, Loader2 } from 'lucide-react';
import { useI18n } from '../../i18n';

const Branches: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [zonesJson, setZonesJson] = useState('');
  const [jsonError, setJsonError] = useState('');
  const { t } = useI18n(); // Use translations

  // FIX: Make this async to wait for Supabase
  const loadBranches = async () => {
    setLoading(true);
    try {
      const data = await api.getBranches();
      setBranches(data || []);
    } catch (err) {
      console.error("Failed to load branches", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleEdit = (branch: Branch) => {
    setEditingBranch({ ...branch });
    // Safety check: ensure zones is an array before stringifying
    const safeZones = Array.isArray(branch.zones) ? branch.zones : [];
    setZonesJson(JSON.stringify(safeZones, null, 2));
    setJsonError('');
  };

  const handleAddNew = () => {
    const newBranch: Branch = {
      id: 0,
      name: '',
      phone_contact: '',
      zones: [],
      is_active: true,
      created_at: new Date().toISOString()
    };
    setEditingBranch(newBranch);
    setZonesJson('[]');
    setJsonError('');
  };

  const handleSave = async () => {
    if (!editingBranch) return;

    try {
      const parsedZones = JSON.parse(zonesJson);
      if (!Array.isArray(parsedZones)) throw new Error("Zones must be an array");

      const branchToSave = { ...editingBranch, zones: parsedZones };

      // FIX: Wait for save to complete
      await api.saveBranch(branchToSave);

      // Reload data
      await loadBranches();
      setEditingBranch(null);
    } catch (e: any) {
      setJsonError(e.message || "Invalid JSON format");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {/* Translated Title or fallback */}
          {t('nav.branches') || 'Branch Management'}
        </h2>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 ml-2" />
          Add New Branch
        </button>
      </div>

      {!editingBranch ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map(branch => (
            <div key={branch.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-3 rounded-full">
                  <Map className="w-6 h-6 text-blue-600" />
                </div>
                <button
                  onClick={() => handleEdit(branch)}
                  className="text-gray-400 hover:text-blue-600 transition"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-lg font-bold mb-2">{branch.name}</h3>
              <p className="text-gray-500 text-sm mb-4">Phone: {branch.phone_contact}</p>

              <div className="border-t border-gray-100 pt-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivery Zones</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {branch.zones && Array.isArray(branch.zones) && branch.zones.length > 0 ? branch.zones.map((z, idx) => (
                    <span key={idx} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                      {z.name} ({z.delivery_fee})
                    </span>
                  )) : (
                    <span className="text-gray-400 text-xs">No zones configured</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-bold text-gray-800">
              {editingBranch.id === 0 ? 'Create New Branch' : `Edit: ${editingBranch.name}`}
            </h3>
            <button
              onClick={() => setEditingBranch(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={editingBranch.name}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Contact</label>
                <input
                  type="text"
                  value={editingBranch.phone_contact || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, phone_contact: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingBranch.is_active}
                  onChange={(e) => setEditingBranch({ ...editingBranch, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (Accepting Orders)</label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                <span>Zones Configuration (JSON)</span>
                <span className="text-xs text-blue-600 cursor-pointer hover:underline" onClick={() => {
                  setZonesJson(`[
  {
    "name": "Zone A",
    "delivery_fee": 15,
    "polygon": [[30.1, 31.1], [30.2, 31.2], [30.2, 31.1]]
  }
]`);
                }}>Load Template</span>
              </label>
              <div className="relative">
                <textarea
                  value={zonesJson}
                  onChange={(e) => setZonesJson(e.target.value)}
                  rows={10}
                  className="w-full bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  dir="ltr"
                />
              </div>
              {jsonError && (
                <div className="flex items-center text-red-600 text-sm mt-1">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {jsonError}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center"
            >
              <Save className="w-5 h-5 ml-2" />
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;