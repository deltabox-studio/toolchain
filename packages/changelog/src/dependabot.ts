/**
 * `.github/dependabot.yml` generation.
 *
 * Dependabot keeps the project's dependencies and the pinned GitHub Actions
 * (`voidzero-dev/setup-vp`, `actions/checkout`, ...) up to date. The config is
 * opt-in like every other CI artifact and is written by the changelog sync task.
 * The optional `security` block also generates a workflow that manages GitHub's
 * native security-update setting and its severity triage.
 */

import { toYaml, type ToolchainDependabotConfig, type YamlValue } from '@deltabox/toolchain/shared';

/** The default Dependabot config path. */
export const DEPENDABOT_FILE = '.github/dependabot.yml';

/** The generated security workflow path (GitHub only reads `.github/workflows`). */
export const DEPENDABOT_SECURITY_FILE = '.github/workflows/dependabot-security.yml';

/** The name of the generated security-update group. */
export const DEPENDABOT_SECURITY_GROUP = 'security-updates';

/** The default package ecosystems (actions + the project's npm packages). */
export const DEPENDABOT_ECOSYSTEMS = ['github-actions', 'npm'] as const;

/** GitHub's severity names (ordered from lowest to highest). */
const SEVERITY_ORDER = ['low', 'medium', 'high', 'critical'] as const;

type Severity = (typeof SEVERITY_ORDER)[number];

/** The normalized security setting used by the YAML/workflow renderers. */
export interface NormalizedDependabotSecurity {
    enabled: boolean;
    vulnerabilities: boolean;
    severity: 'all' | Severity | Severity[];
    strategy: 'grouped' | 'individual';
    workflow: boolean;
}

const DISABLED_SECURITY: NormalizedDependabotSecurity = {
    enabled: false,
    vulnerabilities: false,
    severity: 'all',
    strategy: 'grouped',
    workflow: false,
};

/**
 * Normalize the `security` shorthand/object. `security: true` enables
 * vulnerability PRs with every severity grouped; `false`/absent disables it.
 */
export function normalizeDependabotSecurity(
    setting: ToolchainDependabotConfig['security'] | undefined
): NormalizedDependabotSecurity {
    if (setting === undefined || setting === false) return DISABLED_SECURITY;
    if (setting === true) {
        return {
            enabled: true,
            vulnerabilities: true,
            severity: 'all',
            strategy: 'grouped',
            workflow: true,
        };
    }
    if (setting.enabled === false) return DISABLED_SECURITY;
    const raw = setting.vulnerabilities;
    const rawSeverity =
        typeof raw === 'object' && raw.severity !== undefined ? raw.severity : 'all';
    return {
        enabled: true,
        vulnerabilities: raw === undefined || raw !== false,
        severity: normalizeSeverity(rawSeverity),
        strategy: setting.pr?.strategy ?? 'grouped',
        workflow: setting.workflow ?? true,
    };
}

/** Map `moderate` (npm terminology) to GitHub's `medium`. */
function severityName(value: string): 'all' | Severity {
    if (value === 'moderate' || value === 'medium') return 'medium';
    return value === 'all' ? 'all' : (value as Severity);
}

/** Normalize a severity threshold or list into the internal shape. */
function normalizeSeverity(value: string | readonly string[]): 'all' | Severity | Severity[] {
    if (Array.isArray(value)) {
        const names = value.map(item => severityName(String(item)));
        // `all` in a list (or an empty list) keeps every severity.
        if (names.length === 0 || names.includes('all')) return 'all';
        return names as Severity[];
    }
    return severityName(String(value));
}

/**
 * The severities the generated triage workflow should dismiss. Empty means
 * "keep everything" (no triage step).
 */
export function dismissedSeverities(severity: string | readonly string[]): Severity[] {
    if (severity === 'all') return [];
    if (Array.isArray(severity)) {
        // An empty list would dismiss everything; treat it as "all".
        if (severity.length === 0) return [];
        const keep = new Set(severity.map(value => severityName(String(value))));
        if (keep.has('all')) return [];
        return SEVERITY_ORDER.filter(value => !keep.has(value));
    }
    const name = severityName(String(severity));
    if (name === 'all') return [];
    const index = SEVERITY_ORDER.indexOf(name);
    return index <= 0 ? [] : SEVERITY_ORDER.slice(0, index);
}

/** Add the generated security group unless the user already defined one. */
function withSecurityGroup(
    groups: ToolchainDependabotConfig['groups']
): NonNullable<ToolchainDependabotConfig['groups']> {
    const existing = groups ?? {};
    const alreadyConfigured =
        DEPENDABOT_SECURITY_GROUP in existing ||
        Object.values(existing).some(
            group => (group as { 'applies-to'?: string })['applies-to'] === 'security-updates'
        );
    if (alreadyConfigured) return existing;
    return {
        ...existing,
        [DEPENDABOT_SECURITY_GROUP]: {
            'applies-to': 'security-updates' as const,
            patterns: ['*'],
        },
    };
}

