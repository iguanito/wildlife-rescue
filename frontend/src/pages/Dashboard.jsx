import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  'in-center': 'In the center',
  'released': 'Released',
  'deceased': 'Deceased',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [followUps, setFollowUps] = useState([]);
  const [statusCounts, setStatusCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingIds, setRemovingIds] = useState(new Set());

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/today').then(r => r.json()),
      fetch('/api/dashboard/status').then(r => r.json()),
    ])
      .then(([tasks, counts]) => {
        setFollowUps(tasks);
        setStatusCounts(counts);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkDone = async (medicalRecordId) => {
    setRemovingIds(prev => new Set([...prev, medicalRecordId]));
    try {
      await fetch(`/api/medical/${medicalRecordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpCompleted: true }),
      });
      setTimeout(() => {
        setFollowUps(prev => prev.filter(f => f._id !== medicalRecordId));
        setRemovingIds(prev => {
          const next = new Set(prev);
          next.delete(medicalRecordId);
          return next;
        });
      }, 300);
    } catch (err) {
      setError(err.message);
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(medicalRecordId);
        return next;
      });
    }
  };

  if (loading) return <p className="text-gray-500 p-8">Loading...</p>;

  return (
    <div className="flex gap-8">
      {/* Main panel — today's follow-ups (D-B1) */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Follow-ups Due Today</h3>
          </div>

          {followUps.length === 0 ? (
            /* Empty state always shown — never hidden (per D-B2) */
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No follow-ups due today</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Species</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Follow-up Date</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {followUps.map(task => (
                  <tr
                    key={task._id}
                    className={`transition-all duration-300 ${
                      removingIds.has(task._id)
                        ? 'opacity-0 scale-95'
                        : 'opacity-100 scale-100'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      {/* D-C2: animal name links to detail page (DASH-03) */}
                      <Link
                        to={`/animals/${task.animalData._id}`}
                        className="text-green-700 hover:underline"
                      >
                        {task.animalData.givenName || '(unnamed)'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {task.animalData.commonName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(task.followUpDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {/* D-C3: always visible inline; hidden for volunteers (per D-A3 + Phase 1 D-11) */}
                      {user && ['staff', 'vet', 'admin'].includes(user.role) && (
                        <button
                          onClick={() => handleMarkDone(task._id)}
                          disabled={removingIds.has(task._id)}
                          className="text-sm font-medium text-green-700 hover:text-green-900 disabled:opacity-50 transition-colors"
                        >
                          Mark as done
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Sidebar — status counts widget (D-B1, D-D1–D-D4) */}
      <aside className="w-64 shrink-0">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Animals by Status</h3>
          <div className="space-y-2">
            {statusCounts.map(({ status, count }) => (
              /* D-D4: clicking navigates to /animals?status=<value> */
              <Link
                key={status}
                to={`/animals?status=${status}`}
                className="flex items-center justify-between p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700">{STATUS_LABELS[status]}</span>
                <span className="text-lg font-bold text-green-700">{count}</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
