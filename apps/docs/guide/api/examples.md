# Examples

## Vite+ provider

Resolve and run the project's Vite+ CLI, or map a Vite+ command name:

```ts
import { resolveVp, runVp, resolveVpCommand, VP_COMMANDS } from '@deltabox/toolchain/vite';

await runVp(['check'], { cwd: process.cwd() });
resolveVpCommand('i'); // 'install'
```

## Migrations

Detect the migrations that apply to a project and run them:

```ts
import { detectMigrations, runMigration } from '@deltabox/toolchain/migrate';

for (const migration of detectMigrations(process.cwd())) {
    await migration.run({ cwd: process.cwd(), write: true });
}
```

## Templates

Load the available templates and scaffold one:

```ts
import { loadTemplates, scaffoldTemplate } from '@deltabox/toolchain/template';

const [template] = await loadTemplates({ cwd: process.cwd() });

if (template) {
    await scaffoldTemplate(template, {
        cwd: './out',
        tokens: { name: 'myapp' },
    });
}
```

## Providers

Read provider descriptors the way the editor does:

```ts
import { toolchainProviders } from '@deltabox/toolchain/providers';

console.log(toolchainProviders().map(provider => provider.id));
```

## Sync only the tsconfig task

Useful after a build changes package exports:

```ts
import { defaultSyncTasks, loadToolchainConfig, runSync } from '@deltabox/toolchain';

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

## Config engine

Bind a schema once, then use it to generate or parse configuration:

```ts
import { createConfigEngine, parseEnvConfig } from '@deltabox/toolchain/config';

const engine = createConfigEngine({ schema, envPrefix: 'MYAPP_' });
const runtimeConfig = parseEnvConfig(engine.schema, process.env, {
    envPrefix: 'MYAPP_',
});
```

## Runnable CLI program

Build a CLI from the generated config commands:

```ts
import { configCommands } from '@deltabox/toolchain/config';

const program = engine.cli.program.create(() => configCommands({ engine }), {
    name: 'my-cli',
    globalOptions: [{ flags: '--no-color', description: 'Disable colours.' }] as const,
    disableColors: ({ color }) => color === false,
});

await program.invokeAsync(process.argv.slice(2));
```
