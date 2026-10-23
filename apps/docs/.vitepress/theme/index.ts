import type { Theme } from 'vitepress';
import CopyOrDownloadAsMarkdownButtons from 'vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue';
import DefaultTheme, { VPSocialLinks } from 'vitepress/theme';
import { h } from 'vue';

import './style.css';

/** GitHub-only social links, shown in the navbar and the footer. */
const socialLinks = [
    {
        icon: 'github',
        link: 'https://github.com/deltabox-studio/toolchain',
        ariaLabel: 'GitHub',
    },
];

export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        app.component('CopyOrDownloadAsMarkdownButtons', CopyOrDownloadAsMarkdownButtons);
    },
    Layout() {
        return h(DefaultTheme.Layout, null, {
            'layout-bottom': () =>
                h('div', { class: 'dbx-footer-social' }, [
                    h(VPSocialLinks, { links: socialLinks }),
                ]),
        });
    },
} satisfies Theme;
