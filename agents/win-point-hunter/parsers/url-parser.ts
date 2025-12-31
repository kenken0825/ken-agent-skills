/**
 * URL Parser for Win Point Hunter Agent
 * 
 * URLを解析して企業情報、業界、サービス詳細を抽出
 */

import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { CompanyInfo, URLParseResult } from '../models/types';

export class URLParser {
  private readonly timeout: number = 10000; // 10 seconds
  private readonly userAgent: string = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  /**
   * URLを解析して企業情報を抽出
   * @param url 解析対象のURL
   * @returns URL解析結果
   */
  async parse(url: string): Promise<URLParseResult> {
    try {
      // URLの検証
      const validUrl = this.validateUrl(url);
      
      // HTMLコンテンツの取得
      const html = await this.fetchContent(validUrl);
      
      // CheerioでHTMLを解析
      const $ = cheerio.load(html);
      
      // メタ情報の抽出
      const title = this.extractTitle($);
      const description = this.extractDescription($);
      
      // 企業情報の抽出
      const companyInfo = this.extractCompanyInfo($, validUrl);
      
      // 価値観やキーワードの抽出
      const extractedValues = this.extractValues($);
      
      // 信頼度の計算
      const confidence = this.calculateConfidence(companyInfo, extractedValues);
      
      return {
        url: validUrl,
        title,
        description,
        companyInfo,
        extractedValues,
        confidence
      };
    } catch (error) {
      throw new Error(`Failed to parse URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * URLの妥当性を検証
   * @param url 検証対象のURL
   * @returns 正規化されたURL
   */
  private validateUrl(url: string): string {
    try {
      const urlObject = new URL(url);
      if (!['http:', 'https:'].includes(urlObject.protocol)) {
        throw new Error('Invalid protocol. Only HTTP and HTTPS are supported.');
      }
      return urlObject.href;
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  /**
   * URLからHTMLコンテンツを取得
   * @param url 取得対象のURL
   * @returns HTMLコンテンツ
   */
  private async fetchContent(url: string): Promise<string> {
    try {
      const response: AxiosResponse = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 300
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error(`Request timeout: ${url}`);
        }
        if (error.response) {
          throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
        }
      }
      throw new Error(`Failed to fetch content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * タイトルを抽出
   * @param $ Cheerioインスタンス
   * @returns タイトル
   */
  private extractTitle($: cheerio.CheerioAPI): string {
    // OGPタイトルを優先
    const ogTitle = $('meta[property="og:title"]').attr('content');
    if (ogTitle) return ogTitle.trim();
    
    // 通常のtitleタグ
    const title = $('title').text();
    if (title) return title.trim();
    
    // h1タグ
    const h1 = $('h1').first().text();
    if (h1) return h1.trim();
    
    return 'Untitled';
  }

  /**
   * 説明文を抽出
   * @param $ Cheerioインスタンス
   * @returns 説明文
   */
  private extractDescription($: cheerio.CheerioAPI): string {
    // OGP description
    const ogDesc = $('meta[property="og:description"]').attr('content');
    if (ogDesc) return ogDesc.trim();
    
    // meta description
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc) return metaDesc.trim();
    
    // 最初の段落
    const firstParagraph = $('p').first().text();
    if (firstParagraph && firstParagraph.length > 50) {
      return firstParagraph.substring(0, 200).trim() + '...';
    }
    
    return '';
  }

  /**
   * 企業情報を抽出
   * @param $ Cheerioインスタンス
   * @param url URL
   * @returns 企業情報
   */
  private extractCompanyInfo($: cheerio.CheerioAPI, url: string): Partial<CompanyInfo> {
    const info: Partial<CompanyInfo> = {
      url
    };

    // 企業名の抽出
    info.name = this.extractCompanyName($);
    
    // 業界の推定
    info.industry = this.extractIndustry($);
    
    // サービスの抽出
    info.services = this.extractServices($);
    
    // 企業規模の推定
    info.size = this.estimateCompanySize($);
    
    // 説明文
    info.description = this.extractDescription($);
    
    // 価値観の抽出
    info.values = this.extractCompanyValues($);

    return info;
  }

  /**
   * 企業名を抽出
   * @param $ Cheerioインスタンス
   * @returns 企業名
   */
  private extractCompanyName($: cheerio.CheerioAPI): string {
    // サイト名メタタグ
    const siteName = $('meta[property="og:site_name"]').attr('content');
    if (siteName) return siteName.trim();
    
    // 構造化データから
    const jsonLd = $('script[type="application/ld+json"]').text();
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd);
        if (data.name) return data.name;
        if (data.organization?.name) return data.organization.name;
      } catch {
        // JSON parse error - ignore
      }
    }
    
