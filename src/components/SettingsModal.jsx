import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Key, RefreshCw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export default function SettingsModal({ isOpen, onClose, onSave }) {
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempUrl, setTempUrl] = useState('');
  const [tempAnonKey, setTempAnonKey] = useState('');

  // Test states
  const [testStatusSupabase, setTestStatusSupabase] = useState('idle');
  const [testErrorSupabase, setTestErrorSupabase] = useState('');
  const [testStatusOR, setTestStatusOR] = useState('idle');
  const [testErrorOR, setTestErrorOR] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTempApiKey(localStorage.getItem('openrouter_api_key') || '');
      setTempUrl(localStorage.getItem('supabase_url') || '');
      setTempAnonKey(localStorage.getItem('supabase_anon_key') || '');
      
      setTestStatusSupabase('idle');
      setTestErrorSupabase('');
      setTestStatusOR('idle');
      setTestErrorOR('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('openrouter_api_key', tempApiKey.trim());
    localStorage.setItem('supabase_url', tempUrl.trim());
    localStorage.setItem('supabase_anon_key', tempAnonKey.trim());
    
    window.dispatchEvent(new Event('config-updated'));
    if (onSave) onSave();
    onClose();
  };

  const testSupabaseConnection = async () => {
    if (!tempUrl || !tempAnonKey) {
      setTestStatusSupabase('error');
      setTestErrorSupabase('Please enter both Supabase URL and Anon Key');
      return;
    }
    
    setTestStatusSupabase('testing');
    setTestErrorSupabase('');
    
    try {
      const client = createClient(tempUrl.trim(), tempAnonKey.trim());
      const { data, error: dbErr } = await client.from('prompt_runs').select('id').limit(1);
      if (dbErr) throw dbErr;
      setTestStatusSupabase('success');
    } catch (err) {
      setTestStatusSupabase('error');
      setTestErrorSupabase(err.message || 'Failed to connect to Supabase');
    }
  };

  const testOpenRouterConnection = async () => {
    if (!tempApiKey) {
      setTestStatusOR('error');
      setTestErrorOR('Please enter OpenRouter API Key');
      return;
    }

    setTestStatusOR('testing');
    setTestErrorOR('');

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempApiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: 'Say hello!' }],
          max_tokens: 5
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error.message || 'API error');
      
      setTestStatusOR('success');
    } catch (err) {
      setTestStatusOR('error');
      setTestErrorOR(err.message || 'Failed to connect to OpenRouter');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Key className="h-4.5 w-4.5 text-neutral-900" />
            <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider">API Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 p-6">
          <p className="text-xs text-neutral-500 leading-relaxed">
            Configure your local API credentials. All configuration is stored locally in your browser's <code className="rounded bg-neutral-100 px-1 py-0.5 text-neutral-800 font-mono text-[10px]">localStorage</code> and never sent to any external server.
          </p>

          {/* OpenRouter Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">OpenRouter Key</label>
              <button
                type="button"
                onClick={testOpenRouterConnection}
                disabled={testStatusOR === 'testing'}
                className="flex items-center gap-1 text-[10px] font-bold text-neutral-900 hover:underline transition-all"
              >
                {testStatusOR === 'testing' ? (
                  <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                ) : null}
                Test key
              </button>
            </div>
            
            <div className="relative">
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 placeholder-neutral-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-mono"
              />
            </div>

            {testStatusOR === 'success' && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-800 bg-neutral-50 border border-neutral-350 px-2.5 py-1 rounded">
                <CheckCircle className="h-3.5 w-3.5 text-neutral-900" />
                <span>OpenRouter API Key works perfectly.</span>
              </div>
            )}
            {testStatusOR === 'error' && (
              <div className="flex items-start gap-1.5 text-[10px] text-neutral-500 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>{testErrorOR}</span>
              </div>
            )}
          </div>

          {/* Supabase Section */}
          <div className="space-y-3 border-t border-neutral-100 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Supabase DB</label>
              <button
                type="button"
                onClick={testSupabaseConnection}
                disabled={testStatusSupabase === 'testing'}
                className="flex items-center gap-1 text-[10px] font-bold text-neutral-900 hover:underline transition-all"
              >
                {testStatusSupabase === 'testing' ? (
                  <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                ) : null}
                Test DB
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <span className="block text-[10px] text-neutral-400 mb-1">Supabase URL</span>
                <input
                  type="text"
                  placeholder="https://xyz.supabase.co"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.8 text-xs text-neutral-900 placeholder-neutral-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                />
              </div>

              <div>
                <span className="block text-[10px] text-neutral-400 mb-1">Anon Public Key</span>
                <input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={tempAnonKey}
                  onChange={(e) => setTempAnonKey(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.8 text-xs text-neutral-900 placeholder-neutral-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-mono"
                />
              </div>
            </div>

            {testStatusSupabase === 'success' && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-800 bg-neutral-50 border border-neutral-350 px-2.5 py-1 rounded">
                <CheckCircle className="h-3.5 w-3.5 text-neutral-900" />
                <span>Supabase connection & table verified successfully.</span>
              </div>
            )}
            {testStatusSupabase === 'error' && (
              <div className="flex items-start gap-1.5 text-[10px] text-neutral-500 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>{testErrorSupabase}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 bg-neutral-50/50 px-6 py-3.5">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-colors shadow-sm"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
