import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-green-400/20 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px]" />

      {/* Navigation */}
      <nav className="absolute top-0 w-full z-20 px-6 py-6 flex items-center justify-between max-w-7xl mx-auto left-0 right-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500 shadow-sm flex items-center justify-center text-white font-bold text-lg">
            W
          </div>
          <span className="font-extrabold text-xl tracking-tight text-emerald-900">WhatsappAI</span>
        </div>
        <div>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 text-gray-900 hover:bg-white/60 font-bold rounded-xl transition-all"
          >
            Log In
          </button>
        </div>
      </nav>

      <div className="relative z-10 text-center space-y-8 max-w-3xl px-4 mt-16">
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight">
          Your AI Employee <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-700">
            on WhatsApp
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Automate customer support, bookings, follow-ups, and sales conversations. 24/7. On WhatsApp.
        </p>
        
        <div className="flex items-center justify-center gap-4 pt-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg shadow-green-500/30 transition-all hover:-translate-y-1"
          >
            Start Free Trial
          </button>
          <button className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-bold rounded-2xl shadow-sm border border-gray-200 transition-all hover:-translate-y-1">
            Book a Demo
          </button>
        </div>
      </div>
    </div>
  );
}
