import * as FileSystem from 'expo-file-system';

interface BPERules {
  vocab: Map<string, number>;
  merges: string[][];
  specialTokens: Map<string, number>;
}

export class SiglipTokenizer {
  private rules: BPERules | null = null;
  private maxLength: number = 64;
  private loaded = false;

  private readonly padTokenId = 0;
  private readonly eosTokenId = 1;
  private readonly bosTokenId = 2;
  private readonly unkTokenId = 3;

  constructor(maxLength = 64) {
    this.maxLength = maxLength;
  }

  async load(): Promise<void> {
    try {
      await this.loadFromTokenizerJson();
      this.loaded = true;
      console.log(`SigLIP Tokenizer loaded: ${this.rules?.vocab.size || 0} tokens`);
    } catch (error) {
      console.warn('Failed to load tokenizer:', error);
      this.loadFallbackVocab();
    }
  }

  private async loadFromTokenizerJson(): Promise<void> {
    const paths = [
      'file:///android_asset/models/siglip2-base/tokenizer.json',
      `${FileSystem.documentDirectory}models/siglip2-base/tokenizer.json`,
      `${FileSystem.bundleDirectory}models/siglip2-base/tokenizer.json`,
    ];

    for (const path of paths) {
      try {
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists) {
          const json = await FileSystem.readAsStringAsync(path);
          const data = JSON.parse(json);
          this.parseTokenizerJson(data);
          return;
        }
      } catch (e) {
        console.log(`Failed to load from ${path}`);
      }
    }

    throw new Error('Tokenizer file not found');
  }

  private parseTokenizerJson(data: any): void {
    this.rules = {
      vocab: new Map(),
      merges: [],
      specialTokens: new Map(),
    };

    if (data.model && data.model.vocab) {
      for (const [token, id] of Object.entries(data.model.vocab)) {
        this.rules.vocab.set(token, id as number);
      }
    }

    if (data.model && data.model.merges) {
      this.rules.merges = data.model.merges;
    }

    if (data.added_tokens) {
      for (const token of data.added_tokens) {
        this.rules.specialTokens.set(token.content, token.id);
      }
    }
  }

  private loadFallbackVocab(): void {
    this.rules = {
      vocab: new Map(),
      merges: [],
      specialTokens: new Map([
        ['<pad>', this.padTokenId],
        ['<eos>', this.eosTokenId],
        ['<bos>', this.bosTokenId],
        ['<unk>', this.unkTokenId],
      ]),
    };

    this.loaded = true;
    console.warn('Using fallback tokenizer');
  }

  encode(text: string): BigInt64Array {
    if (!this.loaded || !this.rules) {
      throw new Error('Tokenizer not loaded');
    }

    const normalized = this.normalizeText(text);
    const tokens = this.bpeTokenize(normalized);

    const tokenIds: number[] = [this.bosTokenId];
    for (const token of tokens) {
      const id = this.rules.vocab.get(token) ?? this.rules.specialTokens.get(token);
      tokenIds.push(id ?? this.unkTokenId);
    }
    tokenIds.push(this.eosTokenId);

    return new BigInt64Array(this.padOrTruncate(tokenIds).map(id => BigInt(id)));
  }

  private normalizeText(text: string): string {
    return text
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private bpeTokenize(text: string): string[] {
    if (!this.rules || this.rules.merges.length === 0) {
      return this.fallbackTokenize(text);
    }

    const words = text.split(' ');
    const result: string[] = [];

    for (const word of words) {
      if (word.length === 0) continue;

      const processed = '▁' + word;
      let wordTokens = processed.split('');

      for (const merge of this.rules.merges) {
        const [first, second] = merge;
        const newTokens: string[] = [];
        let i = 0;

        while (i < wordTokens.length) {
          if (i < wordTokens.length - 1 &&
              wordTokens[i] === first &&
              wordTokens[i + 1] === second) {
            newTokens.push(first + second);
            i += 2;
          } else {
            newTokens.push(wordTokens[i]);
            i++;
          }
        }

        wordTokens = newTokens;
      }

      result.push(...wordTokens);
    }

    return result;
  }

  private fallbackTokenize(text: string): string[] {
    return text.split('').map(c => c === ' ' ? '▁' : c);
  }

  private padOrTruncate(tokens: number[]): number[] {
    if (tokens.length > this.maxLength) {
      return [...tokens.slice(0, this.maxLength - 1), this.eosTokenId];
    }

    while (tokens.length < this.maxLength) {
      tokens.push(this.padTokenId);
    }

    return tokens;
  }

  createAttentionMask(tokenIds: BigInt64Array): BigInt64Array {
    const mask = new BigInt64Array(tokenIds.length);
    for (let i = 0; i < tokenIds.length; i++) {
      mask[i] = tokenIds[i] !== BigInt(this.padTokenId) ? BigInt(1) : BigInt(0);
    }
    return mask;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getVocabSize(): number {
    return this.rules?.vocab.size || 0;
  }
}

let tokenizerInstance: SiglipTokenizer | null = null;
let loadingPromise: Promise<void> | null = null;

export async function getSiglipTokenizer(): Promise<SiglipTokenizer> {
  if (tokenizerInstance && tokenizerInstance.isLoaded()) {
    return tokenizerInstance;
  }

  if (loadingPromise) {
    await loadingPromise;
    return tokenizerInstance!;
  }

  tokenizerInstance = new SiglipTokenizer(64);
  loadingPromise = tokenizerInstance.load();
  await loadingPromise;

  return tokenizerInstance;
}

export function resetSiglipTokenizer(): void {
  tokenizerInstance = null;
  loadingPromise = null;
}
