// Admin panel layout with sidebar navigation
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { to: '/admin/users', label: '👥 Users' },
  { to: '/admin/orders', label: '📦 Orders' },
  { to: '/admin/disputes', label: '⚠️ Disputes' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-52 bg-gray-900 text-gray-300 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <span className="text-primary-400 font-bold text-lg">Kaya Admin</span>
          <p className="text-xs text-gray-500 mt-0.5">{user?.name}</p>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `block px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-gray-800 text-white' : 'hover:bg-gray-800 hover:text-white'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700 space-y-2">
          <a href="/" className="block text-xs text-gray-400 hover:text-white">← Back to site</a>
          <button onClick={() => { logout(); navigate('/'); }} className="text-xs text-red-400 hover:text-red-300">Log out</button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
