/**
 * Module 4: Inverted Index Construction
 * Constructs a positional inverted index from tokenized and normalized documents.
 * Stores dictionary entries, postings lists with term frequencies and positions,
 * and collection statistics for BM25 and TF-IDF relevance scoring.
 */

import { LoadedDocument } from './documentLoader';
import { Tokenizer, defaultTokenizer } from './tokenization';
import { TextNormalizer, defaultNormalizer, NormalizationMode } from './textNormalization';

export interface Posting {
  docId: string;
  termFrequency: number;
  positions: number[];
}

export interface DictionaryEntry {
  term: string;
  docFrequency: number;
  collectionFrequency: number;
  postings: Posting[];
}

export interface IndexStats {
  totalTerms: number;
  totalPostings: number;
  totalTokensIndexed: number;
  totalDocuments: number;
  avgDocLength: number;
  normalizationMode: NormalizationMode;
  buildTimeMs: number;
}

export interface InvertedIndexOptions {
  normalizationMode?: NormalizationMode;
  removeStopwords?: boolean;
}

export class InvertedIndex {
  private dictionary: Map<string, DictionaryEntry> = new Map();
  private docLengths: Map<string, number> = new Map();
  private documents: Map<string, LoadedDocument> = new Map();
  private tokenizer: Tokenizer;
  private normalizer: TextNormalizer;
  private normalizationMode: NormalizationMode = 'stemming';
  private removeStopwords = true;
  private totalTokensIndexed = 0;
  private lastBuildTimeMs = 0;

  constructor(options?: InvertedIndexOptions) {
    this.tokenizer = defaultTokenizer;
    this.normalizationMode = options?.normalizationMode || 'stemming';
    this.removeStopwords = options?.removeStopwords ?? true;
    this.normalizer = new TextNormalizer({
      mode: this.normalizationMode,
      removeStopwords: this.removeStopwords,
    });
  }

  /**
   * Build or rebuild the inverted index from an array of documents.
   */
  public buildIndex(docs: LoadedDocument[], options?: InvertedIndexOptions): IndexStats {
    const startTime = performance.now();
    this.clear();

    if (options?.normalizationMode) {
      this.normalizationMode = options.normalizationMode;
    }
    if (options?.removeStopwords !== undefined) {
      this.removeStopwords = options.removeStopwords;
    }

    this.normalizer = new TextNormalizer({
      mode: this.normalizationMode,
      removeStopwords: this.removeStopwords,
    });

    for (const doc of docs) {
      this.addDocument(doc);
    }

    this.lastBuildTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
    return this.getStats();
  }

  /**
   * Index a single document into the inverted index.
   */
  public addDocument(doc: LoadedDocument): void {
    this.documents.set(doc.id, doc);

    // 1. Tokenize document text
    const rawTokens = this.tokenizer.tokenize(doc.content);

    // 2. Text Normalization (Case Folding, Stopwords, Stemming/Lemmatization)
    const normalizedTokens = this.normalizer.normalizeTokens(rawTokens);

    // Store document length (number of normalized tokens)
    const docLength = normalizedTokens.length;
    this.docLengths.set(doc.id, docLength);
    this.totalTokensIndexed += docLength;

    // Build temporary map of term -> positions for this doc
    const docTerms = new Map<string, number[]>();

    for (const token of normalizedTokens) {
      const term = token.normalized;
      if (!term) continue;

      let positions = docTerms.get(term);
      if (!positions) {
        positions = [];
        docTerms.set(term, positions);
      }
      positions.push(token.position);
    }

    // Merge into global inverted index dictionary
    for (const [term, positions] of docTerms.entries()) {
      let entry = this.dictionary.get(term);
      if (!entry) {
        entry = {
          term,
          docFrequency: 0,
          collectionFrequency: 0,
          postings: [],
        };
        this.dictionary.set(term, entry);
      }

      entry.docFrequency += 1;
      entry.collectionFrequency += positions.length;
      entry.postings.push({
        docId: doc.id,
        termFrequency: positions.length,
        positions,
      });
    }
  }

  /**
   * Retrieve the postings list for a specific normalized term.
   */
  public getPostings(term: string): Posting[] | undefined {
    return this.dictionary.get(term)?.postings;
  }

  /**
   * Retrieve the full dictionary entry for a specific term.
   */
  public getEntry(term: string): DictionaryEntry | undefined {
    return this.dictionary.get(term);
  }

  /**
   * Check if a term exists in the inverted index vocabulary.
   */
  public hasTerm(term: string): boolean {
    return this.dictionary.has(term);
  }

  /**
   * Retrieve all terms present in the vocabulary.
   */
  public getAllTerms(): string[] {
    return Array.from(this.dictionary.keys()).sort();
  }

  /**
   * Retrieve all dictionary entries.
   */
  public getAllEntries(): DictionaryEntry[] {
    return Array.from(this.dictionary.values()).sort((a, b) => a.term.localeCompare(b.term));
  }

  /**
   * Retrieve document by its ID.
   */
  public getDocument(docId: string): LoadedDocument | undefined {
    return this.documents.get(docId);
  }

  /**
   * Retrieve all indexed documents.
   */
  public getAllDocuments(): LoadedDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * Retrieve length (token count) of a document.
   */
  public getDocLength(docId: string): number {
    return this.docLengths.get(docId) || 1;
  }

  /**
   * Retrieve current normalization mode used by this index.
   */
  public getNormalizationMode(): NormalizationMode {
    return this.normalizationMode;
  }

  /**
   * Retrieve normalizer instance configured for this index.
   */
  public getNormalizer(): TextNormalizer {
    return this.normalizer;
  }

  /**
   * Calculate index summary statistics.
   */
  public getStats(): IndexStats {
    let totalPostings = 0;
    for (const entry of this.dictionary.values()) {
      totalPostings += entry.postings.length;
    }

    const docCount = this.documents.size;
    const avgDocLength = docCount > 0 ? Math.round((this.totalTokensIndexed / docCount) * 10) / 10 : 0;

    return {
      totalTerms: this.dictionary.size,
      totalPostings,
      totalTokensIndexed: this.totalTokensIndexed,
      totalDocuments: docCount,
      avgDocLength,
      normalizationMode: this.normalizationMode,
      buildTimeMs: this.lastBuildTimeMs,
    };
  }

  /**
   * Clear the index.
   */
  public clear(): void {
    this.dictionary.clear();
    this.docLengths.clear();
    this.documents.clear();
    this.totalTokensIndexed = 0;
  }
}
