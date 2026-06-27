import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import PromptRunner from './components/PromptRunner';
import HistoryTable from './components/HistoryTable';
import Dashboard from './components/Dashboard';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900 selection:bg-neutral-200 selection:text-neutral-950">
        {/* Navigation bar */}
        <Navigation onOpenSettings={() => setIsSettingsOpen(true)} />

        {/* Main Content Area */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 pb-24 md:pb-8">
          <Routes>
            <Route path="/" element={<Navigate to="/run" replace />} />
            <Route path="/run" element={<PromptRunner onOpenSettings={() => setIsSettingsOpen(true)} />} />
            <Route path="/history" element={<HistoryTable />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/run" replace />} />
          </Routes>
        </main>

        {/* Global Settings Modal */}
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      </div>
    </BrowserRouter>
  );
}
