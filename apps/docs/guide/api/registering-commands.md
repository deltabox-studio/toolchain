# Registering commands

Packages export framework-agnostic `CliCommand[]` descriptors; build them into a
program with `createConfigProgram` (this is how the bundled `dbx` binary, and a
consumer's own CLI, are assembled):

```ts
import { configCommands, createConfigProgram } from '@deltabox/toolchain/config';

const program = createConfigProgram(configCommands({ engine }), {
    name: 'acme',
    version: '1.0.0',
});
await program.invokeAsync();
```

For config-driven commands, `engine.cli.program.create(...)` builds the same
program runtime with schema-derived options and typed `run` values.

Custom descriptors do not need to be added to `builtinCommands()` to appear in
the generated reference. Pass the same command list to `generateCliDocs`:

```ts
import { builtinCommands } from '@deltabox/toolchain/cli';
import { generateCliDocs } from '@deltabox/toolchain/config';

const markdown = generateCliDocs([...builtinCommands(), ...myCommands], {
    prefix: 'my-cli',
});
```

`generateCliDocs` omits `hidden` commands, keeps the first of any duplicate
name, and renders args/options (with defaults) the same way as the `dbx`
reference.

## Typed command args

`CliCommand` infers its `run(args, context)` object from the literal `options`
list. Use `defineCliCommand` so the literal tuple is preserved:

```ts
import { defineCliCommand } from '@deltabox/toolchain/shared';

const command = defineCliCommand({
    name: 'serve',
    description: 'Serve.',
    options: [
        { flags: '--json', description: 'JSON output.' },
        { flags: '--cwd <dir>', description: 'Project root.' },
        { flags: '--tag <value...>', description: 'Tags.' },
        { flags: '--no-color', description: 'Disable colour.' },
    ],
    // args.json?: boolean, args.cwd?: string,
    // args.tag?: string[], args.color?: boolean
    run: args => serve(args),
});
```

The same inference is available as a type through
`CliOptionValues<typeof options>`. Unknown positional args and dynamic flags
remain addressable through the index signature.

Descriptors also carry optional `argv` and `bin` fields. `argv` feeds the
standalone config program runtime (`program.invoke()`/`invokeAsync()`, defaulting
to `process.argv.slice(2)`); `bin` makes that runtime execute a relative or
absolute binary instead of the in-process `run`. See
[the config program runtime](/guide/config-generator/api#running-a-built-program)
for `create()`, hooks and help/error formatting.
