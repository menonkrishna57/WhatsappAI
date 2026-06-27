import React from 'react';
import { useAuth } from '../../AuthContext';

export default function Header({ title, onMenuClick }) {
  const { signOut } = useAuth();

  return (
    <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button 
          className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          onClick={onMenuClick}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors hidden sm:block">
          🔔
        </button>
        <button 
          onClick={signOut}
          className="text-sm font-semibold text-gray-500 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
