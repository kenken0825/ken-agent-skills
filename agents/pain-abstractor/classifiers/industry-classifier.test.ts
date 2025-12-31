/**
 * Industry Classifier Test
 * 業界分類のテストケース
 */

import { IndustryClassifier } from './industry-classifier';
import { ConsultationData } from '../models/types';

// テスト用のサンプルテキスト
const testCases = {
  manufacturing: `
    弊社の製造ラインにおいて、品質管理の工程で不良品の検出が遅れることが頻繁に発生しています。
    生産効率を上げるために自動化を進めていますが、設備投資のコストと品質保証のバランスが課題です。
    また、サプライチェーンの最適化により在庫管理を改善したいと考えています。
  `,
  retail: `
    当店舗では売上向上のため、商品陳列の最適化とPOSデータの分析に取り組んでいます。
    ECサイトとの在庫連携がうまくいかず、在庫回転率が低下している状況です。
    顧客満足度を高めるため、接客マニュアルの改善も検討しています。
  `,
  finance: `
    金融機関として、マネーロンダリング対策（AML）とKYC（本人確認）プロセスの強化が急務です。
    融資審査の効率化を図りながら、リスク管理体制を強化する必要があります。
    フィンテック企業との競争に対応するため、デジタルサービスの拡充も課題です。
  `,
  healthcare: `
    当院では電子カルテシステムの導入により、診療効率の向上を目指しています。
    患者満足度を高めるため、待ち時間の短縮と医療安全の強化に取り組んでいます。
    また、感染対策の徹底と医薬品在庫管理の最適化も重要な課題です。
  `,
  it: `
    クラウド移行プロジェクトを進めており、セキュリティ対策の強化が必要です。
    アジャイル開発手法を採用し、CI/CDパイプラインの構築を進めています。
    AI・機械学習を活用したデータ分析基盤の構築も計画しています。
  `,
  construction: `
    建設現場での安全管理体制の強化と、施工管理の効率化が課題です。
    工事の進捗管理をデジタル化し、現場監督の負担を軽減したいと考えています。
    建材コストの上昇に対応するため、原価管理の徹底も必要です。
  `,
  education: `
    オンライン授業の導入により、生徒の学習効果を高める取り組みを進めています。
    教材のデジタル化と成績管理システムの改善により、教員の業務効率化を図っています。
    保護者とのコミュニケーション強化も重要な課題として認識しています。
  `,
  service: `
    ホテルの接客品質向上のため、スタッフ教育プログラムを見直しています。
    予約管理システムの最適化により、稼働率の向上を目指しています。
    顧客満足度を高めるため、ホスピタリティの実践とサービス標準化に取り組んでいます。
  `
};

async function runTests() {
  const classifier = new IndustryClassifier();
  
  console.log('=== Industry Classifier Test Results ===\n');
  
  for (const [expectedIndustry, text] of Object.entries(testCases)) {
    const consultation: ConsultationData = {
      id: `test_${expectedIndustry}`,
      content: text,
      timestamp: new Date()
    };
    
    const result = classifier.classifyText(text);
    const isCorrect = result.primary === expectedIndustry;
    
    console.log(`Test Case: ${expectedIndustry}`);
    console.log(`Result: ${result.primary} (Confidence: ${result.confidence.toFixed(3)})`);
    console.log(`Secondary: ${result.secondary || 'None'}`);
    console.log(`Status: ${isCorrect ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Evidence: ${result.evidence.slice(0, 3).join(', ')}`);
    console.log('---\n');
  }
  
  // 混合ケースのテスト
  const mixedCase = `
    弊社はIT企業として、金融機関向けのシステム開発を行っています。
    セキュリティ対策とコンプライアンス対応が重要な課題です。
    アジャイル開発手法を採用し、クラウドベースのソリューションを提供しています。
  `;
  
  console.log('=== Mixed Industry Test ===');
  const mixedResult = classifier.classifyText(mixedCase);
  console.log(`Primary: ${mixedResult.primary} (Confidence: ${mixedResult.confidence.toFixed(3)})`);
  console.log(`Secondary: ${mixedResult.secondary}`);
  console.log(`Evidence: ${mixedResult.evidence.join(', ')}`);
}

// テストの実行
if (require.main === module) {
  runTests().catch(console.error);
}