/** Resolve the config file path (honours `dir`/`filename`). */
export function dependabotFilePath(setting: ToolchainDependabotConfig = {}): string {
    const dir = (setting.dir ?? '.github')
        .replace(/\\/g, '/')
        .replace(/^\.?\//, '')
        .replace(/\/+$/, '');
    const filename = (setting.filename ?? 'dependabot.yml').trim();
    if (
        !filename ||
        /[\\/]/.test(filename) ||
        filename === '.' ||
        filename === '..' ||
        /^[a-zA-Z]:/.test(dir) ||
        dir.split('/').includes('..')
    ) {
        throw new Error('invalid Dependabot config path (it must stay inside the project).');
    }
    return dir ? `${dir}/${filename}` : filename;
}

/** Resolve the allow/ignore rules for one ecosystem. */
function rulesFor(
    rules: ToolchainDependabotConfig['allow'] | ToolchainDependabotConfig['ignore'],
    ecosystem: string
): unknown[] | undefined {
    if (!rules) return undefined;
    if (Array.isArray(rules)) return rules.length > 0 ? rules : undefined;
    const selected = rules[ecosystem] ?? rules['*'];
    return selected && selected.length > 0 ? selected : undefined;
}

/** Render the Dependabot config. */
export function renderDependabot(setting: ToolchainDependabotConfig = {}): string {
    const schedule = setting.schedule ?? 'weekly';
    const directories =
        setting.directories && setting.directories.length > 0 ? setting.directories : ['/'];
    const ecosystems =
        setting.ecosystems && setting.ecosystems.length > 0
            ? [...new Set(setting.ecosystems)]
            : [...DEPENDABOT_ECOSYSTEMS];
    const security = normalizeDependabotSecurity(setting.security);
    const groups =
        security.enabled && security.vulnerabilities && security.strategy === 'grouped'
            ? withSecurityGroup(setting.groups)
            : setting.groups;
    const hasGroups = Boolean(groups && Object.keys(groups).length > 0);

    const updates = directories.flatMap(directory =>
        ecosystems.map(ecosystem => {
            const allow = rulesFor(setting.allow, ecosystem);
            const ignore = rulesFor(setting.ignore, ecosystem);
            return {
                'package-ecosystem': ecosystem,
                directory,
                schedule: { interval: schedule },
                ...(setting.labels && setting.labels.length > 0 ? { labels: setting.labels } : {}),
                ...(setting.openPullRequestsLimit
                    ? { 'open-pull-requests-limit': setting.openPullRequestsLimit }
                    : {}),
                ...(hasGroups ? { groups } : {}),
                ...(allow ? { allow } : {}),
                ...(ignore ? { ignore } : {}),
            };
        })
    );

    return toYaml({ version: 2, updates } as unknown as Record<string, YamlValue>);
}

/** Cron schedule used by the generated security workflow. */
const SECURITY_CRONS = {
    daily: '0 6 * * *',
    weekly: '0 6 * * 1',
    monthly: '0 6 1 * *',
} as const;

/** The token expression used by the generated security workflow. */
const SECURITY_TOKEN = '${{ secrets.DBX_GITHUB_TOKEN || secrets.GITHUB_TOKEN }}';

/** The steps that enable/disable security updates and apply the severity filter. */
function securitySteps(security: NormalizedDependabotSecurity): Record<string, unknown>[] {
    const steps: Record<string, unknown>[] = [];
    if (security.vulnerabilities) {
        steps.push({
            name: 'Enable Dependabot security updates',
            env: { GH_TOKEN: SECURITY_TOKEN },
            run: [
                'gh api -X PUT "repos/${GITHUB_REPOSITORY}/automated-security-fixes" \\',
                '  || echo "::warning::Could not enable Dependabot security updates; set the DBX_GITHUB_TOKEN secret with repository admin access."',
            ].join('\n'),
        });
    } else {
        steps.push({
            name: 'Disable Dependabot security updates',
            env: { GH_TOKEN: SECURITY_TOKEN },
            run: [
                'gh api -X DELETE "repos/${GITHUB_REPOSITORY}/automated-security-fixes" \\',
                '  || echo "::warning::Could not disable Dependabot security updates; set the DBX_GITHUB_TOKEN secret with repository admin access."',
            ].join('\n'),
        });
    }

    const dismiss = dismissedSeverities(security.severity);
    if (security.vulnerabilities && dismiss.length > 0) {
        const filter = dismiss.map(value => `"${value}"`).join(', ');
        steps.push({
            name: 'Dismiss alerts below the configured severity',
            env: { GH_TOKEN: SECURITY_TOKEN },
            run: [
                'set -euo pipefail',
                'gh api --paginate "repos/${GITHUB_REPOSITORY}/dependabot/alerts?state=open&per_page=100" \\',
                `  --jq '.[] | select(.security_advisory.severity | IN(${filter})) | .number' |`,
                'while IFS= read -r number; do',
                '  [ -n "$number" ] || continue',
                '  gh api -X PATCH "repos/${GITHUB_REPOSITORY}/dependabot/alerts/${number}" \\',
                '    -f state=dismissed \\',
                '    -f dismissed_reason=not_used \\',
                '    -f dismissed_comment="Below the configured severity threshold (dbx)."',
                'done',
            ].join('\n'),
        });
    }
    return steps;
}

/**
 * Render the workflow that enables/disables native Dependabot security updates
 * and applies the configured severity threshold. Returns undefined when
 * security automation is disabled or its workflow is opted out.
 */
export function renderDependabotSecurityWorkflow(
    setting: ToolchainDependabotConfig = {}
): string | undefined {
    const security = normalizeDependabotSecurity(setting.security);
    if (!security.enabled || !security.workflow) return undefined;
    const schedule = setting.schedule ?? 'weekly';
    const workflow = {
        name: 'Dependabot security',
        on: {
            schedule: [{ cron: SECURITY_CRONS[schedule] }],
            workflow_dispatch: {},
        },
        permissions: {
            contents: 'read',
            'security-events': 'write',
        },
        jobs: {
            security: {
                'runs-on': 'ubuntu-latest',
                steps: securitySteps(security),
            },
        },
    };
    return toYaml(workflow as unknown as Record<string, YamlValue>);
}
