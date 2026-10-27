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
`required`, `deprecated`, `example`, `secret`, `scope`, `public` (safe to expose
to the browser) and `defaultValue` (when the resolved default differs from the env
default).
