import type { PackageJson } from 'type-fest';
import { z } from 'zod';

import { externalConfigSchema } from './external.js';
import { section, withEnabled } from './meta.js';
import {
    azureWorkflowSettingSchema,
    githubWorkflowSettingSchema,
    gitlabWorkflowSettingSchema,
    workflowOptionsSchema,
} from './workflow.js';

/** Branch globs the generated changelog/CI workflows target. */
export const changelogBranchesConfigSchema = z
    .object({
        main: z
            .union([z.string(), z.array(z.string())])
            .describe(
                'Branch glob(s) the CI + release workflows run on, and the release PR ' +
                    'base (default `["main"]`).'
            )
            .optional(),
        dev: z
            .union([z.string(), z.array(z.string())])
            .describe(
                'Branch glob(s) the changelog/version workflow runs on. No default: ' +
                    'when omitted it reuses `main` (so a single-branch repo needs no `dev`).'
            )
            .optional(),
    })
    .describe('Branches the generated workflows target.')
    .meta({ id: 'ChangelogBranchesConfig' });

/** commitlint output location plus the Conventional-Commits allow-lists. */
export const changelogCommitlintConfigSchema = withEnabled(
    z.object({
        dir: z
            .string()
            .describe(
                'Directory the generated `commitlint.config.mjs` is written to ' +
                    '(default: the project root). The husky hook and CI use ' +
                    '`--config` to point at it.'
            )
            .optional(),
        types: z.array(z.string()).describe('Allowed commit types (commitlint).').optional(),
        scopes: z.array(z.string()).describe('Allowed commit scopes (commitlint).').optional(),
    }),
    'Enable commitlint (default true when the changelog is enabled). Set false to ' +
        'generate changelogs without the Conventional-Commits pipeline.'
)
    .describe('commitlint config, output location and allow-lists.')
    .meta({ id: 'ChangelogCommitlintConfig' });

/** Which `package.json` versions a changelog run bumps. */
export const changelogVersioningTargetSchema = z
    .enum(['uniform', 'root-only', 'individual'])
    .describe('Where the changelog version bump is applied.')
    .meta({ id: 'ChangelogVersioningTarget' });

/** A Conventional-Commits commit passed to changelog callbacks. */
const changelogCommitRecordSchema = z.object({
    hash: z.string().describe('The full commit hash.'),
    subject: z.string().describe('The commit subject line.'),
    body: z.string().describe('The commit body (including any footers).'),
    author: z.string().describe('The commit author name.'),
    authorEmail: z.string().describe('The commit author email.'),
});

/** A resolved commit author passed to commit-format callbacks. */
const changelogAuthorInfoSchema = z.object({
    name: z.string().describe('The author display name.'),
    url: z.string().describe('The author profile URL.').optional(),
});

/** A resolved issue reference passed to commit-format callbacks. */
const changelogIssueInfoSchema = z.object({
    number: z.number().describe('The issue number.'),
    title: z.string().describe('The issue title.').optional(),
    url: z.string().describe('The issue URL.').optional(),
});

/** The non-callback commit formatting/credit options. */
const changelogCommitFormatShape = {
    author: z.boolean().describe('Include the `by <author>` credit (default true).').optional(),
    commitSha: z.boolean().describe('Include the commit hash link (default true).').optional(),
    issues: z.boolean().describe('Include issue/fixes links (default true).').optional(),
    authorAvatar: z
        .boolean()
        .describe('Prefix the author with their GitHub avatar (default false).')
        .optional(),
};

/** The context handed to a custom commit line formatter. */
const changelogCommitFormatContextSchema = z.object({
    commit: changelogCommitRecordSchema,
    repo: z.string().describe('The GitHub `owner/repo` slug.').optional(),
    author: changelogAuthorInfoSchema,
    issues: z.array(changelogIssueInfoSchema),
    options: z.object(changelogCommitFormatShape),
});

/** A custom commit line formatter (TS/JS configs only). */
const changelogCommitFormatCallbackSchema = z
    .function({
        input: [changelogCommitFormatContextSchema],
        output: z.string(),
    })
    .describe('Fully custom commit line formatter (TS/JS configs only; return the bullet body).')
    .meta({ tsType: '((ctx: ChangelogCommitFormatContext) => string)' });

/** Commit message formatting/credit options (or a custom formatter callback). */
export const changelogCommitFormatConfigSchema = z
    .object({
        ...changelogCommitFormatShape,
        format: changelogCommitFormatCallbackSchema.optional(),
    })
    .describe('Commit message formatting/credit options.')
    .meta({ id: 'ChangelogCommitFormatConfig' });

