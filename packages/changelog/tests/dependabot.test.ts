import { describe, expect, it } from 'vite-plus/test';

import { DEPENDABOT_FILE, dependabotFilePath, renderDependabot } from '../src/dependabot.js';

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

    it('resolves safe file paths', () => {
        expect(dependabotFilePath()).toBe(DEPENDABOT_FILE);
        expect(dependabotFilePath({ dir: '.github', filename: 'updates.yml' })).toBe(
            '.github/updates.yml'
        );
        expect(() => dependabotFilePath({ filename: '../dependabot.yml' })).toThrow('invalid');
        expect(() => dependabotFilePath({ dir: '../outside' })).toThrow('invalid');
    });
});
