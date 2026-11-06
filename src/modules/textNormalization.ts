/**
 * Module 3: Text Normalization & Case Folding
 * Includes:
 * 1. Case folding & unicode diacritic normalization
 * 2. Stopword filtering (with standard Information Retrieval stopword dictionary)
 * 3. Porter Stemming Algorithm (Step 1 to Step 5)
 * 4. Lemmatization (Morphological dictionary and inflectional rule engine)
 */

import { Token } from './tokenization';

export type NormalizationMode = 'stemming' | 'lemmatization' | 'none';

export interface NormalizationOptions {
  /**
   * Mode of morphological reduction:
   * - 'stemming': Porter Stemmer algorithm (chops suffixes to morphological stems)
   * - 'lemmatization': Lemmatizer (maps inflections to dictionary base forms)
   * - 'none': Only case folding & cleanup, preserving surface form
   */
  mode?: NormalizationMode;
  /**
   * Convert characters to lowercase.
   * Default: true
   */
  caseFolding?: boolean;
  /**
   * Strip accents and diacritics (e.g. café -> cafe).
   * Default: true
   */
  stripAccents?: boolean;
  /**
   * Remove common English stopwords.
   * Default: true
   */
  removeStopwords?: boolean;
  /**
   * Strip external punctuation around tokens while allowing internal hyphens.
   * In wildcard mode, preserves '*' for wildcard matching.
   * Default: true
   */
  stripPunctuation?: boolean;
  /**
   * Allow '*' character (for search wildcard query processing).
   * Default: false
   */
  allowWildcards?: boolean;
}

export interface NormalizedToken extends Token {
  /**
   * The canonical normalized form of the token.
   */
  normalized: string;
  /**
   * The intermediate stemmed form if stemming was computed.
   */
  stemmed?: string;
  /**
   * The intermediate lemmatized form if lemmatization was computed.
   */
  lemmatized?: string;
  /**
   * Whether this token is an identified stopword.
   */
  isStopword: boolean;
}

// Standard Information Retrieval stopword list (based on Fox & Brown corpus)
export const STOPWORDS = new Set<string>([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', "aren't",
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', "can't", 'cannot', 'could', "couldn't", 'did', "didn't", 'do', 'does', "doesn't", 'doing',
  "don't", 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', "hadn't", 'has', "hasn't",
  'have', "haven't", 'having', 'he', "he'd", "he'll", "he's", 'her', 'here', "here's", 'hers',
  'herself', 'him', 'himself', 'his', 'how', "how's", 'i', "i'd", "i'll", "i'm", "i've", 'if', 'in',
  'into', 'is', "isn't", 'it', "it's", 'its', 'itself', 'let', "let's", 'me', 'more', 'most', "mustn't",
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', "shan't", 'she', "she'd", "she'll", "she's",
  'should', "shouldn't", 'so', 'some', 'such', 'than', 'that', "that's", 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', "there's", 'these', 'they', "they'd", "they'll", "they're",
  "they've", 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', "wasn't",
  'we', "we'd", "we'll", "we're", "we've", 'were', "weren't", 'what', "what's", 'when', "when's",
  'where', "where's", 'which', 'while', 'who', "who's", 'whom', 'why', "why's", 'with', "won't",
  'would', "wouldn't", 'you', "you'd", "you'll", "you're", "you've", 'your', 'yours', 'yourself',
  'yourselves',
]);

