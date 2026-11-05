// Generated from the vendored vendor workflow schema — do not edit.
// Run `yarn config:generate` to refresh.

export interface GitHubWorkflow {
    /**
     * The name of your workflow. GitHub displays the names of your workflows on your repository's
     * actions page. If you omit this field, GitHub sets the name to the workflow's filename.
     */
    name?: string;
    /**
     * The name of the GitHub event that triggers the workflow. You can provide a single event string,
     * array of events, array of event types, or an event configuration map that schedules a workflow
     * or restricts the execution of a workflow to specific files, tags, or branch changes. For a list
     * of available events, see
     * https://help.github.com/en/github/automating-your-workflow-with-github-actions/events-that-trigger-workflows.
     *
     * @required
     */
    on:
        | 'branch_protection_rule'
        | 'check_run'
        | 'check_suite'
        | 'create'
        | 'delete'
        | 'deployment'
        | 'deployment_status'
        | 'discussion'
        | 'discussion_comment'
        | 'fork'
        | 'gollum'
        | 'issue_comment'
        | 'issues'
        | 'label'
        | 'merge_group'
        | 'milestone'
        | 'page_build'
        | 'project'
        | 'project_card'
        | 'project_column'
        | 'public'
        | 'pull_request'
        | 'pull_request_review'
        | 'pull_request_review_comment'
        | 'pull_request_target'
        | 'push'
        | 'registry_package'
        | 'release'
        | 'status'
        | 'watch'
        | 'workflow_call'
        | 'workflow_dispatch'
        | 'workflow_run'
        | 'repository_dispatch'
        | Array<
              | 'branch_protection_rule'
              | 'check_run'
              | 'check_suite'
              | 'create'
              | 'delete'
              | 'deployment'
              | 'deployment_status'
              | 'discussion'
              | 'discussion_comment'
              | 'fork'
              | 'gollum'
              | 'issue_comment'
              | 'issues'
              | 'label'
              | 'merge_group'
              | 'milestone'
              | 'page_build'
              | 'project'
              | 'project_card'
              | 'project_column'
              | 'public'
              | 'pull_request'
              | 'pull_request_review'
              | 'pull_request_review_comment'
              | 'pull_request_target'
              | 'push'
              | 'registry_package'
              | 'release'
              | 'status'
              | 'watch'
              | 'workflow_call'
              | 'workflow_dispatch'
              | 'workflow_run'
              | 'repository_dispatch'
          >
        | {
              branch_protection_rule?: null | { types?: Array<unknown> | string };
              check_run?: null | { types?: Array<unknown> | string };
              check_suite?: null | { types?: Array<unknown> | string };
              create?: {} | null;
              delete?: {} | null;
              deployment?: {} | null;
              deployment_status?: {} | null;
              discussion?: null | { types?: Array<unknown> | string };
              discussion_comment?: null | { types?: Array<unknown> | string };
              fork?: {} | null;
              gollum?: {} | null;
              issue_comment?: null | { types?: Array<unknown> | string };
              issues?: null | { types?: Array<unknown> | string };
              label?: null | { types?: Array<unknown> | string };
              merge_group?: null | { types?: Array<unknown> | string };
              milestone?: null | { types?: Array<unknown> | string };
              page_build?: {} | null;
              project?: null | { types?: Array<unknown> | string };
              project_card?: null | { types?: Array<unknown> | string };
              project_column?: null | { types?: Array<unknown> | string };
              public?: {} | null;
              pull_request?: null | unknown;
              pull_request_review?: null | { types?: Array<unknown> | string };
              pull_request_review_comment?: null | { types?: Array<unknown> | string };
              pull_request_target?: null | unknown;
              push?: null | unknown;
              registry_package?: null | { types?: Array<unknown> | string };
              release?: null | { types?: Array<unknown> | string };
              status?: {} | null;
              watch?: {} | null;
              workflow_call?: null | { inputs?: {}; outputs?: {}; secrets?: {} };
              workflow_dispatch?: null | { inputs?: {} };
              workflow_run?: null | { types?: Array<unknown> | string; workflows?: Array<string> };
              repository_dispatch?: {} | null;
              schedule?: Array<{ cron: string; timezone?: string }>;
          };
    /** A map of environment variables that are available to all jobs and steps in the workflow. */
    env?: {} | string;
    /** A map of default settings that will apply to all jobs in the workflow. */
    defaults?: {
        run?: {
            /**
             * You can override the default shell settings in the runner's operating system using the shell
             * keyword. You can use built-in shell keywords, or you can define a custom set of shell
             * options.
             */
            shell?: string | 'bash' | 'pwsh' | 'python' | 'sh' | 'cmd' | 'powershell';
            /**
             * Using the working-directory keyword, you can specify the working directory of where to run the
             * command.
             */
            'working-directory'?: string;
        };
    };
    /**
     * Concurrency ensures that only a single job or workflow using the same concurrency group will run
     * at a time. A concurrency group can be any string or expression. The expression can use any
     * context except for the secrets context. You can also specify concurrency at the workflow level.
     * When a concurrent job or workflow is queued, if another job or workflow using the same
     * concurrency group in the repository is in progress, the queued job or workflow will be pending.
     * By default any previously pending job or workflow in the concurrency group will be canceled;
     * this behavior can be changed with `queue`. To also cancel any currently running job or workflow
     * in the same concurrency group, specify cancel-in-progress: true.
     */
    concurrency?:
        | string
        | { group: string; 'cancel-in-progress'?: boolean | string; queue?: 'single' | 'max' };
    /** Controls the level of GitHub Actions cache access granted to a workflow or job. */
    'cache-mode'?: 'read' | 'write' | 'write-only' | 'none';
    /**
     * A workflow run is made up of one or more jobs. Jobs run in parallel by default. To run jobs
     * sequentially, you can define dependencies on other jobs using the jobs.<job_id>.needs keyword.
     * Each job runs in a fresh instance of the virtual environment specified by runs-on. You can run
     * an unlimited number of jobs as long as you are within the workflow usage limits. For more
     * information, see
     * https://help.github.com/en/github/automating-your-workflow-with-github-actions/workflow-syntax-for-github-actions#usage-limits.
     *
     * @required
     */
    jobs: any;
    /**
     * The name for workflow runs generated from the workflow. GitHub displays the workflow run name in
     * the list of workflow runs on your repository's 'Actions' tab.
     */
    'run-name'?: string;
    /**
     * You can modify the default permissions granted to the GITHUB_TOKEN, adding or removing access as
     * required, so that you only allow the minimum required access.
     */
    permissions?:
        | 'read-all'
        | 'write-all'
        | {
              actions?: 'read' | 'write' | 'none';
              'artifact-metadata'?: 'read' | 'write' | 'none';
              attestations?: 'read' | 'write' | 'none';
              checks?: 'read' | 'write' | 'none';
              'code-quality'?: 'read' | 'write' | 'none';
              contents?: 'read' | 'write' | 'none';
              deployments?: 'read' | 'write' | 'none';
              discussions?: 'read' | 'write' | 'none';
              'id-token'?: 'write' | 'none';
              issues?: 'read' | 'write' | 'none';
              models?: 'read' | 'none';
              packages?: 'read' | 'write' | 'none';
              pages?: 'read' | 'write' | 'none';
              'pull-requests'?: 'read' | 'write' | 'none';
              'repository-projects'?: 'read' | 'write' | 'none';
              'security-events'?: 'read' | 'write' | 'none';
              statuses?: 'read' | 'write' | 'none';
              'vulnerability-alerts'?: 'read' | 'none';
              'copilot-requests'?: 'write';
          };
}
