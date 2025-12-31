# Pain Abstractor Classifiers

This directory contains classifiers for the Pain Abstractor Agent.

## Industry Classifier

The `industry-classifier.ts` implements a keyword-based and pattern matching classifier for identifying industries from consultation text.

### Supported Industries

- **manufacturing** - 製造業
- **retail** - 小売業
- **finance** - 金融業
- **healthcare** - 医療・ヘルスケア
- **it** - IT・テクノロジー (note: classified as "it" not "technology")
- **construction** - 建設業
- **education** - 教育
- **service** - サービス業

### Features

1. **Keyword Dictionary**: Each industry has a comprehensive list of Japanese keywords
2. **Pattern Matching**: Regular expressions to detect industry-specific phrases
3. **Confidence Scoring**: Returns confidence level based on match strength
4. **Evidence Tracking**: Provides evidence for classification decisions

### Usage

```typescript
import { IndustryClassifier } from './classifiers/industry-classifier';
import { ConsultationData } from './models/types';

const classifier = new IndustryClassifier();

// Classify single text
const result = classifier.classifyText('製造ラインの品質管理に課題があります');
console.log(result.primary); // "manufacturing"
console.log(result.confidence); // 0.85
console.log(result.evidence); // ["キーワード「製造」を検出", ...]

// Classify multiple consultations
const consultations: ConsultationData[] = [
  {
    id: '1',
    content: 'システム開発の効率化を図りたい',
    timestamp: new Date()
  }
];

const industry = await classifier.classify(consultations);
console.log(industry); // "it"
```

### Testing

Run the test file to see classification examples:

```bash
npx ts-node agents/pain-abstractor/classifiers/industry-classifier.test.ts
```

### Extending

To add new industries or improve classification:

1. Add keywords to `industryKeywords` in the classifier
2. Add patterns to `industryPatterns` for better accuracy
3. Adjust scoring weights if needed