/**
 * Conventional Commits enforcement (https://www.conventionalcommits.org/en/v1.0.0/).
 * Used by the local husky commit-msg hook and the CI commitlint check.
 */
export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        // `release:` is used for the automated release PR squash-merge commits.
        'type-enum': [
            2,
            'always',
            [
                'feat',
                'fix',
                'docs',
                'codegen',
                'style',
                'refactor',
                'perf',
                'test',
                'build',
                'ci',
                'chore',
                'revert',
                'release',
            ],
        ],
        // Allowed scopes (only enforced when a scope is present).
        'scope-enum': [
            2,
            'always',
            [
                'server',
                'frontend',
                'cli',
                'sdk',
                'scripts',
                'shared',
                'types',
                'ci',
                'docker',
                'security',
                'release',
                'deps',
            ],
        ],
        // Long bodies/footers are common in squash-merge messages; don't block on them.
        'body-max-line-length': [0],
        'footer-max-line-length': [0],
    },
};
