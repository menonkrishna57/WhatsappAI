import React from 'react';
import { useAuth } from '../../AuthContext';

export default function Header({ title }) {
  const { signOut } = useAuth();

  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
      <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
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
