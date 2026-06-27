import React from 'react';
import { NavLink } from 'react-router-dom';
import { Settings, Activity, History, Play } from 'lucide-react';

export default function Navigation({ onOpenSettings }) {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
      isActive
        ? 'bg-black text-white'
        : 'text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-black text-white shadow-sm">
            <Activity className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-neutral-900 uppercase">
              PromptTrack AI
            </h1>
            <p className="text-[9px] text-neutral-400 font-bold tracking-wider uppercase">
              Brand Analytics Platform
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/run" className={linkClass}>
            <Play className="h-4 w-4" />
            Prompt Runner
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            <History className="h-4 w-4" />
            History Log
          </NavLink>
          <NavLink to="/dashboard" className={linkClass}>
            <Activity className="h-4 w-4" />
            Analytics Dashboard
          </NavLink>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-neutral-800 hover:text-black bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 transition-all duration-200 text-sm shadow-sm"
          >
            <Settings className="h-4 w-4 animate-spin-slow" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation (Shown at bottom on small screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t border-neutral-200 backdrop-blur-lg px-4 py-2 shadow-lg">
        <div className="flex items-center justify-around">
          <NavLink to="/run" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 text-xs transition-colors ${isActive ? 'text-black font-bold' : 'text-neutral-400'}`}>
            <Play className="h-5 w-5" />
            <span>Runner</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 text-xs transition-colors ${isActive ? 'text-black font-bold' : 'text-neutral-400'}`}>
            <History className="h-5 w-5" />
            <span>History</span>
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 text-xs transition-colors ${isActive ? 'text-black font-bold' : 'text-neutral-400'}`}>
            <Activity className="h-5 w-5" />
            <span>Analytics</span>
          </NavLink>
        </div>
      </div>
    </header>
  );
}
