/**
 * Web Search Mining Project - Main Application Shell
 *
 * Clean project structure with separate modules for:
 * 1. Document Loading (documentLoader.ts)
 * 2. Tokenization (tokenization.ts)
 * 3. Text Normalization / Case Folding with Porter Stemming & Lemmatization (textNormalization.ts)
 * 4. Inverted Index Construction (invertedIndex.ts)
 * 5. Wildcard Processing with Permuterm Index (wildcardProcessor.ts)
 * 6. Query Processing (queryProcessor.ts)
 * 7. Frontend GUI with search input box, Search button, and read-only result area (SearchInterface.tsx)
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Database,
  Layers,
  Sparkles,
  Cpu,
  Terminal,
  Sun,
  Moon,
  Info,
} from 'lucide-react';
import { DocumentLoader } from './modules/documentLoader';
import { InvertedIndex } from './modules/invertedIndex';
import { WildcardProcessor } from './modules/wildcardProcessor';
import { QueryProcessor } from './modules/queryProcessor';
import { NormalizationMode } from './modules/textNormalization';
import { SearchInterface } from './components/SearchInterface';
import { CorpusManager } from './components/CorpusManager';
import { IndexExplorer } from './components/IndexExplorer';
import { WildcardLab } from './components/WildcardLab';
import { NormalizationPlayground } from './components/NormalizationPlayground';
import { HowToRunModal } from './components/HowToRunModal';

type ActiveTab = 'search' | 'corpus' | 'index' | 'wildcard' | 'normalization';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('search');
  const [normalizationMode, setNormalizationMode] = useState<NormalizationMode>('stemming');
  const [stopwordsEnabled, setStopwordsEnabled] = useState<boolean>(true);
  const [showHowToRun, setShowHowToRun] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [version, setVersion] = useState<number>(0);

  // Initialize engine modules
  const documentLoader = useMemo(() => new DocumentLoader(), []);

  const invertedIndex = useMemo(() => {
    const idx = new InvertedIndex({
      normalizationMode,
      removeStopwords: stopwordsEnabled,
    });
    idx.buildIndex(documentLoader.getAllDocuments());
    return idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizationMode, stopwordsEnabled, version]);

  const wildcardProcessor = useMemo(() => {
    return new WildcardProcessor(invertedIndex);
  }, [invertedIndex]);

  const queryProcessor = useMemo(() => {
    return new QueryProcessor(invertedIndex, wildcardProcessor);
  }, [invertedIndex, wildcardProcessor]);

  // Handle rebuilding index with new normalization settings
  const handleRebuildIndex = (mode: NormalizationMode, stopwords: boolean) => {
    setNormalizationMode(mode);
    setStopwordsEnabled(stopwords);
  };

  const handleDocumentsChanged = () => {
    setVersion((v) => v + 1);
  };

  // Toggle Dark Mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Bar Contract: 3 Zones (Wordmark Brand, 4-5 Nav Links, 1 Primary Action) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
              Web Search Mining Engine
            </span>
          </div>

          {/* Zone 2: Navigation Links (single-line controls) */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'search'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Search GUI
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('corpus')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'corpus'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Corpus Loader ({invertedIndex.getStats().totalDocuments})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('index')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'index'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Inverted Index
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('wildcard')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'wildcard'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Wildcard / Permuterm
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('normalization')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'normalization'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Stem & Lemma Lab
            </button>
          </nav>

          {/* Zone 3: Primary Action + Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setShowHowToRun(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Terminal className="w-3.5 h-3.5" />
              How to Run
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 flex overflow-x-auto gap-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${activeTab === 'search' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600'}`}
        >
          Search GUI
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('corpus')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${activeTab === 'corpus' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600'}`}
        >
          Corpus ({invertedIndex.getStats().totalDocuments})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('index')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${activeTab === 'index' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600'}`}
        >
          Inverted Index
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('wildcard')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${activeTab === 'wildcard' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600'}`}
        >
          Wildcard
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('normalization')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap ${activeTab === 'normalization' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600'}`}
        >
          Stem / Lemma
        </button>
      </div>

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'search' && (
          <SearchInterface
            index={invertedIndex}
            queryProcessor={queryProcessor}
            onRebuildIndex={handleRebuildIndex}
            currentMode={normalizationMode}
            stopwordsEnabled={stopwordsEnabled}
          />
        )}

        {activeTab === 'corpus' && (
          <CorpusManager
            documentLoader={documentLoader}
            documents={documentLoader.getAllDocuments()}
            onDocumentsChanged={handleDocumentsChanged}
          />
        )}

        {activeTab === 'index' && (
          <IndexExplorer index={invertedIndex} />
        )}

        {activeTab === 'wildcard' && (
          <WildcardLab
            wildcardProcessor={wildcardProcessor}
            index={invertedIndex}
          />
        )}

        {activeTab === 'normalization' && (
          <NormalizationPlayground />
        )}
      </main>

      {/* Footer with Unboxed Metadata */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span>Web Search Mining Project</span>
            <span aria-hidden="true">·</span>
            <span>Modules 1–7</span>
            <span aria-hidden="true">·</span>
            <span>Porter Stemmer & Lemmatization</span>
            <span aria-hidden="true">·</span>
            <span>Permuterm Wildcards</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowHowToRun(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline underline-offset-2 cursor-pointer"
            >
              How to Run Guide
            </button>
          </div>
        </div>
      </footer>

      {/* How to Run Modal */}
      <HowToRunModal isOpen={showHowToRun} onClose={() => setShowHowToRun(false)} />
    </div>
  );
}
