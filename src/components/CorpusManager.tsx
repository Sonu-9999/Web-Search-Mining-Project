/**
 * Component for Module 1: Document Loading & Corpus Management
 * Allows inspecting the loaded collection, viewing full document text,
 * adding custom documents, and importing JSON corpus files.
 */

import React, { useState } from 'react';
import { Plus, RefreshCw, Upload, Eye, Trash2, Database } from 'lucide-react';
import { DocumentLoader, LoadedDocument } from '../modules/documentLoader';

interface CorpusManagerProps {
  documentLoader: DocumentLoader;
  documents: LoadedDocument[];
  onDocumentsChanged: () => void;
}

export const CorpusManager: React.FC<CorpusManagerProps> = ({
  documentLoader,
  documents,
  onDocumentsChanged,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<LoadedDocument | null>(documents[0] || null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Mining');
  const [newContent, setNewContent] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const stats = documentLoader.getCorpusStats();

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const id = `DOC-${String(documents.length + 1).padStart(2, '0')}`;
    const added = documentLoader.addDocument(id, newTitle || 'Custom Article', newContent, newCategory, newUrl);
    onDocumentsChanged();
    setSelectedDoc(added);
    setNewTitle('');
    setNewContent('');
    setNewUrl('');
    setShowAddForm(false);
  };

  const handleResetDefault = () => {
    documentLoader.loadDefaultCorpus();
    onDocumentsChanged();
    const all = documentLoader.getAllDocuments();
    setSelectedDoc(all[0] || null);
  };

  const handleDelete = (id: string) => {
    documentLoader.removeDocument(id);
    onDocumentsChanged();
    const remaining = documentLoader.getAllDocuments();
    if (selectedDoc?.id === id) {
      setSelectedDoc(remaining[0] || null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Corpus Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 font-medium">Total Documents</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {stats.totalDocuments}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 font-medium">Total Character Volume</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {stats.totalCharacters.toLocaleString()}
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 font-medium">Categories Indexed</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {Object.keys(stats.categories).length}
          </div>
        </div>
      </div>

      {/* Main Split: Document List & Document Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document List (Left 5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-[650px] overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Document Repository</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 rounded-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
              <button
                type="button"
                onClick={handleResetDefault}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                title="Reset to default IR dataset"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 flex-1">
            {documents.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3.5 text-xs transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800/80 font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{doc.id}</span>
                      <span>·</span>
                      <span>{doc.category}</span>
                    </div>
                    <div className="text-slate-900 dark:text-slate-100 font-semibold truncate">
                      {doc.title}
                    </div>
                    <div className="text-slate-500 line-clamp-1">
                      {doc.content}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Document Viewer / Add Document Form (Right 7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-[650px] overflow-y-auto">
          {showAddForm ? (
            <form onSubmit={handleAddDocument} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Add Document to Corpus
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Crawlers and Robot Exclusion"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Crawling">Crawling</option>
                    <option value="Indexing">Indexing</option>
                    <option value="Ranking">Ranking</option>
                    <option value="Mining">Mining</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.org/article"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Document Content (Unstructured Text)
                </label>
                <textarea
                  required
                  rows={10}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste or write raw article content here. The tokenization and text normalization pipeline will automatically ingest and index it."
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-md hover:bg-slate-800"
                >
                  Ingest & Index
                </button>
              </div>
            </form>
          ) : selectedDoc ? (
            <div className="space-y-4">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedDoc.id}</span>
                  <span>·</span>
                  <span>Category: {selectedDoc.category}</span>
                  {selectedDoc.url && (
                    <>
                      <span>·</span>
                      <a
                        href={selectedDoc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-600 dark:text-slate-400 hover:underline truncate max-w-sm"
                      >
                        {selectedDoc.url}
                      </a>
                    </>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedDoc.title}
                </h2>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Raw Document Text Body
                </h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs leading-relaxed text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 font-sans whitespace-pre-wrap">
                  {selectedDoc.content}
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Character Count: {selectedDoc.content.length}</span>
                <span>Word Count: ~{selectedDoc.content.split(/\s+/).filter(Boolean).length}</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Select a document to inspect its raw text.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
