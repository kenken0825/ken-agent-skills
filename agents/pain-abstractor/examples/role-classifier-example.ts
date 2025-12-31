/**
 * Role Classifier Usage Example
 */

import { RoleClassifier } from '../classifiers/role-classifier';

// インスタンスの作成
const classifier = new RoleClassifier();

// サンプルテキストの分類
const sampleTexts = [
  '私は株式会社ABCの代表取締役として、経営戦略の立案と実行を担っています。',
  '営業部でセールスマネージャーをしており、10名のチームを管理しています。',
  'システムエンジニアとして、新規プロダクトの開発に携わっています。',
  '人事部で採用担当として、新卒・中途採用の企画から実行まで行っています。',
  '経理財務部門で決算業務と予算管理を担当しています。',
  'マーケティング部でデジタルマーケティングとブランディングを担当。',
  '法務部でコンプライアンス体制の構築と契約書レビューを行っています。',
  '工場の生産ラインでオペレーション管理を担当しています。',
  '営業とマーケティングの両方を兼務している部長です。'
];

console.log('=== Role Classification Examples ===\n');

sampleTexts.forEach((text, index) => {
  console.log(`Example ${index + 1}:`);
  console.log(`Text: "${text}"`);
  
  // 分類実行
  const result = classifier.classify(text);
  
  console.log(`Primary Role: ${result.primary}`);
  if (result.secondary) {
    console.log(`Secondary Role: ${result.secondary}`);
  }
  console.log(`Confidence: ${result.confidence}%`);
  console.log(`Evidence: ${result.evidence.join(', ')}`);
  
  // 役職レベルの検出
  const level = classifier.detectRoleLevel(text);
  console.log(`Role Level: ${level}`);
  
  // 複数役職の検出
  const multipleRoles = classifier.detectMultipleRoles(text);
  if (multipleRoles.length > 1) {
    console.log(`Multiple Roles Detected: ${multipleRoles.join(', ')}`);
  }
  
  console.log('---\n');
});

// 実際の相談メモからの分類例
console.log('=== Real Consultation Example ===\n');

const consultationMemo = `
本日は製造業の山田様からご相談いただきました。
山田様は営業部長として、売上管理とチーム運営を担当されています。
最近、顧客からの問い合わせ対応に時間がかかり、
新規開拓に充てる時間が取れないという課題をお持ちです。
また、部下の営業スタッフのスキルレベルにばらつきがあり、
教育研修の必要性も感じているとのことでした。
`;

const memoResult = classifier.classify(consultationMemo);
console.log('Consultation Memo Analysis:');
console.log(`Primary Role: ${memoResult.primary}`);
console.log(`Secondary Role: ${memoResult.secondary || 'N/A'}`);
console.log(`Confidence: ${memoResult.confidence}%`);
console.log(`Evidence: ${memoResult.evidence.join(', ')}`);
console.log(`Detected Multiple Roles: ${classifier.detectMultipleRoles(consultationMemo).join(', ')}`);
console.log(`Role Level: ${classifier.detectRoleLevel(consultationMemo)}`);