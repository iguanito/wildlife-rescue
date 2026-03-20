import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SpeciesAutocomplete from '../components/SpeciesAutocomplete';
import MapPicker from '../components/MapPicker';

const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

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

const STEPS = [
  { n: 1, label: 'Animal Info' },
  { n: 2, label: 'Rescue Info' },
  { n: 3, label: 'Clinical Info' },
  { n: 4, label: 'Status' },
];

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
  otherDetails: '',
  // Page 2
  incomeReasons: '',
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
  // Page 3
  status: 'in-center',
  arrivalWeight: '',
  hadTreatment: false,
  underVigilance: false,
  inClinic: false,
  firstExamination: '',
  clinicalEvolution: '',
  necropsyDetails: '',
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
        {STEPS.map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              n === step ? 'bg-green-700 text-white' : n < step ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'
            }`}>
              {n}
            </div>
            <span className={`text-sm ${n === step ? 'font-medium text-gray-900' : 'text-gray-400'}`}>{label}</span>
            {n < 4 && <span className="text-gray-300 mx-1">→</span>}
          </div>
        ))}
      </div>

      {/* Page 1 — Animal Info */}
      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="bg-white rounded-lg shadow p-6 space-y-6">
          <section>
            <SectionTitle>Identity</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Given Name" half>
                <input name="givenName" value={form.givenName} onChange={handleChange} className={inputCls} />
              </Field>
              {form.animalGroup && (
                <div className="flex items-end pb-0.5">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    form.animalGroup === 'Bird' ? 'bg-sky-100 text-sky-700' :
                    form.animalGroup === 'Mammal' ? 'bg-amber-100 text-amber-700' :
                    form.animalGroup === 'Amphibian' ? 'bg-teal-100 text-teal-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>{form.animalGroup}</span>
                </div>
              )}
              <div className="col-span-2">
                <SpeciesAutocomplete
                  label="Search by common or scientific name"
                  field="commonName"
                  value={form.commonName || form.scientificName}
                  onChange={(_, val) => setForm((f) => ({ ...f, commonName: val, scientificName: '' }))}
                  onSelect={(s) => setForm((f) => ({ ...f, commonName: s.commonName, scientificName: s.scientificName, animalGroup: s.group }))}
                />
              </div>
              {form.commonName && (
                <div className="col-span-2 grid grid-cols-2 gap-3 bg-gray-50 rounded-md px-3 py-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Common Name</p>
                    <p className="text-gray-900">{form.commonName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Scientific Name</p>
                    <p className="text-gray-900 italic">{form.scientificName}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

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

          <section>
            <SectionTitle>Other Details</SectionTitle>
            <textarea name="otherDetails" value={form.otherDetails} onChange={handleChange} rows={4} className={inputCls} />
          </section>

          <div className="flex gap-3 pt-2 items-center">
            <button type="submit" className="bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800">
              Next: Rescue Info →
            </button>
            <Link to="/animals" className="ml-auto px-5 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</Link>
          </div>
        </form>
      )}

      {/* Page 2 — Rescue Info */}
      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="bg-white rounded-lg shadow p-6 space-y-6">
          <section>
            <SectionTitle>Income Reason(s)</SectionTitle>
            <textarea name="incomeReasons" value={form.incomeReasons} onChange={handleChange} rows={3} className={inputCls} />
          </section>

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
              <div className="col-span-2">
                <MapPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onSelect={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
                />
              </div>
              <div className="col-span-2 flex items-center gap-2 mt-1">
                <input type="checkbox" id="captureNeeded" name="captureNeeded" checked={form.captureNeeded} onChange={handleChange} className="w-4 h-4 accent-green-700 cursor-pointer" />
                <label htmlFor="captureNeeded" className="text-sm text-gray-700 cursor-pointer">Capture was needed</label>
              </div>
            </div>
          </section>

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

          <section>
            <SectionTitle>Other Rescue Details</SectionTitle>
            <textarea name="otherRescueDetails" value={form.otherRescueDetails} onChange={handleChange} rows={4} className={inputCls} />
          </section>

          <div className="flex gap-3 pt-2 items-center">
            <button type="button" onClick={() => setStep(1)} className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">← Back</button>
            <button type="submit" className="bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800">
              Next: Clinical Info →
            </button>
            <Link to="/animals" className="ml-auto px-5 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</Link>
          </div>
        </form>
      )}

      {/* Page 3 — Clinical Info */}
      {step === 3 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(4); }} className="bg-white rounded-lg shadow p-6 space-y-6">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <section>
            <SectionTitle>Measurements</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Arrival Weight (g)" half>
                <input type="number" min="0" step="0.1" name="arrivalWeight" value={form.arrivalWeight} onChange={handleChange} className={inputCls} />
              </Field>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              {[
                { name: 'hadTreatment', label: 'Had treatment' },
                { name: 'underVigilance', label: 'Under vigilance' },
                { name: 'inClinic', label: 'In clinic' },
              ].map(({ name, label }) => (
                <label key={name} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name={name} checked={form[name]} onChange={handleChange} className="w-4 h-4 accent-green-700" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle>Clinical Notes</SectionTitle>
            <div className="space-y-4">
              <Field label="First Clinical Examination / Injuries">
                <textarea name="firstExamination" value={form.firstExamination} onChange={handleChange} rows={4} className={inputCls} />
              </Field>
              <Field label="Clinical Evolution">
                <textarea name="clinicalEvolution" value={form.clinicalEvolution} onChange={handleChange} rows={4} className={inputCls} />
              </Field>
              <Field label="Necropsy Details">
                <textarea name="necropsyDetails" value={form.necropsyDetails} onChange={handleChange} rows={4} className={inputCls} />
              </Field>
            </div>
          </section>

          <div className="flex gap-3 pt-2 items-center">
            <button type="button" onClick={() => setStep(2)} className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">← Back</button>
            <button type="submit" className="bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800">
              Next: Status →
            </button>
            <Link to="/animals" className="ml-auto px-5 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</Link>
          </div>
        </form>
      )}

      {/* Page 4 — Status */}
      {step === 4 && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <section>
            <SectionTitle>Status</SectionTitle>
            <Field label="Status">
              <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
                <option value="in-center">In the center</option>
                <option value="released">Released</option>
                <option value="deceased">Deceased</option>
              </select>
            </Field>
          </section>

          <div className="flex gap-3 pt-2 items-center">
            <button type="button" onClick={() => setStep(3)} className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">← Back</button>
            <button type="submit" disabled={saving} className="bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Animal'}
            </button>
            <Link to="/animals" className="ml-auto px-5 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</Link>
          </div>
        </form>
      )}
    </div>
  );
}
