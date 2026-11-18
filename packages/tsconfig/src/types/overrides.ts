import type { TsConfigJson } from 'type-fest';

import type { ToolchainTsconfigOverrides } from '@deltabox/toolchain/shared';

/** The file an override targets. */
export type TsconfigOverrideKind = 'base' | 'root' | 'default' | 'build';

/** The `tsconfig.overrides` config section. */
export type TsconfigOverrides = ToolchainTsconfigOverrides;

/** One applied override, as recorded in the manifest. */
export interface AppliedOverride {
    kind: TsconfigOverrideKind;
    override: TsConfigJson;
}

/** Applied overrides keyed by repo-relative file path. */
export type OverridesState = Record<string, AppliedOverride>;

/** A leaf value set by an override, addressed by its object path. */
export interface OverrideLeaf {
    path: string[];
    value: unknown;
}

/** The outcome of `revertOverride`. */
export interface RevertOverrideResult {
    /** Dotted keys that were removed or restored to their snapshot value. */
    reverted: string[];
    /** Dotted keys left alone because they changed after the override applied them. */
    kept: string[];
}
