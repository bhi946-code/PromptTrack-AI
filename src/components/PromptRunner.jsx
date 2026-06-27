import React, { useState, useEffect } from 'react';
import { Play, Key, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { runPromptWithModel, GEMINI_MODEL, GPT_MODEL } from '../lib/openrouterClient';
import { getSupabaseClient } from '../lib/supabaseClient';
import ResponseCard from './ResponseCard';

export default function PromptRunner({ onOpenSettings }) {
  const [prompt, setPrompt] = useState('');
  const [keyword, setKeyword] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  
  // Model states
  const [geminiResult, setGeminiResult] = useState({ text: '', loading: false, error: null, metrics: {} });
  const [gptResult, setGptResult] = useState({ text: '', loading: false, error: null, metrics: {} });
  
  const [dbStatus, setDbStatus] = useState({ saved: false, error: null });

  const checkConfiguration = () => {
    const apiKey = localStorage.getItem('openrouter_api_key');
    const dbUrl = localStorage.getItem('supabase_url');
    const dbKey = localStorage.getItem('supabase_anon_key');
    setIsConfigured(!!(apiKey && dbUrl && dbKey));
  };

  useEffect(() => {
    checkConfiguration();
    // Listen for custom settings changes
    window.addEventListener('config-updated', checkConfiguration);
    return () => window.removeEventListener('config-updated', checkConfiguration);
  }, []);

  // Heuristic evaluators
  const evaluateMention = (text, kw) => {
    if (!text || !kw) return false;
    const cleanKw = kw.trim().toLowerCase();
    return text.toLowerCase().includes(cleanKw);
  };

  const evaluateCitation = (text, kw) => {
    if (!text || !kw) return false;
    const cleanKw = kw.trim().toLowerCase();
    const lowerText = text.toLowerCase();
    
    // Bracketed/parenthetical reference
    const bracketRegex = new RegExp(`[\\[\\(][^\\]\\)]*${cleanKw}[^\\]\\)]*[\\]\\)]`, 'i');
    if (bracketRegex.test(lowerText)) return true;
    
    // Preceding by source words
    const triggers = ['according to', 'source:', 'source ', 'cited', 'reference', 'attributed to', 'from '];
    for (const trigger of triggers) {
      const idx = lowerText.indexOf(trigger);
      if (idx !== -1) {
        if (lowerText.substring(idx, idx + 100).includes(cleanKw)) return true;
      }
    }
    
    // URL check
    const urlRegex = new RegExp(`https?:\\/\\/[^\\s]*${cleanKw}[^\\s]*`, 'i');
    if (urlRegex.test(lowerText)) return true;
    
    return false;
  };

  const evaluateSentiment = (text, kw) => {
    if (!text || !kw) return 'neutral';
    const cleanKw = kw.trim().toLowerCase();
    const lowerText = text.toLowerCase();
    const idx = lowerText.indexOf(cleanKw);
    if (idx === -1) return 'neutral';
    
    // Context window
    const start = Math.max(0, idx - 80);
    const end = Math.min(lowerText.length, idx + cleanKw.length + 80);
    const context = lowerText.substring(start, end);

    const positive = ['great', 'excellent', 'leader', 'innovative', 'innovation', 'best', 'positive', 'love', 'awesome', 'perfect', 'good', 'strong', 'reliable', 'superb', 'fast', 'helpful', 'efficient', 'recommend', 'satisfied', 'pleased', 'outstanding', 'top'];
    const negative = ['bad', 'poor', 'worst', 'fail', 'defect', 'flaw', 'slow', 'expensive', 'hate', 'issue', 'problem', 'bug', 'broken', 'weak', 'unreliable', 'complaint', 'criticize', 'criticism', 'disappointed', 'disappointing', 'difficult', 'hard'];

    let score = 0;
    positive.forEach(word => {
      const matches = context.match(new RegExp(`\\b${word}\\b`, 'g'));
      if (matches) score += matches.length;
    });
    negative.forEach(word => {
      const matches = context.match(new RegExp(`\\b${word}\\b`, 'g'));
      if (matches) score -= matches.length;
    });

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  };

  const extractHighlightSnippet = (text, kw) => {
    if (!text || !kw) return '';
    const cleanKw = kw.trim();
    const idx = text.toLowerCase().indexOf(cleanKw.toLowerCase());
    if (idx === -1) return '';
    const start = Math.max(0, idx - 60);
    const end = Math.min(text.length, idx + cleanKw.length + 60);
    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    return snippet;
  };

  const handleRun = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Reset results
    setGeminiResult({ text: '', loading: true, error: null, metrics: {} });
    setGptResult({ text: '', loading: true, error: null, metrics: {} });
    setDbStatus({ saved: false, error: null });

    const promptText = prompt.trim();
    const trackingKeyword = keyword.trim();

    // Call Model 1 (Gemini) and Model 2 (GPT) parallelly
    const geminiPromise = runPromptWithModel(promptText, GEMINI_MODEL)
      .then(async (resText) => {
        const metrics = {
          isMentioned: evaluateMention(resText, trackingKeyword),
          isCited: evaluateCitation(resText, trackingKeyword),
          sentiment: evaluateSentiment(resText, trackingKeyword),
          snippet: extractHighlightSnippet(resText, trackingKeyword)
        };
        setGeminiResult({ text: resText, loading: false, error: null, metrics });
        return { model: GEMINI_MODEL, text: resText, metrics };
      })
      .catch((err) => {
        setGeminiResult(prev => ({ ...prev, loading: false, error: err.message }));
        throw err;
      });

    const gptPromise = runPromptWithModel(promptText, GPT_MODEL)
      .then(async (resText) => {
        const metrics = {
          isMentioned: evaluateMention(resText, trackingKeyword),
          isCited: evaluateCitation(resText, trackingKeyword),
          sentiment: evaluateSentiment(resText, trackingKeyword),
          snippet: extractHighlightSnippet(resText, trackingKeyword)
        };
        setGptResult({ text: resText, loading: false, error: null, metrics });
        return { model: GPT_MODEL, text: resText, metrics };
      })
      .catch((err) => {
        setGptResult(prev => ({ ...prev, loading: false, error: err.message }));
        throw err;
      });

    // Wait for executions and persist success items to database
    try {
      const results = await Promise.allSettled([geminiPromise, gptPromise]);
      const successfulRuns = [];

      results.forEach((res) => {
        if (res.status === 'fulfilled') {
          successfulRuns.push(res.value);
        }
      });

      if (successfulRuns.length > 0) {
        const supabase = getSupabaseClient();
        if (!supabase) {
          throw new Error('Supabase client unavailable. Please verify connection credentials.');
        }

        const rowsToInsert = successfulRuns.map((run) => ({
          prompt_text: promptText,
          brand_keyword: trackingKeyword,
          model_name: run.model,
          raw_response: run.text,
          is_mentioned: trackingKeyword ? run.metrics.isMentioned : null,
          is_cited: trackingKeyword ? run.metrics.isCited : null,
          sentiment: trackingKeyword ? run.metrics.sentiment : null,
          highlight_snippet: trackingKeyword ? run.metrics.snippet : null
        }));

        const { error } = await supabase.from('prompt_runs').insert(rowsToInsert);
        if (error) throw error;
        setDbStatus({ saved: true, error: null });
      }
    } catch (dbErr) {
      console.error('Database write failed:', dbErr);
      setDbStatus({ saved: false, error: dbErr.message || 'Failed to save runs to database.' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Introduction banner */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-black tracking-tight text-neutral-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-neutral-900" />
          Twin Prompt Runner
        </h2>
        <p className="text-sm text-neutral-500 max-w-2xl leading-relaxed">
          Execute prompts across Gemini and GPT-4o Mini simultaneously. Configure a brand keyword to scan, verify source citations, and analyze sentiments side-by-side in real-time.
        </p>
      </div>

      {/* Configuration warning banner */}
      {!isConfigured && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-neutral-900 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <h4 className="font-bold text-neutral-900 text-sm">Credentials Config Required</h4>
              <p className="text-xs text-neutral-500 mt-0.5">Please add your OpenRouter and Supabase credentials in Settings to run prompts.</p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 text-xs font-bold bg-black text-white hover:bg-neutral-800 px-3.5 py-2 rounded-lg transition-all"
          >
            <Key className="h-3.5 w-3.5" />
            Setup Settings
          </button>
        </div>
      )}

      {/* Runner Form */}
      <form onSubmit={handleRun} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Prompt Area */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Prompt Text</label>
            <textarea
              rows={3}
              placeholder="e.g. Write a brief summary comparing cloud database services, focusing on Supabase and Firebase..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={!isConfigured || geminiResult.loading || gptResult.loading}
              className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder-neutral-300 focus:border-black focus:ring-1 focus:ring-black outline-none disabled:opacity-40 transition-all resize-none"
            />
          </div>

          {/* Brand/Keyword tracking */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Track Brand / Keyword</label>
              <input
                type="text"
                placeholder="e.g. Supabase"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                disabled={!isConfigured || geminiResult.loading || gptResult.loading}
                className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-300 focus:border-black focus:ring-1 focus:ring-black outline-none disabled:opacity-40 transition-all"
              />
              <span className="block text-[10px] text-neutral-400 leading-tight">Matches will be highlighted and logged for sentiment analysis.</span>
            </div>

            <button
              type="submit"
              disabled={!isConfigured || !prompt.trim() || geminiResult.loading || gptResult.loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-bold text-white hover:bg-neutral-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2 shadow-sm"
            >
              <Play className="h-4 w-4 fill-current" />
              Run Dual Evaluation
            </button>
          </div>
        </div>
      </form>

      {/* DB Sync Banner */}
      {dbStatus.saved && (
        <div className="flex items-center gap-2 text-xs text-neutral-950 bg-neutral-100 border border-neutral-200 px-4 py-2.5 rounded-lg shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-neutral-900" />
          <span>Prompt completions synchronized successfully with Supabase database.</span>
        </div>
      )}
      {dbStatus.error && (
        <div className="flex items-center gap-2 text-xs text-neutral-900 bg-neutral-50 border border-neutral-250 px-4 py-2.5 rounded-lg">
          <AlertCircle className="h-4 w-4 text-neutral-500" />
          <span>DB Sync Error: {dbStatus.error}</span>
        </div>
      )}

      {/* Output Grid */}
      {(geminiResult.text || geminiResult.loading || geminiResult.error || gptResult.text || gptResult.loading || gptResult.error) && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Gemini output */}
          {geminiResult.error ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-6 flex flex-col items-center justify-center text-center gap-3 shadow-sm">
              <AlertCircle className="h-8 w-8 text-neutral-400" />
              <h3 className="font-bold text-neutral-900">Gemini 3.5 Flash Failed</h3>
              <p className="text-xs text-neutral-500 max-w-sm">{geminiResult.error}</p>
            </div>
          ) : (
            <ResponseCard
              modelName={GEMINI_MODEL}
              rawResponse={geminiResult.text}
              brandKeyword={keyword}
              isMentioned={geminiResult.metrics.isMentioned}
              isCited={geminiResult.metrics.isCited}
              sentiment={geminiResult.metrics.sentiment}
              loading={geminiResult.loading}
            />
          )}

          {/* GPT output */}
          {gptResult.error ? (
            <div className="rounded-lg border border-neutral-200 bg-white p-6 flex flex-col items-center justify-center text-center gap-3 shadow-sm">
              <AlertCircle className="h-8 w-8 text-neutral-400" />
              <h3 className="font-bold text-neutral-900">GPT-4o Mini Failed</h3>
              <p className="text-xs text-neutral-500 max-w-sm">{gptResult.error}</p>
            </div>
          ) : (
            <ResponseCard
              modelName={GPT_MODEL}
              rawResponse={gptResult.text}
              brandKeyword={keyword}
              isMentioned={gptResult.metrics.isMentioned}
              isCited={gptResult.metrics.isCited}
              sentiment={gptResult.metrics.sentiment}
              loading={gptResult.loading}
            />
          )}
        </div>
      )}
    </div>
  );
}
