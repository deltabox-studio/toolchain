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
    return globs.some(glob => globToRegExp(glob.replace(/\\/g, '/')).test(value));
}

/** The candidate host/path strings a policy glob can match. */
function sourceCandidates(value: string): string[] {
    const candidates = [value];
    // scp-style git URLs (`git@host:owner/repo.git`) are not valid `URL`s.
    const scp = /^[^@\s]+@([^:\s]+):(.+)$/.exec(value);
    if (scp) {
        const host = (scp[1] ?? '').toLowerCase();
        const path = (scp[2] ?? '').toLowerCase();
        candidates.push(host, `${host}/${path.replace(/^\/+/, '')}`);
    }
    try {
        const url = new URL(value.startsWith('//') ? `https:${value}` : value);
        const hostname = url.hostname.toLowerCase();
        const hostPath = `${hostname}${url.pathname}`.toLowerCase();
        candidates.push(
            url.host.toLowerCase(),
            hostname,
            hostPath,
            `${url.host}${url.pathname}`.toLowerCase()
        );
    } catch {
        // local path
    }
    return candidates;
}

/**
 * Whether a registry source is allowed by a policy. URLs are matched against
 * the full URL, the host (with and without a port) and `host/path`; local
 * sources should be passed as an absolute path. A missing policy (or an empty
 * deny + allow) allows everything.
 */
export function registrySourceAllowed(source: string, policy: RegistryPolicy | undefined): boolean {
    if (!policy) return true;
    const value = source.replace(/\\/g, '/').replace(/\/+$/, '');
    const candidates = sourceCandidates(value);
    if (candidates.some(candidate => matches(candidate, policy.deny))) return false;
    if (!policy.allow || policy.allow.length === 0) return true;
    return candidates.some(candidate => matches(candidate, policy.allow));
}