/** The context handed to a custom changelog provider. */
const changelogProviderContextSchema = z.object({
    cwd: z.string().describe('The repository root.'),
    changelog: externalConfigSchema<Record<string, unknown>>(
        'The resolved changelog config.',
        'ChangelogConfig'
    ).optional(),
    records: z.array(changelogCommitRecordSchema).describe('The commits in the scanned range.'),
});

/** A custom changelog provider callback (TS/JS configs only). */
const changelogProviderCallbackSchema = z
    .function({
        input: [changelogProviderContextSchema],
        output: z.union([z.string(), z.void()]),
    })
    .describe('A custom provider callback returning the changelog body (TS/JS configs only).')
    .meta({ tsType: '((ctx: ChangelogProviderContext) => string | void)' });

/** A custom changelog provider object. */
export const changelogProviderConfigSchema = z
    .object({
        id: z.string().describe('The provider id.'),
        run: changelogProviderCallbackSchema,
    })
    .describe('A custom changelog provider object.')
    .meta({ id: 'ChangelogProviderConfig' });

/** `default`, `changesets`, a provider id, a custom provider, or a callback. */
export const changelogProviderSettingSchema = z
    .union([z.string(), changelogProviderConfigSchema, changelogProviderCallbackSchema])
    .describe(
        '`default`, `changesets`, a provider id, a custom provider object, or a ' +
            'callback (TS/JS configs only).'
    );

/** The context handed to custom bump-rule callbacks. */
const changelogBumpRuleContextSchema = z.object({
    env: z.record(z.string(), z.string()).describe('The process environment.'),
    logger: z.any().describe('The toolchain logger (runtime-only).'),
    packageJson: externalConfigSchema<PackageJson>(
        'The package.json content.',
        'PackageJson'
    ).optional(),
    breaking: z
        .boolean()
        .or(z.enum(['conventional', 'any']))
        .describe('How breaking changes are detected.')
        .optional(),
    commit: changelogCommitRecordSchema,
    level: z.enum(['major', 'minor', 'patch']).describe('The bump level being evaluated.'),
});

/** A custom bump-rule callback (TS/JS configs only). */
const changelogBumpRuleCallbackSchema = z
    .function({
        input: [changelogBumpRuleContextSchema],
        output: z.union([z.boolean(), z.enum(['major', 'minor', 'patch'])]),
    })
    .describe('A custom bump matcher (TS/JS configs only).')
    .meta({
        tsType: '((ctx: ChangelogBumpRuleCallbackContext) => boolean | "major" | "minor" | "patch")',
    });

/** A declarative bump matcher (type/scope/pattern/breaking). */
export const changelogBumpRuleMatchSchema = z
    .object({
        breaking: z
            .boolean()
            .describe('Match only commits whose breaking state equals this value.')
            .optional(),
        type: z.string().describe('Match this Conventional-Commits type.').optional(),
        types: z.array(z.string()).describe('Match any of these CC types.').optional(),
        scope: z.string().describe('Match this Conventional-Commits scope.').optional(),
        scopes: z.array(z.string()).describe('Match any of these CC scopes.').optional(),
        pattern: z.string().describe('Match this regular expression.').optional(),
        match: z.string().describe('Match this substring.').optional(),
    })
    .describe('A declarative bump matcher.')
    .meta({ id: 'ChangelogBumpRuleMatch' });

/** A bump rule value: a boolean, substring/regex, matcher, or callback. */
const changelogBumpRuleValueSchema = z.union([
    z.boolean(),
    z.string(),
    changelogBumpRuleMatchSchema,
    changelogBumpRuleCallbackSchema,
]);

/** A bump rule: a value or a list of values (any match wins). */
export const changelogBumpRuleSchema = z
    .union([changelogBumpRuleValueSchema, z.array(changelogBumpRuleValueSchema)])
    .describe('A bump rule: a matcher/callback or a list of matchers/callbacks.')
    .meta({ id: 'ChangelogBumpRule' });

