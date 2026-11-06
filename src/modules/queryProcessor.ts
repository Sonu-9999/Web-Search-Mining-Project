/**
 * Module 6: Query Processing
 * Parses user search queries, expands wildcard patterns via the Permuterm Index,
 * normalizes terms according to the active index configuration, evaluates
 * Boolean logic (AND, OR, NOT), verifies exact phrase queries using positional
 * postings, and ranks results with BM25 / TF-IDF scoring functions.
 */

import { InvertedIndex, Posting } from './invertedIndex';
import { WildcardProcessor } from './wildcardProcessor';
import { Tokenizer, defaultTokenizer } from './tokenization';
import { TextNormalizer } from './textNormalization';
import { LoadedDocument } from './documentLoader';

export type RankingModel = 'bm25' | 'tfidf' | 'boolean';

export interface QueryOptions {
  model?: RankingModel;
  bm25K1?: number; // default 1.2
  bm25B?: number;  // default 0.75
  maxResults?: number;
}

export interface PipelineTraceStep {
  stepNumber: number;
  name: string;
  description: string;
  data: unknown;
}

export interface MatchedDocument {
  docId: string;
  title: string;
  url?: string;
  category?: string;
  score: number;
  matchedTerms: string[];
  termFrequencies: Record<string, number>;
  snippet: string;
  matchedSpans: { start: number; end: number }[];
}

export interface QueryResult {
  query: string;
  model: RankingModel;
  totalMatches: number;
  executionTimeMs: number;
  documents: MatchedDocument[];
  expandedTerms: Record<string, string[]>;
  pipelineTrace: PipelineTraceStep[];
}

export class QueryProcessor {
  private index: InvertedIndex;
  private wildcardProcessor: WildcardProcessor;
  private tokenizer: Tokenizer;

  constructor(index: InvertedIndex, wildcardProcessor?: WildcardProcessor) {
    this.index = index;
    this.wildcardProcessor = wildcardProcessor || new WildcardProcessor(index);
    this.tokenizer = defaultTokenizer;
  }

  public setIndex(index: InvertedIndex): void {
    this.index = index;
    this.wildcardProcessor.buildFromIndex(index);
  }

  /**
   * Main query execution entry point.
   */
  public execute(queryString: string, options?: QueryOptions): QueryResult {
    const startTime = performance.now();
    const query = queryString.trim();
    const model = options?.model || 'bm25';
    const trace: PipelineTraceStep[] = [];
    const expandedTerms: Record<string, string[]> = {};

    if (!query) {
      return {
        query: '',
        model,
        totalMatches: 0,
        executionTimeMs: 0,
        documents: [],
        expandedTerms: {},
        pipelineTrace: [
          {
            stepNumber: 1,
            name: 'Empty Query',
            description: 'No search query provided.',
            data: { query: '' },
          },
        ],
      };
    }

    // STEP 1: Query Ingestion & Lexical Parsing
    const rawTokens = this.parseQueryTokens(query);
    trace.push({
      stepNumber: 1,
      name: 'Query Lexical Parsing',
      description: 'Extracted raw tokens, identified phrases, Boolean operators, and wildcard patterns.',
      data: { rawTokens },
    });

    // STEP 2: Wildcard Processing & Normalization
    const normalizer = this.index.getNormalizer();
    const processedQueryTerms: {
      original: string;
      isWildcard: boolean;
      isPhrase: boolean;
      isBooleanOperator: boolean;
      expandedTokens: string[];
    }[] = [];

    for (const token of rawTokens) {
      if (token.type === 'operator') {
        processedQueryTerms.push({
          original: token.value,
          isWildcard: false,
          isPhrase: false,
          isBooleanOperator: true,
          expandedTokens: [token.value],
        });
      } else if (token.type === 'phrase') {
        // Phrase query: tokenize and normalize each phrase word
        const phraseWords = this.tokenizer.tokenizeToStrings(token.value);
        const normPhraseWords = phraseWords.map((w) =>
          normalizer.normalizeString(w, { removeStopwords: false })
        );
        processedQueryTerms.push({
          original: token.value,
          isWildcard: false,
          isPhrase: true,
          isBooleanOperator: false,
          expandedTokens: normPhraseWords,
        });
      } else if (token.value.includes('*')) {
        // Wildcard term: expand via Permuterm Index!
        const wildcardResult = this.wildcardProcessor.query(token.value);
        expandedTerms[token.value] = wildcardResult.matchedTerms;

        processedQueryTerms.push({
          original: token.value,
          isWildcard: true,
          isPhrase: false,
          isBooleanOperator: false,
          expandedTokens: wildcardResult.matchedTerms,
        });
      } else {
        // Standard term: normalize using the exact same normalization pipeline as the inverted index!
        const normalized = normalizer.normalizeString(token.value);
        if (normalized) {
          processedQueryTerms.push({
            original: token.value,
            isWildcard: false,
            isPhrase: false,
            isBooleanOperator: false,
            expandedTokens: [normalized],
          });
        }
      }
    }

    trace.push({
      stepNumber: 2,
      name: 'Text Normalization & Wildcard Expansion',
      description: `Normalized search terms via ${this.index.getNormalizationMode()} and expanded wildcard expressions using Permuterm indexing.`,
      data: {
        normalizationMode: this.index.getNormalizationMode(),
        processedQueryTerms,
        expandedWildcards: expandedTerms,
      },
    });

    // STEP 3: Check Query Type (Boolean vs Ranked vs Phrase)
    const hasBooleanOperators = rawTokens.some((t) => t.type === 'operator');
    const hasPhrase = rawTokens.some((t) => t.type === 'phrase');

    let matchedDocs: MatchedDocument[] = [];

    if (hasBooleanOperators) {
      matchedDocs = this.evaluateBooleanQuery(processedQueryTerms, trace);
    } else if (hasPhrase) {
      matchedDocs = this.evaluatePhraseAndTermsQuery(processedQueryTerms, model, options, trace);
    } else {
      matchedDocs = this.evaluateRankedQuery(processedQueryTerms, model, options, trace);
    }

    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    trace.push({
      stepNumber: trace.length + 1,
      name: 'Result Synthesis & Snippet Generation',
      description: `Ranked ${matchedDocs.length} matching documents and generated highlighted contextual snippets.`,
      data: {
        totalResults: matchedDocs.length,
        executionTimeMs,
        rankingModel: model,
      },
    });

    return {
      query,
      model,
      totalMatches: matchedDocs.length,
      executionTimeMs,
      documents: matchedDocs,
      expandedTerms,
      pipelineTrace: trace,
    };
  }

