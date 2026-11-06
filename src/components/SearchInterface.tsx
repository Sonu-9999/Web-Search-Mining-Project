/**
 * Module 7: Frontend GUI - Primary Search Interface
 * Features:
 * - Search input box with clear action
 * - Search button
 * - Read-only result area displaying ranked documents, snippets with highlights,
 *   scores, and pipeline diagnostic traces.
 */

import React, { useState } from 'react';
import { Search, Sparkles, X, ChevronDown, ChevronRight, Copy, Check, FileText, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { QueryProcessor, QueryResult, RankingModel } from '../modules/queryProcessor';
import { InvertedIndex } from '../modules/invertedIndex';
import { NormalizationMode } from '../modules/textNormalization';

interface SearchInterfaceProps {
  index: InvertedIndex;
  queryProcessor: QueryProcessor;
  onRebuildIndex: (mode: NormalizationMode, stopwords: boolean) => void;
  currentMode: NormalizationMode;
  stopwordsEnabled: boolean;
}

const SAMPLE_QUERIES = [
  { label: 'Wildcard: comput*', query: 'comput*', desc: 'Trailing wildcard expanded via Permuterm' },
  { label: 'Wildcard: *search', query: '*search', desc: 'Leading wildcard rotated to search$*' },
  { label: 'Wildcard: c*ing', query: 'c*ing', desc: 'Infix wildcard rotated to ing$c*' },
  { label: 'Phrase: "inverted index"', query: '"inverted index"', desc: 'Positional adjacent token matching' },
  { label: 'Boolean: crawler AND politeness', query: 'crawler AND politeness', desc: 'Postings intersection' },
  { label: 'Boolean: ranking OR pagerank', query: 'ranking OR pagerank', desc: 'Postings union' },
  { label: 'Ranked: web mining relevance', query: 'web mining relevance', desc: 'Probabilistic BM25 scoring' },
];

export const SearchInterface: React.FC<SearchInterfaceProps> = ({
  index,
  queryProcessor,
  onRebuildIndex,
  currentMode,
  stopwordsEnabled,
}) => {
  const [queryString, setQueryString] = useState('comput*');
  const [rankingModel, setRankingModel] = useState<RankingModel>('bm25');
  const [lastResult, setLastResult] = useState<QueryResult | null>(() => {
    // Initial run with sample query
    return queryProcessor.execute('comput*', { model: 'bm25' });
  });
  const [expandedTrace, setExpandedTrace] = useState<boolean>(true);
  const [activeResultTab, setActiveResultTab] = useState<'cards' | 'json'>('cards');
  const [copiedJson, setCopiedJson] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const result = queryProcessor.execute(queryString, {
      model: rankingModel,
    });
    setLastResult(result);
  };

  const handleSelectSample = (sample: string) => {
    setQueryString(sample);
    const result = queryProcessor.execute(sample, {
      model: rankingModel,
    });
    setLastResult(result);
  };

  const handleCopyJson = () => {
    if (!lastResult) return;
    navigator.clipboard.writeText(JSON.stringify(lastResult, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const highlightMatches = (text: string, terms: string[]) => {
    if (!terms || terms.length === 0) return text;
    // Build regex for all terms and their stem/roots
    const escaped = terms
      .map((t) => t.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(Boolean)
      .join('|');
    if (!escaped) return text;

    const regex = new RegExp(`\\b(${escaped}[a-z]*)\\b`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (regex.test(part)) {
        return (
          <mark
            key={i}
            className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 px-0.5 rounded font-medium"
          >
            {part}
          </mark>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Input Box Area */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={queryString}
                onChange={(e) => setQueryString(e.target.value)}
                placeholder='Enter search query, e.g. comput*, "inverted index", or crawler AND politeness'
                className="w-full pl-10 pr-10 py-3 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 font-sans"
              />
              {queryString && (
                <button
                  type="button"
                  onClick={() => setQueryString('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>

          {/* Quick Sample Queries */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">Try Examples:</span>
            {SAMPLE_QUERIES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample.query)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs transition-colors cursor-pointer"
                title={sample.desc}
              >
                {sample.label}
              </button>
            ))}
          </div>

          {/* Toggle Engine Controls */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Engine Tuning & Normalization Settings</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Index Size:</span>
              <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                {index.getStats().totalDocuments} Docs
              </span>
              <span>·</span>
              <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                {index.getStats().totalTerms} Terms
              </span>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Ranking Model
                </label>
                <div className="flex gap-1.5">
                  {(['bm25', 'tfidf', 'boolean'] as RankingModel[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRankingModel(m)}
                      className={`px-2.5 py-1.5 rounded font-medium uppercase transition-colors cursor-pointer ${
                        rankingModel === m
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Text Normalization Mode
                </label>
                <div className="flex gap-1.5">
                  {(['stemming', 'lemmatization', 'none'] as NormalizationMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onRebuildIndex(mode, stopwordsEnabled)}
                      className={`px-2.5 py-1.5 rounded font-medium capitalize transition-colors cursor-pointer ${
                        currentMode === mode
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Stopwords Filter
                </label>
                <button
                  type="button"
                  onClick={() => onRebuildIndex(currentMode, !stopwordsEnabled)}
                  className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                    stopwordsEnabled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {stopwordsEnabled ? 'Stopwords Filter: ON (Standard IR)' : 'Stopwords Filter: OFF'}
                </button>
              </div>
            </div>
          )}
        </form>
      </section>

      {/* READ-ONLY RESULT AREA */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Header of Read-Only Result Area */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Read-Only Search Result Area
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Query:</span>
              <code className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded font-mono">
                {lastResult?.query || '(empty)'}
              </code>
              <span aria-hidden="true">·</span>
              <span>Matched:</span>
              <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                {lastResult?.totalMatches ?? 0} documents
              </span>
              <span aria-hidden="true">·</span>
              <span>Latency:</span>
              <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                {lastResult?.executionTimeMs ?? 0} ms
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setActiveResultTab('cards')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  activeResultTab === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Document Cards
              </button>
              <button
                type="button"
                onClick={() => setActiveResultTab('json')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  activeResultTab === 'json'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                JSON Trace Output
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Copy result data to clipboard"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJson ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Wildcard Expansions Banner if applicable */}
        {lastResult && Object.keys(lastResult.expandedTerms).length > 0 && (
          <div className="px-5 py-3 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 text-xs flex flex-wrap items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold text-amber-900 dark:text-amber-200">Permuterm Wildcard Expansions:</span>
            {Object.entries(lastResult.expandedTerms).map(([pattern, terms]) => (
              <div key={pattern} className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <span className="font-mono font-medium">{pattern}</span>
                <ArrowRight className="w-3 h-3 text-amber-500" />
                <span className="font-mono bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                  {terms.length > 0 ? terms.join(', ') : '(no matching dictionary terms)'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pipeline Execution Trace (Collapsible) */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={() => setExpandedTrace(!expandedTrace)}
            className="w-full px-5 py-2.5 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              {expandedTrace ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              <span className="font-semibold">Pipeline Execution Diagnostics</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{lastResult?.pipelineTrace.length ?? 0} processing stages recorded</span>
            </div>
            <span className="text-slate-500 text-[11px]">Click to {expandedTrace ? 'collapse' : 'expand'}</span>
          </button>

          {expandedTrace && lastResult && (
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {lastResult.pipelineTrace.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {step.stepNumber}. {step.name}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      {step.description}
                    </p>
                    <pre className="p-2 bg-slate-50 dark:bg-slate-900 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto max-h-24">
                      {JSON.stringify(step.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Cards View */}
        {activeResultTab === 'cards' && (
          <div className="p-5 divide-y divide-slate-100 dark:divide-slate-800">
            {(!lastResult || lastResult.documents.length === 0) ? (
              <div className="py-12 text-center">
                <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No documents matched your query</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Try another term, a wildcard query like <code className="font-mono">comput*</code>, or select an example above.
                </p>
              </div>
            ) : (
              lastResult.documents.map((doc, idx) => (
                <article key={doc.docId} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{doc.docId}</span>
                        <span aria-hidden="true">·</span>
                        <span>{doc.category || 'General'}</span>
                        {doc.url && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-xs">{doc.url}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {idx + 1}. {doc.title}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-500">Relevance Score</div>
                      <div className="font-mono tabular-nums text-sm font-bold text-slate-900 dark:text-slate-100">
                        {doc.score}
                      </div>
                    </div>
                  </div>

                  {/* Highlighted Snippet */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
                    {highlightMatches(doc.snippet, doc.matchedTerms)}
                  </div>

                  {/* Matched Terms Metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Matched Terms:</span>
                    {doc.matchedTerms.map((term) => (
                      <span key={term} className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
                        {term} {doc.termFrequencies[term] ? `(tf=${doc.termFrequencies[term]})` : ''}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Raw JSON Output Area (Read-Only) */}
        {activeResultTab === 'json' && (
          <div className="p-5">
            <div className="relative">
              <pre className="p-4 bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-auto max-h-[500px] leading-relaxed">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
