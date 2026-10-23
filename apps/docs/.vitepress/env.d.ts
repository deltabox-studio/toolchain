/**
 * Ambient declarations so the VitePress config + theme type-check under the repo
 * `tsconfig` (which does not pull in `vite/client`).
 *
 * - `*.vue`: the VitePress theme imports the plugin's `CopyOrDownloadAsMarkdownButtons.vue`.
 * - `*.css`: the theme imports `./style.css` for its side effect.
 */

declare module '*.vue' {
    import type { DefineComponent } from 'vue';

    const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
    export default component;
}

declare module '*.css';
