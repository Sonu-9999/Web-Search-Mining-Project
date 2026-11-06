/**
 * Guide Component: How To Run the Web Search Mining Engine
 * Provides explicit instructions for local development, production build,
 * project architectural overview, and programmatic CLI/script execution.
 */

import React, { useState } from 'react';
import { Terminal, Copy, Check, BookOpen, Layers, CheckCircle2, X } from 'lucide-react';

interface HowToRunModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToRunModal: React.FC<HowToRunModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const devCommand = `npm install
npm run dev`;

  const buildCommand = `npm run build
npm run preview`;

  const programmaticUsage = `// Programmatic usage in Node.js / TypeScript:
import {
  DocumentLoader,
  Tokenizer,
  TextNormalizer,
  InvertedIndex,
  WildcardProcessor,
  QueryProcessor,
} from './src/modules';

// 1. Document Loading
const loader = new DocumentLoader();
const docs = loader.loadDefaultCorpus();

// 2 & 3. Tokenization & Normalization (Stemming / Lemmatization)
const index = new InvertedIndex({
  normalizationMode: 'stemming', // or 'lemmatization'
  removeStopwords: true,
});

// 4. Inverted Index Construction
index.buildIndex(docs);

// 5 & 6. Wildcard & Query Processing
const wildcard = new WildcardProcessor(index);
const engine = new QueryProcessor(index, wildcard);

// Execute queries:
const res1 = engine.execute('comput*'); // Wildcard query
const res2 = engine.execute('"inverted index"'); // Phrase query
const res3 = engine.execute('crawler AND politeness'); // Boolean query
console.log(res1.documents);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              How to Run the Web Search Mining Engine
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed">
          {/* Section 1: Quickstart Commands */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              1. Running the Interactive Development Server
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Open your terminal in the project root directory and start the Vite development server:
            </p>
            <div className="relative">
              <pre className="p-3 bg-slate-950 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">
                {devCommand}
              </pre>
              <button
                type="button"
                onClick={() => copyCode(devCommand, 1)}
                className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 1 ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-slate-500">
              Note: If your local npm version has strict peer resolution on Windows, run <code className="font-mono text-slate-800 dark:text-slate-200">npm install --legacy-peer-deps</code>.
            </p>
            <p className="text-slate-500">
              The application will run at <code className="font-mono text-slate-800 dark:text-slate-200">http://localhost:3000</code>.
            </p>
          </div>

          {/* Section 2: Building for Production */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              2. Production Build and Preview
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              To bundle optimized production assets into <code className="font-mono">dist/</code>:
            </p>
            <div className="relative">
              <pre className="p-3 bg-slate-950 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">
                {buildCommand}
              </pre>
              <button
                type="button"
                onClick={() => copyCode(buildCommand, 2)}
                className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 2 ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Section 3: Clean Project Structure */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              3. Modular Architecture Overview
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 text-slate-700 dark:text-slate-300">
              <div><strong className="font-mono">src/modules/documentLoader.ts</strong> — Ingests and stores raw text/JSON corpus.</div>
              <div><strong className="font-mono">src/modules/tokenization.ts</strong> — Lexical tokenizer recording positions and offsets.</div>
              <div><strong className="font-mono">src/modules/textNormalization.ts</strong> — Case folding, stopwords, Porter Stemmer, and Lemmatizer.</div>
              <div><strong className="font-mono">src/modules/invertedIndex.ts</strong> — Constructs dictionary and postings with term frequencies and positions.</div>
              <div><strong className="font-mono">src/modules/wildcardProcessor.ts</strong> — Permuterm Index with circular rotation queries.</div>
              <div><strong className="font-mono">src/modules/queryProcessor.ts</strong> — Evaluates BM25, TF-IDF, Boolean (AND/OR/NOT), and phrase queries.</div>
              <div><strong className="font-mono">src/components/SearchInterface.tsx</strong> — Frontend GUI with search box, Search button, and read-only result area.</div>
            </div>
          </div>

          {/* Section 4: Programmatic Usage */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              4. Programmatic Module Usage
            </h3>
            <div className="relative">
              <pre className="p-3 bg-slate-950 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">
                {programmaticUsage}
              </pre>
              <button
                type="button"
                onClick={() => copyCode(programmaticUsage, 3)}
                className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {copiedIndex === 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 3 ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
