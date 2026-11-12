# Registering commands

Packages export framework-agnostic `ToolchainCommand[]` descriptors; wire them onto
a commander program with `registerToolchainCommands` (this is how the bundled
`dbx` binary, and a consumer's own CLI, are assembled):

```ts
import { Command } from 'commander';

import { registerToolchainCommands } from '@deltabox/toolchain/cli';
import { configCommands } from '@deltabox/toolchain/config';

const program = new Command();
registerToolchainCommands(program, configCommands({ engine }));
await program.parseAsync();
```

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
