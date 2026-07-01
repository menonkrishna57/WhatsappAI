import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Megaphone, BarChart3, Settings } from 'lucide-react';
import { useAuth } from '../../AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', Icon: LayoutDashboard },
  { name: 'Customers', path: '/customers', Icon: Users },
  { name: 'Catalog', path: '/catalog', Icon: Package },
  { name: 'Campaigns', path: '/campaigns', Icon: Megaphone },
  { name: 'Analytics', path: '/analytics', Icon: BarChart3 },
  { name: 'Settings', path: '/settings', Icon: Settings },
];

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Sidebar() {
  const { user } = useAuth();
  const businessName = user?.user_metadata?.business_name || user?.email?.split('@')[0] || 'Your Business';

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col h-full shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-600 shadow-sm flex items-center justify-center text-white font-bold text-lg">
          W
        </div>
        <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-gray-100">WhatsappAI</span>
      </div>
      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map(({ name, path, Icon }) => (
          <NavLink
            key={name}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              }`
            }
          >
            <Icon size={20} strokeWidth={2} />
            {name}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold shrink-0">
            {initials(businessName)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{businessName}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
