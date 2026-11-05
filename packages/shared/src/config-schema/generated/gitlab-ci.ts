// Generated from the vendored vendor workflow schema — do not edit.
// Run `yarn config:generate` to refresh.

export interface GitLabCi {
    spec?: {
        /** @allowExtraKeys true */
        inputs?: any;
        include?: Array<
            | { local: string }
            | { project: string; ref?: string; file: string | Array<string> }
            | { remote: string; integrity?: string; cache?: boolean | string }
        >;
        component?: Array<'name' | 'sha' | 'version' | 'reference'>;
        description?: string;
    };
    image?:
        | string
        | {
              name: string;
              entrypoint?: Array<unknown>;
              docker?: { platform?: string; user?: string };
              kubernetes?: { user?: string | number };
              pull_policy?:
                  | 'always'
                  | 'never'
                  | 'if-not-present'
                  | Array<'always' | 'never' | 'if-not-present'>;
          };
    services?: Array<
        | string
        | {
              name: string;
              entrypoint?: Array<string>;
              docker?: { platform?: string; user?: string };
              kubernetes?: { user?: string | number };
              pull_policy?:
                  | 'always'
                  | 'never'
                  | 'if-not-present'
                  | Array<'always' | 'never' | 'if-not-present'>;
              command?: string | Array<string | Array<string>>;
              alias?: string;
              variables?: {};
          }
    >;
    before_script?: string | Array<string | Array<string>>;
    after_script?: string | Array<string | Array<string>>;
    /** @allowExtraKeys true */
    variables?: any;
    cache?:
        | {
              key?:
                  | string
                  | { files?: Array<string>; files_commits?: Array<string>; prefix?: string };
              paths?: Array<string>;
              policy?: string;
              unprotect?: boolean;
              untracked?: boolean;
              when?: 'on_success' | 'on_failure' | 'always';
              fallback_keys?: Array<string>;
          }
        | Array<{
              key?:
                  | string
                  | { files?: Array<string>; files_commits?: Array<string>; prefix?: string };
              paths?: Array<string>;
              policy?: string;
              unprotect?: boolean;
              untracked?: boolean;
              when?: 'on_success' | 'on_failure' | 'always';
              fallback_keys?: Array<string>;
          }>;
    '!reference'?: Array<string>;
    default?: {
        after_script?: string | Array<string | Array<string>>;
        artifacts?: {
            paths?: Array<string>;
            exclude?: Array<string>;
            expose_as?: string;
            name?: string;
            untracked?: boolean;
            when?: 'on_success' | 'on_failure' | 'always';
            access?: 'none' | 'developer' | 'maintainer' | 'all';
            public?: boolean;
            expire_in?: string;
            reports?: {
                accessibility?: string;
                annotations?: string;
                api_fuzzing?: string | Array<string>;
                junit?: string | Array<string>;
                browser_performance?: string;
                coverage_report?: {
                    coverage_format?: 'cobertura' | 'jacoco';
                    path?: string;
                } | null;
                coverage_fuzzing?: string | Array<string>;
                codequality?: string | Array<string>;
                dotenv?: string | Array<string>;
                lsif?: string | Array<string>;
                sast?: string | Array<string>;
                dependency_scanning?: string | Array<string>;
                container_scanning?: string | Array<string>;
                dast?: string | Array<string>;
                license_management?: string | Array<string>;
                license_scanning?: string | Array<string>;
                requirements?: string | Array<string>;
                secret_detection?: string | Array<string>;
                metrics?: string | Array<string>;
                terraform?: string | Array<string>;
                cyclonedx?: string | Array<string>;
                sarif?: string | Array<string>;
                load_performance?: string | Array<string>;
                repository_xray?: string | Array<string>;
            };
        } | null;
        before_script?: string | Array<string | Array<string>>;
        hooks?: {
            pre_get_sources_script?: string | Array<string | Array<string>>;
        };
        cache?:
            | {
                  key?:
                      | string
                      | { files?: Array<string>; files_commits?: Array<string>; prefix?: string };
                  paths?: Array<string>;
                  policy?: string;
                  unprotect?: boolean;
                  untracked?: boolean;
                  when?: 'on_success' | 'on_failure' | 'always';
                  fallback_keys?: Array<string>;
              }
            | Array<{
                  key?:
                      | string
                      | { files?: Array<string>; files_commits?: Array<string>; prefix?: string };
                  paths?: Array<string>;
                  policy?: string;
                  unprotect?: boolean;
                  untracked?: boolean;
                  when?: 'on_success' | 'on_failure' | 'always';
                  fallback_keys?: Array<string>;
              }>;
        image?:
            | string
            | {
                  name: string;
                  entrypoint?: Array<unknown>;
                  docker?: { platform?: string; user?: string };
                  kubernetes?: { user?: string | number };
                  pull_policy?:
                      | 'always'
                      | 'never'
                      | 'if-not-present'
                      | Array<'always' | 'never' | 'if-not-present'>;
              };
        /** @default false */
        interruptible?: boolean;
        /** @allowExtraKeys true */
        id_tokens?: any;
        identity?: 'google_cloud';
        retry?:
            | number
            | {
                  max?: number;
                  when?:
                      | 'always'
                      | 'unknown_failure'
                      | 'script_failure'
                      | 'api_failure'
                      | 'stuck_or_timeout_failure'
                      | 'stuck_pending_with_matching_runners'
                      | 'stuck_pending_no_matching_runners'
                      | 'no_updates_running'
                      | 'no_updates_canceling'
                      | 'runner_system_failure'
                      | 'runner_configuration_error'
                      | 'runner_external_dependency_failure'
                      | 'runner_interrupted'
                      | 'runner_unsupported'
                      | 'stale_schedule'
                      | 'job_execution_timeout'
                      | 'server_timeout_running'
                      | 'server_timeout_canceling'
                      | 'archived_failure'
                      | 'unmet_prerequisites'
                      | 'scheduler_failure'
                      | 'data_integrity_failure'
                      | Array<
                            | 'always'
                            | 'unknown_failure'
                            | 'script_failure'
                            | 'api_failure'
                            | 'stuck_or_timeout_failure'
                            | 'stuck_pending_with_matching_runners'
                            | 'stuck_pending_no_matching_runners'
                            | 'no_updates_running'
                            | 'no_updates_canceling'
                            | 'runner_system_failure'
                            | 'runner_configuration_error'
                            | 'runner_external_dependency_failure'
                            | 'runner_interrupted'
                            | 'runner_unsupported'
                            | 'stale_schedule'
                            | 'job_execution_timeout'
                            | 'server_timeout_running'
                            | 'server_timeout_canceling'
                            | 'archived_failure'
                            | 'unmet_prerequisites'
                            | 'scheduler_failure'
                            | 'data_integrity_failure'
                        >;
                  exit_codes?: Array<number> | number;
              };
        services?: Array<
            | string
            | {
                  name: string;
                  entrypoint?: Array<string>;
                  docker?: { platform?: string; user?: string };
                  kubernetes?: { user?: string | number };
                  pull_policy?:
                      | 'always'
                      | 'never'
                      | 'if-not-present'
                      | Array<'always' | 'never' | 'if-not-present'>;
                  command?: string | Array<string | Array<string>>;
                  alias?: string;
                  variables?: {};
              }
        >;
        tags?: Array<string | Array<string>>;
        timeout?: string;
        '!reference'?: Array<string>;
    };
    /** @default ['build', 'test', 'deploy'] */
    stages?: Array<string | Array<string>>;
    include?:
        | unknown
        | {
              local: string;
              rules?: Array<
                  | {
                        changes?: unknown | Array<string>;
                        exists?: Array<string> | unknown | unknown;
                        when?: 'never' | 'always' | null;
                    }
                  | string
                  | Array<string>
              > | null;
              inputs?: {};
          }
        | {
              project: string;
              ref?: string;
              file: string | Array<string>;
              rules?: Array<
                  | {
                        changes?: unknown | Array<string>;
                        exists?: Array<string> | unknown | unknown;
                        when?: 'never' | 'always' | null;
                    }
                  | string
                  | Array<string>
              > | null;
              inputs?: {};
          }
        | {
              template: string;
              rules?: Array<
                  | {
                        changes?: unknown | Array<string>;
                        exists?: Array<string> | unknown | unknown;
                        when?: 'never' | 'always' | null;
                    }
                  | string
                  | Array<string>
              > | null;
              inputs?: {};
          }
        | {
              component: string;
              rules?: Array<
                  | {
                        changes?: unknown | Array<string>;
                        exists?: Array<string> | unknown | unknown;
                        when?: 'never' | 'always' | null;
                    }
                  | string
                  | Array<string>
              > | null;
              inputs?: {};
          }
        | {
              remote: string;
              integrity?: string;
              cache?: boolean | string;
              rules?: Array<
                  | {
                        changes?: unknown | Array<string>;
                        exists?: Array<string> | unknown | unknown;
                        when?: 'never' | 'always' | null;
                    }
                  | string
                  | Array<string>
              > | null;
              inputs?: {};
          }
        | Array<
              | unknown
              | {
                    local: string;
                    rules?: Array<
                        | {
                              changes?: unknown | Array<string>;
                              exists?: Array<string> | unknown | unknown;
                              when?: 'never' | 'always' | null;
                          }
                        | string
                        | Array<string>
                    > | null;
                    inputs?: {};
                }
              | {
                    project: string;
                    ref?: string;
                    file: string | Array<string>;
                    rules?: Array<
                        | {
                              changes?: unknown | Array<string>;
                              exists?: Array<string> | unknown | unknown;
                              when?: 'never' | 'always' | null;
                          }
                        | string
                        | Array<string>
                    > | null;
                    inputs?: {};
                }
              | {
                    template: string;
                    rules?: Array<
                        | {
                              changes?: unknown | Array<string>;
                              exists?: Array<string> | unknown | unknown;
                              when?: 'never' | 'always' | null;
                          }
                        | string
                        | Array<string>
                    > | null;
                    inputs?: {};
                }
              | {
                    component: string;
                    rules?: Array<
                        | {
                              changes?: unknown | Array<string>;
                              exists?: Array<string> | unknown | unknown;
                              when?: 'never' | 'always' | null;
                          }
                        | string
                        | Array<string>
                    > | null;
                    inputs?: {};
                }
              | {
                    remote: string;
                    integrity?: string;
                    cache?: boolean | string;
                    rules?: Array<
                        | {
                              changes?: unknown | Array<string>;
                              exists?: Array<string> | unknown | unknown;
                              when?: 'never' | 'always' | null;
                          }
                        | string
                        | Array<string>
                    > | null;
                    inputs?: {};
                }
          >;
    pages?: unknown;
    /** @allowExtraKeys true */
    workflow?: {
        name?: string;
        /** Define the rules for when pipeline should be automatically cancelled. */
        auto_cancel?: {
            /** @default 'none' */
            on_job_failure?: 'none' | 'all';
            on_new_commit?: 'conservative' | 'interruptible' | 'none';
        };
        rules?: Array<{} | Array<string>>;
    };
    [key: string]: unknown;
}
