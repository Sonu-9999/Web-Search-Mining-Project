/**
 * Component for Module 5: Wildcard Processing & Permuterm Index Lab
 * Visualizes the Permuterm Index circular rotation shifts ($ symbol),
 * query rotation algorithm, and prefix range matching.
 */

import React, { useState } from 'react';
import { Search, Sparkles, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { WildcardProcessor, WildcardMatchResult } from '../modules/wildcardProcessor';
import { InvertedIndex } from '../modules/invertedIndex';

interface WildcardLabProps {
  wildcardProcessor: WildcardProcessor;
  index: InvertedIndex;
}

export const WildcardLab: React.FC<WildcardLabProps> = ({ wildcardProcessor, index }) => {
  const [testPattern, setTestPattern] = useState('c*ing');
  const [inspectTerm, setInspectTerm] = useState('mining');
  const [result, setResult] = useState<WildcardMatchResult>(() => wildcardProcessor.query('c*ing'));

  const handleTest = (pattern: string) => {
    setTestPattern(pattern);
    const res = wildcardProcessor.query(pattern);
    setResult(res);
  };

  const samplePatterns = [
    { label: 'comput*', type: 'Suffix Wildcard (X*)' },
    { label: '*search', type: 'Prefix Wildcard (*X)' },
    { label: 'c*ing', type: 'Infix Wildcard (X*Y)' },
    { label: 're*tion', type: 'Infix Wildcard (X*Y)' },
    { label: '*min*', type: 'Multiple Wildcards (*X*)' },
    { label: 'p*rank', type: 'Infix Wildcard' },
  ];

  const rotationsForInspectTerm = wildcardProcessor.generateRotations(inspectTerm.toLowerCase().trim() || 'mining');

  return (
    <div className="space-y-6">
      {/* Intro Explanation */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Permuterm Index Architecture (Module 5)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          The Permuterm Index solves arbitrary wildcard queries in Information Retrieval. Each dictionary word is appended with a terminal symbol <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-amber-600 dark:text-amber-400">$</code> and circularly shifted. A wildcard query is rotated until the <code className="font-mono">*</code> is at the end, transforming the wildcard lookup into an efficient sorted prefix lookup.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Interactive Wildcard Tester */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Test Wildcard Query Expansion:
            </h4>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={testPattern}
                  onChange={(e) => setTestPattern(e.target.value)}
                  placeholder="Enter pattern, e.g. comput*, *search, or c*ing"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              </div>
              <button
                type="button"
                onClick={() => handleTest(testPattern)}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-md hover:bg-slate-800 cursor-pointer"
              >
                Expand
              </button>
            </div>

            {/* Quick Test Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-slate-500">Quick patterns:</span>
              {samplePatterns.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleTest(p.label)}
                  className="font-mono px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-[11px] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Permuterm Rotation Mechanism Breakdown */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs space-y-3">
            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>Query Transformation Steps</span>
              <span className="font-mono text-slate-500 text-[11px]">{result.executionTimeMs} ms</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="text-slate-500">Input Wildcard Pattern:</div>
                <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{result.pattern}</div>
                <div className="text-slate-400">Class: {result.lookupType} lookup</div>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="text-slate-500">Permuterm Rotated Query:</div>
                <div className="font-mono font-bold text-amber-600 dark:text-amber-400">{result.rotatedQuery}</div>
                <div className="text-slate-400">Prefix match on: {result.rotatedQuery.replace(/\*$/, '')}</div>
              </div>
            </div>

            <div>
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Expanded Vocabulary Terms ({result.matchedTerms.length} matches):
              </div>
              {result.matchedTerms.length === 0 ? (
                <div className="p-3 bg-white dark:bg-slate-900 rounded text-slate-400 text-center">
                  No matching vocabulary terms found in current inverted index dictionary.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                  {result.matchedTerms.map((term) => (
                    <span
                      key={term}
                      className="px-2 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900 rounded font-mono text-xs"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Visualizing Circular Rotations */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Circular Shift Visualizer
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Type any word to see its circular rotations generated for the Permuterm Index:
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inspectTerm}
              onChange={(e) => setInspectTerm(e.target.value)}
              placeholder="e.g. mining, search, crawler"
              className="flex-1 px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Generated Rotations for <code className="font-mono text-slate-900 dark:text-slate-100">"{inspectTerm}$"</code>:
            </div>
            <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 font-mono text-xs max-h-64 overflow-y-auto">
              {rotationsForInspectTerm.map((rot, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700/40 last:border-0">
                  <span className="text-slate-800 dark:text-slate-200">{rot}</span>
                  <span className="text-slate-400 text-[11px]">→ {inspectTerm}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-500 leading-relaxed border-t border-slate-100 dark:border-slate-800">
            Total unique rotations in active engine: <strong className="font-mono text-slate-800 dark:text-slate-200">{wildcardProcessor.getTotalRotations()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
