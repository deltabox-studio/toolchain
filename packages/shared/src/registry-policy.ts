/** A registry source allow/deny policy (host and path globs). */
export interface RegistryPolicy {
    /** Allowed host/path globs. An empty list allows everything not denied. */
    allow?: string[];
    /** Denied host/path globs (checked first). */
    deny?: string[];
}

function globToRegExp(glob: string): RegExp {
    const escaped = glob
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '\u0000')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '.')
        .replace(/\u0000/g, '.*');
    return new RegExp(`^${escaped}$`, 'i');
}

function matches(value: string, globs: string[] | undefined): boolean {
    if (!globs || globs.length === 0) return false;
    return globs.some(glob => globToRegExp(glob).test(value));
}

/**
 * Whether a registry source is allowed by a policy. URLs are matched against
 * the full URL, the host and `host/path`; local sources should be passed as an
 * absolute path. A missing policy (or an empty deny + allow) allows everything.
 */
export function registrySourceAllowed(source: string, policy: RegistryPolicy | undefined): boolean {
    if (!policy) return true;
    const value = source.replace(/\\/g, '/').replace(/\/+$/, '');
    const candidates = [value];
    try {
        const url = new URL(value);
        candidates.push(url.host.toLowerCase(), `${url.host}${url.pathname}`.toLowerCase());
    } catch {
        // local path
    }
    if (candidates.some(candidate => matches(candidate, policy.deny))) return false;
    if (!policy.allow || policy.allow.length === 0) return true;
    return candidates.some(candidate => matches(candidate, policy.allow));
}
