/**
 * Default corpus containing rich documents related to Web Search Mining,
 * Information Retrieval, Web Crawlers, and Indexing.
 */

export interface RawDocument {
  id: string;
  title: string;
  url: string;
  category: 'Crawling' | 'Indexing' | 'Ranking' | 'Mining' | 'Architecture';
  content: string;
}

export const DEFAULT_CORPUS: RawDocument[] = [
  {
    id: 'DOC-01',
    title: 'Architecture of a Modern Web Search Engine',
    url: 'https://ir.example.org/search-engine-architecture',
    category: 'Architecture',
    content: `A modern web search engine consists of distributed web crawlers, text tokenization pipelines, inverted index builders, and low-latency query processors. The indexer converts unstructured crawled HTML into postings lists containing document identifiers and term frequencies. When a user submits a query, the query processor parses boolean operators and ranks documents using vector space models and BM25 algorithms.`
  },
  {
    id: 'DOC-02',
    title: 'Inverted Index Construction and Compression',
    url: 'https://ir.example.org/inverted-index-algorithms',
    category: 'Indexing',
    content: `An inverted index is the fundamental data structure used in information retrieval. For each distinct word in the vocabulary, the inverted index stores a dictionary entry mapped to a postings list. Positional inverted indexes record word offsets inside each document to enable fast exact phrase queries and proximity scoring. Variable-byte encoding and delta compression minimize disk space.`
  },
  {
    id: 'DOC-03',
    title: 'Tokenization, Case Folding and Text Normalization',
    url: 'https://ir.example.org/tokenization-normalization-guide',
    category: 'Mining',
    content: `Text normalization transforms raw document strings into canonical tokens. The pipeline applies character extraction, punctuation stripping, case folding to lowercase, and diacritic removal. Stemming algorithms such as the Porter Stemmer strip morphological suffixes so that variations like mining, mined, and miner collapse into their root stem. Stopword filtering removes frequent grammatical terms.`
  },
  {
    id: 'DOC-04',
    title: 'Wildcard Query Processing via Permuterm Index',
    url: 'https://ir.example.org/wildcard-queries-permuterm',
    category: 'Indexing',
    content: `Wildcard queries allow users to search with asterisks for unknown character sequences, such as comput* or *search. The permuterm index constructs all circular shifts of each term appended with an end symbol dollar sign. For a query like c*ing, the rotated pattern ing$c* is matched against the rotated dictionary, expanding the wildcard into an efficient disjunction of matching index terms.`
  },
  {
    id: 'DOC-05',
    title: 'Distributed Web Crawlers and Politeness Policies',
    url: 'https://ir.example.org/web-crawlers-politeness',
    category: 'Crawling',
    content: `Web crawlers systematically traverse the World Wide Web by starting from seed URLs and following hyperlinks. Crawlers must obey the Robots Exclusion Protocol robots.txt to respect server resource constraints. Distributed URL frontiers manage crawl priorities, deduplicate visited links, and enforce politeness delay queues to prevent overwhelming web servers with concurrent requests.`
  },
  {
    id: 'DOC-06',
    title: 'PageRank and Link Analysis for Web Mining',
    url: 'https://ir.example.org/pagerank-link-analysis',
    category: 'Ranking',
    content: `Link analysis treats the web graph as a directed network where hyperlinks represent endorsements. The PageRank algorithm simulates a random web surfer navigating pages with a damping factor to compute a stationary probability distribution. Authoritative hub and authority scores from Kleinberg's HITS algorithm complement PageRank for topic-specific authority identification.`
  },
  {
    id: 'DOC-07',
    title: 'Boolean Query Processing and Posting Intersections',
    url: 'https://ir.example.org/boolean-retrieval-evaluation',
    category: 'Ranking',
    content: `Boolean retrieval evaluates queries composed of terms connected by boolean operators AND, OR, and NOT. Postings list intersection is executed in linear time by advancing pointers through sorted document identifiers. For conjunctive queries, intersecting postings in order of increasing document frequency minimizes intermediate comparison overhead.`
  },
  {
    id: 'DOC-08',
    title: 'BM25 and TF-IDF Probabilistic Relevance Ranking',
    url: 'https://ir.example.org/bm25-tfidf-relevance',
    category: 'Ranking',
    content: `The Okapi BM25 scoring function ranks matched documents based on term frequency saturation and inverse document frequency. Unlike naive TF-IDF, BM25 incorporates document length normalization to penalize unnaturally long documents while rewarding concise, highly relevant web pages. Query term weighting ensures rare informational terms dominate retrieval.`
  },
  {
    id: 'DOC-09',
    title: 'Duplicate Detection with Shingling and MinHash',
    url: 'https://ir.example.org/near-duplicate-detection',
    category: 'Mining',
    content: `Web search engines encounter millions of duplicate and near-duplicate web documents. Syntactic similarity is evaluated by converting text into character k-shingles and estimating Jaccard coefficient using MinHash permutations and Locality Sensitive Hashing (LSH). SimHash computes compact 64-bit fingerprints where Hamming distance measures text overlap.`
  },
  {
    id: 'DOC-10',
    title: 'Phrase Queries and Positional Indexing',
    url: 'https://ir.example.org/positional-indexes-phrase-search',
    category: 'Indexing',
    content: `Evaluating an exact phrase query such as "information retrieval" requires knowing the position of each term inside a document. Positional index postings store integer token offsets alongside document identifiers. A positional intersection algorithm checks whether the position of term two equals the position of term one plus one across matching documents.`
  },
  {
    id: 'DOC-11',
    title: 'Web Scraping, Content Extraction and DOM Parsing',
    url: 'https://ir.example.org/web-scraping-dom-extraction',
    category: 'Crawling',
    content: `Web data mining extracts structured knowledge from raw web pages. DOM tree traversal, XPath queries, and CSS selector filtering isolate the primary article body while stripping extraneous boilerplates, navigation bars, headers, and advertising scripts. Extracted clean text is subsequently fed to tokenizers and semantic feature extractors.`
  },
  {
    id: 'DOC-12',
    title: 'Spelling Correction and K-Gram Indexes',
    url: 'https://ir.example.org/spelling-correction-kgram',
    category: 'Indexing',
    content: `Spelling correction handles user typos and misspelled search queries. K-gram indexes store substrings of length k to retrieve candidate words with high character overlap. The Levenshtein edit distance algorithm calculates the minimum number of insertions, deletions, and substitutions needed to transform the erroneous query term into a valid dictionary word.`
  }
];
