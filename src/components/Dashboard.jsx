import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  BarChart3, Activity, Bookmark, ThumbsUp, ThumbsDown, 
  MessageSquare, TrendingUp, AlertCircle, RefreshCw 
} from 'lucide-react';

export default function Dashboard() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats state
  const [stats, setStats] = useState({
    totalRuns: 0,
    totalMentions: 0,
    geminiMentions: 0,
    gptMentions: 0,
    citationRate: 0,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  });

  const [chartData, setChartData] = useState([]);

  const fetchDashboardData = async () => {
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
        .order('created_at', { ascending: true });

      if (dbErr) throw dbErr;
      
      const rawRuns = data || [];
      setRuns(rawRuns);
      computeStatsAndChart(rawRuns);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to retrieve analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    window.addEventListener('config-updated', fetchDashboardData);
    return () => window.removeEventListener('config-updated', fetchDashboardData);
  }, []);

  const computeStatsAndChart = (allRuns) => {
    if (allRuns.length === 0) {
      setStats({
        totalRuns: 0,
        totalMentions: 0,
        geminiMentions: 0,
        gptMentions: 0,
        citationRate: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
      });
      setChartData([]);
      return;
    }

    const totalRuns = allRuns.length;
    let totalMentions = 0;
    let geminiMentions = 0;
    let gptMentions = 0;
    let citationsCount = 0;
    
    const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
    const dateGroups = {};

    allRuns.forEach(run => {
      if (run.is_mentioned) {
        totalMentions++;
        if (run.model_name.includes('gemini')) {
          geminiMentions++;
        } else if (run.model_name === 'openai/gpt-4o-mini') {
          gptMentions++;
        }
      }

      if (run.is_cited) {
        citationsCount++;
      }

      if (run.brand_keyword && run.sentiment) {
        const s = run.sentiment.toLowerCase();
        if (sentimentBreakdown[s] !== undefined) {
          sentimentBreakdown[s]++;
        }
      }

      const dateStr = new Date(run.created_at).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
      
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = { date: dateStr, gemini: 0, gpt: 0, total: 0 };
      }
      
      if (run.is_mentioned) {
        dateGroups[dateStr].total++;
        if (run.model_name.includes('gemini')) {
          dateGroups[dateStr].gemini++;
        } else if (run.model_name === 'openai/gpt-4o-mini') {
          dateGroups[dateStr].gpt++;
        }
      }
    });

    const citationRate = Math.round((citationsCount / totalRuns) * 100);

    setStats({
      totalRuns,
      totalMentions,
      geminiMentions,
      gptMentions,
      citationRate,
      sentimentBreakdown
    });

    const formattedChartData = Object.values(dateGroups).sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    setChartData(formattedChartData);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-neutral-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-neutral-950" />
          Analytics Dashboard
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Historical overview of brand mentions, source citations, and response sentiments.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 flex items-center gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-neutral-900 flex-shrink-0" />
          <span className="text-sm text-neutral-600">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-405">
          <RefreshCw className="h-7 w-7 animate-spin text-neutral-900" />
          <span className="text-[11px] font-bold uppercase tracking-wider">Compiling Metrics...</span>
        </div>
      ) : runs.length === 0 ? (
        /* Empty State */
        <div className="rounded-lg border border-dashed border-neutral-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded bg-neutral-50 border border-neutral-200 text-neutral-400 mb-4">
            <Activity className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900">No Analytics Data</h3>
          <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
            Run a few prompts on the Prompt Runner to generate database records for analysis.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Stat: Total Runs */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Model Runs</span>
                <div className="text-xl font-black text-neutral-900">{stats.totalRuns}</div>
              </div>
              <div className="rounded bg-neutral-50 border border-neutral-200 p-2.5 text-neutral-800">
                <Activity className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Stat: Total Mentions */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Brand Mentions</span>
                <div className="text-xl font-black text-neutral-900">{stats.totalMentions}</div>
              </div>
              <div className="rounded bg-neutral-950 text-white p-2.5">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Stat: Citations */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Citation Rate</span>
                <div className="text-xl font-black text-neutral-900">{stats.citationRate}%</div>
              </div>
              <div className="rounded bg-neutral-50 border border-neutral-200 p-2.5 text-neutral-800">
                <Bookmark className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Stat: Sentiment Ratio */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Sentiment Ratio</span>
                <div className="flex gap-2 text-xs font-bold mt-1">
                  <span className="inline-flex items-center gap-0.5 text-neutral-800 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded">
                    +{stats.sentimentBreakdown.positive}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-neutral-500 bg-white border border-neutral-200 px-1.5 py-0.5 rounded">
                    ={stats.sentimentBreakdown.neutral}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-white bg-black px-1.5 py-0.5 rounded">
                    -{stats.sentimentBreakdown.negative}
                  </span>
                </div>
              </div>
              <div className="rounded bg-neutral-50 border border-neutral-200 p-2.5 text-neutral-800">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-6">Mentions Frequency Over Time</h3>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#8a8a8a" 
                    fontSize={10}
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#8a8a8a" 
                    fontSize={10}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderColor: '#e5e5e5', 
                      borderRadius: '8px',
                      color: '#171717',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    iconType="rect"
                    iconSize={10}
                    wrapperStyle={{ fontSize: '11px', fontWeight: '600', color: '#525252' }}
                  />
                  <Bar 
                    name="Gemini Flash" 
                    dataKey="gemini" 
                    fill="#000000" 
                    radius={[2, 2, 0, 0]} 
                    maxBarSize={24} 
                  />
                  <Bar 
                    name="GPT-4o Mini" 
                    dataKey="gpt" 
                    fill="#a3a3a3" 
                    radius={[2, 2, 0, 0]} 
                    maxBarSize={24} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