/** Options for `ci.changelog.versioning` when configured as an object. */
export const changelogVersioningConfigSchema = z
    .object({
        target: changelogVersioningTargetSchema
            .describe(
                '`uniform` bumps the root and every workspace to one shared version; ' +
                    '`root-only` bumps the root only; `individual` bumps each changed ' +
                    'workspace independently (default `uniform`).'
            )
            .optional(),
        workspaces: z
            .array(z.string())
            .describe(
                'Glob patterns selecting the workspaces to version (relative to the ' +
                    'root). Defaults to the root `package.json` `workspaces` field; when ' +
                    'there is none the root `package.json` is used on its own.'
            )
            .optional(),
        bump: z
            .object({
                major: changelogBumpRuleSchema.optional(),
                minor: changelogBumpRuleSchema.optional(),
                patch: changelogBumpRuleSchema.optional(),
            })
            .describe('Custom bump rules for major/minor/patch (matchers or callbacks).')
            .optional(),
        allowOverBump: z
            .boolean()
            .describe(
                'Apply a bump once per matching change instead of once per run (default false).'
            )
            .optional(),
        commit: changelogCommitFormatConfigSchema
            .describe(
                'Commit message formatting/credit options (with an optional formatter callback).'
            )
            .optional(),
        provider: changelogProviderSettingSchema
            .describe('`default`, `changesets`, a provider id, or a custom provider/callback.')
            .optional(),
    })
    .describe('Automatic version bumping options.')
    .meta({ id: 'ChangelogVersioningConfig' });

/** Automatic version bumping: `true` (default), `false`, or a set of options. */
export const changelogVersioningSchema = z
    .union([z.boolean(), changelogVersioningConfigSchema])
    .describe('Automatic version bumping when a changelog entry is generated.')
    .meta({ id: 'ChangelogVersioning' });

/** The subset of a grouped changelog item exposed to group callbacks. */
const changelogGroupItemSchema = z.object({
    parsed: z.object({
        type: z.string(),
        scope: z.string().optional(),
        breaking: z.boolean(),
        rest: z.string(),
    }),
    text: z.string(),
    bodyParagraphs: z.array(z.array(z.string())),
});

/** The context passed to the whole `groups` callback. */
const changelogGroupsContextSchema = z.object({
    types: z.array(z.string()).describe('The CC types present in the current changelog.'),
    items: z.array(changelogGroupItemSchema).describe('Every item being grouped.'),
});

/** The context passed to a per-group title/order/hidden callback. */
const changelogGroupContextSchema = changelogGroupsContextSchema.extend({
    type: z.string().describe('The CC type of this group.'),
    defaultTitle: z.string().describe('The built-in title for this type.'),
    index: z.number().describe('The group position in the configured/default order.'),
    groupItems: z.array(changelogGroupItemSchema).describe('The items in this group.'),
});

const changelogGroupTitleCallbackSchema = z
    .function({ input: [changelogGroupContextSchema], output: z.string() })
    .describe('A custom group title callback (TS/JS configs only).')
    .meta({ tsType: '((ctx: ChangelogGroupContext) => string)' });

const changelogGroupOrderCallbackSchema = z
    .function({ input: [changelogGroupContextSchema], output: z.number() })
    .describe('A custom group order callback (TS/JS configs only).')
    .meta({ tsType: '((ctx: ChangelogGroupContext) => number)' });

const changelogGroupHiddenCallbackSchema = z
    .function({ input: [changelogGroupContextSchema], output: z.boolean() })
    .describe('A custom group hidden callback (TS/JS configs only).')
    .meta({ tsType: '((ctx: ChangelogGroupContext) => boolean)' });

/** One group entry: a CC type, or its type + custom presentation. */
export const changelogGroupConfigSchema = z
    .object({
        type: z
            .string()
            .describe('The CC type (required for object entries in an array).')
            .optional(),
        title: z
            .union([z.string(), changelogGroupTitleCallbackSchema])
            .describe('Custom heading title (or callback; TS/JS configs only).')
            .optional(),
        order: z
            .union([z.number(), changelogGroupOrderCallbackSchema])
            .describe('Sort position; lower comes first (or callback; TS/JS configs only).')
            .optional(),
        hidden: z
            .union([z.boolean(), changelogGroupHiddenCallbackSchema])
            .describe('Omit this group from the rendered changelog (or callback; TS/JS only).')
            .optional(),
    })
    .describe('One Conventional-Commits group.');

const changelogGroupsArraySchema = z.array(z.union([z.string(), changelogGroupConfigSchema]));

const changelogGroupsRecordSchema = z.record(
    z.string(),
    z.union([z.string(), changelogGroupConfigSchema, z.boolean()])
);

const changelogGroupsCallbackSchema = z
    .function({
        input: [changelogGroupsContextSchema],
        output: z.union([changelogGroupsArraySchema, changelogGroupsRecordSchema]),
    })
    .describe('A custom group builder (TS/JS configs only).')
    .meta({ tsType: '((ctx: ChangelogGroupsContext) => ChangelogGroupsSetting)' });

