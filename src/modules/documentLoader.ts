/**
 * Module 1: Document Loading
 * Handles ingesting, validating, parsing, and storing documents
 * from internal collections, raw text, or external JSON/text files.
 */

import { DEFAULT_CORPUS, RawDocument } from '../data/defaultCorpus';

export interface LoadedDocument {
  id: string;
  title: string;
  url?: string;
  category?: string;
  content: string;
  tokenCount?: number;
  loadedAt: number;
}

export interface CorpusStats {
  totalDocuments: number;
  totalCharacters: number;
  categories: Record<string, number>;
}

export class DocumentLoader {
  private documents: Map<string, LoadedDocument> = new Map();

  constructor(initialDocs?: RawDocument[]) {
    if (initialDocs && initialDocs.length > 0) {
      this.loadRawDocuments(initialDocs);
    } else {
      this.loadDefaultCorpus();
    }
  }

  /**
   * Load the built-in default web search & mining dataset.
   */
  public loadDefaultCorpus(): LoadedDocument[] {
    this.documents.clear();
    return this.loadRawDocuments(DEFAULT_CORPUS);
  }

  /**
   * Load an array of raw documents.
   */
  public loadRawDocuments(rawDocs: RawDocument[]): LoadedDocument[] {
    const loaded: LoadedDocument[] = [];
    for (const doc of rawDocs) {
      const loadedDoc: LoadedDocument = {
        id: doc.id.trim(),
        title: doc.title.trim(),
        url: doc.url,
        category: doc.category,
        content: doc.content.trim(),
        loadedAt: Date.now(),
      };
      this.documents.set(loadedDoc.id, loadedDoc);
      loaded.push(loadedDoc);
    }
    return loaded;
  }

  /**
   * Add a single document manually.
   */
  public addDocument(
    id: string,
    title: string,
    content: string,
    category = 'Custom',
    url?: string
  ): LoadedDocument {
    const cleanId = id.trim() || `DOC-${String(this.documents.size + 1).padStart(2, '0')}`;
    const loadedDoc: LoadedDocument = {
      id: cleanId,
      title: title.trim() || 'Untitled Document',
      content: content.trim(),
      category,
      url,
      loadedAt: Date.now(),
    };
    this.documents.set(loadedDoc.id, loadedDoc);
    return loadedDoc;
  }

  /**
   * Parse a JSON string representing an array of documents.
   */
  public parseJson(jsonString: string): LoadedDocument[] {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid JSON format: Expected an array of documents.');
    }

    const loadedDocs: LoadedDocument[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (!item.content && !item.body && !item.text) {
        continue;
      }
      const loadedDoc: LoadedDocument = {
        id: String(item.id || `IMPORT-${i + 1}`).trim(),
        title: String(item.title || `Document ${i + 1}`).trim(),
        content: String(item.content || item.body || item.text).trim(),
        category: item.category ? String(item.category) : 'Imported',
        url: item.url ? String(item.url) : undefined,
        loadedAt: Date.now(),
      };
      this.documents.set(loadedDoc.id, loadedDoc);
      loadedDocs.push(loadedDoc);
    }
    return loadedDocs;
  }

  /**
   * Remove a document by ID.
   */
  public removeDocument(id: string): boolean {
    return this.documents.delete(id);
  }

  /**
   * Retrieve a document by ID.
   */
  public getDocument(id: string): LoadedDocument | undefined {
    return this.documents.get(id);
  }

  /**
   * Retrieve all currently loaded documents.
   */
  public getAllDocuments(): LoadedDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * Retrieve summary statistics of the loaded corpus.
   */
  public getCorpusStats(): CorpusStats {
    let totalChars = 0;
    const categories: Record<string, number> = {};

    for (const doc of this.documents.values()) {
      totalChars += doc.content.length;
      const cat = doc.category || 'General';
      categories[cat] = (categories[cat] || 0) + 1;
    }

    return {
      totalDocuments: this.documents.size,
      totalCharacters: totalChars,
      categories,
    };
  }

  /**
   * Clear all documents.
   */
  public clear(): void {
    this.documents.clear();
  }
}
