/** A normalized details toggle. */
export interface DetailsToggle {
    enabled: boolean;
    title?: string;
    expanded?: boolean;
}

/** A custom details matcher. */
export interface DetailsCustomMatcher {
    start?: RegExp | string;
    end?: RegExp | string;
    title?: string;
    expanded?: boolean;
    pattern?: RegExp | string;
}

/** The normalized `<details>` settings. */
export interface ResolvedDetails {
    enabled: boolean;
    descriptions: DetailsToggle;
    releaseNotes: DetailsToggle;
    intro: DetailsToggle;
    outro: DetailsToggle;
    footer: DetailsToggle;
    breaking: DetailsToggle;
    types: DetailsToggle & { list?: string[] };
    custom: DetailsCustomMatcher[];
}

const DEFAULT_TITLES = {
    releaseNotes: '**Release Notes**',
    intro: '**Intro**',
    outro: '**Outro**',
    footer: '**Footer**',
    breaking: '**BREAKING CHANGES**',
} as const;

function toggle(value: unknown, defaultTitle?: string, fallback = false): DetailsToggle {
    if (value === undefined) {
        return { enabled: fallback, ...(defaultTitle ? { title: defaultTitle } : {}) };
    }
    if (typeof value === 'boolean') {
        return { enabled: value, ...(defaultTitle ? { title: defaultTitle } : {}) };
    }
    if (value && typeof value === 'object') {
        const record = value as { title?: unknown; expanded?: unknown };
        return {
            enabled: true,
            ...(typeof record.title === 'string' && record.title
                ? { title: record.title }
                : defaultTitle
                  ? { title: defaultTitle }
                  : {}),
            ...(typeof record.expanded === 'boolean' ? { expanded: record.expanded } : {}),
        };
    }
    return { enabled: fallback, ...(defaultTitle ? { title: defaultTitle } : {}) };
}

function customMatcher(value: unknown): DetailsCustomMatcher | undefined {
    if (typeof value === 'string' || value instanceof RegExp) {
        return { pattern: value };
    }
    if (!value || typeof value !== 'object') return undefined;
    const record = value as Record<string, unknown>;
    const start = record.start;
    const end = record.end;
    return {
        ...(typeof start === 'string' || start instanceof RegExp ? { start } : {}),
        ...(typeof end === 'string' || end instanceof RegExp ? { end } : {}),
        ...(typeof record.title === 'string' ? { title: record.title } : {}),
        ...(typeof record.expanded === 'boolean' ? { expanded: record.expanded } : {}),
    };
}

/** Normalize `details` (`true | false | object`). Defaults to enabled. */
export function resolveDetails(value: unknown): ResolvedDetails {
    if (value === false) {
        return {
            enabled: false,
            descriptions: { enabled: false },
            releaseNotes: { enabled: false },
            intro: { enabled: false },
            outro: { enabled: false },
            footer: { enabled: false },
            breaking: { enabled: false },
            types: { enabled: false },
            custom: [],
        };
    }
    if (value === undefined || value === true) {
        return {
            enabled: true,
            descriptions: { enabled: true },
            releaseNotes: { enabled: true, title: DEFAULT_TITLES.releaseNotes },
            intro: { enabled: false, title: DEFAULT_TITLES.intro },
            outro: { enabled: false, title: DEFAULT_TITLES.outro },
            footer: { enabled: false, title: DEFAULT_TITLES.footer },
            breaking: { enabled: true, title: DEFAULT_TITLES.breaking },
            types: { enabled: false },
            custom: [],
        };
    }
    const record = value as Record<string, unknown>;
    if (record.enabled === false) return resolveDetails(false);
    const typesValue = record.types;
    const typesList = Array.isArray(typesValue)
        ? typesValue.filter((item): item is string => typeof item === 'string')
        : undefined;
    const customValue = record.custom;
    const custom = (Array.isArray(customValue) ? customValue : [customValue])
        .map(customMatcher)
        .filter((item): item is DetailsCustomMatcher => item !== undefined);
    return {
        enabled: true,
        descriptions: toggle(record.descriptions),
        releaseNotes: toggle(record.releaseNotes, DEFAULT_TITLES.releaseNotes),
        intro: toggle(record.intro, DEFAULT_TITLES.intro),
        outro: toggle(record.outro, DEFAULT_TITLES.outro),
        footer: toggle(record.footer, DEFAULT_TITLES.footer),
        breaking: toggle(record.breaking, DEFAULT_TITLES.breaking),
        types: {
            ...toggle(typesList ? true : typesValue),
            ...(typesList ? { list: typesList } : {}),
        },
        custom,
    };
}

/** Render a markdown `<details>` collapsible. */
export function renderDetails(title: string, content: string, expanded = false): string {
    const body = content.trim();
    return [
        `<details${expanded ? ' open' : ''}>`,
        `<summary>${title}</summary>`,
        '',
        body,
        '',
        '</details>',
    ].join('\n');
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function patternOf(value: RegExp | string): RegExp {
    return value instanceof RegExp ? value : new RegExp(escapeRegExp(value));
}

/** Wrap matching text in `<details>` collapsibles. */
export function wrapCustomDetails(text: string, details: ResolvedDetails): string {
    if (!details.enabled || details.custom.length === 0) return text;
    let output = text;
    for (const matcher of details.custom) {
        if (matcher.pattern !== undefined) {
            const regex = patternOf(matcher.pattern);
            const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
            const global = new RegExp(regex.source, flags);
            output = output.replace(global, match =>
                renderDetails(matcher.title ?? match, match, matcher.expanded === true)
            );
            continue;
        }
        if (matcher.start === undefined) continue;
        const start = patternOf(matcher.start);
        const startMatch = start.exec(output);
        if (!startMatch || startMatch.index === undefined) continue;
        const title = matcher.title ?? startMatch[0];
        if (matcher.end === undefined) {
            const before = output.slice(0, startMatch.index);
            const after = output.slice(startMatch.index);
            output = `${before}${renderDetails(title, after, matcher.expanded === true)}`;
            continue;
        }
        const end = patternOf(matcher.end);
        const rest = output.slice(startMatch.index + startMatch[0].length);
        const endMatch = end.exec(rest);
        const endIndex = endMatch?.index ?? rest.length;
        const inner = output.slice(
            startMatch.index,
            startMatch.index + startMatch[0].length + endIndex + (endMatch ? endMatch[0].length : 0)
        );
        output = `${output.slice(0, startMatch.index)}${renderDetails(
            title,
            inner,
            matcher.expanded === true
        )}${output.slice(startMatch.index + inner.length)}`;
    }
    return output;
}
