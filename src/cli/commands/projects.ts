import { buildProjectGraph, writeProjectGraph } from '@deltabox/toolchain/core';
import { logger } from '@deltabox/toolchain/shared';

import { rootCliProgram } from '../engine.js';

/** `dbx projects` — discover projects and write the graph file. */
export function projectsCommand() {
    const {
        commands: [command],
    } = rootCliProgram.create(cmd => [
        cmd('projects')
            .description('Discover projects and write .dbx/toolchain/projects.json.')
            .option('--cwd <dir>', 'Root to scan (default: cwd).')
            .option('--max-depth <n>', 'Max directory depth.', '5')
            .option('--no-write', 'Do not write the graph file.')
            .option('--json', 'Print the graph as JSON.')
            .run(({ values: opts, context }) => {
                const rawMaxDepth = String(opts.maxDepth ?? '5').trim();
                if (!/^\d+$/.test(rawMaxDepth)) {
                    throw new Error(
                        `invalid --max-depth "${rawMaxDepth}" (expected a non-negative integer).`
                    );
                }
                const graph = buildProjectGraph(context.cwd, {
                    maxDepth: Number(rawMaxDepth),
                });
                if (opts.write !== false) writeProjectGraph(context.cwd, graph);
                if (opts.json) {
                    logger.raw(JSON.stringify(graph, null, 4));
                    return;
                }
                logger.info(
                    `${graph.dbxProjects.length} dbx project(s), ${graph.projects.length} package(s), package manager: ${graph.packageManager ?? 'unknown'}`
                );
                for (const dir of graph.order) {
                    const project = graph.dbxProjects.find(p => p.dir === dir);
                    const deps = project?.dependencies.length
                        ? `  (deps: ${project.dependencies.join(', ')})`
                        : '';
                    logger.info(`  - ${project?.name ?? dir}  [${dir}]${deps}`);
                }
            }),
    ]);
    return command;
}
