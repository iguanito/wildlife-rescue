import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

const INCOME_REASONS = [
  'Injured', 'Orphaned', 'Sick', 'Entangled', 'Oiled',
  'Exhausted', 'Hit by vehicle', 'Window strike', 'Found abandoned', 'Other',
];

function Field({ label, required, children, half }) {
  return (
    <div className={half ? '' : 'col-span-2'}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{children}</h3>;
}

const EMPTY_FORM = {
  // Page 1
  givenName: '',
  commonName: '',
  scientificName: '',
  animalGroup: '',
  estimatedDateOfBirth: '',
  ageAtAdmission: '',
  sex: 'unknown',
  microchipNumber: '',
  placement: '',
  intakeDate: new Date().toISOString().split('T')[0],
  status: 'intake',
  otherDetails: '',
  // Page 2
  incomeReasons: [],
  rescueDate: '',
  whereFound: '',
  distanceFromCenter: '',
  latitude: '',
  longitude: '',
  captureNeeded: false,
  whoBrought: '',
  whoCalled: '',
  callDetails: '',
  otherRescueDetails: '',
};

export default function AnimalCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  function toggleReason(reason) {
    setForm((f) => ({
      ...f,
      incomeReasons: f.incomeReasons.includes(reason)
        ? f.incomeReasons.filter((r) => r !== reason)
        : [...f.incomeReasons, reason],
    }));
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
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/animals" className="text-gray-400 hover:text-gray-600 text-sm">← Animals</Link>
        <h2 className="text-2xl font-bold text-gray-900">Add Animal</h2>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              s === step ? 'bg-green-700 text-white' : s < step ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'
            }`}>
              {s}
            </div>
            <span className={`text-sm ${s === step ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
              {s === 1 ? 'Animal Info' : 'Rescue Info'}
            </span>
            {s < 2 && <span className="text-gray-300 mx-1">→</span>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Identity */}
          <section>
            <SectionTitle>Identity</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Given Name" half>
                <input name="givenName" value={form.givenName} onChange={handleChange} className={inputCls} />
              </Field>
              <Field label="Common Name" half>
                <input name="commonName" value={form.commonName} onChange={handleChange} className={inputCls} />
              </Field>
              <Field label="Scientific Name" half>
                <input name="scientificName" value={form.scientificName} onChange={handleChange} className={inputCls} />
              </Field>
              <Field label="Animal Group" half>
                <input name="animalGroup" value={form.animalGroup} onChange={handleChange} placeholder="e.g. Raptor, Mammal…" className={inputCls} />
              </Field>
            </div>
          </section>

          {/* Biology */}
          <section>
            <SectionTitle>Biology</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Estimated Date of Birth" half>
                <input type="date" name="estimatedDateOfBirth" value={form.estimatedDateOfBirth} onChange={handleChange} className={inputCls} />
              </Field>
              <Field label="Age at Admission" half>
                <input name="ageAtAdmission" value={form.ageAtAdmission} onChange={handleChange} placeholder="e.g. 3 weeks, ~2 years" className={inputCls} />
              </Field>
              <Field label="Sex" half>
                <select name="sex" value={form.sex} onChange={handleChange} className={inputCls}>
                  <option value="unknown">Unknown</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </Field>
              <Field label="Microchip Number" half>
                <input name="microchipNumber" value={form.microchipNumber} onChange={handleChange} className={inputCls} />
              </Field>
            </div>
          </section>

          {/* Admission */}
          <section>
            <SectionTitle>Admission</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Intake Date" required half>
                <input type="date" name="intakeDate" value={form.intakeDate} onChange={handleChange} required className={inputCls} />
              </Field>
              <Field label="Status" half>
                <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
                  <option value="intake">Intake</option>
                  <option value="treatment">Treatment</option>
                  <option value="ready-for-adoption">Ready for Adoption</option>
                  <option value="released">Released</option>
                  <option value="deceased">Deceased</option>
                </select>
              </Field>
              <Field label="Placement in Center">
                <input name="placement" value={form.placement} onChange={handleChange} placeholder="e.g. Enclosure B, Aviary 3" className={inputCls} />
              </Field>
            </div>
          </section>

          {/* Other */}
          <section>
            <SectionTitle>Other Details</SectionTitle>
            <textarea name="otherDetails" value={form.otherDetails} onChange={handleChange} rows={4} className={inputCls} />
          </section>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800">
              Next: Rescue Info →
            </button>
            <Link to="/animals" className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">
              Cancel
            </Link>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Income reasons */}
          <section>
            <SectionTitle>Income Reason(s)</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {INCOME_REASONS.map((reason) => (
                <label key={reason} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm cursor-pointer select-none transition-colors ${
                  form.incomeReasons.includes(reason)
                    ? 'bg-green-700 border-green-700 text-white'
                    : 'border-gray-300 text-gray-700 hover:border-green-400'
                }`}>
                  <input type="checkbox" className="sr-only" checked={form.incomeReasons.includes(reason)} onChange={() => toggleReason(reason)} />
                  {reason}
                </label>
              ))}
            </div>
          </section>

          {/* Find location */}
          <section>
            <SectionTitle>Where Found</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date Found" half>
                <input type="date" name="rescueDate" value={form.rescueDate} onChange={handleChange} className={inputCls} />
              </Field>
              <Field label="Distance from Center (km)" half>
                <input type="number" min="0" step="0.1" name="distanceFromCenter" value={form.distanceFromCenter} onChange={handleChange} className={inputCls} />
              </Field>
              <Field label="Location Description">
                <input name="whereFound" value={form.whereFound} onChange={handleChange} placeholder="Address, landmark, area…" className={inputCls} />
              </Field>
              <Field label="Latitude" half>
                <input type="number" step="any" name="latitude" value={form.latitude} onChange={handleChange} placeholder="e.g. 48.8566" className={inputCls} />
              </Field>
              <Field label="Longitude" half>
                <input type="number" step="any" name="longitude" value={form.longitude} onChange={handleChange} placeholder="e.g. 2.3522" className={inputCls} />
              </Field>
              <div className="col-span-2 flex items-center gap-2 mt-1">
                <input type="checkbox" id="captureNeeded" name="captureNeeded" checked={form.captureNeeded} onChange={handleChange} className="w-4 h-4 accent-green-700 cursor-pointer" />
                <label htmlFor="captureNeeded" className="text-sm text-gray-700 cursor-pointer">Capture was needed</label>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <SectionTitle>Contact</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Who Brought the Animal" half>
                <input name="whoBrought" value={form.whoBrought} onChange={handleChange} className={inputCls} />
              </Field>
              <Field label="Who Called the Center" half>
                <input name="whoCalled" value={form.whoCalled} onChange={handleChange} className={inputCls} />
              </Field>
              <Field label="Call Details">
                <textarea name="callDetails" value={form.callDetails} onChange={handleChange} rows={2} className={inputCls} />
              </Field>
            </div>
          </section>

          {/* Other rescue details */}
          <section>
            <SectionTitle>Other Rescue Details</SectionTitle>
            <textarea name="otherRescueDetails" value={form.otherRescueDetails} onChange={handleChange} rows={4} className={inputCls} />
          </section>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(1)} className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">
              ← Back
            </button>
            <button type="submit" disabled={saving} className="bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Animal'}
            </button>
            <Link to="/animals" className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
