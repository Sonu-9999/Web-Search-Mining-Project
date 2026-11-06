/**
 * Component for Module 4: Inverted Index Explorer
 * Allows browsing the dictionary vocabulary, inspecting Document Frequency (df),
 * Collection Frequency (cf), and drilling down into individual Postings Lists
 * with document IDs and positional offsets.
 */

import React, { useState } from 'react';
import { Search, ListFilter, Layers, ArrowRight } from 'lucide-react';
import { InvertedIndex, DictionaryEntry } from '../modules/invertedIndex';

interface IndexExplorerProps {
  index: InvertedIndex;
}

export const IndexExplorer: React.FC<IndexExplorerProps> = ({ index }) => {
  const [filterTerm, setFilterTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null);

  const stats = index.getStats();
  const allEntries = index.getAllEntries();

  const filteredEntries = allEntries.filter((entry) =>
    entry.term.toLowerCase().includes(filterTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Index Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 font-medium">Vocabulary Terms</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {stats.totalTerms}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 font-medium">Total Postings</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {stats.totalPostings}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 font-medium">Average Doc Length</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {stats.avgDocLength} tokens
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 font-medium">Build Time</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {stats.buildTimeMs} ms
          </div>
        </div>
      </div>

      {/* Main Split: Dictionary Table & Postings List Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dictionary Column (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-[600px] overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Index Dictionary ({filteredEntries.length} terms)
              </h3>
            </div>

            <div className="relative w-48">
              <input
                type="text"
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                placeholder="Filter terms..."
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Term</th>
                  <th className="py-2.5 px-4 text-right">Doc Freq (df)</th>
                  <th className="py-2.5 px-4 text-right">Col Freq (cf)</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEntries.map((entry) => {
                  const isSelected = selectedEntry?.term === entry.term;
                  return (
                    <tr
                      key={entry.term}
                      onClick={() => setSelectedEntry(entry)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isSelected ? 'bg-slate-100 dark:bg-slate-800 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                        {entry.term}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {entry.docFrequency}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {entry.collectionFrequency}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                          Postings <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Postings List Detail (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-[600px] overflow-y-auto">
          {selectedEntry ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 font-medium">Postings List for Term</div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                  "{selectedEntry.term}"
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>Doc Frequency (df): <strong className="text-slate-800 dark:text-slate-200 font-mono">{selectedEntry.docFrequency}</strong></span>
                  <span>·</span>
                  <span>Collection Frequency (cf): <strong className="text-slate-800 dark:text-slate-200 font-mono">{selectedEntry.collectionFrequency}</strong></span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Document Postings Records:
                </h4>
                {selectedEntry.postings.map((posting) => {
                  const doc = index.getDocument(posting.docId);
                  return (
                    <div
                      key={posting.docId}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {posting.docId}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          Term Frequency (tf) = {posting.termFrequency}
                        </span>
                      </div>
                      {doc && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                          {doc.title}
                        </div>
                      )}
                      <div>
                        <div className="text-[11px] font-medium text-slate-500 mb-1">
                          Positional Index Offsets:
                        </div>
                        <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                          {posting.positions.map((pos) => (
                            <span
                              key={pos}
                              className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded"
                            >
                              pos:{pos}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Select a vocabulary term on the left to inspect its inverted index postings list.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
