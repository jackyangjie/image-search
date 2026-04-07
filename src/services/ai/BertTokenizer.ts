import { File, Paths } from 'expo-file-system';

export class BertTokenizer {
  private vocab: Map<string, number> = new Map();
  private maxLength: number = 52;
  private clsToken = 101;
  private sepToken = 102;
  private padToken = 0;
  private unkToken = 100;
  private loaded = false;

  constructor(maxLength = 52) {
    this.maxLength = maxLength;
  }

  async loadFromFile(vocabPath: string): Promise<void> {
    try {
      const vocabFile = new File(vocabPath);
      const vocabText = await vocabFile.text();
      this.loadVocabFromText(vocabText);
      this.loaded = true;
      console.log(`BERT Tokenizer loaded: ${this.vocab.size} tokens`);
    } catch (error) {
      console.error('Failed to load tokenizer file:', error);
      throw new Error('TOKENIZER_LOAD_FAILED');
    }
  }

  loadFromString(vocabText: string): void {
    this.loadVocabFromText(vocabText);
    this.loaded = true;
  }

  private loadVocabFromText(vocabText: string): void {
    const lines = vocabText.trim().split('\n');
    for (let i = 0; i < lines.length; i++) {
      const token = lines[i].trim();
      if (token) {
        this.vocab.set(token, i);
      }
    }
  }

  encode(text: string): BigInt64Array {
    if (!this.loaded) {
      throw new Error('Tokenizer not loaded. Call loadFromFile() first.');
    }

    const tokens = this.tokenize(text);
    const allTokens = [this.clsToken, ...tokens, this.sepToken];
    const padded = this.padOrTruncate(allTokens);

    return new BigInt64Array(padded.map(id => BigInt(id)));
  }

  private tokenize(text: string): number[] {
    const cleaned = this.preprocessText(text);
    const words = cleaned.split(' ').filter(w => w.length > 0);
    const tokenIds: number[] = [];

    for (const word of words) {
      const wordTokens = this.wordpieceTokenize(word);
      tokenIds.push(...wordTokens);
    }

    return tokenIds;
  }

  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFKC')
      .replace(/[\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private wordpieceTokenize(word: string): number[] {
    const tokens: number[] = [];
    let remaining = word;

    while (remaining.length > 0) {
      let longestMatch = '';
      let longestId = this.unkToken;

      for (let end = remaining.length; end > 0; end--) {
        const substr = remaining.substring(0, end);
        const prefixedSubstr = tokens.length === 0 ? substr : '##' + substr;

        if (this.vocab.has(prefixedSubstr)) {
          longestMatch = prefixedSubstr;
          longestId = this.vocab.get(prefixedSubstr)!;
          break;
        }

        if (end === remaining.length && this.vocab.has(substr)) {
          longestMatch = substr;
          longestId = this.vocab.get(substr)!;
        }
      }

      if (longestMatch === '') {
        tokens.push(this.unkToken);
        remaining = remaining.substring(1);
      } else {
        tokens.push(longestId);
        remaining = remaining.substring(
          longestMatch.startsWith('##') ? longestMatch.length - 2 : longestMatch.length
        );
      }
    }

    return tokens;
  }

  private padOrTruncate(tokens: number[]): number[] {
    if (tokens.length > this.maxLength) {
      return [tokens[0], ...tokens.slice(1, this.maxLength - 1), tokens[tokens.length - 1]];
    }

    while (tokens.length < this.maxLength) {
      tokens.push(this.padToken);
    }

    return tokens;
  }

  createAttentionMask(tokenIds: BigInt64Array): BigInt64Array {
    const mask = new BigInt64Array(tokenIds.length);
    for (let i = 0; i < tokenIds.length; i++) {
      mask[i] = tokenIds[i] !== BigInt(this.padToken) ? BigInt(1) : BigInt(0);
    }
    return mask;
  }

  decode(tokenIds: number[]): string {
    const reverseVocab: Record<number, string> = {};
    for (const [token, id] of this.vocab.entries()) {
      reverseVocab[id] = token;
    }

    const tokens: string[] = [];
    for (const id of tokenIds) {
      if (id === this.clsToken || id === this.sepToken || id === this.padToken) {
        continue;
      }
      const token = reverseVocab[id];
      if (token) {
        tokens.push(token.startsWith('##') ? token.substring(2) : token);
      }
    }

    return tokens.join(' ').trim();
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getVocabSize(): number {
    return this.vocab.size;
  }
}

let tokenizerInstance: BertTokenizer | null = null;
let loadingPromise: Promise<void> | null = null;

export async function getBertTokenizer(): Promise<BertTokenizer> {
  if (tokenizerInstance && tokenizerInstance.isLoaded()) {
    return tokenizerInstance;
  }

  if (loadingPromise) {
    await loadingPromise;
    return tokenizerInstance!;
  }

  tokenizerInstance = new BertTokenizer(52);

  const paths = [
    'file:///android_asset/chinese-clip/vocab.txt',
    `${Paths.document.uri}chinese-clip/vocab.txt`,
    `${Paths.bundle.uri}chinese-clip/vocab.txt`,
  ];

  loadingPromise = loadTokenizerFile(tokenizerInstance, paths);
  await loadingPromise;

  return tokenizerInstance;
}

async function loadTokenizerFile(tokenizer: BertTokenizer, paths: string[]): Promise<void> {
  for (const vocabPath of paths) {
    try {
      const vocabFile = new File(vocabPath);
      if (vocabFile.exists) {
        await tokenizer.loadFromFile(vocabPath);
        return;
      }
    } catch (error) {
      console.log(`Failed to load from ${vocabPath}:`, error);
    }
  }

  throw new Error('Failed to load BERT tokenizer vocab.txt from any path');
}

export function resetBertTokenizer(): void {
  tokenizerInstance = null;
  loadingPromise = null;
}
