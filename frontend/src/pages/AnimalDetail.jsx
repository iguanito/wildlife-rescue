import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast, useToast } from '../components/Toast';

function buildTimeline(animal, medRecords, careLogs) {
  const intakeEvent = {
    _id: 'intake',
    type: 'intake',
    date: animal.intakeDate,
  };
  const allEvents = [
    intakeEvent,
    ...medRecords.map((m) => ({ ...m, _timelineType: 'medical' })),
    ...careLogs.map((c) => ({ ...c, _timelineType: 'carelog' })),
  ];
  allEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
  return allEvents;
}

function groupByDay(entries) {
  const groups = {};
  entries.forEach((entry) => {
    const dateKey = new Date(entry.date).toISOString().split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(entry);
  });
  return Object.entries(groups)
    .map(([dateStr, items]) => ({ date: new Date(dateStr + 'T00:00:00'), items }))
    .sort((a, b) => b.date - a.date);
}

const STATUS_OPTIONS = [
  { value: 'in-center', label: 'In the center' },
  { value: 'released', label: 'Released' },
  { value: 'deceased', label: 'Deceased' },
];
const STATUS_COLORS = {
  'in-center': 'bg-blue-100 text-blue-800',
  released: 'bg-teal-100 text-teal-800',
  deceased: 'bg-gray-100 text-gray-600',
};
const STATUS_LABELS = {
  'in-center': 'In the center',
  released: 'Released',
  deceased: 'Deceased',
};
const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

