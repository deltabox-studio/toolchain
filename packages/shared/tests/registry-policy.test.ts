import { describe, expect, it } from 'vitest';

import { registrySourceAllowed } from '../src/index.js';

describe('registrySourceAllowed', () => {
    it('allows everything without a policy', () => {
        expect(registrySourceAllowed('https://example.com/templates.json', undefined)).toBe(true);
    });

    it('matches hosts, full URLs and local paths', () => {
        const policy = {
            allow: ['*.example.com', 'https://registry.example.org/**', '/repo/templates/**'],
        };
        expect(registrySourceAllowed('https://team.example.com/a.json', policy)).toBe(true);
        expect(registrySourceAllowed('https://registry.example.org/a.json', policy)).toBe(true);
        expect(registrySourceAllowed('/repo/templates/local', policy)).toBe(true);
        expect(registrySourceAllowed('https://evil.test/a.json', policy)).toBe(false);
        expect(registrySourceAllowed('/repo/other', policy)).toBe(false);
    });

    it('checks deny before allow', () => {
        const policy = {
            allow: ['*.example.com'],
            deny: ['*.internal.example.com'],
        };
        expect(registrySourceAllowed('https://foo.internal.example.com/a', policy)).toBe(false);
        expect(registrySourceAllowed('https://public.example.com/a', policy)).toBe(true);
    });
});

describe('registrySourceAllowed URL edge cases', () => {
    it('matches scp-style git URLs by host', () => {
        expect(registrySourceAllowed('git@evil.com:user/repo.git', { deny: ['evil.com'] })).toBe(
            false
        );
        expect(
            registrySourceAllowed('git@example.com:user/repo.git', { allow: ['example.com'] })
        ).toBe(true);
    });

    it('matches hosts regardless of the port', () => {
        expect(
            registrySourceAllowed('https://example.com:8443/a.json', {
                deny: ['example.com/**'],
            })
        ).toBe(false);
    });

    it('matches protocol-relative URLs', () => {
        expect(registrySourceAllowed('//evil.com/a.json', { deny: ['evil.com/**'] })).toBe(false);
    });
});
