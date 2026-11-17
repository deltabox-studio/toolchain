/** A normalized details toggle. */
export interface DetailsToggle {
    enabled: boolean;
    title?: string;
    expanded?: boolean;
    /** Minimum entries in the section before the collapsible is used. */
    minCommits?: number;
}

/** A custom details matcher. */
export interface DetailsCustomMatcher {
    start?: RegExp | string;
    end?: RegExp | string;
    title?: string;
    expanded?: boolean;
    pattern?: RegExp | string;
    minCommits?: number;
}

/** The normalized `<details>` settings. */
export interface ResolvedDetails {
    enabled: boolean;
    lifecycle: 'after' | 'before';
    descriptions: DetailsToggle;
    body: DetailsToggle;
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
    descriptions: '**See more...**',
    intro: '**Intro**',
    outro: '**Outro**',
    footer: '**Footer**',
    breaking: '**BREAKING CHANGES**',
} as const;

function minCommitsOf(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return undefined;
    return Math.floor(value);
}

function toggle(
    value: unknown,
    defaultTitle?: string,
    fallback = false,
    defaultMinCommits?: number
): DetailsToggle {
    const defaultMin =
        defaultMinCommits !== undefined ? minCommitsOf(defaultMinCommits) : undefined;
    if (value === undefined) {
        return {
            enabled: fallback,
            ...(defaultTitle ? { title: defaultTitle } : {}),
            ...(defaultMin !== undefined ? { minCommits: defaultMin } : {}),
        };
    }
    if (typeof value === 'boolean') {
        return {
            enabled: value,
            ...(defaultTitle ? { title: defaultTitle } : {}),
            ...(value && defaultMin !== undefined ? { minCommits: defaultMin } : {}),
        };
    }
    if (value && typeof value === 'object') {
        const record = value as { title?: unknown; expanded?: unknown; minCommits?: unknown };
        const min = minCommitsOf(record.minCommits) ?? defaultMin;
        return {
            enabled: true,
            ...(typeof record.title === 'string' && record.title
                ? { title: record.title }
                : defaultTitle
                  ? { title: defaultTitle }
                  : {}),
            ...(typeof record.expanded === 'boolean' ? { expanded: record.expanded } : {}),
            ...(min !== undefined ? { minCommits: min } : {}),
        };
    }
    return {
        enabled: fallback,
        ...(defaultTitle ? { title: defaultTitle } : {}),
        ...(defaultMin !== undefined ? { minCommits: defaultMin } : {}),
    };
}

function customMatcher(
    value: unknown,
    defaultMinCommits?: number
): DetailsCustomMatcher | undefined {
    const defaultMin =
        defaultMinCommits !== undefined ? minCommitsOf(defaultMinCommits) : undefined;
    if (typeof value === 'string' || value instanceof RegExp) {
        return {
            pattern: value,
            ...(defaultMin !== undefined ? { minCommits: defaultMin } : {}),
        };
    }
    if (!value || typeof value !== 'object') return undefined;
    const record = value as Record<string, unknown>;
    const start = record.start;
    const end = record.end;
    const min = minCommitsOf(record.minCommits) ?? defaultMin;
    return {
        ...(typeof start === 'string' || start instanceof RegExp ? { start } : {}),
        ...(typeof end === 'string' || end instanceof RegExp ? { end } : {}),
        ...(typeof record.title === 'string' ? { title: record.title } : {}),
        ...(typeof record.expanded === 'boolean' ? { expanded: record.expanded } : {}),
        ...(min !== undefined ? { minCommits: min } : {}),
    };
}

/** Whether a toggle applies for a section with `count` entries. */
export function detailsEnabled(toggle: DetailsToggle, count: number): boolean {
    return toggle.enabled && (toggle.minCommits === undefined || count >= toggle.minCommits);
}