export default function AnimalDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const canWrite = user && ['staff', 'vet', 'admin'].includes(user.role);
  const canAddMedical = user && ['vet', 'admin'].includes(user.role);

  const { message: toastMsg, showToast, dismissToast } = useToast();

  const [animal, setAnimal] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const [medForm, setMedForm] = useState({ description: '', treatment: '', vet: '', date: new Date().toLocaleDateString('en-CA'), followUpDate: '', followUpReason: '' });
  const [medSaving, setMedSaving] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);
  const [showMedFollowUp, setShowMedFollowUp] = useState(false);
  const [showMedEditFollowUp, setShowMedEditFollowUp] = useState(false);

  const [careLogs, setCareLogs] = useState([]);
  const [timelineEntries, setTimelineEntries] = useState([]);

  const [editingMedId, setEditingMedId] = useState(null);
  const [medEditForm, setMedEditForm] = useState({});
  const [editingCareId, setEditingCareId] = useState(null);
  const [careEditForm, setCareEditForm] = useState({});

  const [showCareForm, setShowCareForm] = useState(false);
  const [careForm, setCareForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'feeding', value: '', notes: '' });
  const [careSaving, setCareSaving] = useState(false);
  const [careError, setCareError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/animals/${id}`).then((r) => r.json()),
      fetch(`/api/animals/${id}/medical`).then((r) => r.json()),
      fetch(`/api/animals/${id}/carelogs`).then((r) => r.json()),
    ])
      .then(([a, m, c]) => {
        setAnimal(a);
        setEditForm({ givenName: a.givenName, commonName: a.commonName, status: a.status, notes: a.notes || '', intakeDate: a.intakeDate?.split('T')[0] });
        setRecords(m);
        setCareLogs(c);
        setTimelineEntries(buildTimeline(a, m, c));
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
    if (res.status === 403) { showToast('Permission denied'); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setAnimal(data);
    setEditing(false);
  }

  async function deleteAnimal() {
    if (!confirm(`Delete ${animal.givenName}? This cannot be undone.`)) return;
    const res = await fetch(`/api/animals/${id}`, { method: 'DELETE' });
    if (res.status === 403) { showToast('Permission denied'); return; }
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
      if (res.status === 403) { showToast('Permission denied'); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newRecords = [data, ...records];
      setRecords(newRecords);
      setTimelineEntries(buildTimeline(animal, newRecords, careLogs));
      setMedForm({ description: '', treatment: '', vet: '', date: new Date().toLocaleDateString('en-CA'), followUpDate: '', followUpReason: '' });
      setShowMedFollowUp(false);
      setShowMedForm(false);
    } finally {
      setMedSaving(false);
    }
  }

  function canEditMedRecord(entry) {
    if (!user) return false;
    if (['vet', 'admin'].includes(user.role)) return true;
    if (user.role === 'staff') {
      const isOwn = entry.createdBy?._id === user._id || entry.createdBy === user._id;
      const ageMs = Date.now() - new Date(entry.createdAt).getTime();
      return isOwn && ageMs <= 24 * 60 * 60 * 1000;
    }
    return false;
  }

  async function saveMedRecord(recId) {
    const res = await fetch(`/api/medical/${recId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medEditForm),
    });
    if (res.status === 403) { showToast('Permission denied'); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    const newRecords = records.map((r) => r._id === recId ? data : r);
    setRecords(newRecords);
    setTimelineEntries(buildTimeline(animal, newRecords, careLogs));
    setEditingMedId(null);
  }

  function canEditCareLog(entry) {
    if (!user) return false;
    if (['vet', 'admin'].includes(user.role)) return true;
    if (user.role === 'staff') {
      const isOwn = entry.createdBy?._id === user._id || entry.createdBy === user._id;
      const ageMs = Date.now() - new Date(entry.createdAt).getTime();
      return isOwn && ageMs <= 24 * 60 * 60 * 1000;
    }
    return false;
  }

  async function deleteCareLog(logId) {
    if (!confirm('Delete this care log entry?')) return;
    const res = await fetch(`/api/animals/${id}/carelogs/${logId}`, { method: 'DELETE' });
    if (res.status === 403) { showToast('Permission denied'); return; }
    const newCareLogs = careLogs.filter((c) => c._id !== logId);
    setCareLogs(newCareLogs);
    setTimelineEntries(buildTimeline(animal, records, newCareLogs));
  }

  async function saveCareLog(logId) {
    const res = await fetch(`/api/animals/${id}/carelogs/${logId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(careEditForm),
    });
    if (res.status === 403) { showToast('Permission denied'); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    const newCareLogs = careLogs.map((c) => c._id === logId ? data : c);
    setCareLogs(newCareLogs);
    setTimelineEntries(buildTimeline(animal, records, newCareLogs));
    setEditingCareId(null);
  }

  async function deleteMedRecord(recId) {
    if (!confirm('Delete this record?')) return;
    const res = await fetch(`/api/medical/${recId}`, { method: 'DELETE' });
    if (res.status === 403) { showToast('Permission denied'); return; }
    const newRecords = records.filter((x) => x._id !== recId);
    setRecords(newRecords);
    setTimelineEntries(buildTimeline(animal, newRecords, careLogs));
  }

  async function addCareLog(e) {
    e.preventDefault();
    setCareSaving(true);
    setCareError(null);
    try {
      const res = await fetch(`/api/animals/${id}/carelogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(careForm),
      });
      if (res.status === 403) { showToast('Permission denied'); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Add to local state and rebuild timeline
      const newCareLogs = [data, ...careLogs];
      setCareLogs(newCareLogs);
      setTimelineEntries(buildTimeline(animal, records, newCareLogs));
      setCareForm({ date: new Date().toISOString().split('T')[0], type: 'feeding', value: '', notes: '' });
      setShowCareForm(false);
    } catch (err) {
      setCareError(err.message);
    } finally {
      setCareSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!animal) return null;

  return (
    <div className="max-w-2xl space-y-8">
      <Toast message={toastMsg} onDismiss={dismissToast} />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/animals" className="text-gray-400 hover:text-gray-600 text-sm">← Animals</Link>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">{animal.givenName}</h2>
          <p className="text-gray-500 text-sm">{animal.commonName}</p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(!editing)} className="text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50">
              {editing ? 'Cancel' : 'Edit'}
            </button>
            <button onClick={deleteAnimal} className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-md hover:bg-red-50">
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Animal Info */}
      <div className="bg-white rounded-lg shadow p-5">
        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input value={editForm.givenName} onChange={(e) => setEditForm((f) => ({ ...f, givenName: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Species</label>
                <input value={editForm.commonName} onChange={(e) => setEditForm((f) => ({ ...f, commonName: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Intake Date</label>
                <input type="date" value={editForm.intakeDate} onChange={(e) => setEditForm((f) => ({ ...f, intakeDate: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className={inputCls}>
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
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
              ['Species', animal.commonName],
              ['Intake Date', new Date(animal.intakeDate).toLocaleDateString(undefined, { timeZone: 'UTC' })],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium text-gray-500">{label}</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs font-medium text-gray-500">Status</dt>
              <dd className="mt-0.5">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[animal.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[animal.status] ?? animal.status}
                </span>
              </dd>
            </div>
            {animal.notes && (
              <div className="col-span-2">
                <dt className="text-xs font-medium text-gray-500">Notes</dt>
                <dd className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">{animal.notes}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* Care History Timeline */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Care History</h3>

        {/* Add Medical Record button — only for vet/admin; hidden while med form open */}
        {canAddMedical && !showMedForm && (
          <button onClick={() => setShowMedForm(true)} className="w-full text-sm px-3 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-800 mb-2">
            + Add Medical Record
          </button>
        )}

        {/* Medical record inline form */}
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
              {showMedFollowUp ? (
                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Follow-up Date *</label>
                    <input required type="date" value={medForm.followUpDate} onChange={(e) => setMedForm((f) => ({ ...f, followUpDate: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Follow-up Reason *</label>
                    <input required value={medForm.followUpReason} onChange={(e) => setMedForm((f) => ({ ...f, followUpReason: e.target.value }))} className={inputCls} placeholder="e.g. Check wound healing" />
                  </div>
                  <div className="col-span-2">
                    <button type="button" onClick={() => { setShowMedFollowUp(false); setMedForm((f) => ({ ...f, followUpDate: '', followUpReason: '' })); }} className="text-xs text-red-500 hover:text-red-700">
                      − Remove follow-up
                    </button>
                  </div>
                </div>
              ) : (
                <div className="col-span-2">
                  <button type="button" onClick={() => setShowMedFollowUp(true)} className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                    + Add follow-up
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={medSaving} className="bg-purple-700 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-800 disabled:opacity-50">
                {medSaving ? 'Saving...' : 'Save Record'}
              </button>
              <button type="button" onClick={() => { setShowMedForm(false); setShowMedFollowUp(false); setMedForm((f) => ({ ...f, followUpDate: '', followUpReason: '' })); }} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Sticky add button — only for staff/vet/admin; hidden while form open (per D-08, D-09) */}
        {canWrite && !showCareForm && (
          <button
            onClick={() => setShowCareForm(true)}
            className="w-full text-sm px-3 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 mb-4"
          >
            + Add Care Log
          </button>
        )}

        {/* Inline form — appears between button and timeline when open (per D-11) */}
        {showCareForm && (
          <form onSubmit={addCareLog} className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
            {careError && <p className="text-red-600 text-sm">{careError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={careForm.date}
                  onChange={(e) => setCareForm((f) => ({ ...f, date: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type *</label>
                <select
                  required
                  value={careForm.type}
                  onChange={(e) => setCareForm((f) => ({ ...f, type: e.target.value, value: '', notes: '' }))}
                  className={inputCls}
                >
                  <option value="feeding">Feeding</option>
                  <option value="weight">Weight</option>
                  <option value="observation">Observation</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {careForm.type === 'weight' ? 'Value *' : 'Notes *'}
                </label>
                {careForm.type === 'weight' ? (
                  <input
                    required
                    placeholder="e.g. 450g"
                    value={careForm.value}
                    onChange={(e) => setCareForm((f) => ({ ...f, value: e.target.value }))}
                    className={inputCls}
                  />
                ) : (
                  <textarea
                    required
                    rows={2}
                    placeholder={careForm.type === 'feeding' ? 'e.g. 5ml formula, fed well' : 'Describe what you observed'}
                    value={careForm.notes}
                    onChange={(e) => setCareForm((f) => ({ ...f, notes: e.target.value }))}
                    className={inputCls}
                  />
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={careSaving} className="bg-green-700 text-white px-4 py-2 rounded-md text-sm hover:bg-green-800 disabled:opacity-50">
                {careSaving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => { setShowCareForm(false); setCareError(null); }} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Timeline — day-grouped, oldest first (per D-01, D-05) */}
        {timelineEntries.length === 0 ? (
          <p className="text-gray-400 text-sm">No care history recorded yet.</p>
        ) : (
          <div className="space-y-6">
            {groupByDay(timelineEntries).map((day) => (
              <div key={day.date.toISOString()}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {day.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </h4>
                <div className="space-y-2">
                  {day.items.map((entry) => {
                    if (entry.type === 'intake') {
                      return (
                        <div key="intake" className="flex items-center gap-2 text-sm text-gray-500 py-1">
                          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Intake</span>
                          <span>Animal arrived at rescue center</span>
                        </div>
                      );
                    }
                    if (entry._timelineType === 'medical') {
                      const isEditing = editingMedId === entry._id;
                      return (
                        <div key={entry._id} className="bg-white rounded-lg shadow p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Medical</span>
                            <div className="flex items-center gap-3">
                              {entry.createdBy?.email && (
                                <span className="text-xs text-gray-400">{entry.createdBy.email}</span>
                              )}
                              {!isEditing && (
                                <>
                                  {canEditMedRecord(entry) && (
                                    <button
                                      onClick={() => { setEditingMedId(entry._id); setShowMedEditFollowUp(!!entry.followUpDate); setMedEditForm({ description: entry.description, treatment: entry.treatment || '', vet: entry.vet || '', date: entry.date?.split('T')[0] || '', followUpDate: entry.followUpDate?.split('T')[0] || '', followUpReason: entry.followUpReason || '' }); }}
                                      className="text-xs text-blue-500 hover:text-blue-700"
                                    >Edit</button>
                                  )}
                                  {canAddMedical && (
                                    <button onClick={() => deleteMedRecord(entry._id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          {isEditing ? (
                            <div className="mt-3 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Description *</label>
                                  <input required value={medEditForm.description} onChange={(e) => setMedEditForm((f) => ({ ...f, description: e.target.value }))} className={inputCls} />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Treatment</label>
                                  <input value={medEditForm.treatment} onChange={(e) => setMedEditForm((f) => ({ ...f, treatment: e.target.value }))} className={inputCls} />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Vet</label>
                                  <input value={medEditForm.vet} onChange={(e) => setMedEditForm((f) => ({ ...f, vet: e.target.value }))} className={inputCls} />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                                  <input type="date" value={medEditForm.date} onChange={(e) => setMedEditForm((f) => ({ ...f, date: e.target.value }))} className={inputCls} />
                                </div>
                                {showMedEditFollowUp ? (
                                  <div className="col-span-2 grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">Follow-up Date *</label>
                                      <input required type="date" value={medEditForm.followUpDate} onChange={(e) => setMedEditForm((f) => ({ ...f, followUpDate: e.target.value }))} className={inputCls} />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">Follow-up Reason *</label>
                                      <input required value={medEditForm.followUpReason} onChange={(e) => setMedEditForm((f) => ({ ...f, followUpReason: e.target.value }))} className={inputCls} />
                                    </div>
                                    <div className="col-span-2">
                                      <button type="button" onClick={() => { setShowMedEditFollowUp(false); setMedEditForm((f) => ({ ...f, followUpDate: '', followUpReason: '' })); }} className="text-xs text-red-500 hover:text-red-700">
                                        − Remove follow-up
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="col-span-2">
                                    <button type="button" onClick={() => setShowMedEditFollowUp(true)} className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                                      + Add follow-up
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => saveMedRecord(entry._id)} className="bg-purple-700 text-white px-3 py-1.5 rounded-md text-sm hover:bg-purple-800">Save</button>
                                <button onClick={() => setEditingMedId(null)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-gray-900 mt-2">{entry.description}</p>
                              {entry.treatment && <p className="text-sm text-gray-500 mt-0.5">Treatment: {entry.treatment}</p>}
                              {entry.vet && <p className="text-sm text-gray-500">Vet: {entry.vet}</p>}
                              {entry.followUpDate && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Follow-up: {new Date(entry.followUpDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                                  {entry.followUpReason && <span className="ml-1">— {entry.followUpReason}</span>}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      );
                    }
                    if (entry._timelineType === 'carelog') {
                      const typeLabel = entry.type.charAt(0).toUpperCase() + entry.type.slice(1);
                      const isCareEditing = editingCareId === entry._id;
                      return (
                        <div key={entry._id} className="bg-white rounded-lg shadow p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">{typeLabel}</span>
                            <div className="flex items-center gap-3">
                              {entry.createdBy?.email && (
                                <span className="text-xs text-gray-400">{entry.createdBy.email}</span>
                              )}
                              {!isCareEditing && (
                                <>
                                  {canEditCareLog(entry) && (
                                    <button
                                      onClick={() => { setEditingCareId(entry._id); setCareEditForm({ date: entry.date?.split('T')[0] || '', type: entry.type, value: entry.value || '', notes: entry.notes || '' }); }}
                                      className="text-xs text-blue-500 hover:text-blue-700"
                                    >Edit</button>
                                  )}
                                  {user && ['vet', 'admin'].includes(user.role) && (
                                    <button onClick={() => deleteCareLog(entry._id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          {isCareEditing ? (
                            <div className="mt-3 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Date *</label>
                                  <input type="date" required value={careEditForm.date} onChange={(e) => setCareEditForm((f) => ({ ...f, date: e.target.value }))} className={inputCls} />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Type *</label>
                                  <select value={careEditForm.type} onChange={(e) => setCareEditForm((f) => ({ ...f, type: e.target.value, value: '', notes: '' }))} className={inputCls}>
                                    <option value="feeding">Feeding</option>
                                    <option value="weight">Weight</option>
                                    <option value="observation">Observation</option>
                                  </select>
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-xs font-medium text-gray-500 mb-1">{careEditForm.type === 'weight' ? 'Value *' : 'Notes *'}</label>
                                  {careEditForm.type === 'weight' ? (
                                    <input required value={careEditForm.value} onChange={(e) => setCareEditForm((f) => ({ ...f, value: e.target.value }))} className={inputCls} />
                                  ) : (
                                    <textarea required rows={2} value={careEditForm.notes} onChange={(e) => setCareEditForm((f) => ({ ...f, notes: e.target.value }))} className={inputCls} />
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => saveCareLog(entry._id)} className="bg-green-700 text-white px-3 py-1.5 rounded-md text-sm hover:bg-green-800">Save</button>
                                <button onClick={() => setEditingCareId(null)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {entry.value && <p className="text-sm font-medium text-gray-900 mt-2">{entry.value}</p>}
                              {entry.notes && <p className="text-sm text-gray-500 mt-0.5">{entry.notes}</p>}
                            </>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
