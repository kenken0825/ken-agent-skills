/**
 * Win Point Hunter Agent
 * 実務の勝ちポイントを嗅ぎ分け、Win指標へ結晶化する
 */

import { URL } from 'url';
import { WinIndicator, CompanyInfo, HearingNote } from './models/types';
import { URLParser } from './parsers/url-parser';
import { HearingParser } from './parsers/hearing-parser';

export interface WinPointHunterConfig {
  debug?: boolean;
  maxUrlDepth?: number;
}

export interface WinPointInput {
  clientUrls?: string[];
  hearingNotes?: string;
  hybridMode?: boolean;
}

export interface WinPointOutput {
  companyInfo: CompanyInfo;
  winIndicators: WinIndicator[];
  evidence: {
    sources: string[];
    confidence: number;
  };
}

export class WinPointHunterAgent {
  private urlParser: URLParser;
  private hearingParser: HearingParser;

  constructor(private config: WinPointHunterConfig = {}) {
    this.urlParser = new URLParser(config);
    this.hearingParser = new HearingParser();
  }

  /**
   * 実務の勝ちポイントを抽出
   */
  async execute(input: WinPointInput): Promise<WinPointOutput> {
    const companyInfo: CompanyInfo = {
      name: '',
      industry: '',
      description: '',
      values: [],
      services: []
    };
    
    const winIndicators: WinIndicator[] = [];
    const sources: string[] = [];

    // URLからの情報抽出
    if (input.clientUrls && input.clientUrls.length > 0) {
      for (const url of input.clientUrls) {
        const urlInfo = await this.urlParser.parse(url);
        this.mergeCompanyInfo(companyInfo, urlInfo);
        sources.push(url);
      }
    }

    // ヒアリングメモからの情報抽出
    if (input.hearingNotes) {
      const hearingInfo = this.hearingParser.parse(input.hearingNotes);
      winIndicators.push(...hearingInfo.winPoints);
      sources.push('hearing_notes');
    }

    // Win指標の結晶化
    const crystallizedIndicators = this.crystallizeWinIndicators(
      winIndicators,
      companyInfo
    );

    return {
      companyInfo,
      winIndicators: crystallizedIndicators,
      evidence: {
        sources,
        confidence: this.calculateConfidence(sources, crystallizedIndicators)
      }
    };
  }

  /**
   * Win指標の結晶化
   */
  private crystallizeWinIndicators(
    rawIndicators: WinIndicator[],
    companyInfo: CompanyInfo
  ): WinIndicator[] {
    // 重複排除と優先度付け
    const indicatorMap = new Map<string, WinIndicator>();
    
    for (const indicator of rawIndicators) {
      const key = `${indicator.category}-${indicator.name}`;
      if (!indicatorMap.has(key) || 
          (indicatorMap.get(key)!.impact < indicator.impact)) {
        indicatorMap.set(key, {
          ...indicator,
          crystallized: true,
          context: companyInfo.industry
        });
      }
    }

    return Array.from(indicatorMap.values())
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 10); // Top 10 Win Points
  }

  /**
   * 会社情報のマージ
   */
  private mergeCompanyInfo(target: CompanyInfo, source: Partial<CompanyInfo>) {
    if (source.name) target.name = source.name;
    if (source.industry) target.industry = source.industry;
    if (source.description) target.description = source.description;
    if (source.values) target.values.push(...source.values);
    if (source.services) target.services.push(...source.services);
  }

  /**
   * 信頼度の計算
   */
  private calculateConfidence(sources: string[], indicators: WinIndicator[]): number {
    const sourceScore = sources.length * 0.2;
    const indicatorScore = indicators.length * 0.1;
    const crystallizedScore = indicators.filter(i => i.crystallized).length * 0.15;
    
    return Math.min(1.0, sourceScore + indicatorScore + crystallizedScore);
  }
}