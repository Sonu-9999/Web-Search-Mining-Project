/**
 * Module 2: Tokenization
 * Breaks continuous document character streams into discrete linguistic tokens,
 * recording token sequence positions and character offsets for positional indexing
 * and phrase search.
 */

export interface Token {
  /**
   * The raw lexical string of the token before normalization.
   */
  raw: string;
  /**
   * 0-based token index sequence inside the document.
   */
  position: number;
  /**
   * Character index start in the original text.
   */
  startOffset: number;
  /**
   * Character index end in the original text.
   */
  endOffset: number;
}

export interface TokenizerOptions {
  /**
   * Whether to preserve hyphenated words as single tokens (e.g. "tf-idf", "state-of-the-art").
   * Default: true
   */
  preserveHyphens?: boolean;
  /**
   * Whether to include numeric tokens.
   * Default: true
   */
  includeNumbers?: boolean;
  /**
   * Minimum token character length.
   * Default: 1
   */
  minTokenLength?: number;
}

const DEFAULT_TOKENIZER_OPTIONS: TokenizerOptions = {
  preserveHyphens: true,
  includeNumbers: true,
  minTokenLength: 1,
};

export class Tokenizer {
  private options: TokenizerOptions;

  constructor(options?: TokenizerOptions) {
    this.options = { ...DEFAULT_TOKENIZER_OPTIONS, ...options };
  }

  /**
   * Tokenize input text into a list of positional tokens.
   */
  public tokenize(text: string, customOptions?: TokenizerOptions): Token[] {
    const opts = { ...this.options, ...customOptions };
    if (!text || text.trim().length === 0) {
      return [];
    }

    const tokens: Token[] = [];
    // Regex pattern: matches words with optional internal hyphens, apostrophes, or dot-extensions (like robots.txt)
    // Matches alphanumeric sequences and allows internal hyphens or dots if preserveHyphens is true
    const pattern = opts.preserveHyphens
      ? /[a-zA-Z0-9]+(?:[-._][a-zA-Z0-9]+)*/g
      : /[a-zA-Z0-9]+/g;

    let match: RegExpExecArray | null;
    let position = 0;

    while ((match = pattern.exec(text)) !== null) {
      const raw = match[0];
      const startOffset = match.index;
      const endOffset = startOffset + raw.length;

      // Filter by numeric settings
      if (!opts.includeNumbers && /^\d+$/.test(raw)) {
        continue;
      }

      // Filter by min length
      if (raw.length < (opts.minTokenLength || 1)) {
        continue;
      }

      tokens.push({
        raw,
        position,
        startOffset,
        endOffset,
      });

      position++;
    }

    return tokens;
  }

  /**
   * Convenience utility to extract only the raw token strings.
   */
  public tokenizeToStrings(text: string, customOptions?: TokenizerOptions): string[] {
    return this.tokenize(text, customOptions).map((t) => t.raw);
  }
}

// Global default singleton instance
export const defaultTokenizer = new Tokenizer();
