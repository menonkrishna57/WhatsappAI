import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ isOpen, setIsOpen }) {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Customers', path: '/customers', icon: '👥' },
    { name: 'Campaigns', path: '/campaigns', icon: '📢' },
    { name: 'Analytics', path: '/analytics', icon: '📈' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col h-full shrink-0
      transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500 shadow-sm flex items-center justify-center text-white font-bold text-lg">
            W
          </div>
          <span className="font-extrabold text-xl tracking-tight text-emerald-900">WhatsappAI</span>
        </div>
        <button 
          className="lg:hidden text-gray-500 hover:text-gray-800"
          onClick={() => setIsOpen(false)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setIsOpen && setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-green-50 text-green-700 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
            US
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">User Setup</div>
            <div className="text-xs text-gray-500">Premium Plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
