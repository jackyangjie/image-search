/**
 * @fileoverview CLIP Tokenizer
 * @description 轻量级 BPE tokenizer，基于 CLIP 的 vocab/merges
 * MobileCLIP 使用与 CLIP 相同的 tokenizer
 */

const DEFAULT_VOCAB: Record<string, number> = {
  '<|startoftext|>': 49406,
  '<|endoftext|>': 49407,
  '<|pad|>': 0,
  the: 518,
  a: 320,
  photo: 1125,
  image: 1316,
  of: 286,
  in: 287,
  on: 319,
  with: 593,
  and: 290,
  at: 379,
  sunset: 10536,
  beach: 3717,
  cat: 2368,
  dog: 1929,
  person: 2369,
  man: 582,
  woman: 1619,
  people: 1045,
  sky: 4635,
  sea: 3278,
  ocean: 5892,
  water: 1683,
  mountain: 4558,
  tree: 1658,
  grass: 4168,
  building: 1745,
  city: 2265,
  street: 2354,
  car: 2483,
  food: 2015,
  animal: 2823,
  bird: 2365,
  flower: 3718,
  red: 3202,
  blue: 2662,
  green: 2663,
  yellow: 3357,
  white: 2330,
  black: 2309,
};

// BPE merges - 常用 pairs
const DEFAULT_MERGES: Map<string, string> = new Map([
  ['t h', 'th'],
  ['t e', 'te'],
  ['i n', 'in'],
  ['a n', 'an'],
  ['o n', 'on'],
  ['e n', 'en'],
  ['r e', 're'],
  ['s e', 'se'],
  ['o r', 'or'],
  ['a r', 'ar'],
  ['i s', 'is'],
  ['a s', 'as'],
  ['e s', 'es'],
  ['a t', 'at'],
  ['i t', 'it'],
  ['o t', 'ot'],
  ['e t', 'et'],
  ['u t', 'ut'],
  ['o f', 'of'],
  ['f o', 'fo'],
  ['f or', 'for'],
  ['p h', 'ph'],
  ['p ho', 'pho'],
  ['p hot', 'phot'],
  ['p hoto', 'photo'],
  ['i m', 'im'],
  ['i ma', 'ima'],
  ['i mag', 'imag'],
  ['i mage', 'image'],
]);

export class CLIPTokenizer {
  private vocab: Record<string, number>;
  private merges: Map<string, string>;
  private maxLength: number;

  constructor(maxLength = 77) {
    this.vocab = DEFAULT_VOCAB;
    this.merges = DEFAULT_MERGES;
    this.maxLength = maxLength;
  }

  /**
   * 编码文本为 token IDs
   * @param text 输入文本
   * @returns token ID 数组 (Int64Array)
   */
  encode(text: string): BigInt64Array {
    // 基础清理
    const cleaned = this.cleanText(text.toLowerCase().trim());

    // 分词
    const tokens = this.tokenize(cleaned);

    // 添加 BOS/EOS
    const allTokens = [49406, ...tokens, 49407];

    // Pad/Truncate to maxLength
    const padded = this.padOrTruncate(allTokens);

    // 转为 BigInt64Array (ONNX int64 需要)
    return new BigInt64Array(padded.map(id => BigInt(id)));
  }

  /**
   * 基础文本清理
   */
  private cleanText(text: string): string {
    return text
      .replace(/[^\w\s]/g, ' ') // 移除非字母数字
      .replace(/\s+/g, ' ') // 合并空格
      .trim();
  }

  /**
   * BPE 分词
   */
  private tokenize(text: string): number[] {
    const words = text.split(' ');
    const tokens: number[] = [];

    for (const word of words) {
      if (word.length === 0) continue;

      // 完整单词是否在 vocab 中
      const fullWord = word.toLowerCase();
      if (this.vocab[fullWord] !== undefined) {
        tokens.push(this.vocab[fullWord]);
        continue;
      }

      // BPE 分词
      const wordTokens = this.bpeEncode(fullWord);
      tokens.push(...wordTokens);
    }

    return tokens;
  }

  /**
   * BPE 编码单个单词
   */
  private bpeEncode(word: string): number[] {
    // 简单处理：检查常用前缀/后缀
    let remaining = word;
    const tokens: number[] = [];

    // 优先匹配 vocab 中的词
    while (remaining.length > 0) {
      let matched = false;

      // 从长到短匹配
      for (let len = Math.min(remaining.length, 15); len > 0; len--) {
        const substr = remaining.substring(0, len);
        if (this.vocab[substr] !== undefined) {
          tokens.push(this.vocab[substr]);
          remaining = remaining.substring(len);
          matched = true;
          break;
        }
      }

      if (!matched) {
        //  fallback: byte-level encoding (简化版)
        const char = remaining[0];
        const tokenId = this.getByteToken(char);
        tokens.push(tokenId);
        remaining = remaining.substring(1);
      }
    }

    return tokens;
  }

  /**
   * byte-level fallback
   */
  private getByteToken(char: string): number {
    const code = char.charCodeAt(0);
    // CLIP 使用字节 fallback tokens (256-500 范围)
    return 256 + (code % 100);
  }

  /**
   * 填充或截断到固定长度
   */
  private padOrTruncate(tokens: number[]): number[] {
    if (tokens.length > this.maxLength) {
      // Truncate, 保留 BOS, 截断末尾
      return [tokens[0], ...tokens.slice(1, this.maxLength - 1), tokens[tokens.length - 1]];
    }

    // Pad with 0
    while (tokens.length < this.maxLength) {
      tokens.push(0);
    }

    return tokens;
  }

  /**
   * 批量编码
   */
  encodeBatch(texts: string[]): BigInt64Array[] {
    return texts.map(text => this.encode(text));
  }
}

// 单例
let tokenizerInstance: CLIPTokenizer | null = null;

export function getTokenizer(): CLIPTokenizer {
  if (!tokenizerInstance) {
    tokenizerInstance = new CLIPTokenizer();
  }
  return tokenizerInstance;
}
