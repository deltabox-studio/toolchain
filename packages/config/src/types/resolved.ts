import type { MergeDeep, PartialDeep, Simplify } from 'type-fest';
import type { ZodType } from 'zod';

import type { CollectOptions } from './collect.js';
import type { ConfigSchemaType } from './schema.js';

type UnionToIntersection<U> = (U extends unknown ? (value: U) => void : never) extends (
    value: infer I
) => void
    ? I
    : never;

/** Widen a literal default to its primitive type (a plain schema is a default). */
type WidenPrimitive<P> = P extends string
    ? string
    : P extends number
      ? number
      : P extends boolean
        ? boolean
        : P extends bigint
          ? bigint
          : P extends symbol
            ? symbol
            : P;

/**
 * Schema -> config object. Zod schemas infer their output; untyped/scoped
 * schemas resolve to a nested object (their runtime shape is not statically
 * known, so leaves stay `unknown`).
 */
export type ConfigOf<P> = P extends ZodType<infer T> ? T : InferConfigSchema<P>;

/** Infer the shape of an untyped/scoped/plain config schema. */
export type InferConfigSchema<P> =
    P extends ZodType<infer T>
        ? T
        : P extends ConfigSchemaType
          ? Record<string, unknown>
          : P extends readonly (infer I)[]
            ? Simplify<UnionToIntersection<InferConfigSchema<I>>>
            : P extends Record<string, any>
              ? Simplify<{ -readonly [K in keyof P]: InferConfigSchema<P[K]> }>
              : WidenPrimitive<P>;

/**
 * The scope names a schema exposes as statically known keys.
 *
 * A scope map (`{ server, cli }`) yields its own keys; a single Zod schema, an
 * array of schemas or an untyped schema yields `string` because its scopes are
 * resolved at runtime.
 */
export type ConfigScopeKeys<TSchema> = TSchema extends ZodType
    ? string
    : TSchema extends readonly unknown[]
      ? string
      : TSchema extends Record<string, unknown>
        ? 'type' extends keyof TSchema
            ? string
            : 'properties' extends keyof TSchema
              ? string
              : Extract<keyof TSchema, string>
        : string;

/** The validated config value for one schema scope. */
export type ConfigScopeOf<TSchema, K extends string = string> = TSchema extends ZodType
    ? ConfigOf<TSchema>
    : K extends keyof TSchema
      ? ConfigOf<TSchema[K]>
      : ConfigOf<TSchema>;

type OverrideOf<O> = O extends Record<string, any> ? PartialDeep<O> : {};

/** Merge overrides over the parser output. */
export type MergedConfig<P, O> = Simplify<MergeDeep<ConfigOf<P>, OverrideOf<O>>>;

type MaxDepth<O> = O extends { maxDepth: infer D }
    ? D extends number
        ? number extends D
            ? 8
            : D
        : 8
    : 8;

/** Enumerate nested dotted paths, bounded by a literal `maxDepth` (default 8). */
export type DotPath<
    C,
    Depth extends number = 8,
    Acc extends unknown[] = [],
> = Acc['length'] extends Depth
    ? never
    : C extends readonly unknown[]
      ? never
      : C extends Record<string, any>
        ? {
              [K in keyof C & string]: K | `${K}.${DotPath<C[K], Depth, [...Acc, unknown]>}`;
          }[keyof C & string]
        : never;

export type PathUnion<C, O = {}> = DotPath<C, MaxDepth<O>>;

type LiteralPaths<F> = F extends string ? F : F extends readonly string[] ? F[number] : never;

type IncludePaths<O, C> = O extends { include: infer F }
    ? [LiteralPaths<F>] extends [never]
        ? PathUnion<C, O>
        : Extract<PathUnion<C, O>, LiteralPaths<F>>
    : PathUnion<C, O>;

type ExcludePaths<O, _C> = O extends { exclude: infer F } ? LiteralPaths<F> : never;

type PickPath<C, P extends string> = P extends `${infer Head}.${infer Rest}`
    ? Head extends keyof C
        ? { [K in Head]: PickPath<C[Head], Rest> }
        : never
    : P extends keyof C
      ? Pick<C, P>
      : never;

type OmitPath<C, P extends string> = P extends `${infer Head}.${infer Rest}`
    ? Head extends keyof C
        ? { [K in keyof C]: K extends Head ? OmitPath<C[K], Rest> : C[K] }
        : C
    : Omit<C, P>;

type ApplyPaths<C, P extends string> = [P] extends [never]
    ? {}
    : Simplify<UnionToIntersection<P extends string ? PickPath<C, P> : never>>;

type ApplyExcludePaths<C, P extends string> = [P] extends [never]
    ? C
    : Simplify<UnionToIntersection<P extends string ? OmitPath<C, P> : never>>;

export type FilteredConfig<C, O> = ApplyPaths<C, IncludePaths<O, C>>;

export type ExcludedConfig<C, O> = ApplyExcludePaths<C, ExcludePaths<O, C>>;

/** The final correlated config result. */
export type ResolvedConfig<P, O, Options extends CollectOptions = CollectOptions> = Simplify<
    ExcludedConfig<FilteredConfig<MergedConfig<P, O>, Options>, Options>
>;
