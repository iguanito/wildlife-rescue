import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/animals', label: 'Animals' },
];

export default function Layout({ children }) {
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
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