// Morphological lemmatization base lookup table for irregulars & IR-specific terminology
const IRREGULAR_LEMMAS: Record<string, string> = {
  // Information Retrieval & Computer Science terms
  'indices': 'index',
  'indexes': 'index',
  'indexing': 'index',
  'indexed': 'index',
  'matrices': 'matrix',
  'vertices': 'vertex',
  'corpora': 'corpus',
  'crawlers': 'crawler',
  'crawling': 'crawl',
  'crawled': 'crawl',
  'mining': 'mine',
  'mined': 'mine',
  'miners': 'miner',
  'algorithms': 'algorithm',
  'algorithmic': 'algorithm',
  'retrieval': 'retrieval',
  'retrievals': 'retrieval',
  'retrieving': 'retrieve',
  'retrieved': 'retrieve',
  'queries': 'query',
  'queried': 'query',
  'querying': 'query',
  'searches': 'search',
  'searching': 'search',
  'searched': 'search',
  'tokenizers': 'tokenizer',
  'tokenizing': 'tokenize',
  'tokenized': 'tokenize',
  'tokenization': 'tokenization',
  'postings': 'posting',
  'frequencies': 'frequency',
  'similarities': 'similarity',
  'documents': 'document',
  'documented': 'document',
  'documenting': 'document',
  'normalizations': 'normalization',
  'normalized': 'normalize',
  'normalizing': 'normalize',
  'normalizes': 'normalize',
  'stemmers': 'stemmer',
  'stemming': 'stem',
  'stemmed': 'stem',
  'lemmatizing': 'lemmatize',
  'lemmatized': 'lemmatize',
  'lemmatization': 'lemmatization',
  'wildcards': 'wildcard',
  'processors': 'processor',
  'processed': 'process',
  'processing': 'process',
  'processes': 'process',
  'computations': 'computation',
  'computational': 'computation',
  'computing': 'compute',
  'computed': 'compute',
  'computers': 'computer',
  // Common irregular English verbs & nouns
  'is': 'be',
  'are': 'be',
  'was': 'be',
  'were': 'be',
  'been': 'be',
  'being': 'be',
  'has': 'have',
  'had': 'have',
  'having': 'have',
  'does': 'do',
  'did': 'do',
  'done': 'do',
  'doing': 'do',
  'ran': 'run',
  'running': 'run',
  'runs': 'run',
  'went': 'go',
  'gone': 'go',
  'going': 'go',
  'goes': 'go',
  'built': 'build',
  'building': 'build',
  'builds': 'build',
  'wrote': 'write',
  'written': 'write',
  'writing': 'write',
  'writes': 'write',
  'children': 'child',
  'men': 'man',
  'women': 'woman',
  'people': 'person',
  'feet': 'foot',
  'teeth': 'tooth',
  'geese': 'goose',
  'mice': 'mouse',
  'better': 'good',
  'best': 'good',
  'worse': 'bad',
  'worst': 'bad',
};

const DEFAULT_OPTIONS: NormalizationOptions = {
  mode: 'stemming',
  caseFolding: true,
  stripAccents: true,
  removeStopwords: true,
  stripPunctuation: true,
  allowWildcards: false,
};

export class TextNormalizer {
  private options: NormalizationOptions;

