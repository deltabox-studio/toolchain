import type * as vscode from 'vscode';

export interface HomeProject {
    label: string;
    dir: string;
    relativePath: string;
    type: string;
    hasConfig: boolean;
    dependencies: string[];
    /** ISO timestamp of the last sync recorded in the project manifest. */
    syncedAt?: string;
    /** Number of files recorded in the project manifest. */
    trackedFiles: number;
}

export interface HomeModel {
    enabled: boolean;
    projects: HomeProject[];
    packageManager?: string;
    /** ISO timestamp of the most recent sync across every project. */
    lastSync?: string;
}

export type HomeAction =
    | { type: 'ready' }
    | { type: 'syncAll' }
    | { type: 'syncActive' }
    | { type: 'syncSelected' }
    | { type: 'syncCheck' }
    | { type: 'scaffold' }
    | { type: 'refresh' }
    | { type: 'generateConfigs' }
    | { type: 'runWorkflow' }
    | { type: 'resetToolchain' }
    | { type: 'toggle' }
    | { type: 'runVite' }
    | { type: 'templateAdd' }
    | { type: 'templateRemove' }
    | { type: 'syncProject'; dir: string }
    | { type: 'checkProject'; dir: string }
    | { type: 'generateProjectConfig'; dir: string }
    | { type: 'resetProject'; dir: string }
    | { type: 'runProjectWorkflow'; dir: string }
    | { type: 'runProjectVite'; dir: string }
    | { type: 'goToProject'; dir: string };