/** The `changelog.groups` setting: an array, a record, or a callback. */
export const changelogGroupsSettingSchema = z
    .union([changelogGroupsArraySchema, changelogGroupsRecordSchema, changelogGroupsCallbackSchema])
    .describe(
        'Conventional-Commits group order/titles: an ordered array of CC types or ' +
            '`{ type, title, order, hidden }`, a type->title/options record, or a ' +
            'callback (TS/JS configs only).'
    );

const changelogBreakingPatternSchema = z.object({
    pattern: z
        .string()
        .describe('A regular expression matched against the subject and body.')
        .optional(),
    match: z.string().describe('A substring matched against the subject and body.').optional(),
});

export const changelogBreakingCallbackSchema = z
    .function({
        input: [
            z.object({
                subject: z.string().describe('The Conventional-Commits subject.'),
                body: z.string().describe('The commit body (including any footers).'),
            }),
        ],
        output: z.boolean(),
    })
    .describe('A custom breaking-change predicate (TS/JS configs only).')
    .meta({ tsType: '((commit: ChangelogBreakingCommit) => boolean)' });

/** How breaking changes are detected. */
export const changelogBreakingSettingSchema = z
    .union([
        z.boolean(),
        z.enum(['conventional', 'any']),
        changelogBreakingPatternSchema,
        changelogBreakingCallbackSchema,
    ])
    .describe(
        'How breaking changes are detected: `conventional` (default: a `!` in the ' +
            'CC subject or a `BREAKING CHANGE:` footer), `any` (legacy loose match), ' +
            '`false` (disable), `{ pattern }` / `{ match }`, or a callback (TS/JS ' +
            'configs only).'
    );

/**
 * The changelog pipeline options shared by `ci.changelog` and the manual
 * `toolchain.changelog` section (the latter omits workflow options and
 * branches).
 */
const changelogPipelineShape = {
    commitlint: section(changelogCommitlintConfigSchema)
        .describe('commitlint config; set `false` to disable the Conventional-Commits pipeline.')
        .optional(),
    versioning: changelogVersioningSchema
        .describe('Automatic version bumping on changelog generation (default `true`).')
        .optional(),
    vscode: z
        .boolean()
        .describe('Write the Conventional-Commits VS Code settings (default true).')
        .optional(),
    groups: changelogGroupsSettingSchema.optional(),
    breaking: changelogBreakingSettingSchema.optional(),
};

/**
 * The changelog pipeline (`ci.changelog`): it configures the changelog workflow
 * and the options the local/CI changelog run uses. The whole section is opt-in
 * by presence; `enabled: false` (or `false`) disables both.
 */
export const ciChangelogConfigSchema = withEnabled(
    workflowOptionsSchema.extend({
        branches: changelogBranchesConfigSchema
            .describe('Branches the generated workflows target.')
            .optional(),
        ...changelogPipelineShape,
    }),
    'Enable/disable the changelog workflow and pipeline (default: enabled when present).'
)
    .describe('Changelog workflow + pipeline: versioning, VS Code settings and commitlint.')
    .meta({ id: 'CiChangelogConfig' });

/**
 * A changelog workflow setting: a toggle, raw YAML, a complete vendor workflow,
 * or the GitHub changelog pipeline config.
 */
export const changelogWorkflowSettingSchema = z
    .union([
        z.boolean(),
        z.string(),
        githubWorkflowSettingSchema,
        gitlabWorkflowSettingSchema,
        azureWorkflowSettingSchema,
        ciChangelogConfigSchema,
    ])
    .describe(
        '`true`/`false` to enable/disable, a complete GitHub/GitLab/Azure workflow ' +
            '(with `provider`), the changelog pipeline config object, or a raw YAML string ' +
            'written verbatim as the changelog workflow file.'
    )
    .meta({ id: 'ChangelogWorkflowSetting' });

/**
 * The manual changelog section. It accepts the same pipeline options as
 * `ci.changelog` (without the CI-only workflow options and branches), so
 * `dbx changelog`, the VS Code actions and the programmatic API can use it.
 * `ci.changelog` inherits these values when it does not override them.
 */
export const changelogConfigSchema = withEnabled(z.object(changelogPipelineShape))
    .describe(
        'Manual `toolchain.changelog` pipeline config for `dbx changelog`, the VS ' +
            'Code actions and the API; `ci.changelog` inherits these options.'
    )
    .meta({ id: 'ChangelogConfig' });
