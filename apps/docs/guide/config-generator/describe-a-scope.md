# Describe a scope

Each scope is a Zod object. Leaves that are backed by an environment variable
carry an `.meta()` describing that variable:

```ts
import { z } from 'zod';

export const serverConfig = z.object({
    base: z.object({
        port: z.number().default(3000).meta({
            env: 'MYAPP_PORT',
            description: 'HTTP port',
        }),
        host: z.string().default('0.0.0.0').meta({
            env: 'MYAPP_HOST',
            description: 'Bind address',
        }),
    }),
    auth: z.object({
        password: z.string().meta({
            env: 'MYAPP_AUTH_PASSWORD',
            description: 'Admin password',
            required: true,
            secret: true,
        }),
        tokenTtl: z.number().default(3600).meta({
            env: 'MYAPP_AUTH_TOKEN_TTL',
            description: 'Session lifetime (seconds)',
        }),
    }),
});
```

`ConfigMeta` fields: `env`, `path` (dotted config path), `description`,
`required`, `deprecated`, `deprecationMessage`, `example`, `since`, `see`,
`remarks`, `experimental`, `alpha`, `beta`, `secret`, `scope`, `public` (safe to
expose to the browser) and `defaultValue` (when the resolved default differs
from the env default).

`required: true` adds `@required` and `- **Required**` above the markdown
`- **Type**` line. `deprecated: true` adds `@deprecated` / `- **Deprecated**`;
`deprecationMessage` supplies the text. `example` (string or array) adds one
`@example` tag/entry per value under `**Example(s):**`. `since` adds `@since` /
`- **Since**`, `see` adds `@see` / `- **See**` links, `remarks` adds `@remarks` /
`**Remarks:**`, and `experimental`/`alpha`/`beta` add their stability tags.

Each generator accepts the matching `include*` flag (all default `true`) to
suppress an annotation: `includeRequired`, `includeDeprecated`,
`includeExamples`, `includeSince`, `includeSee`, `includeRemarks`,
`includeExperimental`, `includeAlpha`, `includeBeta` — for example
`renderConfigTypes(..., { includeExamples: false })` or
`writeMarkdown(..., { includeDeprecated: false })`.