/** A compact, theme-aware Home dashboard shown above the Projects tree. */
export class HomeViewProvider implements vscode.WebviewViewProvider {
    private view?: vscode.WebviewView;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly getModel: () => HomeModel,
        private readonly onAction: (action: HomeAction) => void | Promise<void>
    ) {}

    resolveWebviewView(view: vscode.WebviewView): void {
        this.view = view;
        view.webview.options = { enableScripts: true, localResourceRoots: [this.extensionUri] };
        view.webview.html = this.html(view.webview);
        view.webview.onDidReceiveMessage(async (message: HomeAction) => {
            if (message.type === 'ready') {
                this.refresh();
                return;
            }
            try {
                await this.onAction(message);
            } finally {
                void view.webview.postMessage({ type: 'done' });
            }
        });
    }

    refresh(): void {
        void this.view?.webview.postMessage({ type: 'model', model: this.getModel() });
    }

    private html(webview: vscode.Webview): string {
        const nonce = getNonce();
        const csp = [
            `default-src 'none'`,
            `style-src ${webview.cspSource} 'unsafe-inline'`,
            `script-src 'nonce-${nonce}'`,
        ].join('; ');

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>deltabox toolchain</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    [hidden] { display: none !important; }
    body {
      margin: 0;
      padding: 10px 10px 16px;
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }
    .lastSync { margin:0 1px 8px; color:var(--vscode-descriptionForeground); font-size:11px; }
    .status {
      display:flex; align-items:center; gap:7px; margin:0 0 12px; padding:8px 9px;
      border:1px solid var(--vscode-panel-border); border-radius:7px;
      background:var(--vscode-sideBarSectionHeader-background);
    }
    .dot { width:8px; height:8px; border-radius:50%; background:var(--vscode-testing-iconPassed); }
    .dot.off { background:var(--vscode-descriptionForeground); }
    .statusText { flex:1; font-weight:600; }
    .muted { color:var(--vscode-descriptionForeground); font-size:11px; }
    .section { margin-top:15px; }
    .sectionHead { display:flex; align-items:center; justify-content:space-between; margin:0 1px 8px; }
    h2 { margin:0; text-transform:uppercase; letter-spacing:.07em; font-size:10px; font-weight:700; color:var(--vscode-descriptionForeground); }
    .actions { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
    button {
      position:relative; overflow:hidden;
      min-height:30px; padding:6px 8px; border:1px solid var(--vscode-button-border, transparent);
      border-radius:5px; color:var(--vscode-button-foreground); background:var(--vscode-button-background);
      font:inherit; font-size:11px; font-weight:600; cursor:pointer;
    }
    button:hover { background:var(--vscode-button-hoverBackground); }
    button.secondary { color:var(--vscode-foreground); background:var(--vscode-button-secondaryBackground); }
    button.secondary:hover { background:var(--vscode-button-secondaryHoverBackground); }
    /* Indeterminate loading bar: a 50%-wide bar sweeping across the button's
       bottom edge until the action completes. */
    button.loading { cursor:progress; }
    button.loading::after {
      content:''; position:absolute; left:0; bottom:0; height:1.5px; width:50%;
      background:var(--vscode-button-background);
      animation:dbx-progress 1.1s linear infinite;
    }
    /* On a primary button the bar would match the button, so use white. */
    button:not(.secondary).loading::after { background:#ffffff; }
    @keyframes dbx-progress {
      0% { transform:translateX(-100%); }
      100% { transform:translateX(200%); }
    }
    .accordion {
      width:100%; display:flex; align-items:center; justify-content:space-between; text-align:left;
      color:var(--vscode-foreground); background:var(--vscode-button-secondaryBackground);
    }
    .accordion:hover { background:var(--vscode-button-secondaryHoverBackground); }
    .accordion .chev { transition:transform .12s ease; }
    .accordion.open .chev { transform:rotate(180deg); }
    .allActions { display:flex; flex-direction:column; gap:6px; margin-top:7px; }
    .allActions button { width:100%; text-align:left; }
    .projectList { display:flex; flex-direction:column; gap:6px; }
    .project {
      position:relative; display:flex; align-items:center; gap:9px; padding:8px 9px;
      border:1px solid var(--vscode-panel-border); border-radius:6px;
      background:var(--vscode-editor-background); min-width:0;
    }
    .projectIcon { color:var(--vscode-textLink-foreground); font-size:14px; flex:none; }
    .projectInfo { min-width:0; flex:1; }
    .projectName { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600; }
    .projectMeta { margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--vscode-descriptionForeground); font-size:10px; }
    .projectSync { margin-top:2px; color:var(--vscode-descriptionForeground); font-size:10px; }
    .project button { flex:none; min-height:26px; padding:3px 8px; }
    .menuBtn { flex:none; min-width:24px; min-height:26px; padding:0 4px; font-size:14px; line-height:1; }
    .menu {
      position:absolute; top:calc(100% - 4px); right:6px; z-index:10; min-width:170px;
      display:flex; flex-direction:column; padding:4px; gap:2px;
      border:1px solid var(--vscode-menu-border, var(--vscode-panel-border)); border-radius:6px;
      background:var(--vscode-menu-background, var(--vscode-editor-background));
      box-shadow:0 2px 8px var(--vscode-widget-shadow, rgba(0,0,0,.35));
    }
    .menu button {
      width:100%; text-align:left; min-height:26px;
      color:var(--vscode-menu-foreground, var(--vscode-foreground));
      background:transparent; border:1px solid transparent; font-weight:500;
    }
    .menu button:hover { background:var(--vscode-menu-selectionBackground, var(--vscode-list-hoverBackground)); color:var(--vscode-menu-selectionForeground, var(--vscode-foreground)); }
    .menu .sep { height:1px; margin:3px 2px; background:var(--vscode-menu-separatorBackground, var(--vscode-panel-border)); }
    .empty {
      padding:12px; border:1px dashed var(--vscode-panel-border); border-radius:6px;
      color:var(--vscode-descriptionForeground); line-height:1.45;
    }
    .empty button { margin-top:9px; width:100%; }
    .footer { margin-top:16px; padding-top:8px; border-top:1px solid var(--vscode-panel-border); color:var(--vscode-descriptionForeground); font-size:10px; line-height:1.45; }
    .link { color:var(--vscode-textLink-foreground); cursor:pointer; text-decoration:none; }
    .link:hover { text-decoration:underline; }
  </style>
</head>
<body>
  <div id="lastSync" class="lastSync"></div>
  <div class="status"><span id="statusDot" class="dot"></span><span id="statusText" class="statusText">Ready</span><span id="manager" class="muted"></span></div>
  <section class="section">
    <div class="sectionHead"><h2>Quick actions</h2></div>
    <div class="actions">
      <button data-action="syncAll">Sync all</button>
      <button data-action="scaffold">Scaffold project</button>
      <button class="secondary" data-action="runVite">Run Vite+\u2026</button>
      <button class="secondary" data-action="templateAdd">Add template\u2026</button>
      <button class="secondary" data-action="syncCheck">Check sync</button>
      <button class="secondary" data-action="refresh">Refresh projects</button>
    </div>
  </section>
  <section class="section">
    <button class="accordion" data-toggle="allActions">All actions <span class="chev">\u25BE</span></button>
    <div id="allActions" class="allActions" hidden>
      <button class="secondary" data-action="syncAll">Sync all projects</button>
      <button class="secondary" data-action="syncActive">Sync active project</button>
      <button class="secondary" data-action="syncSelected">Sync selected projects</button>
      <button class="secondary" data-action="syncCheck">Check sync</button>
      <button class="secondary" data-action="scaffold">Scaffold project\u2026</button>
      <button class="secondary" data-action="generateConfigs">Generate configs\u2026</button>
      <button class="secondary" data-action="runWorkflow">Run workflow\u2026</button>
      <button class="secondary" data-action="runVite">Run Vite+ command\u2026</button>
      <button class="secondary" data-action="templateAdd">Add template\u2026</button>
      <button class="secondary" data-action="templateRemove">Remove template\u2026</button>
      <button class="secondary" data-action="resetToolchain">Reset tooling\u2026</button>
      <button class="secondary" data-action="refresh">Refresh projects</button>
      <button class="secondary" data-action="toggle">Toggle auto-sync</button>
    </div>
  </section>
  <section class="section">
    <div class="sectionHead"><h2>Projects</h2><span id="count" class="muted"></span></div>
    <div id="projects" class="projectList"></div>
    <div id="empty" class="empty" hidden>
      No projects found in this workspace.<br>
      Scaffold a project to get started.
      <button data-action="scaffold">Scaffold project</button>
    </div>
  </section>
  <div class="footer">
    Auto-sync watches config and tsconfig inputs only (no loops).<br>
    <a class="link" data-action="syncCheck">Check sync</a>
  </div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const list = document.getElementById('projects');
    const empty = document.getElementById('empty');

    function closeMenus() {
      for (const menu of document.querySelectorAll('.menu')) menu.hidden = true;
    }

    let pending = null;
    function setLoading(button) {
      if (!button || button.tagName !== 'BUTTON') return;
      clearLoading();
      button.classList.add('loading');
      pending = button;
    }
    function clearLoading() {
      if (pending) pending.classList.remove('loading');
      pending = null;
    }

    document.addEventListener('click', event => {
      const menuBtn = event.target.closest('[data-menu]');
      if (menuBtn) {
        const menu = menuBtn.parentElement.querySelector('.menu');
        const open = !menu.hidden;
        closeMenus();
        menu.hidden = open;
        return;
      }
      const toggle = event.target.closest('[data-toggle]');
      if (toggle) {
        const target = document.getElementById(toggle.dataset.toggle);
        if (target) target.hidden = !target.hidden;
        toggle.classList.toggle('open', target ? !target.hidden : false);
        return;
      }
      const button = event.target.closest('[data-action]');
      closeMenus();
      if (!button) return;
      setLoading(button);
      vscode.postMessage({ type: button.dataset.action, dir: button.dataset.dir });
    });

    function relativeTime(iso) {
      if (!iso) return 'never';
      const then = new Date(iso).getTime();
      if (Number.isNaN(then)) return 'unknown';
      const diff = Date.now() - then;
      const min = Math.round(diff / 60000);
      if (min < 1) return 'just now';
      if (min < 60) return min + 'm ago';
      const hr = Math.round(min / 60);
      if (hr < 24) return hr + 'h ago';
      const day = Math.round(hr / 24);
      if (day < 30) return day + 'd ago';
      return new Date(iso).toLocaleDateString();
    }

    function projectMenu(dir) {
      const menu = document.createElement('div');
      menu.className = 'menu';
      menu.hidden = true;
      const items = [
        ['syncProject', 'Sync'],
        ['checkProject', 'Check sync'],
        ['generateProjectConfig', 'Generate config'],
        ['runProjectWorkflow', 'Run workflow\\u2026'],
        ['runProjectVite', 'Run Vite+\\u2026'],
        ['sep'],
        ['resetProject', 'Reset tooling\\u2026'],
        ['goToProject', 'Go to project'],
      ];
      for (const item of items) {
        if (item[0] === 'sep') {
          const sep = document.createElement('div');
          sep.className = 'sep';
          menu.append(sep);
          continue;
        }
        const button = document.createElement('button');
        button.textContent = item[1];
        button.dataset.action = item[0];
        button.dataset.dir = dir;
        menu.append(button);
      }
      return menu;
    }

    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type === 'done') {
        clearLoading();
        return;
      }
      if (message.type !== 'model') return;
      clearLoading();
      const model = message.model;
      const projects = model.projects || [];

      document.getElementById('statusText').textContent = model.enabled ? 'Auto-sync enabled' : 'Auto-sync paused';
      document.getElementById('statusDot').classList.toggle('off', !model.enabled);
      document.getElementById('manager').textContent = model.packageManager || '';
      document.getElementById('count').textContent = String(projects.length);

      const lastSync = document.getElementById('lastSync');
      if (model.lastSync) {
        lastSync.textContent = 'Last sync: ' + relativeTime(model.lastSync);
        lastSync.title = new Date(model.lastSync).toLocaleString();
      } else {
        lastSync.textContent = 'Last sync: never';
        lastSync.title = '';
      }

      list.replaceChildren();
      empty.hidden = projects.length > 0;
      for (const project of projects) {
        const row = document.createElement('div');
        row.className = 'project';
        const icon = document.createElement('span');
        icon.className = 'projectIcon';
        icon.textContent = project.hasConfig ? '\\u25C6' : '\\u25C7';
        const info = document.createElement('div');
        info.className = 'projectInfo';
        const name = document.createElement('div');
        name.className = 'projectName';
        name.textContent = project.label;
        name.title = project.label;
        const meta = document.createElement('div');
        meta.className = 'projectMeta';
        meta.textContent = project.relativePath + (project.dependencies?.length ? ' \\u00B7 ' + project.dependencies.length + ' deps' : '');
        meta.title = meta.textContent;
        info.append(name, meta);
        if (project.hasConfig) {
          const syncInfo = document.createElement('div');
          syncInfo.className = 'projectSync';
          syncInfo.textContent = 'Last sync: ' + relativeTime(project.syncedAt);
          if (project.syncedAt) syncInfo.title = new Date(project.syncedAt).toLocaleString();
          info.append(syncInfo);
        }
        row.append(icon, info);

        if (project.hasConfig) {
          const sync = document.createElement('button');
          sync.className = 'secondary';
          sync.textContent = 'Sync';
          sync.dataset.action = 'syncProject';
          sync.dataset.dir = project.dir;
          row.append(sync);
        } else {
          const badge = document.createElement('span');
          badge.className = 'muted';
          badge.textContent = 'no config';
          row.append(badge);
        }

        const menuBtn = document.createElement('button');
        menuBtn.className = 'menuBtn secondary';
        menuBtn.textContent = '\\u22EE';
        menuBtn.dataset.menu = project.dir;
        menuBtn.title = 'More actions';
        row.append(menuBtn, projectMenu(project.dir));
        list.append(row);
      }
    });
    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
    }
}

function getNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
        ''
    );
}
