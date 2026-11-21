import path from 'node:path';

import { buildProjectGraph, type ProjectGraph, type ProjectNode } from './graph.js';

/** A project selected by {@link selectProjects}. */
export interface SelectedProject {
    /** Absolute project directory. */
    dir: string;
    /** Directory relative to the root (posix). */
    rel: string;
    /** Package name when available. */
    name?: string;
    /** Whether the directory has a `dbx.config.*`. */
    hasConfig: boolean;
}

export interface SelectProjectsOptions {
    /** Root to scan. */
    root: string;
    /** Keep only projects matching one of these patterns (glob or substring). */
    include?: string[];
    /** Drop projects matching any of these patterns (glob or substring). */
    exclude?: string[];
    /**
     * What to keep: `all` (default), `configured` (has a dbx config) or
     * `unconfigured` (missing a dbx config).
     */
    kind?: 'all' | 'configured' | 'unconfigured';
    /** Maximum directory depth to scan. @default `5` */
    maxDepth?: number;
    /** Use an already-built graph instead of scanning the filesystem again. */
    graph?: ProjectGraph;
}

const GLOB_CHARS = /[*?[\]{}]/;

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Compile a project-filter glob. Supports `**`, `*`, `?`, simple `[...]`
 * classes and `{a,b}` alternatives; anything else is literal, so a malformed
 * class cannot throw.
 */
function toRegExp(pattern: string): RegExp {
    let source = '';
    for (let index = 0; index < pattern.length; index++) {
        const char = pattern[index] as string;
        if (char === '*') {
            if (pattern[index + 1] === '*') {
                source += '.*';
                index += 1;
            } else {
                source += '[^/]*';
            }
        } else if (char === '?') {
            source += '[^/]';
        } else if (char === '[') {
            const end = pattern.indexOf(']', index + 1);
            if (end === -1) {
                source += '\\[';
            } else {
                const body = pattern.slice(index + 1, end);
                // Glob `[!...]` is a negated class in the usual shells.
                source += body.startsWith('!') ? `[^${body.slice(1)}]` : `[${body}]`;
                index = end;
            }
        } else if (char === '{') {
            const end = pattern.indexOf('}', index + 1);
            if (end === -1) {
                source += '\\{';
            } else {
                const alternatives = pattern
                    .slice(index + 1, end)
                    .split(',')
                    .map(alternative => escapeRegExp(alternative));
                source += `(?:${alternatives.join('|')})`;
                index = end;
            }
        } else {
            source += escapeRegExp(char);
        }
    }
    return new RegExp(`^${source}$`, 'i');
}

/** Match a pattern against a project's relative dir + package name. */
function matches(project: SelectedProject, pattern: string): boolean {
    const values = [project.rel, project.name ?? '', path.basename(project.rel)];
    if (GLOB_CHARS.test(pattern)) {
        try {
            const re = toRegExp(pattern);
            return values.some(value => re.test(value));
        } catch {
            // An invalid class/range falls back to the substring semantics.
        }
    }
    const needle = pattern.toLowerCase();
    return values.some(value => value.toLowerCase().includes(needle));
}

/** Discover projects under a root, applying include/exclude + kind filters. */
export function selectProjects(options: SelectProjectsOptions): SelectedProject[] {
    const graph =
        options.graph ??
        buildProjectGraph(
            options.root,
            options.maxDepth !== undefined ? { maxDepth: options.maxDepth } : {}
        );
    const projects: SelectedProject[] = graph.projects.map((node: ProjectNode) => ({
        dir: path.resolve(options.root, node.dir),
        rel: node.dir,
        ...(node.name ? { name: node.name } : {}),
        hasConfig: node.hasConfig,
    }));

    const kind = options.kind ?? 'all';
    const include = options.include?.filter(Boolean) ?? [];
    const exclude = options.exclude?.filter(Boolean) ?? [];

    return projects.filter(project => {
        if (kind === 'configured' && !project.hasConfig) return false;
        if (kind === 'unconfigured' && project.hasConfig) return false;
        if (include.length > 0 && !include.some(pattern => matches(project, pattern))) return false;
        if (exclude.some(pattern => matches(project, pattern))) return false;
        return true;
    });
}
