import React from 'react';

export default function AnalyticsPage() {
  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-yellow-200">
          Mock Data
        </span>
      </div>
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center text-gray-400">
        Analytics UI Placeholder
      </div>
    </div>
  );
}
