/**
 * Hearing Parser Usage Example
 */

import { HearingParser } from '../parsers/hearing-parser';

// Create parser instance
const parser = new HearingParser();

// Example 1: Simple consultation note
const simpleNote = `
現在、受注処理に毎日3時間かかっているという課題があります。
手作業でExcelに転記しているため、ミスも月に10件ほど発生しています。
システム化により、処理時間を1時間に短縮し、ミスをゼロにすることができました。
`;

console.log('=== Example 1: Simple consultation note ===');
const result1 = parser.parse(simpleNote);
console.log('Pain Points:', result1.painPoints);
console.log('Win Indicators:', result1.winPoints);
console.log('Keywords:', result1.keywords);
console.log('Sentiment:', result1.sentiment);

// Example 2: Detailed consultation with multiple improvements
const detailedNote = `
ヒアリング日時：2024年1月15日
担当者：営業部 田中様

【現状の課題】
- 在庫管理が属人化しており、担当者不在時に業務が停滞する
- 発注タイミングが経験に依存し、在庫切れや過剰在庫が発生
- 月次棚卸しに2日間かかり、その間は出荷業務が止まる

【改善提案と期待効果】
在庫管理システムの導入により、以下の効果が期待できます：
1. リアルタイムでの在庫可視化により、誰でも在庫状況を確認可能
2. 自動発注機能により、適正在庫を維持し、在庫切れを90%削減
3. バーコード管理により、棚卸し時間を2日から4時間に短縮

【追加の付加価値】
- 在庫回転率の向上により、キャッシュフローが改善
- データ分析による需要予測で、さらなる効率化が可能
`;

console.log('\n=== Example 2: Detailed consultation ===');
const result2 = parser.parse(detailedNote);
console.log('Pain Points found:', result2.painPoints.length);
console.log('Win Indicators found:', result2.winPoints.length);

// Display top win indicators
console.log('\nTop Win Indicators:');
result2.winPoints
  .sort((a, b) => b.impact - a.impact)
  .slice(0, 5)
  .forEach((win, index) => {
    console.log(`${index + 1}. [${win.category}] ${win.name}`);
    console.log(`   Impact: ${win.impact}/100`);
    console.log(`   ${win.description}`);
  });

// Example 3: Using HearingNote object
import { HearingNote } from '../models/types';

const hearingNoteObj: HearingNote = {
  content: `
    営業支援システムの導入により、見積作成時間が50%削減されました。
    また、顧客情報の一元管理により、営業活動の効率が大幅に向上しています。
    顧客満足度も15%向上し、リピート率が改善しています。
  `,
  date: new Date('2024-01-20'),
  interviewer: '山田太郎',
  interviewee: {
    name: '佐藤花子',
    role: '営業部長',
    department: '営業部'
  }
};

console.log('\n=== Example 3: Using HearingNote object ===');
const result3 = parser.parse(hearingNoteObj);
console.log('Sentiment:', result3.sentiment);
console.log('Categories found:', [...new Set(result3.winPoints.map(w => w.category))]);

// Summary function
function summarizeParseResult(result: any, title: string) {
  console.log(`\n=== ${title} Summary ===`);
  console.log(`Total Pain Points: ${result.painPoints.length}`);
  console.log(`Total Win Indicators: ${result.winPoints.length}`);
  console.log(`Unique Keywords: ${result.keywords.length}`);
  console.log(`Overall Sentiment: ${result.sentiment}`);
  
  if (result.winPoints.length > 0) {
    const avgImpact = result.winPoints.reduce((sum, w) => sum + w.impact, 0) / result.winPoints.length;
    console.log(`Average Win Impact: ${avgImpact.toFixed(1)}/100`);
  }
}

summarizeParseResult(result1, 'Simple Note');
summarizeParseResult(result2, 'Detailed Note');
summarizeParseResult(result3, 'HearingNote Object');