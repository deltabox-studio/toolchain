import type { Theme } from 'vitepress';
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
    Layout() {
        return h(DefaultTheme.Layout, null, {
            'layout-bottom': () =>
                h('div', { class: 'dbx-footer-social' }, [
                    h(VPSocialLinks, { links: socialLinks }),
                ]),
        });
    },
} satisfies Theme;
