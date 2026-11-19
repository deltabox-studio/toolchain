import { describe, expect, it } from 'vite-plus/test';

import {
    DEPENDABOT_FILE,
    dependabotFilePath,
    dismissedSeverities,
    normalizeDependabotSecurity,
    renderDependabot,
    renderDependabotSecurityWorkflow,
} from '../src/dependabot.js';

describe('dependabot config', () => {
    it('defaults to actions + npm with a weekly schedule', () => {
        const yaml = renderDependabot();
        expect(yaml).toContain('version: 2');
        expect(yaml).toContain('package-ecosystem: github-actions');
        expect(yaml).toContain('package-ecosystem: npm');
        expect(yaml).toContain('directory: /');
        expect(yaml).toContain('interval: weekly');
    });

    it('honours schedule, directories, ecosystems, labels, limits and groups', () => {
        const yaml = renderDependabot({
            schedule: 'daily',
            directories: ['/', '/packages/api'],
            ecosystems: ['npm'],
            labels: ['dependencies'],
            openPullRequestsLimit: 3,
            groups: {
                minor: { 'update-types': ['minor', 'patch'] },
            },
        });
        expect(yaml).toContain('interval: daily');
        expect(yaml).toContain('directory: /packages/api');
        expect((yaml.match(/package-ecosystem: npm/g) ?? []).length).toBe(2);
        expect(yaml).not.toContain('github-actions');
        expect(yaml).toContain('dependencies');
        expect(yaml).toContain('open-pull-requests-limit: 3');
        expect(yaml).toContain('groups:');
        expect(yaml).toContain('minor:');
    });

    it('applies global and per-ecosystem allow/ignore rules', () => {
        const yaml = renderDependabot({
            ecosystems: ['github-actions', 'npm'],
            allow: {
                npm: [{ 'dependency-name': 'vite' }, { 'dependency-name': 'vite-plus' }],
                'github-actions': [{ 'dependency-name': '*' }],
            },
            ignore: [
                {
                    'dependency-name': '*',
                    'update-types': ['version-update:semver-major'],
                },
            ],
        });

        expect(yaml).toContain('allow:');
        expect(yaml).toContain('dependency-name: vite');
        expect(yaml).toContain('dependency-name: vite-plus');
        expect((yaml.match(/dependency-name: vite$/gm) ?? []).length).toBe(1);
        expect((yaml.match(/version-update:semver-major/g) ?? []).length).toBe(2);
    });

    it('falls back to the `*` ecosystem rules and omits empty entries', () => {
        const yaml = renderDependabot({
            ecosystems: ['github-actions', 'npm'],
            allow: { '*': [{ 'dependency-name': 'vite' }] },
            ignore: { npm: [] },
        });

        expect((yaml.match(/dependency-name: vite/g) ?? []).length).toBe(2);
        expect(yaml).not.toContain('ignore:');
    });

    it('resolves safe file paths', () => {
        expect(dependabotFilePath()).toBe(DEPENDABOT_FILE);
        expect(dependabotFilePath({ dir: '.github', filename: 'updates.yml' })).toBe(
            '.github/updates.yml'
        );
        expect(() => dependabotFilePath({ filename: '../dependabot.yml' })).toThrow('invalid');
        expect(() => dependabotFilePath({ dir: '../outside' })).toThrow('invalid');
    });

    it('groups security updates when security is enabled', () => {
        const yaml = renderDependabot({ ecosystems: ['npm'], security: true });

        expect(yaml).toContain('security-updates:');
        expect(yaml).toContain('applies-to: security-updates');
        expect(yaml).toContain('patterns:');
    });

    it('keeps individual security updates when the strategy is individual', () => {
        const yaml = renderDependabot({
            ecosystems: ['npm'],
            security: { pr: { strategy: 'individual' } },
        });

        expect(yaml).not.toContain('applies-to: security-updates');
    });

    it('does not override a user-defined security group', () => {
        const yaml = renderDependabot({
            ecosystems: ['npm'],
            security: true,
            groups: {
                custom: { 'applies-to': 'security-updates', patterns: ['vite'] },
            },
        });

        expect(yaml).toContain('custom:');
        expect(yaml).not.toMatch(/^\s+security-updates:/m);
    });

    it('normalizes the security shorthands', () => {
        expect(normalizeDependabotSecurity(undefined)).toMatchObject({
            enabled: false,
            vulnerabilities: false,
        });
        expect(normalizeDependabotSecurity(true)).toMatchObject({
            enabled: true,
            vulnerabilities: true,
            severity: 'all',
            strategy: 'grouped',
            workflow: true,
        });
        expect(normalizeDependabotSecurity({ vulnerabilities: false })).toMatchObject({
            enabled: true,
            vulnerabilities: false,
        });
        expect(
            normalizeDependabotSecurity({
                vulnerabilities: { severity: 'high' },
                pr: { strategy: 'individual' },
                workflow: false,
            })
        ).toMatchObject({
            enabled: true,
            vulnerabilities: true,
            severity: 'high',
            strategy: 'individual',
            workflow: false,
        });
        expect(normalizeDependabotSecurity({ enabled: false })).toMatchObject({ enabled: false });
    });

    it('maps severity thresholds to the alerts to dismiss', () => {
        expect(dismissedSeverities('all')).toEqual([]);
        expect(dismissedSeverities('low')).toEqual([]);
        expect(dismissedSeverities('moderate')).toEqual(['low']);
        expect(dismissedSeverities('medium')).toEqual(['low']);
        expect(dismissedSeverities('high')).toEqual(['low', 'medium']);
        expect(dismissedSeverities('critical')).toEqual(['low', 'medium', 'high']);
        expect(dismissedSeverities(['high', 'critical'])).toEqual(['low', 'medium']);
        expect(dismissedSeverities(['all'])).toEqual([]);
    });

    it('renders the workflow that enables security updates', () => {
        const yaml = renderDependabotSecurityWorkflow({ schedule: 'daily', security: true });

        expect(yaml).toBeDefined();
        expect(yaml).toContain('cron: 0 6 * * *');
        expect(yaml).toContain('automated-security-fixes');
        expect(yaml).toContain('DBX_GITHUB_TOKEN');
        expect(yaml).toContain('security-events: write');
        expect(yaml).not.toContain('dependabot/alerts');
        expect(yaml).not.toContain('DELETE');
    });

    it('renders a disable step when vulnerabilities are opted out', () => {
        const yaml = renderDependabotSecurityWorkflow({
            security: { vulnerabilities: false },
        })!;

        expect(yaml).toContain('DELETE');
        expect(yaml).not.toContain('-X PUT');
    });

    it('renders the severity triage step', () => {
        const yaml = renderDependabotSecurityWorkflow({
            security: { vulnerabilities: { severity: 'high' } },
        })!;

        expect(yaml).toContain('dependabot/alerts?state=open');
        expect(yaml).toContain('IN("low", "medium")');
        expect(yaml).toContain('dismissed_reason=not_used');
    });

    it('omits the workflow when security is disabled or opted out', () => {
        expect(renderDependabotSecurityWorkflow()).toBeUndefined();
        expect(renderDependabotSecurityWorkflow({ security: false })).toBeUndefined();
        expect(renderDependabotSecurityWorkflow({ security: { enabled: false } })).toBeUndefined();
        expect(renderDependabotSecurityWorkflow({ security: { workflow: false } })).toBeUndefined();
    });
});
