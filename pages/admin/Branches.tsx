import React, { useEffect, useState } from 'react';
import { Branch, Zone } from '../../types';
import { api } from '../../services/api';
import { Edit, Plus, Save, Map, AlertTriangle, Loader2, Trash2, FileJson } from 'lucide-react';
import { useI18n } from '../../i18n';

const Branches: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Zone Editor State
  const [zonesJson, setZonesJson] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [importMode, setImportMode] = useState(false);
  const [rawGeoJson, setRawGeoJson] = useState('');

  const { t } = useI18n();

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
    setZonesJson(JSON.stringify(branch.zones || [], null, 2));
    setJsonError('');
    setImportMode(false);
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
    setImportMode(false);
  };

  // --- SMART GEOJSON IMPORTER ---
  const handleImportGeoJson = () => {
    try {
      const parsed = JSON.parse(rawGeoJson);

      // 1. Extract the Coordinate Array
      let coords: any[] = [];

      // Case A: Triple Array (Your input format: "coordinates": [[[lng, lat], ...]])
      if (Array.isArray(parsed) && Array.isArray(parsed[0]) && Array.isArray(parsed[0][0])) {
        coords = parsed[0];
      }
      // Case B: GeoJSON FeatureCollection
      else if (parsed.features && parsed.features[0].geometry.coordinates) {
        coords = parsed.features[0].geometry.coordinates[0];
      }
      // Case C: Standard Geometry
      else if (parsed.coordinates) {
        coords = parsed.coordinates[0];
      }
      else {
        throw new Error("Could not find valid polygon coordinates.");
      }

      // 2. CONVERT & SWAP
      // GeoJSON Standard is [Longitude, Latitude] -> [31.2, 30.0]
      // Our App Needs { lat: 30.0, lng: 31.2 }
      // So we map: lat = point[1], lng = point[0]

      const convertedPolygon = coords.map((point: any) => ({
        lat: Number(point[1]), // Second number is Latitude
        lng: Number(point[0])  // First number is Longitude
      }));

      // Validation Check (Optional but safe for Egypt)
      // Egypt Lat is ~22-32, Lng is ~24-37. 
      // If we see Lat > 33, maybe it wasn't swapped? (Just a sanity check logic comment)

      // 3. Create Zone
      const newZone: Zone = {
        name: `Imported Zone ${new Date().toLocaleTimeString()}`,
        delivery_fee: 15,
        polygon: convertedPolygon
      };

      // 4. Update State
      let currentZones: Zone[] = [];
      try {
        currentZones = JSON.parse(zonesJson);
        if (!Array.isArray(currentZones)) currentZones = [];
      } catch {
        currentZones = [];
      }

      const updatedZones = [...currentZones, newZone];
      setZonesJson(JSON.stringify(updatedZones, null, 2));
      setImportMode(false);
      setRawGeoJson('');
      alert("Zone imported! Coordinates swapped (GeoJSON Lon,Lat -> App Lat,Lng).");

    } catch (e: any) {
      alert("Import Failed: " + e.message);
    }
  };

  const handleSave = async () => {
    if (!editingBranch) return;

    try {
      const parsedZones = JSON.parse(zonesJson);
      if (!Array.isArray(parsedZones)) throw new Error("Zones must be an array");

      const branchToSave = { ...editingBranch, zones: parsedZones };
      await api.saveBranch(branchToSave);
      await loadBranches();
      setEditingBranch(null);
    } catch (e: any) {
      setJsonError(e.message || "Invalid JSON format");
    }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">{t('nav.branches') || 'Branch Management'}</h2>
        <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition">
          <Plus className="w-5 h-5 ml-2" /> Add Branch
        </button>
      </div>

      {!editingBranch ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map(branch => (
            <div key={branch.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-3 rounded-full"><Map className="w-6 h-6 text-blue-600" /></div>
                <button onClick={() => handleEdit(branch)} className="text-gray-400 hover:text-blue-600 transition"><Edit className="w-5 h-5" /></button>
              </div>
              <h3 className="text-lg font-bold mb-2">{branch.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{branch.phone_contact}</p>
              <div className="border-t border-gray-100 pt-4">
                <span className="text-xs font-semibold text-gray-400 uppercase">Zones</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {branch.zones?.map((z, idx) => (
                    <span key={idx} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{z.name} ({z.delivery_fee})</span>
                  ))}
                  {(!branch.zones || branch.zones.length === 0) && <span className="text-gray-400 text-xs">None</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between bg-gray-50">
            <h3 className="text-lg font-bold text-gray-800">{editingBranch.id === 0 ? 'Create Branch' : `Edit: ${editingBranch.name}`}</h3>
            <button onClick={() => setEditingBranch(null)} className="text-gray-500 hover:text-gray-700">Cancel</button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={editingBranch.name} onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={editingBranch.phone_contact} onChange={(e) => setEditingBranch({ ...editingBranch, phone_contact: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="active" checked={editingBranch.is_active} onChange={(e) => setEditingBranch({ ...editingBranch, is_active: e.target.checked })} />
                <label htmlFor="active">Active</label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Zones (JSON)</label>
                <button
                  onClick={() => setImportMode(!importMode)}
                  className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 flex items-center"
                >
                  <FileJson className="w-3 h-3 mr-1" /> {importMode ? "Hide Importer" : "Import GeoJSON"}
                </button>
              </div>

              {/* GEOJSON IMPORTER TOOL */}
              {importMode && (
                <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <h4 className="text-sm font-bold text-indigo-800 mb-2">Paste GeoJSON Coordinates</h4>
                  <p className="text-xs text-indigo-600 mb-2">Paste the array starting with <code>[[[...]]]</code>. We will convert Longitude/Latitude automatically.</p>
                  <textarea
                    value={rawGeoJson}
                    onChange={(e) => setRawGeoJson(e.target.value)}
                    className="w-full h-24 text-xs font-mono p-2 border rounded mb-2"
                    placeholder='[[[30.9, 31.1], [30.9, 31.2]...]]'
                  />
                  <button onClick={handleImportGeoJson} className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded font-bold hover:bg-indigo-700">
                    Parse & Add Zone
                  </button>
                </div>
              )}

              <textarea
                value={zonesJson}
                onChange={(e) => setZonesJson(e.target.value)}
                rows={10}
                className="w-full bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg"
                dir="ltr"
              />
              {jsonError && <div className="text-red-600 text-sm mt-1 flex items-center"><AlertTriangle className="w-4 h-4 mr-1" />{jsonError}</div>}
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-end">
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center">
              <Save className="w-5 h-5 ml-2" /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;