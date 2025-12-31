/**
 * Hearing Parser
 * ヒアリングメモから勝ちポイント・課題・キーワードを抽出
 */

import { HearingNote, HearingParseResult, WinIndicator } from '../models/types';

export class HearingParser {
  /**
   * 課題・問題を示すキーワード
   */
  private readonly painKeywords = [
    '課題', '問題', '困っている', '難しい', '大変', '手間', '時間がかかる',
    '効率が悪い', '改善したい', 'ミス', 'エラー', '遅い', '複雑',
    '面倒', '分からない', '不安', '心配', '負担', 'コストが高い',
    '人手不足', '属人化', '標準化されていない', '可視化されていない'
  ];

  /**
   * 成果・価値を示すキーワード
   */
  private readonly valueKeywords = [
    '成果', '効果', '改善', '向上', '削減', '短縮', '効率化',
    '自動化', '標準化', '可視化', '最適化', '品質向上', '売上増加',
    'コスト削減', '時間短縮', '精度向上', '満足度向上', 'スピードアップ'
  ];

  /**
   * Win指標カテゴリマッピング
   */
  private readonly categoryMapping = {
    efficiency: ['効率', '時間', 'スピード', '自動化', '省力化'],
    quality: ['品質', '精度', 'ミス削減', '標準化', '安定'],
    cost: ['コスト', '費用', '削減', '節約', '投資対効果'],
    growth: ['成長', '拡大', '売上', '新規', '展開'],
    satisfaction: ['満足', '評価', '改善', '使いやすさ', '体験']
  };

  /**
   * ヒアリングメモを解析
   */
  parse(content: string | HearingNote): HearingParseResult {
    const text = typeof content === 'string' ? content : content.content;
    
    // 文章を句読点で分割
    const sentences = this.splitIntoSentences(text);
    
    // 各種情報の抽出
    const painPoints = this.extractPainPoints(sentences);
    const winPoints = this.extractWinPoints(sentences, painPoints);
    const keywords = this.extractKeywords(text);
    const sentiment = this.analyzeSentiment(text, painPoints, winPoints);

    return {
      winPoints,
      painPoints,
      keywords,
      sentiment
    };
  }

  /**
   * 文章を句読点で分割
   */
  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[。\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * 課題・問題点の抽出
   */
  private extractPainPoints(sentences: string[]): string[] {
    const painPoints: string[] = [];
    
    for (const sentence of sentences) {
      // 課題キーワードを含む文を抽出
      if (this.containsAnyKeyword(sentence, this.painKeywords)) {
        painPoints.push(sentence);
      }
      
      // ネガティブな表現パターンを検出
      if (this.detectNegativePattern(sentence)) {
        painPoints.push(sentence);
      }
    }
    
    return [...new Set(painPoints)]; // 重複除去
  }

  /**
   * Win指標の抽出
   */
  private extractWinPoints(sentences: string[], painPoints: string[]): WinIndicator[] {
    const winIndicators: WinIndicator[] = [];
    
    // 課題に対する解決策を探す
    for (const pain of painPoints) {
      const solution = this.findSolutionForPain(pain, sentences);
      if (solution) {
        const indicator = this.createWinIndicator(pain, solution);
        if (indicator) {
          winIndicators.push(indicator);
        }
      }
    }
    
    // 価値キーワードを含む文から直接Win指標を抽出
    for (const sentence of sentences) {
      if (this.containsAnyKeyword(sentence, this.valueKeywords)) {
        const indicator = this.extractDirectWinIndicator(sentence);
        if (indicator) {
          winIndicators.push(indicator);
        }
      }
    }
    
    return winIndicators;
  }

  /**
   * 課題に対する解決策を探す
   */
  private findSolutionForPain(pain: string, sentences: string[]): string | null {
    const painIndex = sentences.indexOf(pain);
    
    // 前後の文から解決策を探す
    for (let i = Math.max(0, painIndex - 2); i <= Math.min(sentences.length - 1, painIndex + 2); i++) {
      if (i === painIndex) continue;
      
      const sentence = sentences[i];
      if (this.containsAnyKeyword(sentence, this.valueKeywords) ||
          this.detectSolutionPattern(sentence)) {
        return sentence;
      }
    }
    
    return null;
  }

  /**
   * Win指標の作成
   */
  private createWinIndicator(pain: string, solution: string): WinIndicator | null {
    const category = this.determineCategory(solution);
    const impact = this.calculateImpact(pain, solution);
    
    if (!category || impact < 30) return null;
    
    return {
      name: this.generateIndicatorName(solution),
      category,
      description: `${pain} → ${solution}`,
      impact,
      evidence: `課題: ${pain}`,
      crystallized: false
    };
  }

  /**
   * 直接的なWin指標の抽出
   */
  private extractDirectWinIndicator(sentence: string): WinIndicator | null {
    const category = this.determineCategory(sentence);
    if (!category) return null;
    
    // 数値を含む場合はより高いインパクト
    const hasNumbers = /\d+/.test(sentence);
    const impact = hasNumbers ? 80 : 60;
    
    return {
      name: this.generateIndicatorName(sentence),
      category,
      description: sentence,
      impact,
      evidence: sentence,
      crystallized: false
    };
  }

  /**
   * カテゴリの判定
   */
  private determineCategory(text: string): WinIndicator['category'] | null {
    let bestMatch: { category: WinIndicator['category']; score: number } | null = null;
    
    for (const [category, keywords] of Object.entries(this.categoryMapping)) {
      const score = keywords.filter(keyword => text.includes(keyword)).length;
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          category: category as WinIndicator['category'],
          score
        };
      }
    }
    