  /**
   * Parse query into lexical tokens: phrases ("..."), operators (AND, OR, NOT), or words.
   */
  private parseQueryTokens(query: string): { type: 'word' | 'phrase' | 'operator'; value: string }[] {
    const tokens: { type: 'word' | 'phrase' | 'operator'; value: string }[] = [];
    const regex = /"([^"]+)"|(\bAND\b|\bOR\b|\bNOT\b|\(|\))|([^\s"()]+)/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(query)) !== null) {
      if (match[1] !== undefined) {
        // Quoted phrase
        tokens.push({ type: 'phrase', value: match[1] });
      } else if (match[2] !== undefined) {
        // Boolean operator
        tokens.push({ type: 'operator', value: match[2].toUpperCase() });
      } else if (match[3] !== undefined) {
        // Standard word or wildcard
        const word = match[3];
        if (word.toUpperCase() === 'AND' || word.toUpperCase() === 'OR' || word.toUpperCase() === 'NOT') {
          tokens.push({ type: 'operator', value: word.toUpperCase() });
        } else {
          tokens.push({ type: 'word', value: word });
        }
      }
    }

    return tokens;
  }

  /**
   * Evaluate free-text query with BM25 or TF-IDF scoring.
   */
  private evaluateRankedQuery(
    processedTerms: { expandedTokens: string[]; original: string }[],
    model: RankingModel,
    options: QueryOptions | undefined,
    trace: PipelineTraceStep[]
  ): MatchedDocument[] {
    const allQueryTokens: string[] = [];
    for (const item of processedTerms) {
      allQueryTokens.push(...item.expandedTokens);
    }

    const uniqueTokens = Array.from(new Set(allQueryTokens));
    const allDocs = this.index.getAllDocuments();
    const N = allDocs.length;
    const avgDocLength = this.index.getStats().avgDocLength;
    const k1 = options?.bm25K1 ?? 1.2;
    const b = options?.bm25B ?? 0.75;

    // Map docId -> score & matched terms
    const docScores = new Map<string, { score: number; terms: Set<string>; tfs: Record<string, number> }>();

    for (const term of uniqueTokens) {
      const entry = this.index.getEntry(term);
      if (!entry) continue;

      const df = entry.docFrequency;
      // Inverse document frequency (IDF) with smoothing
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);

      for (const posting of entry.postings) {
        const docId = posting.docId;
        const tf = posting.termFrequency;
        const docLen = this.index.getDocLength(docId);

        let termScore = 0;
        if (model === 'bm25') {
          // BM25 term weighting
          const numerator = tf * (k1 + 1);
          const denominator = tf + k1 * (1 - b + b * (docLen / (avgDocLength || 1)));
          termScore = idf * (numerator / denominator);
        } else {
          // TF-IDF cosine / logarithmic weighting
          const tfWeight = 1 + Math.log(tf);
          const idfWeight = Math.log((N + 1) / (df + 1)) + 1;
          termScore = tfWeight * idfWeight;
        }

        let record = docScores.get(docId);
        if (!record) {
          record = { score: 0, terms: new Set<string>(), tfs: {} };
          docScores.set(docId, record);
        }

        record.score += termScore;
        record.terms.add(term);
        record.tfs[term] = tf;
      }
    }

    trace.push({
      stepNumber: 3,
      name: 'Ranked Relevance Computation',
      description: `Evaluated ${uniqueTokens.length} active query terms against the inverted index using ${model.toUpperCase()} scoring function.`,
      data: {
        activeTerms: uniqueTokens,
        evaluatedDocuments: docScores.size,
        scoringParameters: model === 'bm25' ? { k1, b, avgDocLength, collectionSize: N } : { model: 'TF-IDF' },
      },
    });

    const results: MatchedDocument[] = [];
    for (const [docId, record] of docScores.entries()) {
      const doc = this.index.getDocument(docId);
      if (!doc) continue;

      const matchedTermsList = Array.from(record.terms);
      const snippetResult = this.generateSnippet(doc.content, matchedTermsList);

      results.push({
        docId,
        title: doc.title,
        url: doc.url,
        category: doc.category,
        score: Math.round(record.score * 1000) / 1000,
        matchedTerms: matchedTermsList,
        termFrequencies: record.tfs,
        snippet: snippetResult.snippet,
        matchedSpans: snippetResult.spans,
      });
    }

    // Sort descending by relevance score
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  /**
   * Evaluate Phrase Queries along with free-text terms.
   */
  private evaluatePhraseAndTermsQuery(
    processedTerms: { original: string; isPhrase: boolean; expandedTokens: string[] }[],
    model: RankingModel,
    options: QueryOptions | undefined,
    trace: PipelineTraceStep[]
  ): MatchedDocument[] {
    const phraseItems = processedTerms.filter((t) => t.isPhrase);
    const standardTerms = processedTerms.filter((t) => !t.isPhrase);

    // Find candidate docs matching the exact phrases using Positional Index
    const phraseMatchingDocs = new Set<string>();
    let firstPhrase = true;

    for (const phrase of phraseItems) {
      const phraseTokens = phrase.expandedTokens;
      const matchingDocsForThisPhrase = this.evaluatePositionalPhrase(phraseTokens);

      if (firstPhrase) {
        for (const id of matchingDocsForThisPhrase) phraseMatchingDocs.add(id);
        firstPhrase = false;
      } else {
        // Intersect
        for (const id of Array.from(phraseMatchingDocs)) {
          if (!matchingDocsForThisPhrase.has(id)) {
            phraseMatchingDocs.delete(id);
          }
        }
      }
    }

    trace.push({
      stepNumber: 3,
      name: 'Positional Phrase Verification',
      description: 'Verified consecutive word positions in postings lists for exact phrase queries.',
      data: {
        phrases: phraseItems.map((p) => p.original),
        documentsPassingPhraseConstraint: Array.from(phraseMatchingDocs),
      },
    });

    if (phraseMatchingDocs.size === 0) {
      return [];
    }

    // Now score candidate documents using BM25
    const rankedResults = this.evaluateRankedQuery(
      phraseItems.concat(standardTerms),
      model,
      options,
      trace
    );

    // Filter by phrase-compliant doc IDs and give bonus for exact phrase match
    return rankedResults
      .filter((r) => phraseMatchingDocs.has(r.docId))
      .map((r) => ({ ...r, score: Math.round((r.score + 5.0) * 1000) / 1000 }));
  }

  /**
   * Check positional adjacency across consecutive tokens for exact phrase queries.
   */
  private evaluatePositionalPhrase(tokens: string[]): Set<string> {
    if (tokens.length === 0) return new Set();
    if (tokens.length === 1) {
      const postings = this.index.getPostings(tokens[0]) || [];
      return new Set(postings.map((p) => p.docId));
    }

    // Retrieve postings for each token in the phrase
    const postingsList: Posting[][] = [];
    for (const t of tokens) {
      const p = this.index.getPostings(t);
      if (!p || p.length === 0) {
        return new Set(); // term missing from index, phrase cannot match
      }
      postingsList.push(p);
    }

    // Intersect documents common to all tokens
    let candidateDocIds = new Set(postingsList[0].map((p) => p.docId));
    for (let i = 1; i < postingsList.length; i++) {
      const currentDocIds = new Set(postingsList[i].map((p) => p.docId));
      candidateDocIds = new Set(Array.from(candidateDocIds).filter((id) => currentDocIds.has(id)));
    }

    const matchingDocIds = new Set<string>();

    // For each candidate document, verify consecutive position adjacency
    for (const docId of candidateDocIds) {
      const docPostings = postingsList.map((list) => list.find((p) => p.docId === docId)!);
      let matchFound = false;

      // Positions of the first word
      const firstPositions = docPostings[0].positions;

      for (const pos of firstPositions) {
        let isConsecutive = true;
        for (let k = 1; k < docPostings.length; k++) {
          const expectedPos = pos + k;
          if (!docPostings[k].positions.includes(expectedPos)) {
            isConsecutive = false;
            break;
          }
        }
        if (isConsecutive) {
          matchFound = true;
          break;
        }
      }

      if (matchFound) {
        matchingDocIds.add(docId);
      }
    }

    return matchingDocIds;
  }

  /**
   * Evaluate Boolean retrieval queries (AND, OR, NOT).
   */
  private evaluateBooleanQuery(
    processedTerms: {
      original: string;
      isBooleanOperator: boolean;
      expandedTokens: string[];
    }[],
    trace: PipelineTraceStep[]
  ): MatchedDocument[] {
    const allDocIds = new Set(this.index.getAllDocuments().map((d) => d.id));

    // Convert processed terms into a sequence of Document Sets
    let currentSet: Set<string> | null = null;
    let nextOperator: 'AND' | 'OR' | 'NOT' = 'AND';
    const matchedTermsMap: Record<string, Set<string>> = {};

    for (const item of processedTerms) {
      if (item.isBooleanOperator) {
        const op = item.original.toUpperCase();
        if (op === 'AND' || op === 'OR' || op === 'NOT') {
          nextOperator = op;
        }
        continue;
      }

      // Determine matching docs for this term / wildcard expansion
      const termDocs = new Set<string>();
      for (const t of item.expandedTokens) {
        const postings = this.index.getPostings(t) || [];
        for (const p of postings) {
          termDocs.add(p.docId);
          if (!matchedTermsMap[p.docId]) matchedTermsMap[p.docId] = new Set();
          matchedTermsMap[p.docId].add(t);
        }
      }

      if (currentSet === null) {
        if (nextOperator === 'NOT') {
          currentSet = new Set<string>(Array.from(allDocIds).filter((id: string) => !termDocs.has(id)));
        } else {
          currentSet = new Set<string>(termDocs);
        }
      } else {
        const existingDocs: string[] = Array.from(currentSet as Set<string>);
        if (nextOperator === 'AND') {
          currentSet = new Set<string>(existingDocs.filter((id: string) => termDocs.has(id)));
        } else if (nextOperator === 'OR') {
          currentSet = new Set<string>([...existingDocs, ...Array.from(termDocs)]);
        } else if (nextOperator === 'NOT') {
          currentSet = new Set<string>(existingDocs.filter((id: string) => !termDocs.has(id)));
        }
      }

      nextOperator = 'AND'; // default operator between adjacent terms
    }

    const finalDocIds = currentSet || new Set<string>();

    trace.push({
      stepNumber: 3,
      name: 'Boolean Logic Evaluation',
      description: 'Performed set intersections (AND), unions (OR), and differences (NOT) on postings lists.',
      data: {
        matchingDocIds: Array.from(finalDocIds),
        totalMatchingDocs: finalDocIds.size,
      },
    });

    const results: MatchedDocument[] = [];
    for (const docId of finalDocIds) {
      const doc = this.index.getDocument(docId);
      if (!doc) continue;

      const matchedList = Array.from(matchedTermsMap[docId] || []);
      const snippetResult = this.generateSnippet(doc.content, matchedList);

      results.push({
        docId,
        title: doc.title,
        url: doc.url,
        category: doc.category,
        score: 1.0, // Boolean match score
        matchedTerms: matchedList,
        termFrequencies: {},
        snippet: snippetResult.snippet,
        matchedSpans: snippetResult.spans,
      });
    }

    return results;
  }

  /**
   * Generate an informative excerpt snippet around the first matched term with character spans.
   */
  private generateSnippet(
    content: string,
    matchedTerms: string[]
  ): { snippet: string; spans: { start: number; end: number }[] } {
    if (!content || matchedTerms.length === 0) {
      return {
        snippet: content.slice(0, 180) + (content.length > 180 ? '...' : ''),
        spans: [],
      };
    }

    // Find first occurrence of any matched term
    let bestIndex = -1;
    const lowerContent = content.toLowerCase();

    for (const term of matchedTerms) {
      const cleanTerm = term.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (!cleanTerm) continue;
      const idx = lowerContent.indexOf(cleanTerm);
      if (idx !== -1 && (bestIndex === -1 || idx < bestIndex)) {
        bestIndex = idx;
      }
    }

    const snippetRadius = 90;
    const start = Math.max(0, bestIndex - snippetRadius);
    const end = Math.min(content.length, bestIndex + snippetRadius);

    let snippet = content.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return {
      snippet,
      spans: [],
    };
  }
}
