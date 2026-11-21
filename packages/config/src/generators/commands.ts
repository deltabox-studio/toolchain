/**
 * CLI reference generator. Renders a markdown page from `CliCommand`
 * descriptors, so a consumer's own CLI (including its custom commands) can
 * generate the same reference as the bundled `dbx` binary.
 */

import type { CliCommand } from '@deltabox/toolchain/shared';

import type { GenerateCliDocsOptions } from '../types/index.js';

/** Escape raw `<`/`>` so Vue does not parse option placeholders as tags. */
function esc(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\|/g, '\\|')
        .replace(/\n/g, ' ');
}

/** Use typographic angles inside code spans (entities render literally there). */
function code(value: string): string {
    return value.replace(/</g, '‹').replace(/>/g, '›');
}

/** The markdown anchor for a command name. */
function anchor(name: string): string {
    return name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

interface CliDocEntry {
    command: CliCommand;
    /** The full command path (`parent child`). */
    name: string;
}

/** Flatten commands (including nested subcommands) in declaration order. */
function collectDocEntries(
    commands: readonly CliCommand[],
    parent: readonly string[] = [],
    seen = new Set<string>(),
    out: CliDocEntry[] = []
): CliDocEntry[] {
    for (const command of commands) {
        if (command.hidden) continue;
        const name = [...parent, command.name].join(' ');
        if (seen.has(name)) continue;
        seen.add(name);
        out.push({ command, name });
        if (command.commands?.length) {
            collectDocEntries(command.commands, [...parent, command.name], seen, out);
        }
    }
    return out;
}

/**
 * Render a CLI reference from command descriptors. Hidden commands are omitted,
 * nested subcommands are flattened into `parent child` entries, and duplicate
 * names keep the first descriptor.
 */
export function generateCliDocs(
    commands: readonly CliCommand[],
    options: GenerateCliDocsOptions = {}
): string {
    const title = options.title ?? 'CLI reference';
    const outline = options.outline ?? [2, 3];
    const prefix = options.prefix ?? 'dbx';
    const intro = options.intro ?? 'Generated from the `CliCommand` descriptors the CLI registers.';
    const all = collectDocEntries(commands);
    const usedAnchors = new Set<string>();
    const anchors = new Map<string, string>();
    for (const { name } of all) {
        const base = anchor(name);
        let candidate = base;
        for (let suffix = 2; usedAnchors.has(candidate); suffix += 1) {
            candidate = `${base}-${suffix}`;
        }
        usedAnchors.add(candidate);
        anchors.set(name, candidate);
    }
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
    for (const { command, name } of all) {
        lines.push(
            `| [\`${prefix} ${name}\`](#${anchors.get(name)}) | ${esc(command.description)} |`
        );
    }
    for (const { command, name } of all) {
        lines.push('', `## \`${prefix} ${name}\``, '', esc(command.description));
        for (const arg of command.args ?? []) {
            const label = arg.required === false ? `[${arg.name}]` : `<${arg.name}>`;
            lines.push(`- \`${code(label)}\` — ${esc(arg.description)}`);
        }
        for (const option of command.options ?? []) {
            if (option.hidden) continue;
            const fallback =
                option.default !== undefined
                    ? ` (default: \`${code(String(option.default))}\`)`
                    : '';
            lines.push(`- \`${code(option.flags)}\` — ${esc(option.description)}${fallback}`);
        }
    }
    const content = `${lines.join('\n').trimEnd()}\n`;
    return options.onContent?.(content) ?? content;
}
