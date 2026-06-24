import React from 'react';

export default function DashboardPage() {
  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Good morning! 👋</h2>
          <p className="text-gray-500">Here's what's happening with your business today.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-6">
        {/* Placeholder for Stats Cards */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-center h-32 text-gray-400">
          Stat Card Placeholder
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-center h-32 text-gray-400">
          Stat Card Placeholder
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-center h-32 text-gray-400">
          Stat Card Placeholder
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-center h-32 text-gray-400">
          Stat Card Placeholder
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center text-gray-400">
        Main Dashboard Content Placeholder
      </div>
    </div>
  );
}
