import { describe, expect, it } from 'vite-plus/test';

import {
  declaredDependencies,
  DEFAULT_TOOLING_VERSIONS,
  declaresTool,
  parseToolVersions,
  toolingDependencies,
} from '../src/tooling-dependencies.js';

describe('tooling dependency defaults', () => {
  it('pins the latest stable versions', () => {
    for (const version of Object.values(DEFAULT_TOOLING_VERSIONS)) {
      expect(version).toMatch(/^\^\d+\.\d+\.\d+$/);
    }
  });

  it('maps each tool to its packages', () => {
    expect(toolingDependencies(['oxc'])).toEqual({
      oxfmt: '^0.78.0',
      oxlint: '^1.93.0',
    });
    expect(toolingDependencies(['biome', 'eslint'])).toEqual({
      '@biomejs/biome': '^2.6.6',
      eslint: '^10.14.0',
    });
    expect(toolingDependencies(['biome', 'eslint'], { eslint: '<=9' })).toEqual({
      '@biomejs/biome': '^2.6.6',
      eslint: '<=9',
    });
  });

  it('parses package@range overrides including scoped names', () => {
    expect(parseToolVersions(['oxfmt@^0.80.0', '@biomejs/biome@^2.7.0'])).toEqual({
      oxfmt: '^0.80.0',
      '@biomejs/biome': '^2.7.0',
    });
    expect(parseToolVersions(['invalid'])).toEqual({});
  });

  it('detects declared tools, including vite-plus for Oxc', () => {
    const pkg = {
      devDependencies: { 'vite-plus': '^1.2.0', prettier: '^3.9.10' },
    };
    expect([...declaredDependencies(pkg)]).toEqual(['vite-plus', 'prettier']);
    expect(declaresTool(pkg, 'fmt', 'oxc')).toBe(true);
    expect(declaresTool(pkg, 'lint', 'oxc')).toBe(true);
    expect(declaresTool(pkg, 'fmt', 'prettier')).toBe(true);
    expect(declaresTool(pkg, 'lint', 'eslint')).toBe(false);
  });
});
