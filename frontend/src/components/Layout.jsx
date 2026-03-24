import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/animals', label: 'Animals' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-green-800 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-green-700">
          <h1 className="text-lg font-bold leading-tight">Wildlife Rescue Center</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-green-600' : 'hover:bg-green-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className="px-4 py-4 border-t border-green-700">
            <p className="text-xs text-green-300 truncate mb-2">{user.email}</p>
            <p className="text-xs text-green-400 mb-3 capitalize">{user.role}</p>
            <button
              onClick={handleLogout}
              className="w-full text-left text-sm text-green-200 hover:text-white hover:bg-green-700 px-2 py-1 rounded transition-colors"
            >
              Log Out
            </button>
          </div>
        )}
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
