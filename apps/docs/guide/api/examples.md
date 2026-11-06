# Examples

```ts
// Vite+ provider
import { resolveVp, runVp, resolveVpCommand, VP_COMMANDS } from '@deltabox/toolchain/vite';
await runVp(['check'], { cwd: process.cwd() });
resolveVpCommand('i'); // 'install'

// Migrations
import { detectMigrations, runMigration } from '@deltabox/toolchain/migrate';
for (const m of detectMigrations(process.cwd())) await m.run({ cwd: process.cwd(), write: true });

// Templates
import { loadTemplates, scaffoldTemplate } from '@deltabox/toolchain/template';
const [template] = await loadTemplates({ cwd: process.cwd() });
if (template) await scaffoldTemplate(template, { cwd: './out', tokens: { name: 'acme' } });

// Providers (what the editor reads)
import { toolchainProviders } from '@deltabox/toolchain/providers';
console.log(toolchainProviders().map(p => p.id));

// Sync only the tsconfig task (eg. after a build changed package exports)
import { defaultSyncTasks, loadToolchainConfig, runSync } from '@deltabox/toolchain';
// Config engine
import { createConfigEngine } from '@deltabox/toolchain/config';
const loaded = await loadToolchainConfig(process.cwd());
await runSync({
    tasks: defaultSyncTasks(),
    only: ['tsconfig'],
    cwd: process.cwd(),
    config: loaded.config,
    tokens: loaded.tokens,
    projectType: loaded.projectType,
});
```