/** Count top-level commit bullets in a body/section (footers are excluded). */
export function countCommitEntries(text: string): number {
    let count = 0;
    for (const line of text.split('\n')) {
        if (/^###\s+(?:Package changes|New contributors)\s*$/.test(line)) break;
        if (/^[-*+]\s+/.test(line)) count += 1;
    }
    return count;
}

/** Normalize `details` (`true | false | object`). Defaults to enabled. */
export function resolveDetails(value: unknown, release = false): ResolvedDetails {
    if (value === false) {
        return {
            enabled: false,
            lifecycle: 'after',
            descriptions: { enabled: false },
            body: { enabled: false },
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
            lifecycle: 'after',
            descriptions: { enabled: true, title: DEFAULT_TITLES.descriptions },
            body: { enabled: !release, title: DEFAULT_TITLES.releaseNotes, minCommits: 10 },
            releaseNotes: {
                enabled: release,
                title: DEFAULT_TITLES.releaseNotes,
            },
            intro: { enabled: false, title: DEFAULT_TITLES.intro },
            outro: { enabled: false, title: DEFAULT_TITLES.outro },
            footer: { enabled: false, title: DEFAULT_TITLES.footer },
            breaking: { enabled: true, title: DEFAULT_TITLES.breaking },
            types: { enabled: true },
            custom: [],
        };
    }
    const record = value as Record<string, unknown>;
    if (record.enabled === false) return resolveDetails(false, release);
    const configMin = minCommitsOf(record.minCommits);
    const bodyMin = configMin ?? 10;
    const typesValue = record.types;
    const typesList = Array.isArray(typesValue)
        ? typesValue.filter((item): item is string => typeof item === 'string')
        : undefined;
    const customValue = record.custom;
    const custom = (Array.isArray(customValue) ? customValue : [customValue])
        .map(item => customMatcher(item, configMin))
        .filter((item): item is DetailsCustomMatcher => item !== undefined);
    const releaseNotes = release
        ? toggle(record.releaseNotes, DEFAULT_TITLES.releaseNotes, true, configMin)
        : { enabled: false, title: DEFAULT_TITLES.releaseNotes };
    return {
        enabled: true,
        lifecycle: record.lifecycle === 'before' ? 'before' : 'after',
        descriptions: toggle(record.descriptions, DEFAULT_TITLES.descriptions, false, configMin),
        body:
            record.body === undefined
                ? { enabled: !release, title: DEFAULT_TITLES.releaseNotes, minCommits: bodyMin }
                : toggle(record.body, DEFAULT_TITLES.releaseNotes, false, bodyMin),
        releaseNotes,
        intro: toggle(record.intro, DEFAULT_TITLES.intro, false, configMin),
        outro: toggle(record.outro, DEFAULT_TITLES.outro, false, configMin),
        footer: toggle(record.footer, DEFAULT_TITLES.footer, false, configMin),
        breaking: toggle(record.breaking, DEFAULT_TITLES.breaking, false, configMin),
        types: {
            ...toggle(typesList ? true : typesValue, undefined, true, configMin),
            ...(typesList ? { list: typesList } : {}),
        },
        custom,
    };
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Render inline Markdown in a `<summary>` as HTML. Markdown is not parsed inside
 * `<summary>`, so links, code, emphasis and strikethrough are converted
 * explicitly (raw HTML is escaped).
 */
function summaryHtml(title: string): string {
    const code: string[] = [];
    let output = escapeHtml(title.trim());
    output = output.replace(/`([^`]+)`/g, (_, value: string) => {
        const token = `\u0000${code.length}\u0000`;
        code.push(`<code>${value}</code>`);
        return token;
    });
    output = output.replace(
        /!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;.*?&quot;)?\)/g,
        '<img src="$2" alt="$1">'
    );
    output = output.replace(
        /\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;.*?&quot;)?\)/g,
        '<a href="$2">$1</a>'
    );
    output = output
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
        .replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>')
        .replace(/~~([^~]+)~~/g, '<del>$1</del>');
    return output.replace(/\u0000(\d+)\u0000/g, (_, index: string) => code[Number(index)]!);
}

/** Render a markdown `<details>` collapsible. */
export function renderDetails(title: string, content: string, expanded = false): string {
    const body = content.trim();
    return [
        `<details${expanded ? ' open' : ''}>`,
        `<summary>${summaryHtml(title)}</summary>`,
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
            const matches = [...output.matchAll(global)];
            if (matcher.minCommits !== undefined && matches.length < matcher.minCommits) continue;
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
            if (
                matcher.minCommits !== undefined &&
                countCommitEntries(after) < matcher.minCommits
            ) {
                continue;
            }
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
        if (matcher.minCommits !== undefined && countCommitEntries(inner) < matcher.minCommits) {
            continue;
        }
        output = `${output.slice(0, startMatch.index)}${renderDetails(
            title,
            inner,
            matcher.expanded === true
        )}${output.slice(startMatch.index + inner.length)}`;
    }
    return output;
}

const TYPE_TITLES: Record<string, string> = {
    feat: 'New features',
    fix: 'Bug fixes',
    refactor: 'Refactors',
    docs: 'Documentation',
    style: 'Styles',
    chore: 'Chores',
    test: 'Tests',
    perf: 'Performance',
    build: 'Build system',
    ci: 'CI',
    revert: 'Reverts',
};

const NON_TYPE_TITLES = new Set(['package changes', 'new contributors']);

function sectionMatchesTypes(title: string, list: string[] | undefined): boolean {
    const normalized = title.toLowerCase();
    // With types enabled broadly, keep the generated footer sections out.
    if (!list || list.length === 0) return !NON_TYPE_TITLES.has(normalized);
    return list.some(type => {
        const raw = type.toLowerCase();
        return raw === normalized || (TYPE_TITLES[raw] ?? '').toLowerCase() === normalized;
    });
}

/** Wrap a bullet's indented description lines in a details block. */
function wrapDescriptions(lines: string[], toggle: DetailsToggle): string[] {
    if (!toggle.enabled) return lines;
    const out: string[] = [];
    let inFooter = false;
    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]!;
        if (/^###\s+(?:Package changes|New contributors)\s*$/.test(line)) {
            inFooter = true;
            out.push(line);
            continue;
        }
        if (inFooter) {
            // A new top-level/type section ends the footer.
            if (/^#{2,3}\s+/.test(line)) inFooter = false;
            out.push(line);
            continue;
        }
        if (!/^[-*+]\s+/.test(line) || /^\s*<details/i.test(line)) {
            out.push(line);
            continue;
        }
        let end = index + 1;
        while (end < lines.length && /^\s{2,}\S/.test(lines[end]!)) end += 1;
        const body = lines.slice(index + 1, end);
        if (body.length === 0) {
            out.push(line);
            continue;
        }
        const descriptionCount =
            body.filter(item => /^\s*[-*+]\s+/.test(item)).length || body.length;
        if (!detailsEnabled(toggle, descriptionCount)) {
            out.push(line, ...body);
            index = end - 1;
            continue;
        }
        const title = toggle.title ?? DEFAULT_TITLES.descriptions;
        const block = renderDetails(title, body.join('\n'), toggle.expanded === true).split('\n');
        // Keep the collapsible inside the commit's list item.
        out.push(line, ...block.map(detailLine => (detailLine ? `  ${detailLine}` : detailLine)));
        index = end - 1;
    }
    return out;
}

function findSectionEnd(lines: string[], start: number): number {
    let end = start + 1;
    while (
        end < lines.length &&
        !/^#{2,3}\s/.test(lines[end]!) &&
        // Release markers delimit the entry, not a section: never swallow them
        // into a collapsible block.
        !lines[end]!.includes('<!-- release:')
    ) {
        end += 1;
    }
    return end;
}

/** Wrap matching section headings (breaking/types) in details. */
function wrapSections(lines: string[], details: ResolvedDetails): string[] {
    const out: string[] = [];
    for (let index = 0; index < lines.length; index += 1) {
        const heading = /^###\s+(.+)$/.exec(lines[index]!);
        if (!heading) {
            out.push(lines[index]!);
            continue;
        }
        const rawTitle = heading[1]!.replace(/\*\*/g, '').trim();
        const end = findSectionEnd(lines, index);
        const block = lines.slice(index, end);
        let toggle: DetailsToggle | undefined;
        if (details.breaking.enabled && rawTitle.toLowerCase() === 'breaking changes') {
            toggle = details.breaking;
        } else if (details.types.enabled && sectionMatchesTypes(rawTitle, details.types.list)) {
            toggle = details.types;
        }
        if (!toggle) {
            out.push(...block);
            index = end - 1;
            continue;
        }
        // The summary already names the section, so drop the duplicate heading
        // from the collapsible body.
        const content = block.slice(1).join('\n').trim();
        if (!content) {
            out.push(...block);
            index = end - 1;
            continue;
        }
        if (!detailsEnabled(toggle, countCommitEntries(content))) {
            out.push(...block);
            index = end - 1;
            continue;
        }
        out.push(
            ...renderDetails(toggle.title ?? rawTitle, content, toggle.expanded === true).split(
                '\n'
            )
        );
        index = end - 1;
    }
    return out;
}

/** Wrap the version body (and/or release notes) in details. */
function wrapBody(lines: string[], details: ResolvedDetails): string[] {
    if (!details.enabled || (!details.body.enabled && !details.releaseNotes.enabled)) {
        return lines;
    }
    const headingIndex = lines.findIndex(line => /^##\s+/.test(line));
    if (headingIndex === -1) return lines;
    let start = headingIndex + 1;
    let end = lines.length;
    const startMarker = lines.findIndex(
        (line, index) => index > headingIndex && line.includes('<!-- release:start -->')
    );
    const endMarker = lines.findIndex(
        (line, index) => index > headingIndex && line.includes('<!-- release:end -->')
    );
    if (startMarker !== -1 && endMarker !== -1 && endMarker > startMarker) {
        start = startMarker + 1;
        end = endMarker;
    }
    while (start < end && !lines[start]!.trim()) start += 1;
    while (end > start && !lines[end - 1]!.trim()) end -= 1;
    if (start >= end) return lines;
    let inner = lines.slice(start, end).join('\n');
    const count = countCommitEntries(inner);
    let releaseWrapped = false;
    if (details.releaseNotes.enabled && detailsEnabled(details.releaseNotes, count)) {
        inner = renderDetails(
            details.releaseNotes.title ?? DEFAULT_TITLES.releaseNotes,
            inner,
            details.releaseNotes.expanded === true
        );
        releaseWrapped = true;
    }
    // Release mode already wraps the entry; a second body wrapper would nest
    // two identical "Release Notes" summaries.
    if (!releaseWrapped && details.body.enabled && detailsEnabled(details.body, count)) {
        inner = renderDetails(
            details.body.title ?? DEFAULT_TITLES.releaseNotes,
            inner,
            details.body.expanded === true
        );
    }
    return [...lines.slice(0, start), ...inner.split('\n'), ...lines.slice(end)];
}

/**
 * Apply details to a fully formatted version entry (custom regexes run last, on
 * the formatted text). This is the default lifecycle: 'after' pipeline.
 */
export function applyDetailsToEntry(entry: string, details: ResolvedDetails): string {
    if (!details.enabled) return entry;
    let lines = entry.split('\n');
    lines = wrapDescriptions(lines, details.descriptions);
    lines = wrapSections(lines, details);
    lines = wrapBody(lines, details);
    return normalizeDetailsSpacing(wrapCustomDetails(lines.join('\n'), details));
}

/** Keep details blocks separated from surrounding Markdown blocks. */
function normalizeDetailsSpacing(text: string): string {
    const lines = text.split('\n');
    const out: string[] = [];
    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]!;
        const previous = out[out.length - 1];
        if (/^<details\b/i.test(line.trim()) && previous !== undefined && previous.trim() !== '') {
            out.push('');
        }
        out.push(line);
        if (
            /^<\/details>/i.test(line.trim()) &&
            index + 1 < lines.length &&
            lines[index + 1]!.trim() !== ''
        ) {
            out.push('');
        }
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n');
}
