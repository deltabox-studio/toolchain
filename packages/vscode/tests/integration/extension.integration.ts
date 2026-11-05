import * as assert from 'node:assert/strict';

import * as vscode from 'vscode';

suite('deltabox toolchain extension', () => {
    test('activates and registers its commands', async () => {
        const extension = vscode.extensions.getExtension('deltabox.toolchain-vscode');
        assert.ok(extension, 'the extension is installed in the test host');

        await extension.activate();
        assert.ok(extension.isActive, 'the extension activates');

        const commands = await vscode.commands.getCommands(true);
        for (const id of [
            'deltabox.toolchain.sync',
            'deltabox.toolchain.syncAll',
            'deltabox.toolchain.scaffold',
            'deltabox.toolchain.providers.refresh',
            'deltabox.toolchain.templates.refresh',
            'deltabox.toolchain.registry.refresh',
        ]) {
            assert.ok(commands.includes(id), `${id} is registered`);
        }
    });

    test('ships the bundled dbx CLI', async () => {
        const extension = vscode.extensions.getExtension('deltabox.toolchain-vscode');
        assert.ok(extension, 'the extension is installed in the test host');

        const cli = vscode.Uri.joinPath(extension.extensionUri, 'dist', 'dbx.cjs');
        const stat = await vscode.workspace.fs.stat(cli);
        assert.ok(stat.size > 0, 'dist/dbx.cjs is bundled');
    });
});
