import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { GEMINI_MODEL, GPT_MODEL } from '../lib/openrouterClient';
import { 
  Search, Filter, Calendar, ChevronDown, ChevronUp, Trash2, 
  ThumbsUp, ThumbsDown, MessageSquare, AlertCircle, RefreshCw, Bookmark
} from 'lucide-react';

export default function HistoryTable() {
  const [runs, setRuns] = useState([]);
  const [filteredRuns, setFilteredRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Expanded rows state
  const [expandedRowId, setExpandedRowId] = useState(null);

  // Filter states
  const [keywordFilter, setKeywordFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('all');
  const [mentionFilter, setMentionFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      setError('Supabase client is not configured. Please open Settings.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: dbErr } = await supabase
        .from('prompt_runs')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbErr) throw dbErr;
      setRuns(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message || 'Failed to retrieve history logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // Listen for custom settings changes to re-fetch
    window.addEventListener('config-updated', fetchHistory);
    return () => window.removeEventListener('config-updated', fetchHistory);
  }, []);

  // Filter logic
  useEffect(() => {
    let result = [...runs];

    if (keywordFilter.trim()) {
      const kw = keywordFilter.toLowerCase();
      result = result.filter(
        run => 
          run.brand_keyword?.toLowerCase().includes(kw) ||
          run.prompt_text?.toLowerCase().includes(kw) ||
          run.raw_response?.toLowerCase().includes(kw)
      );
    }

    if (modelFilter !== 'all') {
      if (modelFilter === GEMINI_MODEL) {
        result = result.filter(run => run.model_name.includes('gemini'));
      } else {
        result = result.filter(run => run.model_name === modelFilter);
      }
    }

    if (mentionFilter !== 'all') {
      const isMent = mentionFilter === 'mentioned';
      result = result.filter(run => run.is_mentioned === isMent);
    }

    if (startDate) {
      const start = new Date(startDate);
      result = result.filter(run => new Date(run.created_at) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(run => new Date(run.created_at) <= end);
    }

    setFilteredRuns(result);
  }, [runs, keywordFilter, modelFilter, mentionFilter, startDate, endDate]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this log entry?')) return;
    
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const { error: delErr } = await supabase
        .from('prompt_runs')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;
      setRuns(prev => prev.filter(run => run.id !== id));
      if (expandedRowId === id) setExpandedRowId(null);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const clearAllHistory = async () => {
    if (!confirm('WARNING: Are you sure you want to delete ALL prompt run logs? This action is irreversible.')) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      setLoading(true);
      const { error: delErr } = await supabase
        .from('prompt_runs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); 
      if (delErr) throw delErr;
      setRuns([]);
      setExpandedRowId(null);
    } catch (err) {
      alert(`Clear failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setKeywordFilter('');
    setModelFilter('all');
    setMentionFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const getSentimentBadge = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return (
          <span className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-[10px] font-bold text-neutral-800">
            <ThumbsUp className="h-2.5 w-2.5" /> Positive
          </span>
        );
      case 'negative':
        return (
          <span className="inline-flex items-center gap-1 rounded border border-neutral-900 bg-neutral-950 px-2 py-0.5 text-[10px] font-bold text-white">
            <ThumbsDown className="h-2.5 w-2.5" /> Negative
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-bold text-neutral-500">
            <MessageSquare className="h-2.5 w-2.5" /> Neutral
          </span>
        );
    }
  };

  const highlightKeyword = (text, keyword) => {
    if (!text) return '';
    if (!keyword) return text;
    const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-neutral-200 text-neutral-950 px-1 py-0.5 rounded font-bold border border-neutral-350 select-all">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-neutral-900">History Log</h2>
          <p className="text-sm text-neutral-500 mt-1">Review, filter, and audit all historical prompt executions.</p>
        </div>
        {runs.length > 0 && (
          <button
            onClick={clearAllHistory}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 hover:text-red-650 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 px-4 py-2 rounded-lg transition-colors self-start sm:self-auto shadow-sm"
          >
            <Trash2 className="h-4 w-4" />
            Clear All Logs
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 flex items-center gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-neutral-900 flex-shrink-0" />
          <span className="text-sm text-neutral-600">{error}</span>
        </div>
      )}

      {/* Filters Panel */}
      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-900" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-850">Log Filters</span>
          </div>
          <button 
            onClick={resetFilters} 
            className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
          {/* Keyword search */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Search text</span>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={keywordFilter}
                onChange={e => setKeywordFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white pl-8 pr-4 py-1.5 text-xs text-neutral-805 placeholder-neutral-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
              />
            </div>
          </div>

          {/* Model select */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Model</span>
            <select
              value={modelFilter}
              onChange={e => setModelFilter(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-805 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
            >
              <option value="all">All Models</option>
              <option value={GEMINI_MODEL}>Gemini 3.5 Flash</option>
              <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
            </select>
          </div>

          {/* Mention select */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Brand Mention</span>
            <select
              value={mentionFilter}
              onChange={e => setMentionFilter(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-805 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="mentioned">Mentioned</option>
              <option value="not_mentioned">Not Mentioned</option>
            </select>
          </div>

          {/* Date Start */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">From Date</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white pl-8 pr-3 py-1.5 text-xs text-neutral-805 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
              />
            </div>
          </div>

          {/* Date End */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">To Date</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white pl-8 pr-3 py-1.5 text-xs text-neutral-805 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400">
          <RefreshCw className="h-7 w-7 animate-spin text-neutral-900" />
          <span className="text-[11px] font-bold uppercase tracking-wider">Fetching Log Database...</span>
        </div>
      ) : filteredRuns.length === 0 ? (
        /* Empty State */
        <div className="rounded-lg border border-dashed border-neutral-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded bg-neutral-50 border border-neutral-200 text-neutral-400 mb-4">
            <Search className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900">No Logs Found</h3>
          <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
            {runs.length === 0 
              ? "You haven't run any prompts yet. Head over to Prompt Runner to start!"
              : "No logs match the current filter selection. Try adjusting or resetting filters."}
          </p>
        </div>
      ) : (
        /* Data Table */
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto text-xs">
            <table className="w-full border-collapse text-left text-neutral-700">
              <thead className="bg-neutral-50 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Prompt</th>
                  <th className="px-6 py-3.5">Brand Key</th>
                  <th className="px-6 py-3.5">Model</th>
                  <th className="px-6 py-3.5">Mentioned</th>
                  <th className="px-6 py-3.5 text-center">Cited</th>
                  <th className="px-6 py-3.5">Sentiment</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredRuns.map((run) => {
                  const isExpanded = expandedRowId === run.id;
                  return (
                    <React.Fragment key={run.id}>
                      <tr 
                        onClick={() => setExpandedRowId(isExpanded ? null : run.id)}
                        className="hover:bg-neutral-50/50 cursor-pointer transition-colors duration-100"
                      >
                        {/* Timestamp */}
                        <td className="px-6 py-3.5 whitespace-nowrap text-[10px] text-neutral-400 font-mono">
                          {new Date(run.created_at).toLocaleString()}
                        </td>
                        {/* Prompt (truncated) */}
                        <td className="px-6 py-3.5 max-w-xs truncate text-neutral-800">
                          {run.prompt_text}
                        </td>
                        {/* Brand Keyword */}
                        <td className="px-6 py-3.5 font-bold text-neutral-900">
                          {run.brand_keyword || <span className="text-neutral-300">-</span>}
                        </td>
                        {/* Model */}
                        <td className="px-6 py-3.5 font-mono text-[10px] text-neutral-500 uppercase">
                          {run.model_name.includes('gemini') ? 'Gemini Flash' : run.model_name === 'openai/gpt-4o-mini' ? 'GPT-4o Mini' : run.model_name}
                        </td>
                        {/* Mentioned */}
                        <td className="px-6 py-3.5 whitespace-nowrap font-bold">
                          {run.is_mentioned === null ? (
                            <span className="text-neutral-300">-</span>
                          ) : run.is_mentioned ? (
                            <span className="inline-flex items-center rounded border border-neutral-900 bg-neutral-950 text-white px-1.5 py-0.5 text-[9px]">YES</span>
                          ) : (
                            <span className="text-neutral-400">NO</span>
                          )}
                        </td>
                        {/* Cited */}
                        <td className="px-6 py-3.5 text-center">
                          {run.is_cited === null ? (
                            <span className="text-neutral-300">-</span>
                          ) : run.is_cited ? (
                            <Bookmark className="h-3.5 w-3.5 mx-auto text-neutral-900 fill-current" />
                          ) : (
                            <span className="text-neutral-300 font-mono">-</span>
                          )}
                        </td>
                        {/* Sentiment */}
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          {run.brand_keyword ? getSentimentBadge(run.sentiment) : <span className="text-neutral-300">-</span>}
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-3" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => setExpandedRowId(isExpanded ? null : run.id)}
                              className="text-neutral-400 hover:text-neutral-900 p-1"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={(e) => handleDelete(run.id, e)}
                              className="text-neutral-400 hover:text-neutral-950 p-1 rounded hover:bg-neutral-100 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-neutral-50/40 px-8 py-5 border-b border-neutral-200">
                            <div className="space-y-4 text-xs">
                              {/* Full Prompt */}
                              <div>
                                <h5 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Full Prompt Text</h5>
                                <div className="rounded-lg border border-neutral-200 bg-white p-4 text-neutral-800 font-sans whitespace-pre-wrap select-text leading-relaxed">
                                  {run.prompt_text}
                                </div>
                              </div>

                              {/* Highlight Snippet */}
                              {run.highlight_snippet && (
                                <div>
                                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Context Highlight Snippet</h5>
                                  <div className="rounded-lg border border-neutral-200 bg-white p-3 text-neutral-800 font-sans whitespace-pre-wrap select-text leading-relaxed">
                                    {highlightKeyword(run.highlight_snippet, run.brand_keyword)}
                                  </div>
                                </div>
                              )}

                              {/* Full Response */}
                              <div>
                                <h5 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Full Model Output Response</h5>
                                <div className="rounded-lg border border-neutral-200 bg-white p-5 text-neutral-700 font-sans whitespace-pre-wrap select-text leading-relaxed max-h-96 overflow-y-auto">
                                  {highlightKeyword(run.raw_response, run.brand_keyword)}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
