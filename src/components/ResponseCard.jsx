import React from 'react';
import { AlertCircle, CheckCircle, MessageSquare, ThumbsUp, ThumbsDown, Bookmark } from 'lucide-react';

export default function ResponseCard({ 
  modelName, 
  rawResponse, 
  brandKeyword, 
  isMentioned, 
  isCited, 
  sentiment, 
  loading 
}) {
  
  const cleanGeminiResponse = (text) => {
    if (!text) return '';
    // Remove parenthetical thought process at start
    text = text.replace(/^\s*\(.*?\)\s*\**/s, '');
    // Remove leading asterisks
    text = text.replace(/^\*+/, '');
    return text.trim();
  };

  const isGemini = modelName.includes('gemini');
  const processedResponse = isGemini ? cleanGeminiResponse(rawResponse) : rawResponse;
  
  if (isGemini && processedResponse) {
    console.log("Full Gemini Response:", processedResponse);
  }
  
  // Highlight helper (minimal black-and-white highlight)
  const renderHighlightedResponse = (text, keyword) => {
    if (!text) return 'No response generated.';
    if (!keyword) return text;
    
    const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-neutral-200 text-neutral-950 px-1 py-0.5 rounded-sm font-bold border border-neutral-350 select-all">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getSentimentStyles = (s) => {
    // Return clean grayscale badge configuration
    switch (s?.toLowerCase()) {
      case 'positive':
        return {
          bg: 'bg-neutral-50 text-neutral-900 border border-neutral-300',
          icon: <ThumbsUp className="h-3 w-3 text-neutral-900" />
        };
      case 'negative':
        return {
          bg: 'bg-neutral-900 text-white border border-neutral-900',
          icon: <ThumbsDown className="h-3 w-3 text-white" />
        };
      default:
        return {
          bg: 'bg-white text-neutral-600 border border-neutral-200',
          icon: <MessageSquare className="h-3 w-3 text-neutral-400" />
        };
    }
  };

  const sentimentInfo = getSentimentStyles(sentiment);
  
  // Dynamic case-insensitive brand keyword mention check
  const isActuallyMentioned = !!(
    isMentioned || 
    (brandKeyword && processedResponse && processedResponse.toLowerCase().includes(brandKeyword.trim().toLowerCase()))
  );

  return (
    <div 
      className="flex flex-col rounded-lg border border-neutral-200 bg-white shadow-sm hover:border-neutral-300 transition-all duration-200"
      style={{
        height: 'auto',
        overflow: 'visible'
      }}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-6 py-3.5">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Model Output</span>
          <h3 className="font-mono text-xs font-black text-neutral-900 mt-0.5 uppercase tracking-wide">
            {modelName === 'google/gemini-flash-1.5:free' ? 'Gemini 1.5 Flash (Free)' : modelName === 'google/gemini-2.0-flash-exp:free' ? 'Gemini 2.0 Flash (Free)' : modelName === 'google/gemini-2.0-flash-lite' ? 'Gemini 2.0 Flash Lite' : modelName === 'google/gemini-3.5-flash' ? 'Gemini 3.5 Flash' : modelName === 'openai/gpt-4o-mini' ? 'GPT-4o Mini' : modelName}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-bold text-neutral-550">
          <span className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-neutral-400 animate-pulse' : 'bg-black'}`} />
          {loading ? 'RUNNING' : 'COMPLETED'}
        </div>
      </div>

      {/* Brand Track Bar */}
      {brandKeyword && (
        <div className="grid grid-cols-3 gap-2 px-6 py-2.5 border-b border-neutral-200 bg-neutral-50/50 text-[10px] font-bold text-neutral-500 uppercase tracking-wide">
          {/* Mentions */}
          <div className="flex items-center gap-1.5">
            <span>Mentioned:</span>
            {isActuallyMentioned ? (
              <span className="inline-flex items-center gap-1 rounded border border-neutral-900 bg-neutral-950 text-white px-1.5 py-0.5 text-[9px]">
                YES
              </span>
            ) : (
              <span className="text-neutral-400 font-normal">NO</span>
            )}
          </div>

          {/* Citations */}
          <div className="flex items-center gap-1.5">
            <span>Cited:</span>
            {isCited ? (
              <span className="inline-flex items-center gap-1 rounded border border-neutral-250 bg-white text-neutral-900 px-1.5 py-0.5 text-[9px] shadow-sm">
                <Bookmark className="h-2.5 w-2.5 fill-current" /> YES
              </span>
            ) : (
              <span className="text-neutral-400 font-normal">NO</span>
            )}
          </div>

          {/* Sentiment */}
          <div className="flex items-center gap-1.5">
            <span>Sentiment:</span>
            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold ${sentimentInfo.bg}`}>
              {sentimentInfo.icon}
              <span className="capitalize">{sentiment || 'neutral'}</span>
            </span>
          </div>
        </div>
      )}

      {/* Response Text */}
      <div 
        className="flex-1 p-6 pr-1 text-xs text-neutral-700 leading-relaxed font-sans select-text custom-scrollbar"
        style={{ 
          overflowY: 'auto', 
          maxHeight: '500px', 
          height: 'auto',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap'
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-405">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-black" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Generating Response...</span>
          </div>
        ) : (
          renderHighlightedResponse(processedResponse, brandKeyword)
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px !important;
          height: 4px !important;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #ffffff !important;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d4d4d4 !important;
          border-radius: 2px !important;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a3a3a3 !important;
        }
      `}</style>
    </div>
  );
}