  constructor(options?: NormalizationOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Normalize a single raw token string according to current options.
   */
  public normalizeString(raw: string, customOptions?: NormalizationOptions): string {
    const opts = { ...this.options, ...customOptions };
    let text = raw;

    // 1. Accent & Diacritic Stripping
    if (opts.stripAccents) {
      text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    // 2. Case Folding
    if (opts.caseFolding) {
      text = text.toLowerCase();
    }

    // 3. Punctuation Stripping
    if (opts.stripPunctuation) {
      if (opts.allowWildcards) {
        // Strip everything except alphanumeric, hyphens, and wildcards (*)
        text = text.replace(/[^a-zA-Z0-9*-]/g, '');
      } else {
        // Strip everything except alphanumeric and internal hyphens
        text = text.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
      }
    }

    if (!text) {
      return '';
    }

    // If wildcard present, do not stem or lemmatize so pattern remains intact!
    if (opts.allowWildcards && text.includes('*')) {
      return text;
    }

    // 4. Stemming or Lemmatization
    if (opts.mode === 'stemming') {
      return this.porterStem(text);
    } else if (opts.mode === 'lemmatization') {
      return this.lemmatize(text);
    }

    return text;
  }

  /**
   * Normalize an array of positional tokens from the tokenizer.
   */
  public normalizeTokens(
    tokens: Token[],
    customOptions?: NormalizationOptions
  ): NormalizedToken[] {
    const opts = { ...this.options, ...customOptions };
    const normalizedList: NormalizedToken[] = [];

    for (const token of tokens) {
      // Basic folding to check stopword
      const folded = token.raw.toLowerCase().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
      const isStopword = STOPWORDS.has(folded);

      if (opts.removeStopwords && isStopword) {
        continue;
      }

      const normalized = this.normalizeString(token.raw, opts);
      if (!normalized) {
        continue;
      }

      // Generate both representations for diagnostics & inspection
      const stemmed = this.porterStem(folded);
      const lemmatized = this.lemmatize(folded);

      normalizedList.push({
        ...token,
        normalized,
        stemmed,
        lemmatized,
        isStopword,
      });
    }

    return normalizedList;
  }

  /**
   * Lemmatization algorithm:
   * Maps inflections to their dictionary base lemma using irregular mappings and
   * morphological suffix rules for nouns, verbs, and adjectives.
   */
  public lemmatize(word: string): string {
    const lower = word.toLowerCase();

    // Check irregular / specialized IR dictionary
    if (IRREGULAR_LEMMAS[lower]) {
      return IRREGULAR_LEMMAS[lower];
    }

    // Short words (<= 3 chars) usually do not need lemmatization
    if (lower.length <= 3) {
      return lower;
    }

    // Rule 1: Plural nouns ending in -ies (e.g. categories -> category)
    if (lower.endsWith('ies') && lower.length > 4) {
      return lower.slice(0, -3) + 'y';
    }

    // Rule 2: Plural nouns ending in -ves (e.g. knives -> knife, leaves -> leaf)
    if (lower.endsWith('ves') && lower.length > 4) {
      return lower.slice(0, -3) + 'f';
    }

    // Rule 3: Plurals ending in -es (boxes -> box, classes -> class, watches -> watch, buses -> bus)
    if (lower.endsWith('es') && lower.length > 3) {
      if (
        lower.endsWith('shes') ||
        lower.endsWith('ches') ||
        lower.endsWith('sses') ||
        lower.endsWith('xes') ||
        lower.endsWith('zes')
      ) {
        return lower.slice(0, -2);
      }
      // E.g. likes -> like, dances -> dance
      return lower.slice(0, -1);
    }

    // Rule 4: Regular plural -s (e.g. crawlers -> crawler, books -> book)
    if (lower.endsWith('s') && !lower.endsWith('ss') && !lower.endsWith('us') && !lower.endsWith('is')) {
      return lower.slice(0, -1);
    }

    // Rule 5: Past tense / participle -ied (e.g. queries/queried -> query)
    if (lower.endsWith('ied') && lower.length > 4) {
      return lower.slice(0, -3) + 'y';
    }

    // Rule 6: Past tense -ed (e.g. crawled -> crawl, computed -> compute, mapped -> map)
    if (lower.endsWith('ed') && lower.length > 4) {
      const stem = lower.slice(0, -2);
      // Double consonant check (e.g. mapped -> map, stopped -> stop)
      if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
        return stem.slice(0, -1);
      }
      // Silent e check (e.g. computed -> compute, shared -> share)
      if (this.endsInConsonantVowelConsonant(stem)) {
        return stem + 'e';
      }
      return stem;
    }

    // Rule 7: Present participle -ing (e.g. crawling -> crawl, computing -> compute, running -> run)
    if (lower.endsWith('ing') && lower.length > 4) {
      const stem = lower.slice(0, -3);
      // Double consonant check (e.g. running -> run, swimming -> swim)
      if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
        return stem.slice(0, -1);
      }
      // Silent e (e.g. computing -> compute, mining -> mine, making -> make)
      if (stem.length >= 3 && !this.containsVowel(stem.slice(-1)) && this.containsVowel(stem.slice(-2, -1))) {
        return stem + 'e';
      }
      return stem;
    }

    // Rule 8: Adverbs ending in -ly (e.g. systematically -> systematic, quickly -> quick)
    if (lower.endsWith('ly') && lower.length > 4) {
      return lower.slice(0, -2);
    }

    return lower;
  }

