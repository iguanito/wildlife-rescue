import { COLUMNS, COLUMN_GROUPS, DEFAULT_COLUMN_IDS } from '../config/animalColumns.jsx';

export default function ColumnPickerModal({ visibleIds, onChange, onClose }) {
  function toggle(id) {
    if (visibleIds.includes(id)) {
      if (visibleIds.length === 1) return; // keep at least one column visible
      onChange(visibleIds.filter(v => v !== id));
    } else {
      onChange([...visibleIds, id]);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Customize columns</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onChange(DEFAULT_COLUMN_IDS)}
              className="text-xs text-gray-500 underline hover:text-gray-700"
            >
              Reset to default
            </button>
            <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
          </div>
        </div>

        <div className="px-4 py-3 max-h-96 overflow-y-auto flex flex-col gap-4">
          {COLUMN_GROUPS.map(group => {
            const cols = COLUMNS.filter(c => c.group === group);
            return (
              <div key={group}>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{group}</div>
                <div className="grid grid-cols-3 gap-y-1.5 gap-x-2">
                  {cols.map(col => (
                    <label key={col.id} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleIds.includes(col.id)}
                        onChange={() => toggle(col.id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-green-800 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
