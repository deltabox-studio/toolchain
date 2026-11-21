# Describe a scope

Each top-level key is a **scope**; its value is a Zod schema, an untyped
(JSON-Schema-shaped) schema, a plain object, a primitive, or an array of schema
parts. A single schema (not keyed by scope) is treated as one `config` scope.

- [Zod](#zod)
- [Untyped](#untyped)
- [Plain objects](#plain-objects)
- [Primitives](#primitives)
- [Arrays](#arrays)
- [Base groups](#base-groups)

A schema must satisfy `ConfigSchema`:

```ts
import type { Schema as SchemaType } from 'untyped';
import type { ZodType } from 'zod';

/** A resolved untyped schema carrying the config metadata. */
export type ConfigSchemaType = SchemaType & ConfigMeta;

/** A plain JSON-ish value used as a schema default (`{ port: 3000 }`). */
export type ConfigPlainValue =
    | string
    | number
    | boolean
    | bigint
    | null
    | undefined
    | ConfigPlainValue[]
    | { [key: string]: ConfigPlainValue };

/** A Zod schema, a resolved untyped schema, or a plain value/default. */
export type ConfigSchemaInput = ZodType | ConfigSchemaType | ConfigPlainValue;

/** A single schema, a list of schemas, or scoped schemas keyed by scope name. */
export type ConfigSchema<Scope extends ConfigScope = ConfigScope> =
    | ConfigSchemaInput
    | ConfigSchemaInput[]
    | Record<Scope, ConfigSchemaInput | ConfigSchemaInput[]>;
```

A scope map is the usual shape:

```ts
export const scopes = {
    server: serverConfig, // Zod
    frontend: frontendConfig, // untyped or plain
    cli: 3000, // primitive
};
```

and is used to create the [config engine](/guide/config-generator/create-the-engine).

## Zod

Zod is the richest input: it validates, supplies defaults and carries `.meta()`
metadata for the generated env/CLI/types/docs.

```ts
import { z } from 'zod';

export const serverConfig = z.object({
    base: z.object({
        port: z.number().default(3000).meta({
            // ConfigMeta
            envName: 'MYAPP_PORT',
            description: 'HTTP port',
        }),
        host: z.string().default('0.0.0.0').meta({
            // ConfigMeta
            envName: 'MYAPP_HOST',
            description: 'Bind address',
        }),
    }),
    auth: z.object({
        password: z.string().meta({
            // ConfigMeta
            envName: 'MYAPP_AUTH_PASSWORD',
            description: 'Admin password',
            required: true,
            secret: true,
        }),
        tokenTtl: z.number().default(3600).meta({
            // ConfigMeta
            envName: 'MYAPP_AUTH_TOKEN_TTL',
            description: 'Session lifetime (seconds)',
        }),
    }),
});
```

`z.toJSONSchema` is used internally, so unions, enums, tuples, records and
nullable values keep their shape in the generated types, markdown and JSON
Schema. Values JSON Schema cannot represent (functions) can declare
`.meta({ tsType: '...' })`.

## Untyped

An untyped schema is the resolved JSON-Schema-like shape. It is useful when the
schema comes from a JSON file, a remote source or hand-written definitions.

```ts
export const serverConfig = {
    type: 'object',
    properties: {
        base: {
            type: 'object',
            properties: {
                port: {
                    type: 'number',
                    default: 3000,
                    envName: 'MYAPP_PORT',
                    description: 'HTTP port',
                },
                host: { type: 'string', default: '0.0.0.0' },
            },
        },
        auth: {
            type: 'object',
            properties: {
                password: {
                    type: 'string',
                    required: true,
                    secret: true,
                    envName: 'MYAPP_AUTH_PASSWORD',
                },
            },
        },
    },
};
```

Untyped leaves support the same `ConfigMeta` keys as Zod leaves (`envName`,
`description`, `required`, `secret`, `cliFlag`, ...), plus `type`, `properties`,
`required`, `default`, `items`, `enum`, `anyOf`/`oneOf` and `$ref`/`$defs`.

## Plain objects

A plain object uses its values as defaults. The generator infers the leaf types:

```ts
export const serverConfig = {
    port: 3000,
    host: 'localhost',
    debug: false,
    tags: ['api', 'web'],
    auth: {
        tokenTtl: 3600,
    },
};
```

This is equivalent to an untyped schema whose leaves have `type` and `default`
set. It is the quickest way to scaffold a config, but it carries no validation
metadata — use Zod when you need strict validation.

> A plain object inside a scope is read as that scope's **fields**. To declare
> explicit schema keywords (`type`, `properties`, `envName`, ...) use an untyped
> schema instead, so the keys are not mistaken for defaults.

## Primitives

Primitive values become defaults inside a plain object:

```ts
export const serverConfig = {
    port: 3000, // number
    host: 'localhost', // string
    debug: false, // boolean
};
```

A whole scope can also be a primitive when it has a single value:

```ts
const engine = createConfigEngine({
    schema: { version: '1.0.0' },
});
```

The value is exposed under the scope's `config` leaf (`{ version: { config:
'1.0.0' } }`). For named fields, prefer a plain object or an untyped/Zod schema.

## Arrays

An array of schemas is merged into one scope. This is useful when a scope is
split across modules:

```ts
export const serverConfig = [
    z.object({ host: z.string().default('localhost') }),
    z.object({ port: z.number().default(3000) }),
];
```

Arrays of **plain values** are defaults for a leaf; declare them as an untyped
schema when you need an array default at the scope root:

```ts
const tags = { type: 'array', items: { type: 'string' }, default: ['api'] };
```

## Base groups

The `baseGroup` option hoists a schema's flat fields out of the nested groups in
the generated outputs. It defaults to `base`:

```ts
const engine = createConfigEngine({
    schema: scopes,
    baseGroup: 'base',
});
```

The generated types expose `…Base` and the main interface extends it; the
markdown and JSON Schema flatten the base fields into the top level.

### Hoist multiple groups

Pass an array to hoist more than one group. The groups are merged in declaration
order:

```ts
const engine = createConfigEngine({
    schema: scopes,
    baseGroup: ['base', 'server'],
});
```

Both `base.port` and `server.host`, for example, become top-level fields in the
generated `…Base` interface. Use `flatten: true` (or `flatten: { level }`) when
you want all top-level keys flattened instead of selecting groups.

## Meta

**Only Zod and Untyped can define metadata.**

[Plain objects](#plain-objects), [primitives](#primitives) and [arrays](#arrays) therefore
does **not** support metadata because they're too simplistic.

> Use Zod or Untyped (JSON-Schema-shaped) schemas to add metadata to config options.

### Description

Descriptions can be used to inline JSDocs, `.env` comments, markdown docs etc.
for a single configuration in the generated config types/env/cli/markdown/schema.

#### Zod description

They can be defined for a config option in a Zod schema with `.describe(<string>)`
or `.meta({ description: <string> })`:

```ts
export const serverConfig = z.object({
    base: z.object({
        // using .describe()
        port: z.number().default(3000).describe('HTTP port'),
        // using .meta()
        host: z.string().default('0.0.0.0').meta({
            description: 'Bind address',
        }),
    }),
});
```

#### Untyped description

An untyped schema carrying the [config metadata](#other-meta-fields)'s description field:

```ts
export const serverConfig = {
    type: 'object',
    properties: {
        base: {
            type: 'object',
            properties: {
                port: {
                    type: 'number',
                    default: 3000,
                    description: 'HTTP port', // the description
                },
                host: { type: 'string', default: '0.0.0.0' },
            },
        },
    },
};
```

### Other meta fields

The [ConfigMeta](https://github.com/deltabox-studio/toolchain/blob/main/packages/config/src/types/meta.ts)
fields used in the Zod/Untyped schemas:

- `id` (override the name of the generated type)
- `typeName` (same as `id`)
- `public` (safe to expose as public API, true by default)
- `description`
- `envName`
- `env` (deprecated, use `envName` instead)
- `envPath` (dotted config path)
- `path` (deprecated, use `envPath` instead)
- `envExpose` (set `false` to keep a value out of env output)
- `required`
- `deprecated`
- `deprecationMessage`
- `example`
- `since`
- `see`
- `remarks`
- `experimental`
- `alpha`
- `beta`
- `secret`
- `scope`
- `defaultValue` (when the resolved default differs)
- `cli` (`false`, or `ConfigCliOptionMeta`: `flag`, `short`, `description`, `type`, `parse`, `default`, `choices`, `multiple`, `required`, `hidden`)
- `cliCommand` (`false`, or `ConfigCliCommandMeta`: `name`, `description`, `aliases`, `hidden`, `passthrough`, `args`)
- `cliFlag` / `cliFlagShort` (legacy aliases for `cli.flag` / `cli.short`)

### Annotations

| Field                             | Adds                                                                                                       | Notes                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `required: true`                  | **JSDocs:**<br>`@required`<br><br>**Markdown:**<br>`- **Required**` above the `- **Type**` line            |                                                   |
| `deprecated: true`                | **JSDocs:**<br>`@deprecated`<br><br>**Markdown:**<br>`- **Deprecated**`                                    | `deprecationMessage: <string>` supplies the text. |
| `example` (string or array)       | **JSDocs:**<br>One `@example` tag per value <br><br>**Markdown:**<br>One `**Example(s):**` entry per value |                                                   |
| `since`                           | **JSDocs:**<br>`@since`<br><br>**Markdown:**<br>`- **Since**`                                              |                                                   |
| `see`                             | **JSDocs:**<br>`@see`<br><br>**Markdown:**<br>`- **See**` links                                            |                                                   |
| `remarks`                         | **JSDocs:**<br>`@remarks`<br><br>**Markdown:**<br>`**Remarks:**`                                           |                                                   |
| `experimental` / `alpha` / `beta` | Their stability tags                                                                                       |                                                   |

#### Include or exclude annotations

Each generator accepts the matching `include*` option (all defaults `true`) to
keep or suppress an annotation:

- `includeRequired`
- `includeDeprecated`
- `includeExamples`
- `includeSince`
- `includeSee`
- `includeRemarks`
- `includeExperimental`
- `includeAlpha`
- `includeBeta`

Markdown and type output shows env/CLI equivalents by default.

Disable them with `includeEnv: false` or `includeCli: false` in the [config engine](/guide/config-generator/create-the-engine)'s generator options:

```ts
engine.markdown.generate({ includeCli: false, includeEnv: false });
engine.types.generate({ includeEnv: false });
```

## API reference

See the [API reference](/guide/config-generator/api) for the complete list of
exports and every generator option.
