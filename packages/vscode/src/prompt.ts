import * as vscode from 'vscode';

/** One selectable item in a paged QuickPick. */
export interface PromptItem<T> {
    label: string;
    description?: string;
    detail?: string;
    value: T;
}

/** A navigation item rendered before the real choices. */
export type PromptNavigation = { type: 'back' } | { type: 'next'; page: number; pages: number };

/** The minimal UI surface the prompt factory needs. */
export interface PromptHost {
    pick: <T>(
        items: readonly (PromptItem<T> | { label: string; navigation: PromptNavigation })[],
        options: { title?: string; placeHolder?: string; canPickMany?: boolean }
    ) => Promise<unknown>;
    input: (options: {
        title?: string;
        prompt?: string;
        value?: string;
        placeHolder?: string;
    }) => Promise<string | undefined>;
    confirm: (options: {
        title?: string;
        prompt: string;
        value?: boolean;
    }) => Promise<boolean | undefined>;
}

/** A declarative prompt argument. */
export interface PromptArgument {
    name: string;
    description: string;
    type: 'string' | 'boolean' | 'choice' | 'multiselect';
    required?: boolean;
    default?: string | boolean | string[];
    choices?: { label: string; value: string; description?: string }[];
}

/** A declarative action (CLI-like, rendered as VS Code prompts). */
export interface PromptAction {
    id: string;
    label: string;
    group: string;
    description?: string;
    arguments?: PromptArgument[];
    /** The VS Code command to delegate execution to. */
    command?: string;
    /** Or a direct runner (used when the action needs its own prompts). */
    run?: (values: Record<string, unknown>, host: PromptHost) => Promise<void>;
}

export const DEFAULT_PAGE_SIZE = 8;

/** The default VS Code host. */
export function vscodePromptHost(): PromptHost {
    return {
        pick: async (items, options) =>
            vscode.window.showQuickPick(
                items as never,
                {
                    ...(options.title ? { title: options.title } : {}),
                    ...(options.placeHolder ? { placeHolder: options.placeHolder } : {}),
                    ...(options.canPickMany ? { canPickMany: true } : {}),
                } as vscode.QuickPickOptions
            ) as unknown,
        input: async options =>
            vscode.window.showInputBox({
                ...(options.title ? { title: options.title } : {}),
                ...(options.prompt ? { prompt: options.prompt } : {}),
                ...(options.value !== undefined ? { value: options.value } : {}),
                ...(options.placeHolder ? { placeHolder: options.placeHolder } : {}),
            }),
        confirm: async options => {
            const picked = await vscode.window.showQuickPick(
                [
                    { label: 'Yes', value: true },
                    { label: 'No', value: false },
                ],
                { title: options.title, placeHolder: options.prompt }
            );
            return picked?.value;
        },
    };
}

function isNavigation(item: unknown): item is { navigation: PromptNavigation } {
    return Boolean(item && typeof item === 'object' && 'navigation' in item);
}

/**
 * Show a paged QuickPick. Navigation entries are rendered before the real
 * choices, so `Go back` / `Next page (n/m)` are always reachable.
 */
export async function pickPaged<T>(
    host: PromptHost,
    title: string,
    items: readonly PromptItem<T>[],
    page = 0,
    pageSize = DEFAULT_PAGE_SIZE
): Promise<T | undefined> {
    const pages = Math.max(1, Math.ceil(items.length / pageSize));
    const current = Math.min(Math.max(0, page), pages - 1);
    const start = current * pageSize;
    const slice = items.slice(start, start + pageSize);
    const navigation: { label: string; navigation: PromptNavigation }[] = [];
    if (current > 0) navigation.push({ label: 'Go back', navigation: { type: 'back' } });
    if (current < pages - 1) {
        navigation.push({
            label: `Next page (${current + 1}/${pages})`,
            navigation: { type: 'next', page: current + 1, pages },
        });
    }
    const picked = (await host.pick([...navigation, ...slice], {
        title,
        placeHolder: pages > 1 ? `Page ${current + 1}/${pages}` : 'Choose an action',
    })) as PromptItem<T> | { navigation: PromptNavigation } | undefined;
    if (!picked) return undefined;
    if (isNavigation(picked)) {
        return pickPaged(
            host,
            title,
            items,
            picked.navigation.type === 'back' ? current - 1 : picked.navigation.page,
            pageSize
        );
    }
    return picked.value;
}

/** Prompt for every argument of an action. */
export async function promptArguments(
    host: PromptHost,
    args: readonly PromptArgument[]
): Promise<Record<string, unknown> | undefined> {
    const values: Record<string, unknown> = {};
    for (const arg of args) {
        if (arg.type === 'boolean') {
            values[arg.name] = await host.confirm({
                title: arg.description,
                prompt: arg.description,
                value: arg.default === true,
            });
            continue;
        }
        if (arg.type === 'choice' || arg.type === 'multiselect') {
            const choices = arg.choices ?? [];
            if (arg.type === 'multiselect') {
                const picked = (await host.pick(
                    choices.map(choice => ({ ...choice, value: choice.value })),
                    { title: arg.description, placeHolder: arg.description, canPickMany: true }
                )) as PromptItem<string>[] | undefined;
                values[arg.name] = picked?.map(item => item.value) ?? [];
            } else {
                const picked = await pickPaged(
                    host,
                    arg.description,
                    choices.map(choice => ({
                        label: choice.label,
                        description: choice.description,
                        value: choice.value,
                    }))
                );
                values[arg.name] = picked;
            }
            continue;
        }
        const entered = await host.input({
            title: arg.description,
            prompt: arg.description,
            ...(typeof arg.default === 'string' ? { value: arg.default } : {}),
        });
        if (entered === undefined) {
            if (arg.required !== false) return undefined;
            continue;
        }
        if (entered !== '') values[arg.name] = entered;
    }
    return values;
}

/** Prompt and execute one action. Returns false when the user cancelled. */
export async function executePromptAction(
    host: PromptHost,
    action: PromptAction
): Promise<boolean> {
    const values = action.arguments ? await promptArguments(host, action.arguments) : {};
    if (values === undefined) return false;
    if (action.run) {
        await action.run(values, host);
        return true;
    }
    if (action.command) {
        await vscode.commands.executeCommand(action.command, values);
        return true;
    }
    await vscode.window.showWarningMessage(`deltabox: action "${action.label}" has no command.`);
    return false;
}
