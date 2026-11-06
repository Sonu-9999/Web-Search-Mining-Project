/**
 * Module 5: Wildcard Processing
 * Implements Wildcard Retrieval using the classic Permuterm Index and K-Gram/Regex
 * filtering to expand wildcard patterns (e.g. "comput*", "*search", "c*ing", "*data*")
 * into matching vocabulary terms from the Inverted Index.
 */

import { InvertedIndex } from './invertedIndex';

export interface PermutermEntry {
  rotation: string;
  originalTerm: string;
}

export interface WildcardMatchResult {
  pattern: string;
  rotatedQuery: string;
  matchedTerms: string[];
  totalMatches: number;
  lookupType: 'suffix' | 'prefix' | 'infix' | 'multiple';
  executionTimeMs: number;
}

export class WildcardProcessor {
  /**
   * Permuterm index mapping: rotation string -> original term
   */
  private permutermMap: Map<string, string> = new Map();
  /**
   * Sorted list of all rotations for binary search prefix queries
   */
  private sortedRotations: string[] = [];
  private vocabulary: string[] = [];

  constructor(invertedIndex?: InvertedIndex) {
    if (invertedIndex) {
      this.buildFromIndex(invertedIndex);
    }
  }

  /**
   * Build the Permuterm Index from an Inverted Index's vocabulary.
   */
  public buildFromIndex(invertedIndex: InvertedIndex): void {
    const terms = invertedIndex.getAllTerms();
    this.buildFromVocabulary(terms);
  }

  /**
   * Build the Permuterm Index from an arbitrary list of vocabulary terms.
   */
  public buildFromVocabulary(terms: string[]): void {
    this.permutermMap.clear();
    this.vocabulary = [...terms];

    for (const term of terms) {
      const rotations = this.generateRotations(term);
      for (const rot of rotations) {
        this.permutermMap.set(rot, term);
      }
    }

    // Sort rotations alphabetically to facilitate fast prefix lookups
    this.sortedRotations = Array.from(this.permutermMap.keys()).sort();
  }

  /**
   * Generate all circular shifts of a term appended with the terminal symbol '$'.
   * Example: "mine" -> "mine$", "ine$m", "ne$mi", "e$min", "$mine"
   */
  public generateRotations(term: string): string[] {
    const rotations: string[] = [];
    const extended = term + '$';
    const len = extended.length;

    for (let i = 0; i < len; i++) {
      const rot = extended.slice(i) + extended.slice(0, i);
      rotations.push(rot);
    }

    return rotations;
  }

  /**
   * Transform a wildcard pattern into a permuterm query string where the '*' is rotated to the end.
   */
  public rotateWildcardQuery(pattern: string): { rotated: string; lookupType: 'suffix' | 'prefix' | 'infix' | 'multiple' } {
    const cleanPattern = pattern.trim();
    const starCount = (cleanPattern.match(/\*/g) || []).length;

    if (starCount === 0) {
      return { rotated: cleanPattern + '$', lookupType: 'suffix' };
    }

    // Single wildcard cases
    if (starCount === 1) {
      const starIndex = cleanPattern.indexOf('*');

      // Case 1: Trailing wildcard (e.g. "comput*") -> rotate to "$comput*"
      if (cleanPattern.endsWith('*')) {
        const prefix = cleanPattern.slice(0, -1);
        return { rotated: '$' + prefix + '*', lookupType: 'suffix' };
      }

      // Case 2: Leading wildcard (e.g. "*search") -> rotate to "search$*"
      if (cleanPattern.startsWith('*')) {
        const suffix = cleanPattern.slice(1);
        return { rotated: suffix + '$*', lookupType: 'prefix' };
      }

      // Case 3: Infix wildcard (e.g. "c*ing") -> rotate to "ing$c*"
      const prefix = cleanPattern.slice(0, starIndex);
      const suffix = cleanPattern.slice(starIndex + 1);
      return { rotated: suffix + '$' + prefix + '*', lookupType: 'infix' };
    }

    // Multiple wildcards (e.g. "*min*", "c*m*ing") -> lookup initial anchor and verify with regex
    return { rotated: cleanPattern, lookupType: 'multiple' };
  }

  /**
   * Execute a wildcard query to retrieve all matching vocabulary terms.
   */
  public query(pattern: string): WildcardMatchResult {
    const startTime = performance.now();
    const cleanPattern = pattern.trim().toLowerCase();

    // Check if query is actually a wildcard query
    if (!cleanPattern.includes('*')) {
      const matched = this.vocabulary.includes(cleanPattern) ? [cleanPattern] : [];
      return {
        pattern: cleanPattern,
        rotatedQuery: cleanPattern + '$',
        matchedTerms: matched,
        totalMatches: matched.length,
        lookupType: 'suffix',
        executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      };
    }

    const { rotated, lookupType } = this.rotateWildcardQuery(cleanPattern);
    const matchedTermsSet = new Set<string>();

    if (lookupType !== 'multiple') {
      // Find all permuterms starting with the rotated prefix before the trailing '*'
      const queryPrefix = rotated.replace(/\*$/, '');

      // Binary search / sorted prefix scan
      const startIndex = this.findFirstPrefixIndex(queryPrefix);
      if (startIndex !== -1) {
        for (let i = startIndex; i < this.sortedRotations.length; i++) {
          const rot = this.sortedRotations[i];
          if (rot.startsWith(queryPrefix)) {
            const original = this.permutermMap.get(rot);
            if (original) {
              matchedTermsSet.add(original);
            }
          } else {
            break;
          }
        }
      }
    } else {
      // Multiple wildcards fallback: convert wildcard pattern to regex
      // E.g. "*min*" -> "^.*min.*$"
      const regexPattern = new RegExp(
        '^' + cleanPattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*') + '$',
        'i'
      );

      for (const term of this.vocabulary) {
        if (regexPattern.test(term)) {
          matchedTermsSet.add(term);
        }
      }
    }

    const matchedTerms = Array.from(matchedTermsSet).sort();
    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      pattern: cleanPattern,
      rotatedQuery: rotated,
      matchedTerms,
      totalMatches: matchedTerms.length,
      lookupType,
      executionTimeMs,
    };
  }

  /**
   * Binary search for the first index in sortedRotations that starts with prefix.
   */
  private findFirstPrefixIndex(prefix: string): number {
    let low = 0;
    let high = this.sortedRotations.length - 1;
    let result = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const val = this.sortedRotations[mid];

      if (val >= prefix) {
        if (val.startsWith(prefix)) {
          result = mid;
        }
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    return result;
  }

  /**
   * Retrieve total number of permuterm rotations indexed.
   */
  public getTotalRotations(): number {
    return this.permutermMap.size;
  }

  /**
   * Sample rotations for inspection in the GUI.
   */
  public getSampleRotations(limit = 20): PermutermEntry[] {
    const samples: PermutermEntry[] = [];
    let count = 0;
    for (const [rotation, originalTerm] of this.permutermMap.entries()) {
      samples.push({ rotation, originalTerm });
      count++;
      if (count >= limit) break;
    }
    return samples;
  }
}
