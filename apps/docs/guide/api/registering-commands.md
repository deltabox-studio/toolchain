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
