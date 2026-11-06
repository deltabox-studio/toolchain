/**
 * CLI reference generator. Renders a markdown page from `ToolchainCommand`
 * descriptors, so a consumer's own CLI (including its custom commands) can
 * generate the same reference as the bundled `dbx` binary.
 */

import type { ToolchainCommand } from '@deltabox/toolchain/shared';

/** Options for {@link generateCliDocs}. */
export interface GenerateCliDocsOptions {
    /** Page title (default `CLI reference`). */
    title?: string;
    /** Frontmatter outline levels (default `[2, 3]`). */
    outline?: number[];
    /** Intro markdown rendered before the command table. */
    intro?: string;
    /** Command prefix used in headings and links (default `dbx`). */
    prefix?: string;
}

/** Escape raw `<`/`>` so Vue does not parse option placeholders as tags. */
function esc(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\|/g, '\\|');
}

/** Use typographic angles inside code spans (entities render literally there). */
function code(value: string): string {
    return value.replace(/</g, '‹').replace(/>/g, '›');
}

/** The markdown anchor for a command name. */
function anchor(name: string): string {
    return name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

/**
 * Render a CLI reference from command descriptors. Hidden commands are omitted
 * and duplicate names keep the first descriptor.
 */
export function generateCliDocs(
    commands: readonly ToolchainCommand[],
    options: GenerateCliDocsOptions = {}
): string {
    const title = options.title ?? 'CLI reference';
    const outline = options.outline ?? [2, 3];
    const prefix = options.prefix ?? 'dbx';
    const intro =
        options.intro ?? 'Generated from the `ToolchainCommand` descriptors the CLI registers.';
    const seen = new Set<string>();
    const all = commands.filter(command => {
        if (command.hidden) return false;
        if (seen.has(command.name)) return false;
        seen.add(command.name);
        return true;
    });
    const lines = [
        '---',
        `title: ${title}`,
        `outline: [${outline.join(', ')}]`,
        '---',
        '',
        `# ${title}`,
        '',
        intro,
        '',
        '| Command | Description |',
        '| ------- | ----------- |',
    ];
    for (const command of all) {
        lines.push(
            `| [\`${prefix} ${command.name}\`](#${anchor(command.name)}) | ${esc(command.description)} |`
        );
    }
    for (const command of all) {
        lines.push('', `## \`${prefix} ${command.name}\``, '', esc(command.description));
        for (const arg of command.args ?? []) {
            const label = arg.required === false ? `[${arg.name}]` : `<${arg.name}>`;
            lines.push(`- \`${code(label)}\` — ${esc(arg.description)}`);
        }
        for (const option of command.options ?? []) {
            const fallback =
                option.default !== undefined ? ` (default: \`${String(option.default)}\`)` : '';
            lines.push(`- \`${code(option.flags)}\` — ${esc(option.description)}${fallback}`);
        }
    }
    return `${lines.join('\n').trimEnd()}\n`;
}
