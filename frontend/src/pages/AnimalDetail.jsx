import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = ['intake', 'treatment', 'ready-for-adoption', 'released', 'deceased'];
const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

export default function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [animal, setAnimal] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const [medForm, setMedForm] = useState({ description: '', treatment: '', vet: '', date: '', followUpDate: '' });
  const [medSaving, setMedSaving] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/animals/${id}`).then((r) => r.json()),
      fetch(`/api/animals/${id}/medical`).then((r) => r.json()),
    ])
      .then(([a, m]) => {
        setAnimal(a);
        setEditForm({ name: a.name, species: a.species, status: a.status, notes: a.notes || '', intakeDate: a.intakeDate?.split('T')[0] });
        setRecords(m);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function saveAnimal() {
    const res = await fetch(`/api/animals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setAnimal(data);
    setEditing(false);
  }

  async function deleteAnimal() {
    if (!confirm(`Delete ${animal.name}? This cannot be undone.`)) return;
    await fetch(`/api/animals/${id}`, { method: 'DELETE' });
    navigate('/animals');
  }

  async function addMedRecord(e) {
    e.preventDefault();
    setMedSaving(true);
    try {
      const res = await fetch(`/api/animals/${id}/medical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecords((r) => [data, ...r]);
      setMedForm({ description: '', treatment: '', vet: '', date: '', followUpDate: '' });
      setShowMedForm(false);
    } finally {
      setMedSaving(false);
    }
  }

  async function deleteMedRecord(recId) {
    if (!confirm('Delete this record?')) return;
    await fetch(`/api/medical/${recId}`, { method: 'DELETE' });
    setRecords((r) => r.filter((x) => x._id !== recId));
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!animal) return null;

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/animals" className="text-gray-400 hover:text-gray-600 text-sm">← Animals</Link>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">{animal.name}</h2>
          <p className="text-gray-500 text-sm">{animal.species}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(!editing)} className="text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50">
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button onClick={deleteAnimal} className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-md hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>

      {/* Animal Info */}
      <div className="bg-white rounded-lg shadow p-5">
        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Species</label>
                <input value={editForm.species} onChange={(e) => setEditForm((f) => ({ ...f, species: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Intake Date</label>
                <input type="date" value={editForm.intakeDate} onChange={(e) => setEditForm((f) => ({ ...f, intakeDate: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className={inputCls}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <textarea value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className={inputCls} />
            </div>
            <button onClick={saveAnimal} className="bg-green-700 text-white px-4 py-2 rounded-md text-sm hover:bg-green-800">Save</button>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-4">
            {[
              ['Species', animal.species],
              ['Status', animal.status],
              ['Intake Date', new Date(animal.intakeDate).toLocaleDateString()],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium text-gray-500">{label}</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
              </div>
            ))}
            {animal.notes && (
              <div className="col-span-2">
                <dt className="text-xs font-medium text-gray-500">Notes</dt>
                <dd className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">{animal.notes}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* Medical Records */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Medical Records</h3>
          <button onClick={() => setShowMedForm(!showMedForm)} className="text-sm px-3 py-1.5 bg-green-700 text-white rounded-md hover:bg-green-800">
            {showMedForm ? 'Cancel' : '+ Add Record'}
          </button>
        </div>

        {showMedForm && (
          <form onSubmit={addMedRecord} className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Description *</label>
                <input required value={medForm.description} onChange={(e) => setMedForm((f) => ({ ...f, description: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Treatment</label>
                <input value={medForm.treatment} onChange={(e) => setMedForm((f) => ({ ...f, treatment: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Vet</label>
                <input value={medForm.vet} onChange={(e) => setMedForm((f) => ({ ...f, vet: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                <input type="date" value={medForm.date} onChange={(e) => setMedForm((f) => ({ ...f, date: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Follow-up Date</label>
                <input type="date" value={medForm.followUpDate} onChange={(e) => setMedForm((f) => ({ ...f, followUpDate: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <button type="submit" disabled={medSaving} className="bg-green-700 text-white px-4 py-2 rounded-md text-sm hover:bg-green-800 disabled:opacity-50">
              {medSaving ? 'Saving...' : 'Save Record'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {records.length === 0 && <p className="text-gray-400 text-sm">No medical records yet.</p>}
          {records.map((r) => (
            <div key={r._id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.description}</p>
                  {r.treatment && <p className="text-sm text-gray-500 mt-0.5">Treatment: {r.treatment}</p>}
                  {r.vet && <p className="text-sm text-gray-500">Vet: {r.vet}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(r.date || r.createdAt).toLocaleDateString()}
                    {r.followUpDate && ` · Follow-up: ${new Date(r.followUpDate).toLocaleDateString()}`}
                  </p>
                </div>
                <button onClick={() => deleteMedRecord(r._id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
