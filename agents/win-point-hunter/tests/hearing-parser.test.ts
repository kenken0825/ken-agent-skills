/**
 * Hearing Parser Tests
 */

import { HearingParser } from '../parsers/hearing-parser';
import { HearingNote, HearingParseResult, WinIndicator } from '../models/types';

describe('HearingParser', () => {
  let parser: HearingParser;

  beforeEach(() => {
    parser = new HearingParser();
  });

  describe('parse', () => {
    it('should extract pain points from consultation notes', () => {
      const hearingNote = `
        現在、受注処理に時間がかかるという課題があります。
        毎日手作業でExcelに入力していて、ミスも多いです。
        営業担当が不在の時は処理が滞ってしまい困っています。
      `;

      const result = parser.parse(hearingNote);

      expect(result.painPoints).toHaveLength(3);
      expect(result.painPoints[0]).toContain('時間がかかる');
      expect(result.painPoints[1]).toContain('ミス');
      expect(result.painPoints[2]).toContain('困っています');
    });

    it('should extract win indicators from improvement suggestions', () => {
      const hearingNote = `
        受注処理に時間がかかるという課題があります。
        システムを導入することで、処理時間を50%削減できました。
        また、ミスも大幅に減少し、品質が向上しています。
      `;

      const result = parser.parse(hearingNote);

      expect(result.winPoints.length).toBeGreaterThan(0);
      
      const efficiencyWin = result.winPoints.find(w => w.category === 'efficiency');
      expect(efficiencyWin).toBeDefined();
      expect(efficiencyWin?.impact).toBeGreaterThan(70);

      const qualityWin = result.winPoints.find(w => w.category === 'quality');
      expect(qualityWin).toBeDefined();
    });

    it('should extract relevant keywords', () => {
      const hearingNote = `
        在庫管理システムの導入により、在庫の可視化が実現しました。
        発注業務の自動化で、業務効率が大幅に向上しています。
      `;

      const result = parser.parse(hearingNote);

      expect(result.keywords).toContain('在庫管理');
      expect(result.keywords).toContain('システム');
      expect(result.keywords).toContain('可視化');
      expect(result.keywords).toContain('自動化');
      expect(result.keywords).toContain('業務効率');
    });

    it('should analyze sentiment correctly', () => {
      const positiveNote = `
        新システムの導入により、売上が20%向上しました。
        顧客満足度も大幅に改善し、素晴らしい成果を達成できています。
      `;

      const negativeNote = `
        現在のシステムは使いにくく、多くの問題があります。
        改善の見込みもなく、困難な状況が続いています。
      `;

      const positiveResult = parser.parse(positiveNote);
      const negativeResult = parser.parse(negativeNote);

      expect(positiveResult.sentiment).toBe('positive');
      expect(negativeResult.sentiment).toBe('negative');
    });

    it('should handle HearingNote object input', () => {
      const hearingNote: HearingNote = {
        content: '業務効率化により、コスト削減を実現しました。',
        date: new Date(),
        interviewer: 'John Doe',
        interviewee: {
          name: 'Jane Smith',
          role: 'Manager',
          department: 'Sales'
        }
      };

      const result = parser.parse(hearingNote);

      expect(result.winPoints.length).toBeGreaterThan(0);
      expect(result.keywords).toContain('業務効率化');
      expect(result.keywords).toContain('コスト削減');
    });

    it('should create win indicators with proper evidence', () => {
      const hearingNote = `
        月次レポート作成に8時間かかっていました。
        自動化ツールの導入で、1時間に短縮できました。
      `;

      const result = parser.parse(hearingNote);

      const winIndicator = result.winPoints[0];
      expect(winIndicator.evidence).toContain('8時間');
      expect(winIndicator.description).toContain('1時間に短縮');
    });

    it('should categorize win indicators correctly', () => {
      const hearingNote = `
        効率化により作業時間を削減。
        品質管理の強化でミスが減少。
        コスト削減で年間100万円の節約。
        新規顧客獲得で売上が拡大。
        使いやすさの改善で満足度が向上。
      `;

      const result = parser.parse(hearingNote);

      const categories = result.winPoints.map(w => w.category);
      expect(categories).toContain('efficiency');
      expect(categories).toContain('quality');
      expect(categories).toContain('cost');
      expect(categories).toContain('growth');
      expect(categories).toContain('satisfaction');
    });
  });
});