    // ヘッダーやフッターから推測
    const headerText = $('header').text();
    const footerText = $('footer').text();
    
    // 著作権表記から
    const copyrightMatch = footerText.match(/©\s*(\d{4}\s*)?([^0-9]+)/);
    if (copyrightMatch && copyrightMatch[2]) {
      return copyrightMatch[2].trim();
    }
    
    return 'Unknown Company';
  }

  /**
   * 業界を推定
   * @param $ Cheerioインスタンス
   * @returns 業界
   */
  private extractIndustry($: cheerio.CheerioAPI): string {
    const bodyText = $('body').text().toLowerCase();
    
    // 業界キーワードのマッピング
    const industryKeywords: { [key: string]: string[] } = {
      'IT・テクノロジー': ['it', 'ソフトウェア', 'software', 'tech', 'デジタル', 'digital', 'ai', '人工知能', 'データ'],
      '金融': ['金融', 'finance', '銀行', 'bank', '保険', 'insurance', '投資', 'investment'],
      '製造業': ['製造', 'manufacturing', '工場', 'factory', '生産', 'production', 'メーカー'],
      '小売・流通': ['小売', 'retail', '販売', 'sales', '流通', 'distribution', 'ec', 'ecommerce'],
      '医療・ヘルスケア': ['医療', 'medical', 'ヘルスケア', 'healthcare', '病院', 'hospital', '薬', 'pharmaceutical'],
      '教育': ['教育', 'education', '学習', 'learning', '研修', 'training', 'スクール', 'school'],
      '建設・不動産': ['建設', 'construction', '不動産', 'real estate', '建築', 'architecture'],
      'サービス業': ['サービス', 'service', 'コンサルティング', 'consulting', 'マーケティング', 'marketing']
    };
    
    // 各業界のスコアを計算
    let bestMatch = 'その他';
    let bestScore = 0;
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      const score = keywords.filter(keyword => bodyText.includes(keyword)).length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = industry;
      }
    }
    
    return bestMatch;
  }

  /**
   * サービスを抽出
   * @param $ Cheerioインスタンス
   * @returns サービスリスト
   */
  private extractServices($: cheerio.CheerioAPI): string[] {
    const services: Set<string> = new Set();
    
    // サービスページのリンクから
    $('a[href*="service"], a[href*="product"], a[href*="solution"]').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 2 && text.length < 50) {
        services.add(text);
      }
    });
    
    // 特定のセクションから
    $('section, div').each((_, elem) => {
      const $elem = $(elem);
      const heading = $elem.find('h2, h3').first().text().toLowerCase();
      
      if (heading.includes('サービス') || heading.includes('service') || 
          heading.includes('製品') || heading.includes('product') ||
          heading.includes('ソリューション') || heading.includes('solution')) {
        
        $elem.find('li, p').each((_, item) => {
          const text = $(item).text().trim();
          if (text && text.length > 5 && text.length < 100) {
            services.add(text.split('\n')[0]); // 最初の行のみ
          }
        });
      }
    });
    
    return Array.from(services).slice(0, 10); // 最大10個まで
  }

  /**
   * 企業規模を推定
   * @param $ Cheerioインスタンス
   * @returns 企業規模
   */
  private estimateCompanySize($: cheerio.CheerioAPI): 'small' | 'medium' | 'large' | 'enterprise' {
    const bodyText = $('body').text();
    
    // 従業員数のパターン
    const employeePatterns = [
      /従業員数[：:]*\s*([0-9,]+)/,
      /社員数[：:]*\s*([0-9,]+)/,
      /([0-9,]+)\s*名/,
      /([0-9,]+)\s*人/
    ];
    
    for (const pattern of employeePatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        const count = parseInt(match[1].replace(/,/g, ''));
        if (count < 50) return 'small';
        if (count < 250) return 'medium';
        if (count < 1000) return 'large';
        return 'enterprise';
      }
    }
    
    // グローバル展開の言及
    if (bodyText.includes('グローバル') || bodyText.includes('global') || 
        bodyText.includes('世界中') || bodyText.includes('worldwide')) {
      return 'enterprise';
    }
    
    // デフォルト
    return 'medium';
  }

  /**
   * 企業の価値観を抽出
   * @param $ Cheerioインスタンス
   * @returns 価値観リスト
   */
  private extractCompanyValues($: cheerio.CheerioAPI): string[] {
    const values: Set<string> = new Set();
    
    // ミッション、ビジョン、バリューのセクション
    $('section, div').each((_, elem) => {
      const $elem = $(elem);
      const text = $elem.text().toLowerCase();
      
      if (text.includes('ミッション') || text.includes('mission') ||
          text.includes('ビジョン') || text.includes('vision') ||
          text.includes('バリュー') || text.includes('value') ||
          text.includes('理念') || text.includes('philosophy')) {
        
        $elem.find('li, p').each((_, item) => {
          const valueText = $(item).text().trim();
          if (valueText && valueText.length > 5 && valueText.length < 100) {
            values.add(valueText.split('\n')[0]);
          }
        });
      }
    });
    
    return Array.from(values).slice(0, 5); // 最大5個まで
  }

  /**
   * 価値観やキーワードを抽出
   * @param $ Cheerioインスタンス
   * @returns 抽出された価値観
   */
  private extractValues($: cheerio.CheerioAPI): string[] {
    const values: Set<string> = new Set();
    const bodyText = $('body').text();
    
    // Win指標に関連するキーワード
    const winKeywords = [
      // 効率性
      '効率', '生産性', 'productivity', 'efficiency', '自動化', 'automation',
      '最適化', 'optimization', 'スピード', 'speed', '迅速', 'agile',
      
      // 品質
      '品質', 'quality', '精度', 'accuracy', '信頼性', 'reliability',
      'エラー削減', 'error reduction', '改善', 'improvement',
      
      // コスト
      'コスト削減', 'cost reduction', '費用対効果', 'roi', '節約', 'saving',
      
      // 成長
      '成長', 'growth', '拡大', 'expansion', 'スケール', 'scale',
      '革新', 'innovation', 'イノベーション',
      
      // 満足度
      '満足度', 'satisfaction', '顧客満足', 'customer satisfaction',
      'エンゲージメント', 'engagement', '体験', 'experience'
    ];
    
    // キーワードマッチング
    winKeywords.forEach(keyword => {
      if (bodyText.toLowerCase().includes(keyword.toLowerCase())) {
        values.add(keyword);
      }
    });
    
    // 特徴的なフレーズの抽出
    const strongPhrases = $('strong, b, em').map((_, elem) => $(elem).text().trim()).get();
    strongPhrases.forEach(phrase => {
      if (phrase.length > 5 && phrase.length < 50) {
        values.add(phrase);
      }
    });
    
    return Array.from(values).slice(0, 20); // 最大20個まで
  }

  /**
   * 信頼度を計算
   * @param companyInfo 企業情報
   * @param extractedValues 抽出された価値観
   * @returns 信頼度スコア（0-1）
   */
  private calculateConfidence(companyInfo: Partial<CompanyInfo>, extractedValues: string[]): number {
    let score = 0;
    let maxScore = 0;
    
    // 企業名
    if (companyInfo.name && companyInfo.name !== 'Unknown Company') {
      score += 20;
    }
    maxScore += 20;
    
    // 業界
    if (companyInfo.industry && companyInfo.industry !== 'その他') {
      score += 15;
    }
    maxScore += 15;
    
    // サービス
    if (companyInfo.services && companyInfo.services.length > 0) {
      score += Math.min(companyInfo.services.length * 3, 15);
    }
    maxScore += 15;
    
    // 企業規模
    if (companyInfo.size) {
      score += 10;
    }
    maxScore += 10;
    
    // 価値観
    if (companyInfo.values && companyInfo.values.length > 0) {
      score += Math.min(companyInfo.values.length * 4, 20);
    }
    maxScore += 20;
    
    // 抽出された価値観
    if (extractedValues.length > 0) {
      score += Math.min(extractedValues.length * 2, 20);
    }
    maxScore += 20;
    
    return score / maxScore;
  }

  /**
   * バッチ処理でURLリストを解析
   * @param urls URLリスト
   * @param concurrency 同時実行数
   * @returns 解析結果リスト
   */
  async parseBatch(urls: string[], concurrency: number = 3): Promise<URLParseResult[]> {
    const results: URLParseResult[] = [];
    
    // URLを同時実行数ごとのバッチに分割
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      
      // バッチ内のURLを並列処理
      const batchResults = await Promise.allSettled(
        batch.map(url => this.parse(url))
      );
      
      // 成功した結果のみを収集
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to parse ${batch[index]}: ${result.reason}`);
          // エラーの場合も基本的な結果を返す
          results.push({
            url: batch[index],
            title: 'Error',
            description: `Failed to parse: ${result.reason}`,
            companyInfo: {},
            extractedValues: [],
            confidence: 0
          });
        }
      });
    }
    
    return results;
  }
}

// デフォルトのインスタンスをエクスポート
export const urlParser = new URLParser();