    return bestMatch?.category || null;
  }

  /**
   * インパクトの計算
   */
  private calculateImpact(pain: string, solution: string): number {
    let impact = 50; // 基本スコア
    
    // 数値が含まれている場合は高インパクト
    if (/\d+/.test(solution)) {
      impact += 20;
    }
    
    // 複数の価値キーワードを含む場合
    const valueCount = this.valueKeywords.filter(keyword => solution.includes(keyword)).length;
    impact += valueCount * 10;
    
    // 重要度を示す修飾語
    if (solution.includes('大幅') || solution.includes('劇的') || solution.includes('著しく')) {
      impact += 15;
    }
    
    return Math.min(100, impact);
  }

  /**
   * 指標名の生成
   */
  private generateIndicatorName(text: string): string {
    // 主要な価値キーワードを抽出
    const foundKeywords = this.valueKeywords.filter(keyword => text.includes(keyword));
    if (foundKeywords.length > 0) {
      return foundKeywords[0];
    }
    
    // 動詞を抽出
    const verbMatch = text.match(/([\u4E00-\u9FAF]+)(する|化|削減|向上|改善)/);
    if (verbMatch) {
      return verbMatch[0];
    }
    
    // 最初の20文字を使用
    return text.substring(0, 20) + '...';
  }

  /**
   * キーワードの抽出
   */
  private extractKeywords(text: string): string[] {
    const keywords = new Set<string>();
    
    // 名詞の抽出（簡易版）
    const nounPattern = /[\u4E00-\u9FAF]{2,}/g;
    const nouns = text.match(nounPattern) || [];
    
    for (const noun of nouns) {
      // 一般的すぎる単語を除外
      if (noun.length >= 2 && noun.length <= 10 && !this.isCommonWord(noun)) {
        keywords.add(noun);
      }
    }
    
    // 価値・課題キーワードも追加
    [...this.painKeywords, ...this.valueKeywords].forEach(keyword => {
      if (text.includes(keyword)) {
        keywords.add(keyword);
      }
    });
    
    return Array.from(keywords).slice(0, 20); // 最大20個
  }

  /**
   * センチメント分析
   */
  private analyzeSentiment(
    text: string, 
    painPoints: string[], 
    winPoints: WinIndicator[]
  ): 'positive' | 'neutral' | 'negative' {
    const painScore = painPoints.length * 2;
    const winScore = winPoints.length * 3;
    
    // ポジティブ・ネガティブワードのカウント
    const positiveWords = ['良い', '素晴らしい', '期待', '成功', '達成'];
    const negativeWords = ['悪い', '失敗', '困難', '不可能', '諦め'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    const totalScore = winScore + positiveCount - painScore - negativeCount;
    
    if (totalScore > 2) return 'positive';
    if (totalScore < -2) return 'negative';
    return 'neutral';
  }

  /**
   * キーワードが含まれているかチェック
   */
  private containsAnyKeyword(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * ネガティブなパターンの検出
   */
  private detectNegativePattern(text: string): boolean {
    const negativePatterns = [
      /できない/,
      /していない/,
      /されていない/,
      /うまくいかない/,
      /わからない/,
      /不十分/,
      /不足/
    ];
    
    return negativePatterns.some(pattern => pattern.test(text));
  }

  /**
   * 解決策パターンの検出
   */
  private detectSolutionPattern(text: string): boolean {
    const solutionPatterns = [
      /ことで/,
      /により/,
      /を使って/,
      /を活用/,
      /を導入/,
      /を実施/,
      /することで/
    ];
    
    return solutionPatterns.some(pattern => pattern.test(text));
  }

  /**
   * 一般的な単語かチェック
   */
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'こと', 'もの', 'ため', 'とき', 'ところ', 'それ', 'これ',
      'あれ', 'どれ', 'なに', 'わたし', 'あなた', 'みんな'
    ];
    
    return commonWords.includes(word);
  }
}