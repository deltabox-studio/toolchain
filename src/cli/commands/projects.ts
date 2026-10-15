import { buildProjectGraph, writeProjectGraph } from '@deltabox/toolchain-core';
import type { ToolingCommand } from '@deltabox/toolchain-shared';

/** `dbx projects` — discover projects and write the graph file. */
export function projectsCommand(): ToolingCommand {
    return {
        name: 'projects',
        description: 'Discover projects and write .dbx/toolchain/projects.json.',
        options: [
            { flags: '--cwd <dir>', description: 'Root to scan (default: cwd).' },
            { flags: '--max-depth <n>', description: 'Max directory depth.', default: '5' },
            { flags: '--no-write', description: 'Do not write the graph file.' },
            { flags: '--json', description: 'Print the graph as JSON.' },
        ],
        run: (opts, context) => {
            const graph = buildProjectGraph(context.cwd, {
                maxDepth: Number.parseInt(String(opts.maxDepth ?? '5'), 10),
            });
            if (opts.write !== false) writeProjectGraph(context.cwd, graph);
            if (opts.json) {
                console.log(JSON.stringify(graph, null, 4));
                return;
            }
            console.log(
                `dbx: ${graph.dbxProjects.length} dbx project(s), ${graph.projects.length} package(s), package manager: ${graph.packageManager ?? 'unknown'}`
            );
            for (const dir of graph.order) {
                const project = graph.dbxProjects.find(p => p.dir === dir);
                const deps = project?.dependencies.length
                    ? `  (deps: ${project.dependencies.join(', ')})`
                    : '';
                console.log(`  - ${project?.name ?? dir}  [${dir}]${deps}`);
            }
        },
    };
}
