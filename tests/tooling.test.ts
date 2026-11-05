import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
    DEFAULT_FMT_RULES,
    DEFAULT_LINT_RULES,
    sectionConfig,
    type SyncContext,
    type ToolchainConfig,
} from '../src/index.js';
import { normalizeToolingConfig, toolingDefaultsTask } from '../src/tooling.js';

const tmpDirs: string[] = [];

function tmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-tooling-'));
    fs.mkdirSync(path.join(dir, '.git'));
    tmpDirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function writeJson(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(value, null, 4)}\n`, 'utf-8');
}

function packageJson(cwd: string, deps: Record<string, string>): void {
    writeJson(path.join(cwd, 'package.json'), { devDependencies: deps });
}

function missingSettings(cwd: string): string {
    return path.join(cwd, 'missing-settings.json');
}

function fmtOf(config: ToolchainConfig): Record<string, unknown> | undefined {
    return sectionConfig(config.fmt) as Record<string, unknown> | undefined;
}

function lintOf(config: ToolchainConfig): Record<string, unknown> | undefined {
    return sectionConfig(config.lint) as Record<string, unknown> | undefined;
}

describe('normalizeToolingConfig', () => {
    it('uses an installed formatter/linter', async () => {
        const cwd = tmp();
        packageJson(cwd, { prettier: '^3', eslint: '^9' });
        const { config, warnings } = await normalizeToolingConfig(
            { fmt: true, lint: true },
            { cwd, vscodeSettingsPath: missingSettings(cwd) }
        );
        expect(fmtOf(config)?.prettier).toEqual({});
        expect(fmtOf(config)?.oxc).toBeUndefined();
        expect(lintOf(config)?.eslint).toEqual({});
        expect(warnings).toEqual([]);
    });

    it('prefers a higher-precedence installed tool', async () => {
        const cwd = tmp();
        packageJson(cwd, { '@biomejs/biome': '^2', prettier: '^3' });
        const { config } = await normalizeToolingConfig(
            { fmt: true },
            { cwd, vscodeSettingsPath: missingSettings(cwd) }
        );
        expect(fmtOf(config)?.biome).toEqual({});
        expect(fmtOf(config)?.prettier).toBeUndefined();
    });

    it('uses Oxc defaults for an installed Vite+ toolchain', async () => {
        const cwd = tmp();
        packageJson(cwd, { 'vite-plus': '^1' });
        const { config } = await normalizeToolingConfig(
            { fmt: true, lint: true },
            { cwd, vscodeSettingsPath: missingSettings(cwd) }
        );
        expect(fmtOf(config)?.oxc).toEqual(DEFAULT_FMT_RULES);
        expect(lintOf(config)?.oxc).toEqual(DEFAULT_LINT_RULES);
    });

    it('keeps vscode options when normalizing shorthand sections', async () => {
        const cwd = tmp();
        packageJson(cwd, { 'vite-plus': '^1' });
        const { config } = await normalizeToolingConfig(
            { fmt: { vscode: false }, lint: { vscode: true } },
            { cwd, vscodeSettingsPath: missingSettings(cwd) }
        );
        expect(fmtOf(config)?.vscode).toBe(false);
        expect(lintOf(config)?.vscode).toBe(true);
        expect(fmtOf(config)?.oxc).toEqual(DEFAULT_FMT_RULES);
    });

    it('falls back to Oxc defaults and warns when nothing is available', async () => {
        const cwd = tmp();
        const { config, warnings } = await normalizeToolingConfig(
            { fmt: true, lint: true },
            { cwd, vscodeSettingsPath: missingSettings(cwd) }
        );
        expect(fmtOf(config)?.oxc).toEqual(DEFAULT_FMT_RULES);
        expect(lintOf(config)?.oxc).toEqual(DEFAULT_LINT_RULES);
        expect(warnings).toEqual(['fmt.no-tool', 'lint.no-tool']);
    });

    it('detects Prettier from a user-owned config file', async () => {
        const cwd = tmp();
        writeJson(path.join(cwd, '.prettierrc'), { singleQuote: false, printWidth: 90 });
        const { config, warnings } = await normalizeToolingConfig(
            { fmt: true },
            { cwd, vscodeSettingsPath: missingSettings(cwd) }
        );
        expect(fmtOf(config)?.prettier).toEqual({ singleQuote: false, printWidth: 90 });
        expect(fmtOf(config)?.oxc).toBeUndefined();
        expect(warnings).toEqual([]);
    });

    it('prefers the nearest package.json tool over a root-installed one', async () => {
        const root = tmp();
        packageJson(root, { 'vite-plus': '^1' });
        const cwd = path.join(root, 'packages/app');
        fs.mkdirSync(cwd, { recursive: true });
        packageJson(cwd, { prettier: '^3' });
        const { config } = await normalizeToolingConfig(
            { fmt: true },
            { cwd, vscodeSettingsPath: missingSettings(cwd) }
        );
        expect(fmtOf(config)?.prettier).toEqual({});
        expect(fmtOf(config)?.oxc).toBeUndefined();
    });

    it('uses the project .vscode/settings.json before installed tools', async () => {
        const cwd = tmp();
        packageJson(cwd, { 'vite-plus': '^1' });
        writeJson(path.join(cwd, '.vscode/settings.json'), {
            'editor.defaultFormatter': 'esbenp.prettier-vscode',
            'editor.codeActionsOnSave': { 'source.fixAll.eslint': 'explicit' },
        });
        const { config } = await normalizeToolingConfig(
            { fmt: true, lint: true },
            { cwd, vscodeSettingsPath: missingSettings(cwd) }
        );
        expect(fmtOf(config)?.prettier).toEqual({});
        expect(lintOf(config)?.eslint).toEqual({});
        expect(fmtOf(config)?.oxc).toBeUndefined();
        expect(lintOf(config)?.oxc).toBeUndefined();
    });

    it('detects a tool from an ancestor config file', async () => {
        const root = tmp();
        writeJson(path.join(root, '.prettierrc'), { singleQuote: true });
        const cwd = path.join(root, 'packages/app');
        fs.mkdirSync(cwd, { recursive: true });
        const { config } = await normalizeToolingConfig(
            { fmt: true },
            { cwd, vscodeSettingsPath: missingSettings(cwd) }
        );
        expect(fmtOf(config)?.prettier).toEqual({ singleQuote: true });
    });

    it('detects a linter from a config file', async () => {
        const cwd = tmp();
        writeJson(path.join(cwd, '.eslintrc.json'), { rules: { eqeqeq: 'warn' } });
        const { config } = await normalizeToolingConfig(
            { lint: true },
            { cwd, vscodeSettingsPath: missingSettings(cwd) }
        );
        expect(lintOf(config)?.eslint).toEqual({ rules: { eqeqeq: 'warn' } });
    });

    it('folds a user-owned Oxc config into the defaults', async () => {
        const cwd = tmp();
        writeJson(path.join(cwd, '.oxfmtrc.json'), { printWidth: 80 });
        const { config } = await normalizeToolingConfig(
            { fmt: true },
            { cwd, vscodeSettingsPath: missingSettings(cwd) }
        );
        expect(fmtOf(config)?.oxc).toMatchObject({ printWidth: 80 });
        expect(fmtOf(config)?.oxc).toMatchObject({
            tabWidth: DEFAULT_FMT_RULES.tabWidth,
        });
    });

    it('resolves a tool from the VS Code user settings language blocks', async () => {
        const cwd = tmp();
        const settings = path.join(cwd, 'settings.json');
        writeJson(settings, {
            '[typescript]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
            'editor.codeActionsOnSave': { 'source.fixAll.eslint': 'explicit' },
        });
        const { config, warnings } = await normalizeToolingConfig(
            { fmt: true, lint: true },
            { cwd, vscodeSettingsPath: settings }
        );
        expect(fmtOf(config)?.prettier).toEqual({});
        expect(lintOf(config)?.eslint).toEqual({});
        expect(warnings).toEqual([]);
    });
});

describe('toolingDefaultsTask', () => {
    it('mutates the config and emits the shared no-tool warnings', async () => {
        const cwd = tmp();
        const config: ToolchainConfig = { fmt: true, lint: true };
        const warnings: { message: string; id?: string }[] = [];
        const ctx: SyncContext = {
            cwd,
            projectType: 'project',
            config,
            ownConfig: config,
            tokens: {},
            log: () => {},
            warn: (message, id) => warnings.push({ message, id }),
        };
        await toolingDefaultsTask({ vscodeSettingsPath: missingSettings(cwd) }).run(ctx);
        expect(fmtOf(config)?.oxc).toEqual(DEFAULT_FMT_RULES);
        expect(lintOf(config)?.oxc).toEqual(DEFAULT_LINT_RULES);
        expect(warnings.map(warning => warning.id)).toEqual(['fmt.no-tool', 'lint.no-tool']);
        expect(warnings[0]?.message).toContain('falling back to Oxc');
    });
});
