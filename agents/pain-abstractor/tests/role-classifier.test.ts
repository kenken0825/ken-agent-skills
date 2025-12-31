/**
 * Role Classifier Tests
 */

import { RoleClassifier } from '../classifiers/role-classifier';

describe('RoleClassifier', () => {
  let classifier: RoleClassifier;

  beforeEach(() => {
    classifier = new RoleClassifier();
  });

  describe('classify', () => {
    it('should classify executive roles correctly', () => {
      const testCases = [
        '私は株式会社〇〇の代表取締役です',
        'CEO として経営戦略を立案しています',
        '取締役会で事業計画を承認しました'
      ];

      testCases.forEach(text => {
        const result = classifier.classify(text);
        expect(result.primary).toBe('executive');
        expect(result.confidence).toBeGreaterThan(50);
        expect(result.evidence.length).toBeGreaterThan(0);
      });
    });

    it('should classify management roles correctly', () => {
      const testCases = [
        '営業部長として部門の目標管理を行っています',
        'マネージャーとして10名のチームを率いています',
        '課長として業務改善を推進中'
      ];

      testCases.forEach(text => {
        const result = classifier.classify(text);
        expect(result.primary).toBe('management');
        expect(result.confidence).toBeGreaterThan(50);
      });
    });

    it('should classify sales roles correctly', () => {
      const testCases = [
        '営業担当として新規顧客開拓を行っています',
        'セールスマンとして売上目標を達成しました',
        'ルートセールスで既存顧客を回っています'
      ];

      testCases.forEach(text => {
        const result = classifier.classify(text);
        expect(result.primary).toBe('sales');
        expect(result.confidence).toBeGreaterThan(50);
      });
    });

    it('should classify marketing roles correctly', () => {
      const testCases = [
        'マーケティング部でブランディングを担当',
        'デジタルマーケティングのプランナーです',
        'PR担当として広報活動を行っています'
      ];

      testCases.forEach(text => {
        const result = classifier.classify(text);
        expect(result.primary).toBe('marketing');
        expect(result.confidence).toBeGreaterThan(50);
      });
    });

    it('should classify HR roles correctly', () => {
      const testCases = [
        '人事部で採用を担当しています',
        '労務管理と教育研修を担当',
        'タレントマネジメントシステムの導入を推進'
      ];

      testCases.forEach(text => {
        const result = classifier.classify(text);
        expect(result.primary).toBe('hr');
        expect(result.confidence).toBeGreaterThan(50);
      });
    });

    it('should classify accounting roles correctly', () => {
      const testCases = [
        '経理部で決算業務を担当',
        '財務担当として資金調達を行っています',
        '予算管理と内部統制を担当'
      ];

      testCases.forEach(text => {
        const result = classifier.classify(text);
        expect(result.primary).toBe('accounting');
        expect(result.confidence).toBeGreaterThan(50);
      });
    });

    it('should classify legal roles correctly', () => {
      const testCases = [
        '法務部で契約書のレビューを担当',
        'コンプライアンス担当として規制対応',
        '知的財産の管理を行っています'
      ];

      testCases.forEach(text => {
        const result = classifier.classify(text);
        expect(result.primary).toBe('legal');
        expect(result.confidence).toBeGreaterThan(50);
      });
    });

    it('should classify engineer roles correctly', () => {
      const testCases = [
        'システムエンジニアとして開発を担当',
        'AIエンジニアとして機械学習モデルを構築',
        'インフラエンジニアとしてネットワーク設計'
      ];

      testCases.forEach(text => {
        const result = classifier.classify(text);
        expect(result.primary).toBe('engineer');
        expect(result.confidence).toBeGreaterThan(50);
      });
    });

    it('should classify operations roles correctly', () => {
      const testCases = [
        '製造現場でオペレーション管理を担当',
        '物流センターで倉庫運営を行っています',
        '品質管理部門でQC活動を推進'
      ];

      testCases.forEach(text => {
        const result = classifier.classify(text);
        expect(result.primary).toBe('operations');
        expect(result.confidence).toBeGreaterThan(50);
      });
    });

    it('should handle ambiguous cases with secondary classification', () => {
      const text = '営業部長として売上管理とチームマネジメントを担当';
      const result = classifier.classify(text);
      
      expect(['sales', 'management']).toContain(result.primary);
      expect(result.secondary).toBeDefined();
      expect(['sales', 'management']).toContain(result.secondary);
    });

    it('should return unknown for unclassifiable text', () => {
      const testCases = [
        '',
        '天気がいいですね',
        '今日のランチは美味しかった'
      ];

      testCases.forEach(text => {
        const result = classifier.classify(text);
        expect(result.primary).toBe('unknown');
        expect(result.confidence).toBe(0);
      });
    });
  });

  describe('detectMultipleRoles', () => {
    it('should detect multiple roles in text', () => {
      const text = 'エンジニア出身で、現在は営業部長として活動。マーケティングにも関わっています。';
      const roles = classifier.detectMultipleRoles(text);
      
      expect(roles).toContain('engineer');
      expect(roles).toContain('sales');
      expect(roles).toContain('management');
      expect(roles).toContain('marketing');
    });
  });

  describe('detectRoleLevel', () => {
    it('should detect executive level', () => {
      const text = 'CEOとして経営を担当';
      const level = classifier.detectRoleLevel(text);
      expect(level).toBe('executive');
    });

    it('should detect manager level', () => {
      const text = 'マネージャーとしてチームを管理';
      const level = classifier.detectRoleLevel(text);
      expect(level).toBe('manager');
    });

    it('should detect staff level', () => {
      const text = 'スタッフとして業務を担当';
      const level = classifier.detectRoleLevel(text);
      expect(level).toBe('staff');
    });

    it('should return unknown for no level indicators', () => {
      const text = '業務を行っています';
      const level = classifier.detectRoleLevel(text);
      expect(level).toBe('unknown');
    });
  });
});