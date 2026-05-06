import { useState } from 'react';
import { DEFAULT_COLUMN_IDS } from '../config/animalColumns.jsx';

const LS_KEY = 'animalListColumns';

function readFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_COLUMN_IDS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_COLUMN_IDS;
  } catch {
    return DEFAULT_COLUMN_IDS;
  }
}

export default function useColumnConfig() {
  const [visibleIds, setVisibleIds] = useState(readFromStorage);

  function update(ids) {
    setVisibleIds(ids);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(ids));
    } catch {
      // localStorage unavailable (e.g. private browsing) — silent no-op
    }
  }

  return [visibleIds, update];
}
