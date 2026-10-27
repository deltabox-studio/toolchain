import fs from 'node:fs';
import path from 'node:path';

import {
    logger,
    type ManagedFile,
    type ProjectType,
    type Replacements,
    type SyncContext,
    type SyncTask,
    type ToolchainConfig,
} from '@deltabox/toolchain-shared';

import { ensureDbxGitignore } from './gitignore.js';
import { readManifest, writeManifest } from './manifest.js';
import { resolveProjectType } from './project-type.js';

export interface RunSyncOptions {
    /** The task list to run. */
    tasks: SyncTask[];
    /** The project root. */
    cwd: string;
    /** The loaded config. */
    config: ToolchainConfig;
    /** The resolved replacement tokens. */
    tokens: Replacements;
    /** The project kind (resolved from the config/cwd when omitted). */
    projectType?: ProjectType;
    /** Dry-run: report drift and exit non-zero without writing. */
    check?: boolean;
    /** Suppress logging. */
    quiet?: boolean;
    /** Custom logger (default `logger.info`). */
    log?: (message: string) => void;
}

export interface RemovedFile {
    /** Repo-relative path. */
    path: string;
    /** The content before removal, so an editor can offer "Restore". */
    content: string;
}

export interface SyncResult {
    /** Paths written (empty in check mode). */
    written: string[];
    /** Paths whose generated content differs from disk. */
    changed: string[];
    /** Previously-managed paths removed because they are no longer generated. */
    removed: string[];
    /** The removed files' previous content (for a Restore action). */
    removedFiles: RemovedFile[];
    /** Whether disk already matched the generated output. */
    upToDate: boolean;
}

/** Normalize a path to forward slashes. */
function norm(relative: string): string {
    return relative.replace(/\\/g, '/');
}

/**
 * Run every enabled sync task, writing the managed files and pruning files that
 * are no longer generated. With `check: true` nothing is written: drift is
 * reported instead (for CI).
 */
export async function runSync(options: RunSyncOptions): Promise<SyncResult> {
    const { tasks, cwd, config, tokens } = options;
    const log = options.quiet ? () => {} : (options.log ?? ((m: string) => logger.info(m)));
    const warn = options.quiet ? () => {} : (m: string) => logger.warn(m);
    const projectType = options.projectType ?? resolveProjectType(cwd, config);
    const ctx: SyncContext = { cwd, projectType, config, tokens, log, warn };
    const hooks = config.hooks ?? {};
    await hooks.beforeSync?.(ctx);

    const active = tasks.filter(
        task =>
            (!task.projectTypes || task.projectTypes.includes(projectType)) &&
            (!task.enabled || task.enabled(config))
    );
    log(`running ${active.length} task(s)${options.check ? ' (check)' : ''} [${projectType}]`);

    const files: ManagedFile[] = [];
    for (const task of active) {
        log(`  - ${task.name}`);
        await hooks.beforeTask?.({ task, ctx });
        const result = await task.run(ctx);
        const produced = Array.isArray(result) ? result : undefined;
        if (produced) files.push(...produced);
        await hooks.afterTask?.({ task, ctx, ...(produced ? { files: produced } : {}) });
    }

    const desired = new Map(files.map(file => [norm(file.path), file.content]));
    const manifest = readManifest(cwd);

    // Files a task declares as user-owned (`keep`): never deleted, dropped from
    // the manifest, so consumers can edit them (eg. `tsconfig.build.json`).
    const keep = new Set<string>();
    for (const task of active) for (const pattern of task.keep ?? []) keep.add(pattern);
    const isKept = (relative: string): boolean => {
        for (const pattern of keep) {
            if (
                relative === pattern ||
                relative.endsWith(`/${pattern}`) ||
                relative.endsWith(pattern)
            )
                return true;
        }
        return false;
    };

    const changed: string[] = [];
    for (const [relative, content] of desired) {
        const abs = path.resolve(cwd, relative);
        const current = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf-8') : undefined;
        if (current !== content) changed.push(relative);
    }
    const existedBefore = new Map(
        [...desired.keys()].map(relative => [relative, fs.existsSync(path.resolve(cwd, relative))])
    );
    // A file dbx never created (it existed before the first sync) is adopted:
    // stop managing it, but never delete it when its section is removed.
    const originOf = (relative: string): 'created' | 'adopted' =>
        manifest.origins?.[relative] ??
        (manifest.files.includes(relative)
            ? 'created'
            : existedBefore.get(relative)
              ? 'adopted'
              : 'created');
    const removed = manifest.files.filter(
        relative =>
            !desired.has(relative) &&
            !isKept(relative) &&
            fs.existsSync(path.resolve(cwd, relative)) &&
            originOf(relative) === 'created'
    );
    const removedFiles: RemovedFile[] = removed.map(relative => ({
        path: relative,
        content: fs.readFileSync(path.resolve(cwd, relative), 'utf-8'),
    }));
    const upToDate = changed.length === 0 && removed.length === 0;

    if (options.check) {
        if (upToDate) {
            log('generated files are in sync.');
        } else {
            log('generated files are out of date:');
            for (const relative of changed) log(`  M ${relative}`);
            for (const relative of removed) log(`  D ${relative}`);
            log('Run `dbx sync` to regenerate them.');
        }
        const summary = { written: [], changed, removed, removedFiles, upToDate };
        await hooks.afterSync?.({ cwd, config, result: summary });
        return summary;
    }

    const written: string[] = [];
    for (const [relative, content] of desired) {
        const abs = path.resolve(cwd, relative);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, content, 'utf-8');
        written.push(relative);
    }
    for (const relative of removed) {
        fs.rmSync(path.resolve(cwd, relative), { force: true });
    }
    const origins: Record<string, 'created' | 'adopted'> = {};
    for (const relative of desired.keys()) {
        origins[relative] = originOf(relative);
    }
    writeManifest(cwd, [...desired.keys()], undefined, origins);
    if (ensureDbxGitignore(cwd)) log('  I .gitignore (added the .dbx ignore block)');

    log(
        `wrote ${written.length}, removed ${removed.length} file(s)${
            changed.length ? `, updated ${changed.length}` : ''
        }.`
    );
    const summary = { written, changed, removed, removedFiles, upToDate };
    await hooks.afterSync?.({ cwd, config, result: summary });
    return summary;
}
