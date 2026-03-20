import { useState, useCallback, useEffect } from 'react';

export function Toast({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-md shadow-lg text-sm flex items-center gap-3">
      <span>{message}</span>
      <button onClick={onDismiss} className="text-white hover:text-red-200 font-bold">×</button>
    </div>
  );
}

export function useToast() {
  const [message, setMessage] = useState('');
  const showToast = useCallback((msg) => setMessage(msg), []);
  const dismissToast = useCallback(() => setMessage(''), []);
  return { message, showToast, dismissToast };
}
