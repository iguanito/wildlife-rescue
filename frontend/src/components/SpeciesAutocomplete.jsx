import { useState, useEffect, useRef } from 'react';

const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

export default function SpeciesAutocomplete({ label, field, value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (value.length < 2) { setSuggestions([]); setOpen(false); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const res = await fetch(`/api/species?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    }, 250);
    return () => clearTimeout(debounce.current);
  }, [value]);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(species) {
    onSelect(species);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        className={inputCls}
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto text-sm">
          {suggestions.map((s) => (
            <li
              key={s._id}
              onMouseDown={() => handleSelect(s)}
              className="px-3 py-2 cursor-pointer hover:bg-green-50 flex justify-between items-baseline gap-2"
            >
              <span className="font-medium text-gray-900">{s.commonName}</span>
              <span className="text-gray-400 text-xs italic truncate">{s.scientificName}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                s.group === 'Bird' ? 'bg-sky-100 text-sky-700' :
                s.group === 'Mammal' ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>{s.group}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
