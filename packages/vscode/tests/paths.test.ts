import { describe, expect, it } from 'vite-plus/test';

import { sanitizePathForDisplay } from '../src/paths.js';

const home = 'C:\\Users\\me';
const env = {
    APPDATA: 'C:\\Users\\me\\AppData\\Roaming',
    LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local',
    PROGRAMDATA: 'C:\\ProgramData',
    PROGRAMFILES: 'C:\\Program Files',
    'PROGRAMFILES(X86)': 'C:\\Program Files (x86)',
    TEMP: 'C:\\Users\\me\\AppData\\Local\\Temp',
};

describe('sanitizePathForDisplay', () => {
    it('aliases Windows system directories', () => {
        const options = { home, env, platform: 'win32' as const };
        expect(sanitizePathForDisplay('C:\\Users\\me\\projects\\app', options)).toBe(
            '~/projects/app'
        );
        expect(sanitizePathForDisplay('C:\\Users\\me\\AppData\\Roaming\\dbx', options)).toBe(
            '~appdata/dbx'
        );
        expect(sanitizePathForDisplay('C:\\Users\\me\\AppData\\Local\\Temp\\dbx', options)).toBe(
            '~temp/dbx'
        );
        expect(sanitizePathForDisplay('C:\\ProgramData\\dbx', options)).toBe('~programdata/dbx');
        expect(sanitizePathForDisplay('C:\\Program Files\\dbx', options)).toBe('~programfiles/dbx');
        expect(sanitizePathForDisplay('C:\\Program Files (x86)\\dbx', options)).toBe(
            '~programfilesx86/dbx'
        );
        expect(sanitizePathForDisplay('C:\\Users\\me', options)).toBe('~');
    });

    it('aliases XDG directories on Unix', () => {
        const options = {
            home: '/home/me',
            env: {
                XDG_CONFIG_HOME: '/home/me/.config',
                XDG_DATA_HOME: '/home/me/.local/share',
                XDG_CACHE_HOME: '/home/me/.cache',
                XDG_STATE_HOME: '/home/me/.local/state',
            },
            platform: 'linux' as const,
        };
        expect(sanitizePathForDisplay('/home/me/projects/app', options)).toBe('~/projects/app');
        expect(sanitizePathForDisplay('/home/me/.config/dbx', options)).toBe('~config/dbx');
        expect(sanitizePathForDisplay('/home/me/.local/share/dbx', options)).toBe('~data/dbx');
        expect(sanitizePathForDisplay('/home/me/.cache/dbx', options)).toBe('~cache/dbx');
        expect(sanitizePathForDisplay('/home/me/.local/state/dbx', options)).toBe('~state/dbx');
    });

    it('leaves remote URLs, relatives and unrelated paths alone', () => {
        const options = { home, env, platform: 'win32' as const };
        expect(sanitizePathForDisplay('https://example.com/templates.json', options)).toBe(
            'https://example.com/templates.json'
        );
        expect(sanitizePathForDisplay('./templates', options)).toBe('./templates');
        expect(sanitizePathForDisplay('C:\\Users\\me-other\\app', options)).toBe(
            'C:\\Users\\me-other\\app'
        );
    });
});
