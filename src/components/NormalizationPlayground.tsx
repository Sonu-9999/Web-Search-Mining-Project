/**
 * Component for Modules 2 & 3: Tokenization & Normalization Laboratory
 * Allows testing and comparing:
 * - Token extraction and positional boundaries
 * - Case folding & accent stripping
 * - Stopword filtering
 * - Porter Stemmer suffix reduction
 * - Lemmatization to base/dictionary lemma headword
 */

import React, { useState } from 'react';
import { defaultTokenizer } from '../modules/tokenization';
import { TextNormalizer } from '../modules/textNormalization';
import { Type, Cpu, BookOpen, Layers } from 'lucide-react';

export const NormalizationPlayground: React.FC = () => {
  const [inputText, setInputText] = useState(
    'Distributed web crawlers are systematically crawling, indexing, and mining millions of complex documents and matrices.'
  );
  const [removeStopwords, setRemoveStopwords] = useState(true);

  const normalizer = new TextNormalizer({ removeStopwords });
  const rawTokens = defaultTokenizer.tokenize(inputText);
  const normalizedTokens = normalizer.normalizeTokens(rawTokens, { removeStopwords });

  const sampleInputs = [
    'Web crawlers are mining and crawling indexed data matrices.',
    'Better algorithms compute queries using inverted indices.',
    'Children were happily writing computational search routines.',
    'The Porter stemmer stems words while lemmatizers find base lemmas.',
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-slate-500" />
          Text Normalization & Morphological Reduction Pipeline (Modules 2 & 3)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Compare how the <strong>Porter Stemmer</strong> (algorithmic suffix stripping) and the <strong>Lemmatizer</strong> (morphological reduction to dictionary base forms) transform raw document tokens prior to Inverted Index construction.
        </p>
      </div>

      {/* Input Text Box */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Input Text to Process
          </label>
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 leading-relaxed font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500">Sample phrases:</span>
            {sampleInputs.map((sample, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputText(sample)}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] transition-colors cursor-pointer"
              >
                Sample {i + 1}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={removeStopwords}
              onChange={(e) => setRemoveStopwords(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-0"
            />
            <span>Filter Stopwords (Standard IR)</span>
          </label>
        </div>
      </div>

      {/* Comparison Grid Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            Token-by-Token Morphological Comparison ({rawTokens.length} total tokens)
          </h4>
          <div className="text-xs text-slate-500">
            Active indexed tokens: <strong className="font-mono text-slate-800 dark:text-slate-200">{normalizedTokens.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Pos</th>
                <th className="py-2.5 px-4">Raw Token</th>
                <th className="py-2.5 px-4">Case Folded</th>
                <th className="py-2.5 px-4">Porter Stemmer</th>
                <th className="py-2.5 px-4">Lemmatizer (Base Form)</th>
                <th className="py-2.5 px-4">Stopword Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rawTokens.map((t) => {
                const folded = t.raw.toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
                const stem = normalizer.porterStem(folded);
                const lemma = normalizer.lemmatize(folded);
                const isStopword = normalizer.normalizeTokens([t], { removeStopwords: false })[0]?.isStopword;
                const isFiltered = removeStopwords && isStopword;

                return (
                  <tr
                    key={t.position}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isFiltered ? 'opacity-40 line-through bg-slate-50/50 dark:bg-slate-900/40' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 font-mono text-slate-400">
                      {t.position}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                      {t.raw}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {folded}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                      {stem}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {lemma}
                    </td>
                    <td className="py-2.5 px-4">
                      {isStopword ? (
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                          Stopword {isFiltered ? '(Filtered)' : ''}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          Indexed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
