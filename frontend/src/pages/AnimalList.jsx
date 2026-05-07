import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COLUMNS } from '../config/animalColumns.jsx';
import useColumnConfig from '../hooks/useColumnConfig.js';
import ColumnPickerModal from '../components/ColumnPickerModal.jsx';

export default function AnimalList() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? 'in-center');
  const [inClinicFilter, setInClinicFilter] = useState(false);
  const [underVigilanceFilter, setUnderVigilanceFilter] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [visibleIds, setVisibleIds] = useColumnConfig();

  const visibleColumns = visibleIds.map(id => COLUMNS.find(c => c.id === id)).filter(Boolean);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (inClinicFilter) params.set('inClinic', 'true');
    if (underVigilanceFilter) params.set('underVigilance', 'true');

    setLoading(true);
    fetch(`/api/animals?${params}`)
      .then(r => r.json())
      .then(setAnimals)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter, inClinicFilter, underVigilanceFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Animals</h2>
        {user && ['staff', 'vet', 'admin'].includes(user.role) && (
          <Link
            to="/animals/new"
            className="bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors"
          >
            + Add Animal
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <input
          type="text"
          placeholder="Search by name or species..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All statuses</option>
          <option value="in-center">In the center</option>
          <option value="released">Released</option>
          <option value="deceased">Deceased</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={inClinicFilter}
            onChange={e => setInClinicFilter(e.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          In clinic
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={underVigilanceFilter}
            onChange={e => setUnderVigilanceFilter(e.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          Under vigilance
        </label>
        <button
          onClick={() => setShowColumnPicker(true)}
          className="ml-auto flex items-center gap-1.5 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ⊞ Columns
          <span className="bg-green-700 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
            {visibleIds.length}
          </span>
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : animals.length === 0 ? (
        <p className="text-gray-500">No animals found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {visibleColumns.map(col => (
                  <th
                    key={col.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {animals.map(a => (
                <tr key={a._id} className="hover:bg-gray-50">
                  {visibleColumns.map(col => (
                    <td key={col.id} className="px-6 py-4 text-sm text-gray-600">
                      {col.render(a)}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/animals/${a._id}`}
                      className="text-green-700 hover:underline text-sm font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showColumnPicker && (
        <ColumnPickerModal
          visibleIds={visibleIds}
          onChange={setVisibleIds}
          onClose={() => setShowColumnPicker(false)}
        />
      )}
    </div>
  );
}
