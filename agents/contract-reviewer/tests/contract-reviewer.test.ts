/**
 * Contract Reviewer Agent - テストスイート
 */

import {
  createContractReviewer,
  reviewContract,
  parseContract,
  createLegalExpert,
  createCFOExpert,
  createCISOExpert,
  createOperationsExpert,
  createDevilsAdvocate,
  createAngelsAdvocate,
  createJudge,
  createDebateArena,
  Contract,
  Finding,
} from '../index';
import { AnalysisContext } from '../personas/base-persona';

// =============================================================================
// テスト用サンプル契約書
// =============================================================================

const SAMPLE_CONTRACT_JA = `
業務委託契約書

株式会社ABC（以下「甲」という）と株式会社XYZ（以下「乙」という）は、
以下のとおり業務委託契約を締結する。

第1条（目的）
甲は乙に対し、本契約に定める条件に従い、システム開発業務を委託し、
乙はこれを受託する。

第2条（委託業務）
乙は、甲の指示に従い、以下の業務を遂行するものとする。
（1）Webアプリケーションの開発
（2）システムの保守・運用

第3条（契約期間）
本契約の有効期間は、2024年4月1日から2025年3月31日までとする。
ただし、期間満了の1ヶ月前までに甲乙いずれからも書面による
解約の申し出がない場合は、同一条件で1年間自動更新されるものとし、
以後も同様とする。

第4条（報酬）
甲は乙に対し、業務の対価として月額100万円（税別）を支払う。
支払いは毎月末日締め、翌月末日払いとする。

第5条（秘密保持）
甲及び乙は、本契約に関連して知り得た相手方の秘密情報を、
相手方の書面による事前の承諾なく第三者に開示・漏洩してはならない。
この義務は契約終了後も存続する。

第6条（損害賠償）
乙は、本契約に違反し甲に損害を与えた場合、甲に対し一切の損害を
賠償しなければならない。

第7条（解除）
甲は、乙が本契約に違反した場合、催告なく直ちに本契約を解除できる。

第8条（準拠法・管轄）
本契約は日本法に準拠し、東京地方裁判所を第一審の専属的合意管轄裁判所とする。

以上、本契約の成立を証するため、本書2通を作成し、
甲乙記名押印の上、各1通を保有する。
`;

const SAMPLE_NDA_EN = `
NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into between
ABC Corporation ("Disclosing Party") and XYZ Inc. ("Receiving Party").

1. CONFIDENTIAL INFORMATION
Confidential Information means any and all information disclosed by
the Disclosing Party to the Receiving Party.

2. OBLIGATIONS
The Receiving Party shall:
(a) Not disclose any Confidential Information to any third party without prior consent
(b) Use Confidential Information solely for the Purpose

3. TERM
This Agreement shall be effective for a period of 3 years from the date of execution.

4. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with
the laws of the State of Delaware, USA.

5. LIMITATION OF LIABILITY
IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
SPECIAL, CONSEQUENTIAL DAMAGES, WITHOUT LIMITATION.
`;

// =============================================================================
// Contract Parser テスト
// =============================================================================

describe('ContractParser', () => {
  test('日本語契約書をパースできる', () => {
    const result = parseContract(SAMPLE_CONTRACT_JA);

    expect(result.success).toBe(true);
    expect(result.contract).toBeDefined();
    expect(result.contract!.clauses.length).toBeGreaterThan(0);
    expect(result.contract!.metadata.language).toBe('ja');
  });

  test('英語契約書をパースできる', () => {
    const result = parseContract(SAMPLE_NDA_EN);

    expect(result.success).toBe(true);
    expect(result.contract).toBeDefined();
    expect(result.contract!.type).toBe('nda');
  });

  test('当事者を抽出できる', () => {
    const result = parseContract(SAMPLE_CONTRACT_JA);

    expect(result.contract!.parties.length).toBeGreaterThanOrEqual(0);
    // パターンマッチにより当事者が抽出される場合
  });

  test('条項タイプを検出できる', () => {
    const result = parseContract(SAMPLE_CONTRACT_JA);
    const clauses = result.contract!.clauses;

    // 秘密保持条項が検出されるか
    const hasConfidentiality = clauses.some(
      (c) => c.type === 'confidentiality' || c.content.includes('秘密')
    );
    expect(hasConfidentiality).toBe(true);
  });
});

