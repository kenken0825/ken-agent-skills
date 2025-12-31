/**
 * Changelog Generator
 * スキルの更新履歴を生成
 */

import { Skill, SkillMetadata, GeneratorInterface } from '../models/types';

export class ChangelogGenerator implements GeneratorInterface {
  /**
   * CHANGELOG.mdを生成
   */
  async generate(skill: Skill, metadata?: SkillMetadata): Promise<string> {
    const sections: string[] = [];
    
    // ヘッダー
    sections.push(this.generateHeader(skill));
    
    // 更新履歴
    if (metadata?.changelog && metadata.changelog.length > 0) {
      sections.push(this.generateChangelogEntries(metadata.changelog));
    } else {
      // デフォルトの初期エントリ
      sections.push(this.generateDefaultChangelog(skill, metadata));
    }
    
    // フッター
    sections.push(this.generateFooter());
    
    return sections.join('\n\n');
  }
  
  /**
   * コンテンツの検証
   */
  validate(content: string): boolean {
    // 基本的な構造の確認
    return content.includes('# Changelog') || content.includes('# 更新履歴');
  }
  
  /**
   * ヘッダーの生成
   */
  private generateHeader(skill: Skill): string {
    return `# Changelog

All notable changes to the "${skill.name}" skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).`;
  }
  
  /**
   * 更新履歴エントリの生成
   */
  private generateChangelogEntries(changelog: Array<{version: string; date: string; changes: string[]}>): string {
    const entries: string[] = [];
    
    // バージョンごとのエントリを生成
    changelog.forEach((entry, index) => {
      const isLatest = index === 0;
      const versionHeader = isLatest 
        ? `## [${entry.version}] - ${entry.date} (Latest)`
        : `## [${entry.version}] - ${entry.date}`;
      
      entries.push(versionHeader);
      
      // 変更をカテゴリ別に分類
      const categorizedChanges = this.categorizeChanges(entry.changes);
      
      // 各カテゴリの変更を出力
      if (categorizedChanges.added.length > 0) {
        entries.push('', '### Added');
        categorizedChanges.added.forEach(change => {
          entries.push(`- ${change}`);
        });
      }
      
      if (categorizedChanges.changed.length > 0) {
        entries.push('', '### Changed');
        categorizedChanges.changed.forEach(change => {
          entries.push(`- ${change}`);
        });
      }
      
      if (categorizedChanges.deprecated.length > 0) {
        entries.push('', '### Deprecated');
        categorizedChanges.deprecated.forEach(change => {
          entries.push(`- ${change}`);
        });
      }
      
      if (categorizedChanges.removed.length > 0) {
        entries.push('', '### Removed');
        categorizedChanges.removed.forEach(change => {
          entries.push(`- ${change}`);
        });
      }
      
      if (categorizedChanges.fixed.length > 0) {
        entries.push('', '### Fixed');
        categorizedChanges.fixed.forEach(change => {
          entries.push(`- ${change}`);
        });
      }
      
      if (categorizedChanges.security.length > 0) {
        entries.push('', '### Security');
        categorizedChanges.security.forEach(change => {
          entries.push(`- ${change}`);
        });
      }
    });
    
    return entries.join('\n');
  }
  
  /**
   * デフォルトの更新履歴を生成
   */
  private generateDefaultChangelog(skill: Skill, metadata?: SkillMetadata): string {
    const version = metadata?.version || '1.0.0';
    const date = new Date().toISOString().split('T')[0];
    
    const lines: string[] = [
      `## [${version}] - ${date}`,
      '',
      '### Added'
    ];
    
    // 初期機能のリスト
    const features: string[] = [];
    
    // スキルの基本情報から機能を推測
    features.push(`Initial implementation of ${skill.name}`);
    
    if (skill.assets?.scripts?.length) {
      features.push(`${skill.assets.scripts.length} automation scripts`);
    }
    
    if (skill.assets?.templates?.length) {
      features.push(`${skill.assets.templates.length} templates for quick setup`);
    }
    
    if (skill.assets?.documents?.length) {
      features.push(`Comprehensive documentation (${skill.assets.documents.length} documents)`);
    }
    
    if (skill.triggers && skill.triggers.length > 0) {
      features.push(`Support for ${skill.triggers.length} trigger patterns`);
    }
    
    if (skill.painPatterns && skill.painPatterns.length > 0) {
      features.push(`Solutions for ${skill.painPatterns.length} identified pain points`);
    }
    
    // 基本機能
    features.push('Configuration management system');
    features.push('Error handling and logging');
    features.push('Unit tests and integration tests');
    
    features.forEach(feature => {
      lines.push(`- ${feature}`);
    });
    
    // 既知の問題（あれば）
    lines.push('', '### Known Issues');
    lines.push('- None at this time');
    
    return lines.join('\n');
  }
  
  /**
   * フッターの生成
   */
  private generateFooter(): string {
    return `---

## Version History Summary

| Version | Release Date | Major Changes |
|---------|--------------|---------------|
| 1.0.0   | ${new Date().toISOString().split('T')[0]} | Initial release |

## Roadmap

### Planned Features
- Enhanced error handling and recovery
- Performance optimizations
- Additional language support
- Extended configuration options
- API rate limiting and caching

### Future Considerations
- Cloud deployment options
- Enterprise features
- Advanced analytics and reporting
- Multi-tenant support

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to contribute to this project.

## Support

For questions, issues, or feature requests, please:
1. Check the [FAQ](./docs/FAQ.md)
2. Search existing [Issues](https://github.com/your-org/skill-repo/issues)
3. Create a new issue if needed

---

*This changelog is automatically generated and maintained.*`;
  }
  
  /**
   * 変更をカテゴリ別に分類
   */
  private categorizeChanges(changes: string[]): {
    added: string[];
    changed: string[];
    deprecated: string[];
    removed: string[];
    fixed: string[];
    security: string[];
  } {
    const categorized = {
      added: [] as string[],
      changed: [] as string[],
      deprecated: [] as string[],
      removed: [] as string[],
      fixed: [] as string[],
      security: [] as string[]
    };
    
    changes.forEach(change => {
      const lowerChange = change.toLowerCase();
      
      // キーワードに基づいて分類
      if (lowerChange.includes('add') || lowerChange.includes('new') || lowerChange.includes('追加')) {
        categorized.added.push(change);
      } else if (lowerChange.includes('fix') || lowerChange.includes('修正') || lowerChange.includes('バグ')) {
        categorized.fixed.push(change);
      } else if (lowerChange.includes('change') || lowerChange.includes('update') || lowerChange.includes('変更') || lowerChange.includes('更新')) {
        categorized.changed.push(change);
      } else if (lowerChange.includes('deprecat') || lowerChange.includes('非推奨')) {
        categorized.deprecated.push(change);
      } else if (lowerChange.includes('remove') || lowerChange.includes('delete') || lowerChange.includes('削除')) {
        categorized.removed.push(change);
      } else if (lowerChange.includes('security') || lowerChange.includes('セキュリティ') || lowerChange.includes('脆弱性')) {
        categorized.security.push(change);
      } else {
        // デフォルトは changed に分類
        categorized.changed.push(change);
      }
    });
    
    return categorized;
  }
  
  /**
   * バージョン比較のヘルパー関数
   */
  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;
      
      if (partA > partB) return -1;
      if (partA < partB) return 1;
    }
    
    return 0;
  }
  
  /**
   * セマンティックバージョニングに基づく次のバージョンの推測
   */
  private suggestNextVersion(currentVersion: string, changeType: 'major' | 'minor' | 'patch'): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    switch (changeType) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }
}