import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function AnimalCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    species: '',
    intakeDate: new Date().toISOString().split('T')[0],
    status: 'intake',
    notes: '',
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      navigate(`/animals/${data._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/animals" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Animals
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Add Animal</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <Field label="Name" required>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className={inputCls}
          />
        </Field>

        <Field label="Species" required>
          <input
            name="species"
            value={form.species}
            onChange={handleChange}
            required
            className={inputCls}
          />
        </Field>

        <Field label="Intake Date" required>
          <input
            type="date"
            name="intakeDate"
            value={form.intakeDate}
            onChange={handleChange}
            required
            className={inputCls}
          />
        </Field>

        <Field label="Status">
          <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
            <option value="intake">Intake</option>
            <option value="treatment">Treatment</option>
            <option value="ready-for-adoption">Ready for Adoption</option>
            <option value="released">Released</option>

            <option value="deceased">Deceased</option>
          </select>
        </Field>

        <Field label="Notes">
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className={inputCls}
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Animal'}
          </button>
          <Link
            to="/animals"
            className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