  /**
   * Porter Stemmer Algorithm (M. Porter, 1980)
   * Implements Steps 1a through 5b for algorithmic suffix reduction.
   */
  public porterStem(w: string): string {
    const word = w.toLowerCase();
    if (word.length <= 2) {
      return word;
    }

    // Helper functions for Porter Stemmer
    const isConsonant = (str: string, i: number): boolean => {
      const ch = str[i];
      if ('aeiou'.includes(ch)) return false;
      if (ch === 'y') {
        if (i === 0) return true;
        return !isConsonant(str, i - 1);
      }
      return true;
    };

    const getMeasure = (str: string): number => {
      let n = 0;
      let i = 0;
      const len = str.length;
      while (i < len && isConsonant(str, i)) i++;
      while (i < len) {
        while (i < len && !isConsonant(str, i)) i++;
        while (i < len && isConsonant(str, i)) i++;
        n++;
      }
      return n;
    };

    const hasVowel = (str: string): boolean => {
      for (let i = 0; i < str.length; i++) {
        if (!isConsonant(str, i)) return true;
      }
      return false;
    };

    const endsWithDoubleConsonant = (str: string): boolean => {
      const len = str.length;
      if (len < 2) return false;
      return str[len - 1] === str[len - 2] && isConsonant(str, len - 1);
    };

    const cvc = (str: string): boolean => {
      const len = str.length;
      if (len < 3) return false;
      if (
        isConsonant(str, len - 1) &&
        !isConsonant(str, len - 2) &&
        isConsonant(str, len - 3)
      ) {
        const last = str[len - 1];
        if (last === 'w' || last === 'x' || last === 'y') return false;
        return true;
      }
      return false;
    };

    let stem = word;

    // STEP 1a
    if (stem.endsWith('sses')) {
      stem = stem.slice(0, -2);
    } else if (stem.endsWith('ies')) {
      stem = stem.slice(0, -2);
    } else if (!stem.endsWith('ss') && stem.endsWith('s')) {
      stem = stem.slice(0, -1);
    }

    // STEP 1b
    let step1bExtra = false;
    if (stem.endsWith('eed')) {
      const base = stem.slice(0, -3);
      if (getMeasure(base) > 0) {
        stem = base + 'ee';
      }
    } else if (stem.endsWith('ed')) {
      const base = stem.slice(0, -2);
      if (hasVowel(base)) {
        stem = base;
        step1bExtra = true;
      }
    } else if (stem.endsWith('ing')) {
      const base = stem.slice(0, -3);
      if (hasVowel(base)) {
        stem = base;
        step1bExtra = true;
      }
    }

    if (step1bExtra) {
      if (stem.endsWith('at') || stem.endsWith('bl') || stem.endsWith('iz')) {
        stem += 'e';
      } else if (endsWithDoubleConsonant(stem) && !stem.endsWith('l') && !stem.endsWith('s') && !stem.endsWith('z')) {
        stem = stem.slice(0, -1);
      } else if (getMeasure(stem) === 1 && cvc(stem)) {
        stem += 'e';
      }
    }

    // STEP 1c
    if (stem.endsWith('y')) {
      const base = stem.slice(0, -1);
      if (hasVowel(base)) {
        stem = base + 'i';
      }
    }

    // STEP 2
    const step2Pairs: [string, string][] = [
      ['ational', 'ate'],
      ['tional', 'tion'],
      ['enci', 'ence'],
      ['anci', 'ance'],
      ['izer', 'ize'],
      ['abli', 'able'],
      ['alli', 'al'],
      ['entli', 'ent'],
      ['eli', 'e'],
      ['ousli', 'ous'],
      ['ization', 'ize'],
      ['ation', 'ate'],
      ['ator', 'ate'],
      ['alism', 'al'],
      ['iveness', 'ive'],
      ['fulness', 'ful'],
      ['ousness', 'ous'],
      ['aliti', 'al'],
      ['iviti', 'ive'],
      ['biliti', 'ble'],
    ];

    for (const [suffix, replacement] of step2Pairs) {
      if (stem.endsWith(suffix)) {
        const base = stem.slice(0, -suffix.length);
        if (getMeasure(base) > 0) {
          stem = base + replacement;
        }
        break;
      }
    }

    // STEP 3
    const step3Pairs: [string, string][] = [
      ['icate', 'ic'],
      ['ative', ''],
      ['alize', 'al'],
      ['iciti', 'ic'],
      ['ical', 'ic'],
      ['ful', ''],
      ['ness', ''],
    ];

    for (const [suffix, replacement] of step3Pairs) {
      if (stem.endsWith(suffix)) {
        const base = stem.slice(0, -suffix.length);
        if (getMeasure(base) > 0) {
          stem = base + replacement;
        }
        break;
      }
    }

    // STEP 4
    const step4Suffixes = [
      'al', 'ance', 'ence', 'er', 'ic', 'able', 'ible', 'ant', 'ement',
      'ment', 'ent', 'ou', 'ism', 'ate', 'iti', 'ous', 'ive', 'ize',
    ];

    for (const suffix of step4Suffixes) {
      if (stem.endsWith(suffix)) {
        const base = stem.slice(0, -suffix.length);
        if (getMeasure(base) > 1) {
          stem = base;
        }
        break;
      }
    }

    if (stem.endsWith('ion')) {
      const base = stem.slice(0, -3);
      if (getMeasure(base) > 1 && (base.endsWith('s') || base.endsWith('t'))) {
        stem = base;
      }
    }

    // STEP 5a
    if (stem.endsWith('e')) {
      const base = stem.slice(0, -1);
      const m = getMeasure(base);
      if (m > 1 || (m === 1 && !cvc(base))) {
        stem = base;
      }
    }

    // STEP 5b
    if (stem.endsWith('ll') && getMeasure(stem) > 1) {
      stem = stem.slice(0, -1);
    }

    return stem;
  }

  private endsInConsonantVowelConsonant(str: string): boolean {
    if (str.length < 3) return false;
    const c1 = !this.containsVowel(str[str.length - 3]);
    const v = this.containsVowel(str[str.length - 2]);
    const c2 = !this.containsVowel(str[str.length - 1]);
    return c1 && v && c2;
  }

  private containsVowel(str: string): boolean {
    return /[aeiou]/i.test(str);
  }
}

// Global default singleton instance
export const defaultNormalizer = new TextNormalizer();
