export const STATUS_COLORS = {
  'in-center': 'bg-blue-100 text-blue-800',
  released: 'bg-teal-100 text-teal-800',
  deceased: 'bg-gray-100 text-gray-600',
};

export const STATUS_LABELS = {
  'in-center': 'In the center',
  released: 'Released',
  deceased: 'Deceased',
};

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString(undefined, { timeZone: 'UTC' });
}

function bool(val) {
  return val ? '✓' : '—';
}

export const COLUMNS = [
  // Animal characteristics
  { id: 'givenName',           label: 'Given name',        group: 'Animal characteristics', render: a => <span className="font-medium text-gray-900">{a.givenName || '—'}</span> },
  { id: 'commonName',          label: 'Common name',       group: 'Animal characteristics', render: a => a.commonName || '—' },
  { id: 'scientificName',      label: 'Scientific name',   group: 'Animal characteristics', render: a => a.scientificName || '—' },
  { id: 'animalGroup',         label: 'Group',             group: 'Animal characteristics', render: a => a.animalGroup || '—' },
  { id: 'sex',                 label: 'Sex',               group: 'Animal characteristics', render: a => a.sex || '—' },
  { id: 'estimatedDateOfBirth',label: 'Date of birth',     group: 'Animal characteristics', render: a => formatDate(a.estimatedDateOfBirth) },
  { id: 'ageAtAdmission',      label: 'Age at admission',  group: 'Animal characteristics', render: a => a.ageAtAdmission || '—' },
  { id: 'microchipNumber',     label: 'Microchip',         group: 'Animal characteristics', render: a => a.microchipNumber || '—' },
  { id: 'placement',           label: 'Placement',         group: 'Animal characteristics', render: a => a.placement || '—' },
  { id: 'otherDetails',        label: 'Other details',     group: 'Animal characteristics', render: a => a.otherDetails || '—' },

  // Rescue details
  { id: 'incomeReasons',       label: 'Income reason(s)',  group: 'Rescue details', render: a => a.incomeReasons || '—' },
  { id: 'rescueDate',          label: 'Rescue date',       group: 'Rescue details', render: a => formatDate(a.rescueDate) },
  { id: 'whereFound',          label: 'Where found',       group: 'Rescue details', render: a => a.whereFound || '—' },
  { id: 'distanceFromCenter',  label: 'Km from center',    group: 'Rescue details', render: a => a.distanceFromCenter != null ? a.distanceFromCenter : '—' },
  { id: 'latitude',            label: 'Latitude',          group: 'Rescue details', render: a => a.latitude != null ? a.latitude : '—' },
  { id: 'longitude',           label: 'Longitude',         group: 'Rescue details', render: a => a.longitude != null ? a.longitude : '—' },
  { id: 'captureNeeded',       label: 'Capture needed',    group: 'Rescue details', render: a => bool(a.captureNeeded) },
  { id: 'whoBrought',          label: 'Who brought',       group: 'Rescue details', render: a => a.whoBrought || '—' },
  { id: 'whoCalled',           label: 'Who called',        group: 'Rescue details', render: a => a.whoCalled || '—' },
  { id: 'callDetails',         label: 'Call details',      group: 'Rescue details', render: a => a.callDetails || '—' },
  { id: 'otherRescueDetails',  label: 'Other rescue details', group: 'Rescue details', render: a => a.otherRescueDetails || '—' },

  // Clinical
  { id: 'arrivalWeight',       label: 'Arrival weight',    group: 'Clinical', render: a => a.arrivalWeight != null ? `${a.arrivalWeight} g` : '—' },
  { id: 'currentWeight',       label: 'Current weight',    group: 'Clinical', render: a => a.currentWeight || '—' },
  { id: 'hadTreatment',        label: 'Had treatment',     group: 'Clinical', render: a => bool(a.hadTreatment) },
  { id: 'underVigilance',      label: 'Under vigilance',   group: 'Clinical', render: a => bool(a.underVigilance) },
  { id: 'inClinic',            label: 'In clinic',         group: 'Clinical', render: a => bool(a.inClinic) },
  { id: 'firstExamination',    label: 'First examination', group: 'Clinical', render: a => a.firstExamination || '—' },
  { id: 'clinicalEvolution',   label: 'Clinical evolution',group: 'Clinical', render: a => a.clinicalEvolution || '—' },
  { id: 'necropsyDetails',     label: 'Necropsy details',  group: 'Clinical', render: a => a.necropsyDetails || '—' },

  // Status & Time
  {
    id: 'status',
    label: 'Status',
    group: 'Status & Time',
    render: a => (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
        {STATUS_LABELS[a.status] ?? a.status}
      </span>
    ),
  },
  { id: 'intakeDate',          label: 'Intake date',       group: 'Status & Time', render: a => formatDate(a.intakeDate) },
  {
    id: 'daysInCenter',
    label: 'Days in center',
    group: 'Status & Time',
    render: a => a.intakeDate ? Math.floor((Date.now() - new Date(a.intakeDate)) / 86400000) : '—',
  },
];

export const COLUMN_GROUPS = [
  'Animal characteristics',
  'Rescue details',
  'Clinical',
  'Status & Time',
];

export const DEFAULT_COLUMN_IDS = [
  'givenName',
  'commonName',
  'intakeDate',
  'status',
  'whereFound',
  'underVigilance',
  'daysInCenter',
  'currentWeight',
];
