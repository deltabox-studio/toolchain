import path from 'node:path';

import { buildProjectGraph, type ProjectNode } from './graph.js';

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
    /** Maximum directory depth to scan (default 5). */
    maxDepth?: number;
}

const GLOB_CHARS = /[*?[\]{}]/;

const GLOBSTAR = '<<dbx-globstar>>';

function toRegExp(pattern: string): RegExp {
    const escaped = pattern
        .replace(/[.+^${}()|\\]/g, '\\$&')
        .replace(/\*\*/g, GLOBSTAR)
        .replace(/\*/g, '[^/]*')
        .replaceAll(GLOBSTAR, '.*')
        .replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`, 'i');
}

/** Match a pattern against a project's relative dir + package name. */
function matches(project: SelectedProject, pattern: string): boolean {
    const values = [project.rel, project.name ?? '', path.basename(project.rel)];
    if (GLOB_CHARS.test(pattern)) {
        const re = toRegExp(pattern);
        return values.some(value => re.test(value));
    }
    const needle = pattern.toLowerCase();
    return values.some(value => value.toLowerCase().includes(needle));
}

/** Discover projects under a root, applying include/exclude + kind filters. */
export function selectProjects(options: SelectProjectsOptions): SelectedProject[] {
    const graph = buildProjectGraph(
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
