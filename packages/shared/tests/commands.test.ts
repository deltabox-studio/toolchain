import { describe, expectTypeOf, it } from 'vite-plus/test';

import { defineCliCommand } from '../src/index.js';

describe('defineCliCommand', () => {
    it('infers run args from the literal option list', () => {
        const command = defineCliCommand({
            name: 'serve',
            description: 'Serve.',
            options: [
                { flags: '--json', description: 'JSON output.' },
                { flags: '--only <tasks>', description: 'Task names.' },
                { flags: '--tag <value...>', description: 'Tags.' },
                { flags: '--no-color', description: 'Disable colour.' },
                { flags: '--limit <count>', description: 'Limit.', type: 'number' },
            ],
            run: args => {
                expectTypeOf(args.json).toEqualTypeOf<boolean | undefined>();
                expectTypeOf(args.only).toEqualTypeOf<string | undefined>();
                expectTypeOf(args.tag).toEqualTypeOf<string[] | undefined>();
                expectTypeOf(args.color).toEqualTypeOf<boolean | undefined>();
                expectTypeOf(args.limit).toEqualTypeOf<number | undefined>();
            },
        });

        expectTypeOf(command.options?.[0]?.flags).toEqualTypeOf<'--json' | undefined>();
    });
});
