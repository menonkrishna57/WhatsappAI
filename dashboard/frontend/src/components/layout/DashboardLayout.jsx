import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const getTitle = (path) => {
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/customers': return 'Customers';
      case '/campaigns': return 'Campaigns';
      case '/analytics': return 'Analytics';
      case '/settings': return 'Settings';
      default: return 'WhatsappAI';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50/50 font-sans text-gray-900 overflow-hidden selection:bg-green-100 selection:text-green-900">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full lg:w-auto">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-green-500/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none"></div>
        
        <Header 
          title={getTitle(location.pathname)} 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