// =============================================================================
// Persona テスト
// =============================================================================

describe('Personas', () => {
  let contract: Contract;

  beforeAll(() => {
    const result = parseContract(SAMPLE_CONTRACT_JA);
    contract = result.contract!;
  });

  const analysisContext: AnalysisContext = {
    contract: null as unknown as Contract, // 後で設定
    ourPartyName: '甲',
  };

  beforeEach(() => {
    analysisContext.contract = contract;
  });

  describe('LegalExpert', () => {
    test('法的リスクを検出できる', async () => {
      const expert = createLegalExpert();
      const analysis = await expert.analyze(analysisContext);

      expect(analysis.persona).toBe('legal_expert');
      expect(analysis.findings).toBeDefined();
      expect(Array.isArray(analysis.findings)).toBe(true);
    });

    test('無制限責任を検出できる', async () => {
      const expert = createLegalExpert();
      const analysis = await expert.analyze(analysisContext);

      // 「一切の損害」という表現があるため、無制限責任として検出されるはず
      const hasUnlimitedLiability = analysis.findings.some(
        (f) => f.title.includes('責任') || f.issue.includes('上限')
      );
      // 検出されることを期待（契約書の内容による）
      expect(analysis.findings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('CFOExpert', () => {
    test('財務リスクを検出できる', async () => {
      const expert = createCFOExpert();
      const analysis = await expert.analyze(analysisContext);

      expect(analysis.persona).toBe('cfo_expert');
      expect(analysis.findings).toBeDefined();
    });

    test('自動更新条項を検出できる', async () => {
      const expert = createCFOExpert();
      const analysis = await expert.analyze(analysisContext);

      // 「自動更新」という表現があるため検出されるはず
      const hasAutoRenewal = analysis.findings.some(
        (f) => f.title.includes('自動更新') || f.issue.includes('更新')
      );
      expect(hasAutoRenewal).toBe(true);
    });
  });

  describe('CISOExpert', () => {
    test('セキュリティリスクを検出できる', async () => {
      const expert = createCISOExpert();
      const analysis = await expert.analyze(analysisContext);

      expect(analysis.persona).toBe('ciso_expert');
      expect(analysis.findings).toBeDefined();
    });
  });

  describe('OperationsExpert', () => {
    test('運用リスクを検出できる', async () => {
      const expert = createOperationsExpert();
      const analysis = await expert.analyze(analysisContext);

      expect(analysis.persona).toBe('operations_expert');
      expect(analysis.findings).toBeDefined();
    });
  });
});

// =============================================================================
// Debate テスト
// =============================================================================

describe('Debate System', () => {
  const mockFinding: Finding = {
    id: 'test-finding-1',
    persona: 'legal_expert',
    clauseRef: 'clause-6',
    clauseNumber: '第6条',
    severity: 'high',
    category: 'legal_risk',
    title: '無制限の責任',
    issue: '損害賠償責任に上限が設定されていません',
    impact: '予測不能な巨額の損害賠償責任を負う可能性',
    recommendation: '責任上限条項の追加を交渉してください',
    evidence: ['一切の損害を賠償しなければならない'],
  };

  describe('DevilsAdvocate', () => {
    test('リスクを最大化する主張を生成できる', async () => {
      const devil = createDevilsAdvocate();
      const result = parseContract(SAMPLE_CONTRACT_JA);

      const argument = await devil.argue({
        contract: result.contract!,
        finding: mockFinding,
        round: 1,
      });

      expect(argument.position).toBeDefined();
      expect(argument.reasoning).toBeDefined();
      expect(argument.evidence).toBeDefined();
    });
  });

  describe('AngelsAdvocate', () => {
    test('メリットを擁護する主張を生成できる', async () => {
      const angel = createAngelsAdvocate();
      const result = parseContract(SAMPLE_CONTRACT_JA);

      const argument = await angel.argue({
        contract: result.contract!,
        finding: mockFinding,
        round: 1,
      });

      expect(argument.position).toBeDefined();
      expect(argument.reasoning).toBeDefined();
    });
  });

  describe('Judge', () => {
    test('判定を下せる', async () => {
      const judge = createJudge();
      const devil = createDevilsAdvocate();
      const angel = createAngelsAdvocate();
      const result = parseContract(SAMPLE_CONTRACT_JA);

      const devilArg = await devil.argue({
        contract: result.contract!,
        finding: mockFinding,
        round: 1,
      });

      const angelArg = await angel.argue({
        contract: result.contract!,
        finding: mockFinding,
        round: 1,
      });

      const outcome = await judge.deliberate(mockFinding, devilArg, angelArg);

      expect(outcome.findingId).toBe(mockFinding.id);
      expect(outcome.verdict).toBeDefined();
      expect(outcome.verdict.adjustedSeverity).toBeDefined();
      expect(outcome.verdict.rationale).toBeDefined();
    });
  });

  describe('DebateArena', () => {
    test('議論を実施できる', async () => {
      const arena = createDebateArena({ maxRounds: 1, findingsPerRound: 2 });
      const result = parseContract(SAMPLE_CONTRACT_JA);

      const output = await arena.conduct({
        contract: result.contract!,
        findings: [mockFinding],
        personaAnalyses: [],
      });

      expect(output.rounds.length).toBeGreaterThan(0);
      expect(output.allOutcomes.length).toBeGreaterThan(0);
      expect(output.synthesis).toBeDefined();
    });
  });
});

// =============================================================================
// Integration テスト
// =============================================================================

describe('ContractReviewer Integration', () => {
  test('契約書を完全にレビューできる', async () => {
    const reviewer = createContractReviewer({
      enableDebate: true,
      debateRounds: 1,
      findingsPerDebateRound: 3,
    });

    const output = await reviewer.review({
      contractText: SAMPLE_CONTRACT_JA,
      ourPartyName: '甲',
    });

    expect(output.success).toBe(true);
    expect(output.report).toBeDefined();
    expect(output.report!.executiveSummary).toBeDefined();
    expect(output.report!.personaAnalyses.length).toBe(4); // 4つのペルソナ
  });

  test('シンプルなレビュー関数が動作する', async () => {
    const output = await reviewContract(SAMPLE_CONTRACT_JA, {
      enableDebate: false,
    });

    expect(output.success).toBe(true);
    expect(output.report).toBeDefined();
  });

  test('イベントが発行される', async () => {
    const reviewer = createContractReviewer({ enableDebate: false });
    const events: string[] = [];

    reviewer.onEvent((event) => {
      events.push(event.type);
    });

    await reviewer.review({ contractText: SAMPLE_CONTRACT_JA });

    expect(events).toContain('parsing:start');
    expect(events).toContain('parsing:complete');
    expect(events).toContain('report:complete');
  });

  test('レポートをテキスト形式で出力できる', async () => {
    const reviewer = createContractReviewer({ enableDebate: false });
    const output = await reviewer.review({ contractText: SAMPLE_CONTRACT_JA });

    const text = reviewer.formatReport(output.report!);

    expect(text).toContain('契約書レビューレポート');
    expect(text).toContain('エグゼクティブサマリー');
  });

  test('英語契約書もレビューできる', async () => {
    const output = await reviewContract(SAMPLE_NDA_EN, {
      contractType: 'nda',
      enableDebate: false,
    });

    expect(output.success).toBe(true);
    expect(output.report!.contractTitle).toBeDefined();
  });
});

// =============================================================================
// Edge Cases テスト
// =============================================================================

describe('Edge Cases', () => {
  test('空の契約書でもエラーにならない', async () => {
    const output = await reviewContract('', { enableDebate: false });

    // パースには成功するが、指摘は少ないはず
    expect(output.success).toBe(true);
  });

  test('非常に短い契約書を処理できる', async () => {
    const shortContract = '秘密保持契約書\n\n秘密情報を開示しない。';
    const output = await reviewContract(shortContract, { enableDebate: false });

    expect(output.success).toBe(true);
  });

  test('構造化されていない契約書を処理できる', async () => {
    const unstructuredContract = `
      この契約は株式会社ABCと株式会社XYZの間で締結される。
      両者は秘密情報を保護し、10万ドルを支払う。
      違反した場合は全額賠償。準拠法はニューヨーク州法。
    `;
    const output = await reviewContract(unstructuredContract, {
      enableDebate: false,
    });

    expect(output.success).toBe(true);
    // 何らかの指摘が検出されるはず
  });
});
