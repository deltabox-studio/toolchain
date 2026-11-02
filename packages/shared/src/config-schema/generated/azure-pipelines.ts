// Generated from the vendored vendor workflow schema — do not edit.
// Run `yarn config:generate` to refresh.

export type AzurePipelines =
    | {
          stages: Array<
              | {
                    stage?: string;
                    group?: string;
                    displayName?: string;
                    pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                    dependsOn?: string | Array<string>;
                    condition?: string;
                    variables?: {} | Array<{ name?: string; value?: string; readonly?: string | string | string | string | string | string | string | string } | { group?: string } | { template?: string; parameters?: {} }>;
                    jobs?: Array<
                        | {
                              job?: string;
                              displayName?: string;
                              dependsOn?: string | Array<string>;
                              condition?: string;
                              continueOnError?: string;
                              timeoutInMinutes?: string;
                              cancelTimeoutInMinutes?: string;
                              variables?: {} | Array<{ name?: string; value?: string; readonly?: string | string | string | string | string | string | string | string } | { group?: string } | { template?: string; parameters?: {} }>;
                              strategy?: { matrix?: {} | string; maxParallel?: string } | { parallel?: string };
                              pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                              container?:
                                  | string
                                  | { alias?: string }
                                  | {
                                        endpoint?: string;
                                        env?: {};
                                        image: string;
                                        mapDockerSocket?: string | string | string | string | string | string | string | string;
                                        options?: string;
                                        ports?: Array<string>;
                                        volumes?: Array<string>;
                                        mountReadOnly?: {
                                            work?: string | string | string | string | string | string | string | string;
                                            externals?: string | string | string | string | string | string | string | string;
                                            tools?: string | string | string | string | string | string | string | string;
                                            tasks?: string | string | string | string | string | string | string | string;
                                        };
                                    };
                              services?: {};
                              workspace?: { clean?: string };
                              uses?: { repositories?: Array<string>; pools?: Array<string> };
                              steps?: Array<
                                  | unknown
                                  | {
                                        script: string;
                                        failOnStderr?: string;
                                        workingDirectory?: string;
                                        condition?: string;
                                        continueOnError?: string | string | string | string | string | string | string | string;
                                        displayName?: string;
                                        target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                        enabled?: string | string | string | string | string | string | string | string;
                                        env?: {};
                                        name?: string;
                                        timeoutInMinutes?: string;
                                        retryCountOnTaskFailure?: string;
                                    }
                                  | {
                                        powershell: string;
                                        errorActionPreference?: string;
                                        failOnStderr?: string;
                                        ignoreLASTEXITCODE?: string;
                                        workingDirectory?: string;
                                        condition?: string;
                                        continueOnError?: string | string | string | string | string | string | string | string;
                                        displayName?: string;
                                        target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                        enabled?: string | string | string | string | string | string | string | string;
                                        env?: {};
                                        name?: string;
                                        timeoutInMinutes?: string;
                                        retryCountOnTaskFailure?: string;
                                    }
                                  | {
                                        pwsh: string;
                                        errorActionPreference?: string;
                                        failOnStderr?: string;
                                        ignoreLASTEXITCODE?: string;
                                        workingDirectory?: string;
                                        condition?: string;
                                        continueOnError?: string | string | string | string | string | string | string | string;
                                        displayName?: string;
                                        target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                        enabled?: string | string | string | string | string | string | string | string;
                                        env?: {};
                                        name?: string;
                                        timeoutInMinutes?: string;
                                        retryCountOnTaskFailure?: string;
                                    }
                                  | {
                                        bash: string;
                                        failOnStderr?: string;
                                        workingDirectory?: string;
                                        condition?: string;
                                        continueOnError?: string | string | string | string | string | string | string | string;
                                        displayName?: string;
                                        target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                        enabled?: string | string | string | string | string | string | string | string;
                                        env?: {};
                                        name?: string;
                                        timeoutInMinutes?: string;
                                        retryCountOnTaskFailure?: string;
                                    }
                                  | {
                                        checkout?: string;
                                        clean?: string;
                                        fetchDepth?: string;
                                        fetchFilter?: string;
                                        fetchTags?: string;
                                        lfs?: string;
                                        persistCredentials?: string;
                                        submodules?: string;
                                        path?: string;
                                        sparseCheckoutDirectories?: string;
                                        sparseCheckoutPatterns?: string;
                                        workspaceRepo?: string;
                                        condition?: string;
                                        continueOnError?: string | string | string | string | string | string | string | string;
                                        displayName?: string;
                                        target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                        enabled?: string | string | string | string | string | string | string | string;
                                        env?: {};
                                        name?: string;
                                        timeoutInMinutes?: string;
                                        retryCountOnTaskFailure?: string;
                                    }
                                  | {
                                        download: string;
                                        artifact?: string;
                                        patterns?: string;
                                        condition?: string;
                                        continueOnError?: string | string | string | string | string | string | string | string;
                                        displayName?: string;
                                        target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                        enabled?: string | string | string | string | string | string | string | string;
                                        env?: {};
                                        name?: string;
                                        timeoutInMinutes?: string;
                                        retryCountOnTaskFailure?: string;
                                    }
                                  | {
                                        downloadBuild?: string;
                                        artifact?: string;
                                        path?: string;
                                        patterns?: string;
                                        inputs?: {};
                                        condition?: string;
                                        continueOnError?: string | string | string | string | string | string | string | string;
                                        displayName?: string;
                                        target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                        enabled?: string | string | string | string | string | string | string | string;
                                        env?: {};
                                        name?: string;
                                        timeoutInMinutes?: string;
                                        retryCountOnTaskFailure?: string;
                                    }
                                  | {
                                        getPackage?: string;
                                        path?: string;
                                        condition?: string;
                                        continueOnError?: string | string | string | string | string | string | string | string;
                                        displayName?: string;
                                        target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                        enabled?: string | string | string | string | string | string | string | string;
                                        env?: {};
                                        name?: string;
                                        timeoutInMinutes?: string;
                                        retryCountOnTaskFailure?: string;
                                    }
                                  | {
                                        upload?: string;
                                        artifact?: string;
                                        condition?: string;
                                        continueOnError?: string | string | string | string | string | string | string | string;
                                        displayName?: string;
                                        target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                        enabled?: string | string | string | string | string | string | string | string;
                                        env?: {};
                                        name?: string;
                                        timeoutInMinutes?: string;
                                        retryCountOnTaskFailure?: string;
                                    }
                                  | {
                                        publish?: string;
                                        artifact?: string;
                                        condition?: string;
                                        continueOnError?: string | string | string | string | string | string | string | string;
                                        displayName?: string;
                                        target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                        enabled?: string | string | string | string | string | string | string | string;
                                        env?: {};
                                        name?: string;
                                        timeoutInMinutes?: string;
                                        retryCountOnTaskFailure?: string;
                                    }
                                  | { template?: string; parameters?: {} }
                                  | {
                                        reviewApp?: string;
                                        condition?: string;
                                        continueOnError?: string | string | string | string | string | string | string | string;
                                        displayName?: string;
                                        target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                        enabled?: string | string | string | string | string | string | string | string;
                                        env?: {};
                                        name?: string;
                                        timeoutInMinutes?: string;
                                        retryCountOnTaskFailure?: string;
                                    }
                              >;
                              templateContext?: {};
                          }
                        | {
                              deployment?: string;
                              displayName?: string;
                              dependsOn?: string | Array<string>;
                              condition?: string;
                              continueOnError?: string;
                              timeoutInMinutes?: string;
                              cancelTimeoutInMinutes?: string;
                              variables?: {} | Array<{ name?: string; value?: string; readonly?: string | string | string | string | string | string | string | string } | { group?: string } | { template?: string; parameters?: {} }>;
                              pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                              environment?: string | { name?: string; resourceName?: string; resourceId?: string; resourceType?: string; tags?: string };
                              strategy?:
                                  | {
                                        runOnce?: {
                                            preDeploy?: {
                                                steps?: Array<
                                                    | unknown
                                                    | {
                                                          script: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          powershell: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          pwsh: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          bash: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          checkout?: string;
                                                          clean?: string;
                                                          fetchDepth?: string;
                                                          fetchFilter?: string;
                                                          fetchTags?: string;
                                                          lfs?: string;
                                                          persistCredentials?: string;
                                                          submodules?: string;
                                                          path?: string;
                                                          sparseCheckoutDirectories?: string;
                                                          sparseCheckoutPatterns?: string;
                                                          workspaceRepo?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          download: string;
                                                          artifact?: string;
                                                          patterns?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          downloadBuild?: string;
                                                          artifact?: string;
                                                          path?: string;
                                                          patterns?: string;
                                                          inputs?: {};
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          getPackage?: string;
                                                          path?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          upload?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          publish?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | { template?: string; parameters?: {} }
                                                    | {
                                                          reviewApp?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                >;
                                                pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                            };
                                            deploy?: {
                                                steps?: Array<
                                                    | unknown
                                                    | {
                                                          script: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          powershell: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          pwsh: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          bash: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          checkout?: string;
                                                          clean?: string;
                                                          fetchDepth?: string;
                                                          fetchFilter?: string;
                                                          fetchTags?: string;
                                                          lfs?: string;
                                                          persistCredentials?: string;
                                                          submodules?: string;
                                                          path?: string;
                                                          sparseCheckoutDirectories?: string;
                                                          sparseCheckoutPatterns?: string;
                                                          workspaceRepo?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          download: string;
                                                          artifact?: string;
                                                          patterns?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          downloadBuild?: string;
                                                          artifact?: string;
                                                          path?: string;
                                                          patterns?: string;
                                                          inputs?: {};
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          getPackage?: string;
                                                          path?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          upload?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          publish?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | { template?: string; parameters?: {} }
                                                    | {
                                                          reviewApp?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                >;
                                                pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                            };
                                            routeTraffic?: {
                                                steps?: Array<
                                                    | unknown
                                                    | {
                                                          script: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          powershell: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          pwsh: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          bash: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          checkout?: string;
                                                          clean?: string;
                                                          fetchDepth?: string;
                                                          fetchFilter?: string;
                                                          fetchTags?: string;
                                                          lfs?: string;
                                                          persistCredentials?: string;
                                                          submodules?: string;
                                                          path?: string;
                                                          sparseCheckoutDirectories?: string;
                                                          sparseCheckoutPatterns?: string;
                                                          workspaceRepo?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          download: string;
                                                          artifact?: string;
                                                          patterns?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          downloadBuild?: string;
                                                          artifact?: string;
                                                          path?: string;
                                                          patterns?: string;
                                                          inputs?: {};
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          getPackage?: string;
                                                          path?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          upload?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          publish?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | { template?: string; parameters?: {} }
                                                    | {
                                                          reviewApp?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                >;
                                                pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                            };
                                            postRouteTraffic?: {
                                                steps?: Array<
                                                    | unknown
                                                    | {
                                                          script: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          powershell: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          pwsh: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          bash: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          checkout?: string;
                                                          clean?: string;
                                                          fetchDepth?: string;
                                                          fetchFilter?: string;
                                                          fetchTags?: string;
                                                          lfs?: string;
                                                          persistCredentials?: string;
                                                          submodules?: string;
                                                          path?: string;
                                                          sparseCheckoutDirectories?: string;
                                                          sparseCheckoutPatterns?: string;
                                                          workspaceRepo?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          download: string;
                                                          artifact?: string;
                                                          patterns?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          downloadBuild?: string;
                                                          artifact?: string;
                                                          path?: string;
                                                          patterns?: string;
                                                          inputs?: {};
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          getPackage?: string;
                                                          path?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          upload?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          publish?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | { template?: string; parameters?: {} }
                                                    | {
                                                          reviewApp?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                >;
                                                pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                            };
                                            on?: {
                                                failure?: {
                                                    steps?: Array<
                                                        | unknown
                                                        | {
                                                              script: string;
                                                              failOnStderr?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              powershell: string;
                                                              errorActionPreference?: string;
                                                              failOnStderr?: string;
                                                              ignoreLASTEXITCODE?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              pwsh: string;
                                                              errorActionPreference?: string;
                                                              failOnStderr?: string;
                                                              ignoreLASTEXITCODE?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              bash: string;
                                                              failOnStderr?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              checkout?: string;
                                                              clean?: string;
                                                              fetchDepth?: string;
                                                              fetchFilter?: string;
                                                              fetchTags?: string;
                                                              lfs?: string;
                                                              persistCredentials?: string;
                                                              submodules?: string;
                                                              path?: string;
                                                              sparseCheckoutDirectories?: string;
                                                              sparseCheckoutPatterns?: string;
                                                              workspaceRepo?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              download: string;
                                                              artifact?: string;
                                                              patterns?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              downloadBuild?: string;
                                                              artifact?: string;
                                                              path?: string;
                                                              patterns?: string;
                                                              inputs?: {};
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              getPackage?: string;
                                                              path?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              upload?: string;
                                                              artifact?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              publish?: string;
                                                              artifact?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | { template?: string; parameters?: {} }
                                                        | {
                                                              reviewApp?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                    >;
                                                    pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                                };
                                                success?: {
                                                    steps?: Array<
                                                        | unknown
                                                        | {
                                                              script: string;
                                                              failOnStderr?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              powershell: string;
                                                              errorActionPreference?: string;
                                                              failOnStderr?: string;
                                                              ignoreLASTEXITCODE?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              pwsh: string;
                                                              errorActionPreference?: string;
                                                              failOnStderr?: string;
                                                              ignoreLASTEXITCODE?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              bash: string;
                                                              failOnStderr?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              checkout?: string;
                                                              clean?: string;
                                                              fetchDepth?: string;
                                                              fetchFilter?: string;
                                                              fetchTags?: string;
                                                              lfs?: string;
                                                              persistCredentials?: string;
                                                              submodules?: string;
                                                              path?: string;
                                                              sparseCheckoutDirectories?: string;
                                                              sparseCheckoutPatterns?: string;
                                                              workspaceRepo?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              download: string;
                                                              artifact?: string;
                                                              patterns?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              downloadBuild?: string;
                                                              artifact?: string;
                                                              path?: string;
                                                              patterns?: string;
                                                              inputs?: {};
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              getPackage?: string;
                                                              path?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              upload?: string;
                                                              artifact?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              publish?: string;
                                                              artifact?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | { template?: string; parameters?: {} }
                                                        | {
                                                              reviewApp?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                    >;
                                                    pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                                };
                                            };
                                        };
                                    }
                                  | {
                                        rolling?: {
                                            maxParallel?: string;
                                            preDeploy?: {
                                                steps?: Array<
                                                    | unknown
                                                    | {
                                                          script: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          powershell: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          pwsh: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          bash: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          checkout?: string;
                                                          clean?: string;
                                                          fetchDepth?: string;
                                                          fetchFilter?: string;
                                                          fetchTags?: string;
                                                          lfs?: string;
                                                          persistCredentials?: string;
                                                          submodules?: string;
                                                          path?: string;
                                                          sparseCheckoutDirectories?: string;
                                                          sparseCheckoutPatterns?: string;
                                                          workspaceRepo?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          download: string;
                                                          artifact?: string;
                                                          patterns?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          downloadBuild?: string;
                                                          artifact?: string;
                                                          path?: string;
                                                          patterns?: string;
                                                          inputs?: {};
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          getPackage?: string;
                                                          path?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          upload?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          publish?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | { template?: string; parameters?: {} }
                                                    | {
                                                          reviewApp?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                >;
                                                pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                            };
                                            deploy?: {
                                                steps?: Array<
                                                    | unknown
                                                    | {
                                                          script: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          powershell: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          pwsh: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          bash: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          checkout?: string;
                                                          clean?: string;
                                                          fetchDepth?: string;
                                                          fetchFilter?: string;
                                                          fetchTags?: string;
                                                          lfs?: string;
                                                          persistCredentials?: string;
                                                          submodules?: string;
                                                          path?: string;
                                                          sparseCheckoutDirectories?: string;
                                                          sparseCheckoutPatterns?: string;
                                                          workspaceRepo?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          download: string;
                                                          artifact?: string;
                                                          patterns?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          downloadBuild?: string;
                                                          artifact?: string;
                                                          path?: string;
                                                          patterns?: string;
                                                          inputs?: {};
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          getPackage?: string;
                                                          path?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          upload?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          publish?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | { template?: string; parameters?: {} }
                                                    | {
                                                          reviewApp?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                >;
                                                pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                            };
                                            routeTraffic?: {
                                                steps?: Array<
                                                    | unknown
                                                    | {
                                                          script: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          powershell: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          pwsh: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          bash: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          checkout?: string;
                                                          clean?: string;
                                                          fetchDepth?: string;
                                                          fetchFilter?: string;
                                                          fetchTags?: string;
                                                          lfs?: string;
                                                          persistCredentials?: string;
                                                          submodules?: string;
                                                          path?: string;
                                                          sparseCheckoutDirectories?: string;
                                                          sparseCheckoutPatterns?: string;
                                                          workspaceRepo?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          download: string;
                                                          artifact?: string;
                                                          patterns?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          downloadBuild?: string;
                                                          artifact?: string;
                                                          path?: string;
                                                          patterns?: string;
                                                          inputs?: {};
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          getPackage?: string;
                                                          path?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          upload?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          publish?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | { template?: string; parameters?: {} }
                                                    | {
                                                          reviewApp?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                >;
                                                pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                            };
                                            postRouteTraffic?: {
                                                steps?: Array<
                                                    | unknown
                                                    | {
                                                          script: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          powershell: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          pwsh: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          bash: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          checkout?: string;
                                                          clean?: string;
                                                          fetchDepth?: string;
                                                          fetchFilter?: string;
                                                          fetchTags?: string;
                                                          lfs?: string;
                                                          persistCredentials?: string;
                                                          submodules?: string;
                                                          path?: string;
                                                          sparseCheckoutDirectories?: string;
                                                          sparseCheckoutPatterns?: string;
                                                          workspaceRepo?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          download: string;
                                                          artifact?: string;
                                                          patterns?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          downloadBuild?: string;
                                                          artifact?: string;
                                                          path?: string;
                                                          patterns?: string;
                                                          inputs?: {};
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          getPackage?: string;
                                                          path?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          upload?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          publish?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | { template?: string; parameters?: {} }
                                                    | {
                                                          reviewApp?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                >;
                                                pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                            };
                                            on?: {
                                                failure?: {
                                                    steps?: Array<
                                                        | unknown
                                                        | {
                                                              script: string;
                                                              failOnStderr?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              powershell: string;
                                                              errorActionPreference?: string;
                                                              failOnStderr?: string;
                                                              ignoreLASTEXITCODE?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              pwsh: string;
                                                              errorActionPreference?: string;
                                                              failOnStderr?: string;
                                                              ignoreLASTEXITCODE?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              bash: string;
                                                              failOnStderr?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              checkout?: string;
                                                              clean?: string;
                                                              fetchDepth?: string;
                                                              fetchFilter?: string;
                                                              fetchTags?: string;
                                                              lfs?: string;
                                                              persistCredentials?: string;
                                                              submodules?: string;
                                                              path?: string;
                                                              sparseCheckoutDirectories?: string;
                                                              sparseCheckoutPatterns?: string;
                                                              workspaceRepo?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              download: string;
                                                              artifact?: string;
                                                              patterns?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              downloadBuild?: string;
                                                              artifact?: string;
                                                              path?: string;
                                                              patterns?: string;
                                                              inputs?: {};
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              getPackage?: string;
                                                              path?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              upload?: string;
                                                              artifact?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              publish?: string;
                                                              artifact?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | { template?: string; parameters?: {} }
                                                        | {
                                                              reviewApp?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                    >;
                                                    pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                                };
                                                success?: {
                                                    steps?: Array<
                                                        | unknown
                                                        | {
                                                              script: string;
                                                              failOnStderr?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              powershell: string;
                                                              errorActionPreference?: string;
                                                              failOnStderr?: string;
                                                              ignoreLASTEXITCODE?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              pwsh: string;
                                                              errorActionPreference?: string;
                                                              failOnStderr?: string;
                                                              ignoreLASTEXITCODE?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              bash: string;
                                                              failOnStderr?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              checkout?: string;
                                                              clean?: string;
                                                              fetchDepth?: string;
                                                              fetchFilter?: string;
                                                              fetchTags?: string;
                                                              lfs?: string;
                                                              persistCredentials?: string;
                                                              submodules?: string;
                                                              path?: string;
                                                              sparseCheckoutDirectories?: string;
                                                              sparseCheckoutPatterns?: string;
                                                              workspaceRepo?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              download: string;
                                                              artifact?: string;
                                                              patterns?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              downloadBuild?: string;
                                                              artifact?: string;
                                                              path?: string;
                                                              patterns?: string;
                                                              inputs?: {};
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              getPackage?: string;
                                                              path?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              upload?: string;
                                                              artifact?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              publish?: string;
                                                              artifact?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | { template?: string; parameters?: {} }
                                                        | {
                                                              reviewApp?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                    >;
                                                    pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                                };
                                            };
                                        };
                                    }
                                  | {
                                        canary?: {
                                            increments?: Array<string>;
                                            preDeploy?: {
                                                steps?: Array<
                                                    | unknown
                                                    | {
                                                          script: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          powershell: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          pwsh: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          bash: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          checkout?: string;
                                                          clean?: string;
                                                          fetchDepth?: string;
                                                          fetchFilter?: string;
                                                          fetchTags?: string;
                                                          lfs?: string;
                                                          persistCredentials?: string;
                                                          submodules?: string;
                                                          path?: string;
                                                          sparseCheckoutDirectories?: string;
                                                          sparseCheckoutPatterns?: string;
                                                          workspaceRepo?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          download: string;
                                                          artifact?: string;
                                                          patterns?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          downloadBuild?: string;
                                                          artifact?: string;
                                                          path?: string;
                                                          patterns?: string;
                                                          inputs?: {};
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          getPackage?: string;
                                                          path?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          upload?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          publish?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | { template?: string; parameters?: {} }
                                                    | {
                                                          reviewApp?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                >;
                                                pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                            };
                                            deploy?: {
                                                steps?: Array<
                                                    | unknown
                                                    | {
                                                          script: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          powershell: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          pwsh: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          bash: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          checkout?: string;
                                                          clean?: string;
                                                          fetchDepth?: string;
                                                          fetchFilter?: string;
                                                          fetchTags?: string;
                                                          lfs?: string;
                                                          persistCredentials?: string;
                                                          submodules?: string;
                                                          path?: string;
                                                          sparseCheckoutDirectories?: string;
                                                          sparseCheckoutPatterns?: string;
                                                          workspaceRepo?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          download: string;
                                                          artifact?: string;
                                                          patterns?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          downloadBuild?: string;
                                                          artifact?: string;
                                                          path?: string;
                                                          patterns?: string;
                                                          inputs?: {};
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          getPackage?: string;
                                                          path?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          upload?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          publish?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | { template?: string; parameters?: {} }
                                                    | {
                                                          reviewApp?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                >;
                                                pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                            };
                                            routeTraffic?: {
                                                steps?: Array<
                                                    | unknown
                                                    | {
                                                          script: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          powershell: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          pwsh: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          bash: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          checkout?: string;
                                                          clean?: string;
                                                          fetchDepth?: string;
                                                          fetchFilter?: string;
                                                          fetchTags?: string;
                                                          lfs?: string;
                                                          persistCredentials?: string;
                                                          submodules?: string;
                                                          path?: string;
                                                          sparseCheckoutDirectories?: string;
                                                          sparseCheckoutPatterns?: string;
                                                          workspaceRepo?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          download: string;
                                                          artifact?: string;
                                                          patterns?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          downloadBuild?: string;
                                                          artifact?: string;
                                                          path?: string;
                                                          patterns?: string;
                                                          inputs?: {};
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          getPackage?: string;
                                                          path?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          upload?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          publish?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | { template?: string; parameters?: {} }
                                                    | {
                                                          reviewApp?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                >;
                                                pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                            };
                                            postRouteTraffic?: {
                                                steps?: Array<
                                                    | unknown
                                                    | {
                                                          script: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          powershell: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          pwsh: string;
                                                          errorActionPreference?: string;
                                                          failOnStderr?: string;
                                                          ignoreLASTEXITCODE?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          bash: string;
                                                          failOnStderr?: string;
                                                          workingDirectory?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          checkout?: string;
                                                          clean?: string;
                                                          fetchDepth?: string;
                                                          fetchFilter?: string;
                                                          fetchTags?: string;
                                                          lfs?: string;
                                                          persistCredentials?: string;
                                                          submodules?: string;
                                                          path?: string;
                                                          sparseCheckoutDirectories?: string;
                                                          sparseCheckoutPatterns?: string;
                                                          workspaceRepo?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          download: string;
                                                          artifact?: string;
                                                          patterns?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          downloadBuild?: string;
                                                          artifact?: string;
                                                          path?: string;
                                                          patterns?: string;
                                                          inputs?: {};
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          getPackage?: string;
                                                          path?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          upload?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | {
                                                          publish?: string;
                                                          artifact?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                    | { template?: string; parameters?: {} }
                                                    | {
                                                          reviewApp?: string;
                                                          condition?: string;
                                                          continueOnError?: string | string | string | string | string | string | string | string;
                                                          displayName?: string;
                                                          target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                          enabled?: string | string | string | string | string | string | string | string;
                                                          env?: {};
                                                          name?: string;
                                                          timeoutInMinutes?: string;
                                                          retryCountOnTaskFailure?: string;
                                                      }
                                                >;
                                                pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                            };
                                            on?: {
                                                failure?: {
                                                    steps?: Array<
                                                        | unknown
                                                        | {
                                                              script: string;
                                                              failOnStderr?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              powershell: string;
                                                              errorActionPreference?: string;
                                                              failOnStderr?: string;
                                                              ignoreLASTEXITCODE?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              pwsh: string;
                                                              errorActionPreference?: string;
                                                              failOnStderr?: string;
                                                              ignoreLASTEXITCODE?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              bash: string;
                                                              failOnStderr?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              checkout?: string;
                                                              clean?: string;
                                                              fetchDepth?: string;
                                                              fetchFilter?: string;
                                                              fetchTags?: string;
                                                              lfs?: string;
                                                              persistCredentials?: string;
                                                              submodules?: string;
                                                              path?: string;
                                                              sparseCheckoutDirectories?: string;
                                                              sparseCheckoutPatterns?: string;
                                                              workspaceRepo?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              download: string;
                                                              artifact?: string;
                                                              patterns?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              downloadBuild?: string;
                                                              artifact?: string;
                                                              path?: string;
                                                              patterns?: string;
                                                              inputs?: {};
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              getPackage?: string;
                                                              path?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              upload?: string;
                                                              artifact?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              publish?: string;
                                                              artifact?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | { template?: string; parameters?: {} }
                                                        | {
                                                              reviewApp?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                    >;
                                                    pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                                };
                                                success?: {
                                                    steps?: Array<
                                                        | unknown
                                                        | {
                                                              script: string;
                                                              failOnStderr?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              powershell: string;
                                                              errorActionPreference?: string;
                                                              failOnStderr?: string;
                                                              ignoreLASTEXITCODE?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              pwsh: string;
                                                              errorActionPreference?: string;
                                                              failOnStderr?: string;
                                                              ignoreLASTEXITCODE?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              bash: string;
                                                              failOnStderr?: string;
                                                              workingDirectory?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              checkout?: string;
                                                              clean?: string;
                                                              fetchDepth?: string;
                                                              fetchFilter?: string;
                                                              fetchTags?: string;
                                                              lfs?: string;
                                                              persistCredentials?: string;
                                                              submodules?: string;
                                                              path?: string;
                                                              sparseCheckoutDirectories?: string;
                                                              sparseCheckoutPatterns?: string;
                                                              workspaceRepo?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              download: string;
                                                              artifact?: string;
                                                              patterns?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              downloadBuild?: string;
                                                              artifact?: string;
                                                              path?: string;
                                                              patterns?: string;
                                                              inputs?: {};
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              getPackage?: string;
                                                              path?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              upload?: string;
                                                              artifact?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | {
                                                              publish?: string;
                                                              artifact?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                        | { template?: string; parameters?: {} }
                                                        | {
                                                              reviewApp?: string;
                                                              condition?: string;
                                                              continueOnError?: string | string | string | string | string | string | string | string;
                                                              displayName?: string;
                                                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                              enabled?: string | string | string | string | string | string | string | string;
                                                              env?: {};
                                                              name?: string;
                                                              timeoutInMinutes?: string;
                                                              retryCountOnTaskFailure?: string;
                                                          }
                                                    >;
                                                    pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                                };
                                            };
                                        };
                                    };
                              workspace?: { clean?: string };
                              uses?: { repositories?: Array<string>; pools?: Array<string> };
                              container?:
                                  | string
                                  | { alias?: string }
                                  | {
                                        endpoint?: string;
                                        env?: {};
                                        image: string;
                                        mapDockerSocket?: string | string | string | string | string | string | string | string;
                                        options?: string;
                                        ports?: Array<string>;
                                        volumes?: Array<string>;
                                        mountReadOnly?: {
                                            work?: string | string | string | string | string | string | string | string;
                                            externals?: string | string | string | string | string | string | string | string;
                                            tools?: string | string | string | string | string | string | string | string;
                                            tasks?: string | string | string | string | string | string | string | string;
                                        };
                                    };
                              services?: {};
                              templateContext?: {};
                          }
                        | { template?: string; parameters?: {} }
                    >;
                    lockBehavior?: string | string;
                    trigger?: string | string;
                    isSkippable?: string | string | string | string | string | string | string | string;
                    templateContext?: {};
                    checks?: Array<{ type?: string }>;
                }
              | { template?: string; parameters?: {} }
          >;
          pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
          name?: string;
          appendCommitMessageToRunName?: string | string | string | string | string | string | string | string;
          trigger?:
              | string
              | Array<string>
              | { batch?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> }; paths?: { include?: Array<string>; exclude?: Array<string> }; tags?: { include?: Array<string>; exclude?: Array<string> } };
          parameters?: Array<{
              name?: string;
              displayName?: string;
              type?: string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string;
              default?: string | __schema0 | {};
              values?: Array<string>;
          }>;
          pr?:
              | string
              | Array<string>
              | {
                    autoCancel?: string | string | string | string | string | string | string | string;
                    branches?: { include?: Array<string>; exclude?: Array<string> };
                    paths?: { include?: Array<string>; exclude?: Array<string> };
                    drafts?: string | string | string | string | string | string | string | string;
                };
          schedules?: Array<{ cron?: string; displayName?: string; branches?: { include?: Array<string>; exclude?: Array<string> }; batch?: string | string | string | string | string | string | string | string; always?: string | string | string | string | string | string | string | string }>;
          resources?:
              | {
                    builds?: Array<{ build: string; type: string; connection: string; source: string; version?: string; branch?: string; trigger?: string | string }>;
                    containers?: Array<{
                        container: string;
                        type?: string | string;
                        trigger?: string | string | { enabled?: string | string | string | string | string | string | string | string; tags?: Array<string> | { include?: Array<string>; exclude?: Array<string> } };
                        azureSubscription?: string;
                        resourceGroup?: string;
                        registry?: string;
                        repository?: string;
                        localImage?: string | string | string | string | string | string | string | string;
                        endpoint?: string;
                        env?: {};
                        image: string;
                        mapDockerSocket?: string | string | string | string | string | string | string | string;
                        options?: string;
                        ports?: Array<string>;
                        volumes?: Array<string>;
                        mountReadOnly?: {
                            work?: string | string | string | string | string | string | string | string;
                            externals?: string | string | string | string | string | string | string | string;
                            tools?: string | string | string | string | string | string | string | string;
                            tasks?: string | string | string | string | string | string | string | string;
                        };
                    }>;
                    pipelines?: Array<{
                        pipeline: string;
                        project?: string;
                        source?: string;
                        version?: string;
                        branch?: string;
                        tags?: Array<string>;
                        trigger?: string | string | { enabled?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> } | Array<string>; stages?: Array<string>; tags?: Array<string> };
                    }>;
                    repositories?: Array<{
                        repository: string;
                        endpoint?: string;
                        trigger?:
                            | string
                            | Array<string>
                            | { batch?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> }; paths?: { include?: Array<string>; exclude?: Array<string> }; tags?: { include?: Array<string>; exclude?: Array<string> } };
                        checkoutOptions?: { clean?: string; fetchDepth?: string; fetchTags?: string; lfs?: string; submodules?: string; persistCredentials?: string };
                        name?: string;
                        ref?: string;
                        type?: string;
                    }>;
                    webhooks?: Array<{ webhook: string; connection: string; type?: string; filters?: Array<{ path: string; value: string }> }>;
                    packages?: Array<{ package: string; type: string; connection: string; name: string; version?: string; tag?: string; trigger?: string | string }>;
                }
              | Array<{ repo?: string; clean?: string; fetchDepth?: string; lfs?: string }>;
          variables?: {} | Array<{ name?: string; value?: string; readonly?: string | string | string | string | string | string | string | string } | { group?: string } | { template?: string; parameters?: {} }>;
          lockBehavior?: string | string;
      }
    | {
          extends: { template?: string; parameters?: {} };
          pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
          name?: string;
          appendCommitMessageToRunName?: string | string | string | string | string | string | string | string;
          trigger?:
              | string
              | Array<string>
              | { batch?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> }; paths?: { include?: Array<string>; exclude?: Array<string> }; tags?: { include?: Array<string>; exclude?: Array<string> } };
          parameters?: Array<{
              name?: string;
              displayName?: string;
              type?: string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string;
              default?: string | __schema0 | {};
              values?: Array<string>;
          }>;
          pr?:
              | string
              | Array<string>
              | {
                    autoCancel?: string | string | string | string | string | string | string | string;
                    branches?: { include?: Array<string>; exclude?: Array<string> };
                    paths?: { include?: Array<string>; exclude?: Array<string> };
                    drafts?: string | string | string | string | string | string | string | string;
                };
          schedules?: Array<{ cron?: string; displayName?: string; branches?: { include?: Array<string>; exclude?: Array<string> }; batch?: string | string | string | string | string | string | string | string; always?: string | string | string | string | string | string | string | string }>;
          resources?:
              | {
                    builds?: Array<{ build: string; type: string; connection: string; source: string; version?: string; branch?: string; trigger?: string | string }>;
                    containers?: Array<{
                        container: string;
                        type?: string | string;
                        trigger?: string | string | { enabled?: string | string | string | string | string | string | string | string; tags?: Array<string> | { include?: Array<string>; exclude?: Array<string> } };
                        azureSubscription?: string;
                        resourceGroup?: string;
                        registry?: string;
                        repository?: string;
                        localImage?: string | string | string | string | string | string | string | string;
                        endpoint?: string;
                        env?: {};
                        image: string;
                        mapDockerSocket?: string | string | string | string | string | string | string | string;
                        options?: string;
                        ports?: Array<string>;
                        volumes?: Array<string>;
                        mountReadOnly?: {
                            work?: string | string | string | string | string | string | string | string;
                            externals?: string | string | string | string | string | string | string | string;
                            tools?: string | string | string | string | string | string | string | string;
                            tasks?: string | string | string | string | string | string | string | string;
                        };
                    }>;
                    pipelines?: Array<{
                        pipeline: string;
                        project?: string;
                        source?: string;
                        version?: string;
                        branch?: string;
                        tags?: Array<string>;
                        trigger?: string | string | { enabled?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> } | Array<string>; stages?: Array<string>; tags?: Array<string> };
                    }>;
                    repositories?: Array<{
                        repository: string;
                        endpoint?: string;
                        trigger?:
                            | string
                            | Array<string>
                            | { batch?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> }; paths?: { include?: Array<string>; exclude?: Array<string> }; tags?: { include?: Array<string>; exclude?: Array<string> } };
                        checkoutOptions?: { clean?: string; fetchDepth?: string; fetchTags?: string; lfs?: string; submodules?: string; persistCredentials?: string };
                        name?: string;
                        ref?: string;
                        type?: string;
                    }>;
                    webhooks?: Array<{ webhook: string; connection: string; type?: string; filters?: Array<{ path: string; value: string }> }>;
                    packages?: Array<{ package: string; type: string; connection: string; name: string; version?: string; tag?: string; trigger?: string | string }>;
                }
              | Array<{ repo?: string; clean?: string; fetchDepth?: string; lfs?: string }>;
          variables?: {} | Array<{ name?: string; value?: string; readonly?: string | string | string | string | string | string | string | string } | { group?: string } | { template?: string; parameters?: {} }>;
          lockBehavior?: string | string;
      }
    | {
          jobs: Array<
              | {
                    job?: string;
                    displayName?: string;
                    dependsOn?: string | Array<string>;
                    condition?: string;
                    continueOnError?: string;
                    timeoutInMinutes?: string;
                    cancelTimeoutInMinutes?: string;
                    variables?: {} | Array<{ name?: string; value?: string; readonly?: string | string | string | string | string | string | string | string } | { group?: string } | { template?: string; parameters?: {} }>;
                    strategy?: { matrix?: {} | string; maxParallel?: string } | { parallel?: string };
                    pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                    container?:
                        | string
                        | { alias?: string }
                        | {
                              endpoint?: string;
                              env?: {};
                              image: string;
                              mapDockerSocket?: string | string | string | string | string | string | string | string;
                              options?: string;
                              ports?: Array<string>;
                              volumes?: Array<string>;
                              mountReadOnly?: {
                                  work?: string | string | string | string | string | string | string | string;
                                  externals?: string | string | string | string | string | string | string | string;
                                  tools?: string | string | string | string | string | string | string | string;
                                  tasks?: string | string | string | string | string | string | string | string;
                              };
                          };
                    services?: {};
                    workspace?: { clean?: string };
                    uses?: { repositories?: Array<string>; pools?: Array<string> };
                    steps?: Array<
                        | unknown
                        | {
                              script: string;
                              failOnStderr?: string;
                              workingDirectory?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              powershell: string;
                              errorActionPreference?: string;
                              failOnStderr?: string;
                              ignoreLASTEXITCODE?: string;
                              workingDirectory?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              pwsh: string;
                              errorActionPreference?: string;
                              failOnStderr?: string;
                              ignoreLASTEXITCODE?: string;
                              workingDirectory?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              bash: string;
                              failOnStderr?: string;
                              workingDirectory?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              checkout?: string;
                              clean?: string;
                              fetchDepth?: string;
                              fetchFilter?: string;
                              fetchTags?: string;
                              lfs?: string;
                              persistCredentials?: string;
                              submodules?: string;
                              path?: string;
                              sparseCheckoutDirectories?: string;
                              sparseCheckoutPatterns?: string;
                              workspaceRepo?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              download: string;
                              artifact?: string;
                              patterns?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              downloadBuild?: string;
                              artifact?: string;
                              path?: string;
                              patterns?: string;
                              inputs?: {};
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              getPackage?: string;
                              path?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              upload?: string;
                              artifact?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              publish?: string;
                              artifact?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | { template?: string; parameters?: {} }
                        | {
                              reviewApp?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                    >;
                    templateContext?: {};
                }
              | {
                    deployment?: string;
                    displayName?: string;
                    dependsOn?: string | Array<string>;
                    condition?: string;
                    continueOnError?: string;
                    timeoutInMinutes?: string;
                    cancelTimeoutInMinutes?: string;
                    variables?: {} | Array<{ name?: string; value?: string; readonly?: string | string | string | string | string | string | string | string } | { group?: string } | { template?: string; parameters?: {} }>;
                    pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                    environment?: string | { name?: string; resourceName?: string; resourceId?: string; resourceType?: string; tags?: string };
                    strategy?:
                        | {
                              runOnce?: {
                                  preDeploy?: {
                                      steps?: Array<
                                          | unknown
                                          | {
                                                script: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                powershell: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                pwsh: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                bash: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                checkout?: string;
                                                clean?: string;
                                                fetchDepth?: string;
                                                fetchFilter?: string;
                                                fetchTags?: string;
                                                lfs?: string;
                                                persistCredentials?: string;
                                                submodules?: string;
                                                path?: string;
                                                sparseCheckoutDirectories?: string;
                                                sparseCheckoutPatterns?: string;
                                                workspaceRepo?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                download: string;
                                                artifact?: string;
                                                patterns?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                downloadBuild?: string;
                                                artifact?: string;
                                                path?: string;
                                                patterns?: string;
                                                inputs?: {};
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                getPackage?: string;
                                                path?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                upload?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                publish?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | { template?: string; parameters?: {} }
                                          | {
                                                reviewApp?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                      >;
                                      pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                  };
                                  deploy?: {
                                      steps?: Array<
                                          | unknown
                                          | {
                                                script: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                powershell: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                pwsh: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                bash: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                checkout?: string;
                                                clean?: string;
                                                fetchDepth?: string;
                                                fetchFilter?: string;
                                                fetchTags?: string;
                                                lfs?: string;
                                                persistCredentials?: string;
                                                submodules?: string;
                                                path?: string;
                                                sparseCheckoutDirectories?: string;
                                                sparseCheckoutPatterns?: string;
                                                workspaceRepo?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                download: string;
                                                artifact?: string;
                                                patterns?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                downloadBuild?: string;
                                                artifact?: string;
                                                path?: string;
                                                patterns?: string;
                                                inputs?: {};
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                getPackage?: string;
                                                path?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                upload?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                publish?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | { template?: string; parameters?: {} }
                                          | {
                                                reviewApp?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                      >;
                                      pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                  };
                                  routeTraffic?: {
                                      steps?: Array<
                                          | unknown
                                          | {
                                                script: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                powershell: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                pwsh: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                bash: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                checkout?: string;
                                                clean?: string;
                                                fetchDepth?: string;
                                                fetchFilter?: string;
                                                fetchTags?: string;
                                                lfs?: string;
                                                persistCredentials?: string;
                                                submodules?: string;
                                                path?: string;
                                                sparseCheckoutDirectories?: string;
                                                sparseCheckoutPatterns?: string;
                                                workspaceRepo?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                download: string;
                                                artifact?: string;
                                                patterns?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                downloadBuild?: string;
                                                artifact?: string;
                                                path?: string;
                                                patterns?: string;
                                                inputs?: {};
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                getPackage?: string;
                                                path?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                upload?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                publish?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | { template?: string; parameters?: {} }
                                          | {
                                                reviewApp?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                      >;
                                      pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                  };
                                  postRouteTraffic?: {
                                      steps?: Array<
                                          | unknown
                                          | {
                                                script: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                powershell: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                pwsh: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                bash: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                checkout?: string;
                                                clean?: string;
                                                fetchDepth?: string;
                                                fetchFilter?: string;
                                                fetchTags?: string;
                                                lfs?: string;
                                                persistCredentials?: string;
                                                submodules?: string;
                                                path?: string;
                                                sparseCheckoutDirectories?: string;
                                                sparseCheckoutPatterns?: string;
                                                workspaceRepo?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                download: string;
                                                artifact?: string;
                                                patterns?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                downloadBuild?: string;
                                                artifact?: string;
                                                path?: string;
                                                patterns?: string;
                                                inputs?: {};
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                getPackage?: string;
                                                path?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                upload?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                publish?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | { template?: string; parameters?: {} }
                                          | {
                                                reviewApp?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                      >;
                                      pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                  };
                                  on?: {
                                      failure?: {
                                          steps?: Array<
                                              | unknown
                                              | {
                                                    script: string;
                                                    failOnStderr?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    powershell: string;
                                                    errorActionPreference?: string;
                                                    failOnStderr?: string;
                                                    ignoreLASTEXITCODE?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    pwsh: string;
                                                    errorActionPreference?: string;
                                                    failOnStderr?: string;
                                                    ignoreLASTEXITCODE?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    bash: string;
                                                    failOnStderr?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    checkout?: string;
                                                    clean?: string;
                                                    fetchDepth?: string;
                                                    fetchFilter?: string;
                                                    fetchTags?: string;
                                                    lfs?: string;
                                                    persistCredentials?: string;
                                                    submodules?: string;
                                                    path?: string;
                                                    sparseCheckoutDirectories?: string;
                                                    sparseCheckoutPatterns?: string;
                                                    workspaceRepo?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    download: string;
                                                    artifact?: string;
                                                    patterns?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    downloadBuild?: string;
                                                    artifact?: string;
                                                    path?: string;
                                                    patterns?: string;
                                                    inputs?: {};
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    getPackage?: string;
                                                    path?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    upload?: string;
                                                    artifact?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    publish?: string;
                                                    artifact?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | { template?: string; parameters?: {} }
                                              | {
                                                    reviewApp?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                          >;
                                          pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                      };
                                      success?: {
                                          steps?: Array<
                                              | unknown
                                              | {
                                                    script: string;
                                                    failOnStderr?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    powershell: string;
                                                    errorActionPreference?: string;
                                                    failOnStderr?: string;
                                                    ignoreLASTEXITCODE?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    pwsh: string;
                                                    errorActionPreference?: string;
                                                    failOnStderr?: string;
                                                    ignoreLASTEXITCODE?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    bash: string;
                                                    failOnStderr?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    checkout?: string;
                                                    clean?: string;
                                                    fetchDepth?: string;
                                                    fetchFilter?: string;
                                                    fetchTags?: string;
                                                    lfs?: string;
                                                    persistCredentials?: string;
                                                    submodules?: string;
                                                    path?: string;
                                                    sparseCheckoutDirectories?: string;
                                                    sparseCheckoutPatterns?: string;
                                                    workspaceRepo?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    download: string;
                                                    artifact?: string;
                                                    patterns?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    downloadBuild?: string;
                                                    artifact?: string;
                                                    path?: string;
                                                    patterns?: string;
                                                    inputs?: {};
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    getPackage?: string;
                                                    path?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    upload?: string;
                                                    artifact?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    publish?: string;
                                                    artifact?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | { template?: string; parameters?: {} }
                                              | {
                                                    reviewApp?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                          >;
                                          pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                      };
                                  };
                              };
                          }
                        | {
                              rolling?: {
                                  maxParallel?: string;
                                  preDeploy?: {
                                      steps?: Array<
                                          | unknown
                                          | {
                                                script: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                powershell: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                pwsh: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                bash: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                checkout?: string;
                                                clean?: string;
                                                fetchDepth?: string;
                                                fetchFilter?: string;
                                                fetchTags?: string;
                                                lfs?: string;
                                                persistCredentials?: string;
                                                submodules?: string;
                                                path?: string;
                                                sparseCheckoutDirectories?: string;
                                                sparseCheckoutPatterns?: string;
                                                workspaceRepo?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                download: string;
                                                artifact?: string;
                                                patterns?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                downloadBuild?: string;
                                                artifact?: string;
                                                path?: string;
                                                patterns?: string;
                                                inputs?: {};
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                getPackage?: string;
                                                path?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                upload?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                publish?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | { template?: string; parameters?: {} }
                                          | {
                                                reviewApp?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                      >;
                                      pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                  };
                                  deploy?: {
                                      steps?: Array<
                                          | unknown
                                          | {
                                                script: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                powershell: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                pwsh: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                bash: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                checkout?: string;
                                                clean?: string;
                                                fetchDepth?: string;
                                                fetchFilter?: string;
                                                fetchTags?: string;
                                                lfs?: string;
                                                persistCredentials?: string;
                                                submodules?: string;
                                                path?: string;
                                                sparseCheckoutDirectories?: string;
                                                sparseCheckoutPatterns?: string;
                                                workspaceRepo?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                download: string;
                                                artifact?: string;
                                                patterns?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                downloadBuild?: string;
                                                artifact?: string;
                                                path?: string;
                                                patterns?: string;
                                                inputs?: {};
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                getPackage?: string;
                                                path?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                upload?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                publish?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | { template?: string; parameters?: {} }
                                          | {
                                                reviewApp?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                      >;
                                      pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                  };
                                  routeTraffic?: {
                                      steps?: Array<
                                          | unknown
                                          | {
                                                script: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                powershell: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                pwsh: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                bash: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                checkout?: string;
                                                clean?: string;
                                                fetchDepth?: string;
                                                fetchFilter?: string;
                                                fetchTags?: string;
                                                lfs?: string;
                                                persistCredentials?: string;
                                                submodules?: string;
                                                path?: string;
                                                sparseCheckoutDirectories?: string;
                                                sparseCheckoutPatterns?: string;
                                                workspaceRepo?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                download: string;
                                                artifact?: string;
                                                patterns?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                downloadBuild?: string;
                                                artifact?: string;
                                                path?: string;
                                                patterns?: string;
                                                inputs?: {};
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                getPackage?: string;
                                                path?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                upload?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                publish?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | { template?: string; parameters?: {} }
                                          | {
                                                reviewApp?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                      >;
                                      pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                  };
                                  postRouteTraffic?: {
                                      steps?: Array<
                                          | unknown
                                          | {
                                                script: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                powershell: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                pwsh: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                bash: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                checkout?: string;
                                                clean?: string;
                                                fetchDepth?: string;
                                                fetchFilter?: string;
                                                fetchTags?: string;
                                                lfs?: string;
                                                persistCredentials?: string;
                                                submodules?: string;
                                                path?: string;
                                                sparseCheckoutDirectories?: string;
                                                sparseCheckoutPatterns?: string;
                                                workspaceRepo?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                download: string;
                                                artifact?: string;
                                                patterns?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                downloadBuild?: string;
                                                artifact?: string;
                                                path?: string;
                                                patterns?: string;
                                                inputs?: {};
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                getPackage?: string;
                                                path?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                upload?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                publish?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | { template?: string; parameters?: {} }
                                          | {
                                                reviewApp?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                      >;
                                      pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                  };
                                  on?: {
                                      failure?: {
                                          steps?: Array<
                                              | unknown
                                              | {
                                                    script: string;
                                                    failOnStderr?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    powershell: string;
                                                    errorActionPreference?: string;
                                                    failOnStderr?: string;
                                                    ignoreLASTEXITCODE?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    pwsh: string;
                                                    errorActionPreference?: string;
                                                    failOnStderr?: string;
                                                    ignoreLASTEXITCODE?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    bash: string;
                                                    failOnStderr?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    checkout?: string;
                                                    clean?: string;
                                                    fetchDepth?: string;
                                                    fetchFilter?: string;
                                                    fetchTags?: string;
                                                    lfs?: string;
                                                    persistCredentials?: string;
                                                    submodules?: string;
                                                    path?: string;
                                                    sparseCheckoutDirectories?: string;
                                                    sparseCheckoutPatterns?: string;
                                                    workspaceRepo?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    download: string;
                                                    artifact?: string;
                                                    patterns?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    downloadBuild?: string;
                                                    artifact?: string;
                                                    path?: string;
                                                    patterns?: string;
                                                    inputs?: {};
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    getPackage?: string;
                                                    path?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    upload?: string;
                                                    artifact?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    publish?: string;
                                                    artifact?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | { template?: string; parameters?: {} }
                                              | {
                                                    reviewApp?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                          >;
                                          pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                      };
                                      success?: {
                                          steps?: Array<
                                              | unknown
                                              | {
                                                    script: string;
                                                    failOnStderr?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    powershell: string;
                                                    errorActionPreference?: string;
                                                    failOnStderr?: string;
                                                    ignoreLASTEXITCODE?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    pwsh: string;
                                                    errorActionPreference?: string;
                                                    failOnStderr?: string;
                                                    ignoreLASTEXITCODE?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    bash: string;
                                                    failOnStderr?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    checkout?: string;
                                                    clean?: string;
                                                    fetchDepth?: string;
                                                    fetchFilter?: string;
                                                    fetchTags?: string;
                                                    lfs?: string;
                                                    persistCredentials?: string;
                                                    submodules?: string;
                                                    path?: string;
                                                    sparseCheckoutDirectories?: string;
                                                    sparseCheckoutPatterns?: string;
                                                    workspaceRepo?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    download: string;
                                                    artifact?: string;
                                                    patterns?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    downloadBuild?: string;
                                                    artifact?: string;
                                                    path?: string;
                                                    patterns?: string;
                                                    inputs?: {};
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    getPackage?: string;
                                                    path?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    upload?: string;
                                                    artifact?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    publish?: string;
                                                    artifact?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | { template?: string; parameters?: {} }
                                              | {
                                                    reviewApp?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                          >;
                                          pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                      };
                                  };
                              };
                          }
                        | {
                              canary?: {
                                  increments?: Array<string>;
                                  preDeploy?: {
                                      steps?: Array<
                                          | unknown
                                          | {
                                                script: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                powershell: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                pwsh: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                bash: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                checkout?: string;
                                                clean?: string;
                                                fetchDepth?: string;
                                                fetchFilter?: string;
                                                fetchTags?: string;
                                                lfs?: string;
                                                persistCredentials?: string;
                                                submodules?: string;
                                                path?: string;
                                                sparseCheckoutDirectories?: string;
                                                sparseCheckoutPatterns?: string;
                                                workspaceRepo?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                download: string;
                                                artifact?: string;
                                                patterns?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                downloadBuild?: string;
                                                artifact?: string;
                                                path?: string;
                                                patterns?: string;
                                                inputs?: {};
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                getPackage?: string;
                                                path?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                upload?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                publish?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | { template?: string; parameters?: {} }
                                          | {
                                                reviewApp?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                      >;
                                      pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                  };
                                  deploy?: {
                                      steps?: Array<
                                          | unknown
                                          | {
                                                script: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                powershell: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                pwsh: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                bash: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                checkout?: string;
                                                clean?: string;
                                                fetchDepth?: string;
                                                fetchFilter?: string;
                                                fetchTags?: string;
                                                lfs?: string;
                                                persistCredentials?: string;
                                                submodules?: string;
                                                path?: string;
                                                sparseCheckoutDirectories?: string;
                                                sparseCheckoutPatterns?: string;
                                                workspaceRepo?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                download: string;
                                                artifact?: string;
                                                patterns?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                downloadBuild?: string;
                                                artifact?: string;
                                                path?: string;
                                                patterns?: string;
                                                inputs?: {};
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                getPackage?: string;
                                                path?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                upload?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                publish?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | { template?: string; parameters?: {} }
                                          | {
                                                reviewApp?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                      >;
                                      pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                  };
                                  routeTraffic?: {
                                      steps?: Array<
                                          | unknown
                                          | {
                                                script: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                powershell: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                pwsh: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                bash: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                checkout?: string;
                                                clean?: string;
                                                fetchDepth?: string;
                                                fetchFilter?: string;
                                                fetchTags?: string;
                                                lfs?: string;
                                                persistCredentials?: string;
                                                submodules?: string;
                                                path?: string;
                                                sparseCheckoutDirectories?: string;
                                                sparseCheckoutPatterns?: string;
                                                workspaceRepo?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                download: string;
                                                artifact?: string;
                                                patterns?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                downloadBuild?: string;
                                                artifact?: string;
                                                path?: string;
                                                patterns?: string;
                                                inputs?: {};
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                getPackage?: string;
                                                path?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                upload?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                publish?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | { template?: string; parameters?: {} }
                                          | {
                                                reviewApp?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                      >;
                                      pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                  };
                                  postRouteTraffic?: {
                                      steps?: Array<
                                          | unknown
                                          | {
                                                script: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                powershell: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                pwsh: string;
                                                errorActionPreference?: string;
                                                failOnStderr?: string;
                                                ignoreLASTEXITCODE?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                bash: string;
                                                failOnStderr?: string;
                                                workingDirectory?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                checkout?: string;
                                                clean?: string;
                                                fetchDepth?: string;
                                                fetchFilter?: string;
                                                fetchTags?: string;
                                                lfs?: string;
                                                persistCredentials?: string;
                                                submodules?: string;
                                                path?: string;
                                                sparseCheckoutDirectories?: string;
                                                sparseCheckoutPatterns?: string;
                                                workspaceRepo?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                download: string;
                                                artifact?: string;
                                                patterns?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                downloadBuild?: string;
                                                artifact?: string;
                                                path?: string;
                                                patterns?: string;
                                                inputs?: {};
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                getPackage?: string;
                                                path?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                upload?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | {
                                                publish?: string;
                                                artifact?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                          | { template?: string; parameters?: {} }
                                          | {
                                                reviewApp?: string;
                                                condition?: string;
                                                continueOnError?: string | string | string | string | string | string | string | string;
                                                displayName?: string;
                                                target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                enabled?: string | string | string | string | string | string | string | string;
                                                env?: {};
                                                name?: string;
                                                timeoutInMinutes?: string;
                                                retryCountOnTaskFailure?: string;
                                            }
                                      >;
                                      pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                  };
                                  on?: {
                                      failure?: {
                                          steps?: Array<
                                              | unknown
                                              | {
                                                    script: string;
                                                    failOnStderr?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    powershell: string;
                                                    errorActionPreference?: string;
                                                    failOnStderr?: string;
                                                    ignoreLASTEXITCODE?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    pwsh: string;
                                                    errorActionPreference?: string;
                                                    failOnStderr?: string;
                                                    ignoreLASTEXITCODE?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    bash: string;
                                                    failOnStderr?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    checkout?: string;
                                                    clean?: string;
                                                    fetchDepth?: string;
                                                    fetchFilter?: string;
                                                    fetchTags?: string;
                                                    lfs?: string;
                                                    persistCredentials?: string;
                                                    submodules?: string;
                                                    path?: string;
                                                    sparseCheckoutDirectories?: string;
                                                    sparseCheckoutPatterns?: string;
                                                    workspaceRepo?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    download: string;
                                                    artifact?: string;
                                                    patterns?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    downloadBuild?: string;
                                                    artifact?: string;
                                                    path?: string;
                                                    patterns?: string;
                                                    inputs?: {};
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    getPackage?: string;
                                                    path?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    upload?: string;
                                                    artifact?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    publish?: string;
                                                    artifact?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | { template?: string; parameters?: {} }
                                              | {
                                                    reviewApp?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                          >;
                                          pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                      };
                                      success?: {
                                          steps?: Array<
                                              | unknown
                                              | {
                                                    script: string;
                                                    failOnStderr?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    powershell: string;
                                                    errorActionPreference?: string;
                                                    failOnStderr?: string;
                                                    ignoreLASTEXITCODE?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    pwsh: string;
                                                    errorActionPreference?: string;
                                                    failOnStderr?: string;
                                                    ignoreLASTEXITCODE?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    bash: string;
                                                    failOnStderr?: string;
                                                    workingDirectory?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    checkout?: string;
                                                    clean?: string;
                                                    fetchDepth?: string;
                                                    fetchFilter?: string;
                                                    fetchTags?: string;
                                                    lfs?: string;
                                                    persistCredentials?: string;
                                                    submodules?: string;
                                                    path?: string;
                                                    sparseCheckoutDirectories?: string;
                                                    sparseCheckoutPatterns?: string;
                                                    workspaceRepo?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    download: string;
                                                    artifact?: string;
                                                    patterns?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    downloadBuild?: string;
                                                    artifact?: string;
                                                    path?: string;
                                                    patterns?: string;
                                                    inputs?: {};
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    getPackage?: string;
                                                    path?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    upload?: string;
                                                    artifact?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | {
                                                    publish?: string;
                                                    artifact?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                              | { template?: string; parameters?: {} }
                                              | {
                                                    reviewApp?: string;
                                                    condition?: string;
                                                    continueOnError?: string | string | string | string | string | string | string | string;
                                                    displayName?: string;
                                                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                                                    enabled?: string | string | string | string | string | string | string | string;
                                                    env?: {};
                                                    name?: string;
                                                    timeoutInMinutes?: string;
                                                    retryCountOnTaskFailure?: string;
                                                }
                                          >;
                                          pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
                                      };
                                  };
                              };
                          };
                    workspace?: { clean?: string };
                    uses?: { repositories?: Array<string>; pools?: Array<string> };
                    container?:
                        | string
                        | { alias?: string }
                        | {
                              endpoint?: string;
                              env?: {};
                              image: string;
                              mapDockerSocket?: string | string | string | string | string | string | string | string;
                              options?: string;
                              ports?: Array<string>;
                              volumes?: Array<string>;
                              mountReadOnly?: {
                                  work?: string | string | string | string | string | string | string | string;
                                  externals?: string | string | string | string | string | string | string | string;
                                  tools?: string | string | string | string | string | string | string | string;
                                  tasks?: string | string | string | string | string | string | string | string;
                              };
                          };
                    services?: {};
                    templateContext?: {};
                }
              | { template?: string; parameters?: {} }
          >;
          pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
          name?: string;
          appendCommitMessageToRunName?: string | string | string | string | string | string | string | string;
          trigger?:
              | string
              | Array<string>
              | { batch?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> }; paths?: { include?: Array<string>; exclude?: Array<string> }; tags?: { include?: Array<string>; exclude?: Array<string> } };
          parameters?: Array<{
              name?: string;
              displayName?: string;
              type?: string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string;
              default?: string | __schema0 | {};
              values?: Array<string>;
          }>;
          pr?:
              | string
              | Array<string>
              | {
                    autoCancel?: string | string | string | string | string | string | string | string;
                    branches?: { include?: Array<string>; exclude?: Array<string> };
                    paths?: { include?: Array<string>; exclude?: Array<string> };
                    drafts?: string | string | string | string | string | string | string | string;
                };
          schedules?: Array<{ cron?: string; displayName?: string; branches?: { include?: Array<string>; exclude?: Array<string> }; batch?: string | string | string | string | string | string | string | string; always?: string | string | string | string | string | string | string | string }>;
          resources?:
              | {
                    builds?: Array<{ build: string; type: string; connection: string; source: string; version?: string; branch?: string; trigger?: string | string }>;
                    containers?: Array<{
                        container: string;
                        type?: string | string;
                        trigger?: string | string | { enabled?: string | string | string | string | string | string | string | string; tags?: Array<string> | { include?: Array<string>; exclude?: Array<string> } };
                        azureSubscription?: string;
                        resourceGroup?: string;
                        registry?: string;
                        repository?: string;
                        localImage?: string | string | string | string | string | string | string | string;
                        endpoint?: string;
                        env?: {};
                        image: string;
                        mapDockerSocket?: string | string | string | string | string | string | string | string;
                        options?: string;
                        ports?: Array<string>;
                        volumes?: Array<string>;
                        mountReadOnly?: {
                            work?: string | string | string | string | string | string | string | string;
                            externals?: string | string | string | string | string | string | string | string;
                            tools?: string | string | string | string | string | string | string | string;
                            tasks?: string | string | string | string | string | string | string | string;
                        };
                    }>;
                    pipelines?: Array<{
                        pipeline: string;
                        project?: string;
                        source?: string;
                        version?: string;
                        branch?: string;
                        tags?: Array<string>;
                        trigger?: string | string | { enabled?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> } | Array<string>; stages?: Array<string>; tags?: Array<string> };
                    }>;
                    repositories?: Array<{
                        repository: string;
                        endpoint?: string;
                        trigger?:
                            | string
                            | Array<string>
                            | { batch?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> }; paths?: { include?: Array<string>; exclude?: Array<string> }; tags?: { include?: Array<string>; exclude?: Array<string> } };
                        checkoutOptions?: { clean?: string; fetchDepth?: string; fetchTags?: string; lfs?: string; submodules?: string; persistCredentials?: string };
                        name?: string;
                        ref?: string;
                        type?: string;
                    }>;
                    webhooks?: Array<{ webhook: string; connection: string; type?: string; filters?: Array<{ path: string; value: string }> }>;
                    packages?: Array<{ package: string; type: string; connection: string; name: string; version?: string; tag?: string; trigger?: string | string }>;
                }
              | Array<{ repo?: string; clean?: string; fetchDepth?: string; lfs?: string }>;
          variables?: {} | Array<{ name?: string; value?: string; readonly?: string | string | string | string | string | string | string | string } | { group?: string } | { template?: string; parameters?: {} }>;
          lockBehavior?: string | string;
      }
    | {
          phases: Array<
              | {
                    phase?: string;
                    dependsOn?: string | Array<string>;
                    displayName?: string;
                    condition?: string;
                    continueOnError?: string;
                    queue?: string | { cancelTimeoutInMinutes?: string; container?: string; demands?: string | Array<string>; matrix?: {} | string; name?: string; parallel?: string; timeoutInMinutes?: string; workspace?: { clean?: string } };
                    variables?: {} | Array<{ name?: string; value?: string; readonly?: string | string | string | string | string | string | string | string } | { group?: string } | { template?: string; parameters?: {} }>;
                    steps?: Array<
                        | unknown
                        | {
                              script: string;
                              failOnStderr?: string;
                              workingDirectory?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              powershell: string;
                              errorActionPreference?: string;
                              failOnStderr?: string;
                              ignoreLASTEXITCODE?: string;
                              workingDirectory?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              pwsh: string;
                              errorActionPreference?: string;
                              failOnStderr?: string;
                              ignoreLASTEXITCODE?: string;
                              workingDirectory?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              bash: string;
                              failOnStderr?: string;
                              workingDirectory?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              checkout?: string;
                              clean?: string;
                              fetchDepth?: string;
                              fetchFilter?: string;
                              fetchTags?: string;
                              lfs?: string;
                              persistCredentials?: string;
                              submodules?: string;
                              path?: string;
                              sparseCheckoutDirectories?: string;
                              sparseCheckoutPatterns?: string;
                              workspaceRepo?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              download: string;
                              artifact?: string;
                              patterns?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              downloadBuild?: string;
                              artifact?: string;
                              path?: string;
                              patterns?: string;
                              inputs?: {};
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              getPackage?: string;
                              path?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              upload?: string;
                              artifact?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              publish?: string;
                              artifact?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | { template?: string; parameters?: {} }
                        | {
                              reviewApp?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                    >;
                }
              | {
                    phase?: string;
                    dependsOn?: string | Array<string>;
                    displayName?: string;
                    condition?: string;
                    continueOnError?: string;
                    server?: string | { cancelTimeoutInMinutes?: string; matrix?: {} | string; parallel?: string; timeoutInMinutes?: string };
                    variables?: {} | Array<{ name?: string; value?: string; readonly?: string | string | string | string | string | string | string | string } | { group?: string } | { template?: string; parameters?: {} }>;
                    steps?: Array<
                        | unknown
                        | {
                              script: string;
                              failOnStderr?: string;
                              workingDirectory?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              powershell: string;
                              errorActionPreference?: string;
                              failOnStderr?: string;
                              ignoreLASTEXITCODE?: string;
                              workingDirectory?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              pwsh: string;
                              errorActionPreference?: string;
                              failOnStderr?: string;
                              ignoreLASTEXITCODE?: string;
                              workingDirectory?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              bash: string;
                              failOnStderr?: string;
                              workingDirectory?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              checkout?: string;
                              clean?: string;
                              fetchDepth?: string;
                              fetchFilter?: string;
                              fetchTags?: string;
                              lfs?: string;
                              persistCredentials?: string;
                              submodules?: string;
                              path?: string;
                              sparseCheckoutDirectories?: string;
                              sparseCheckoutPatterns?: string;
                              workspaceRepo?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              download: string;
                              artifact?: string;
                              patterns?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              downloadBuild?: string;
                              artifact?: string;
                              path?: string;
                              patterns?: string;
                              inputs?: {};
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              getPackage?: string;
                              path?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              upload?: string;
                              artifact?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | {
                              publish?: string;
                              artifact?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                        | { template?: string; parameters?: {} }
                        | {
                              reviewApp?: string;
                              condition?: string;
                              continueOnError?: string | string | string | string | string | string | string | string;
                              displayName?: string;
                              target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                              enabled?: string | string | string | string | string | string | string | string;
                              env?: {};
                              name?: string;
                              timeoutInMinutes?: string;
                              retryCountOnTaskFailure?: string;
                          }
                    >;
                }
              | { template?: string; parameters?: {} }
          >;
          name?: string;
          appendCommitMessageToRunName?: string | string | string | string | string | string | string | string;
          trigger?:
              | string
              | Array<string>
              | { batch?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> }; paths?: { include?: Array<string>; exclude?: Array<string> }; tags?: { include?: Array<string>; exclude?: Array<string> } };
          parameters?: Array<{
              name?: string;
              displayName?: string;
              type?: string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string;
              default?: string | __schema0 | {};
              values?: Array<string>;
          }>;
          pr?:
              | string
              | Array<string>
              | {
                    autoCancel?: string | string | string | string | string | string | string | string;
                    branches?: { include?: Array<string>; exclude?: Array<string> };
                    paths?: { include?: Array<string>; exclude?: Array<string> };
                    drafts?: string | string | string | string | string | string | string | string;
                };
          schedules?: Array<{ cron?: string; displayName?: string; branches?: { include?: Array<string>; exclude?: Array<string> }; batch?: string | string | string | string | string | string | string | string; always?: string | string | string | string | string | string | string | string }>;
          resources?:
              | {
                    builds?: Array<{ build: string; type: string; connection: string; source: string; version?: string; branch?: string; trigger?: string | string }>;
                    containers?: Array<{
                        container: string;
                        type?: string | string;
                        trigger?: string | string | { enabled?: string | string | string | string | string | string | string | string; tags?: Array<string> | { include?: Array<string>; exclude?: Array<string> } };
                        azureSubscription?: string;
                        resourceGroup?: string;
                        registry?: string;
                        repository?: string;
                        localImage?: string | string | string | string | string | string | string | string;
                        endpoint?: string;
                        env?: {};
                        image: string;
                        mapDockerSocket?: string | string | string | string | string | string | string | string;
                        options?: string;
                        ports?: Array<string>;
                        volumes?: Array<string>;
                        mountReadOnly?: {
                            work?: string | string | string | string | string | string | string | string;
                            externals?: string | string | string | string | string | string | string | string;
                            tools?: string | string | string | string | string | string | string | string;
                            tasks?: string | string | string | string | string | string | string | string;
                        };
                    }>;
                    pipelines?: Array<{
                        pipeline: string;
                        project?: string;
                        source?: string;
                        version?: string;
                        branch?: string;
                        tags?: Array<string>;
                        trigger?: string | string | { enabled?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> } | Array<string>; stages?: Array<string>; tags?: Array<string> };
                    }>;
                    repositories?: Array<{
                        repository: string;
                        endpoint?: string;
                        trigger?:
                            | string
                            | Array<string>
                            | { batch?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> }; paths?: { include?: Array<string>; exclude?: Array<string> }; tags?: { include?: Array<string>; exclude?: Array<string> } };
                        checkoutOptions?: { clean?: string; fetchDepth?: string; fetchTags?: string; lfs?: string; submodules?: string; persistCredentials?: string };
                        name?: string;
                        ref?: string;
                        type?: string;
                    }>;
                    webhooks?: Array<{ webhook: string; connection: string; type?: string; filters?: Array<{ path: string; value: string }> }>;
                    packages?: Array<{ package: string; type: string; connection: string; name: string; version?: string; tag?: string; trigger?: string | string }>;
                }
              | Array<{ repo?: string; clean?: string; fetchDepth?: string; lfs?: string }>;
          variables?: {} | Array<{ name?: string; value?: string; readonly?: string | string | string | string | string | string | string | string } | { group?: string } | { template?: string; parameters?: {} }>;
          lockBehavior?: string | string;
      }
    | {
          strategy?: { matrix?: {} | string; maxParallel?: string } | { parallel?: string };
          continueOnError?: string;
          pool?: string | { name?: string; demands?: string | Array<string>; vmImage?: string };
          container?:
              | string
              | { alias?: string }
              | {
                    endpoint?: string;
                    env?: {};
                    image: string;
                    mapDockerSocket?: string | string | string | string | string | string | string | string;
                    options?: string;
                    ports?: Array<string>;
                    volumes?: Array<string>;
                    mountReadOnly?: {
                        work?: string | string | string | string | string | string | string | string;
                        externals?: string | string | string | string | string | string | string | string;
                        tools?: string | string | string | string | string | string | string | string;
                        tasks?: string | string | string | string | string | string | string | string;
                    };
                };
          services?: {};
          workspace?: { clean?: string };
          steps: Array<
              | unknown
              | {
                    script: string;
                    failOnStderr?: string;
                    workingDirectory?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    powershell: string;
                    errorActionPreference?: string;
                    failOnStderr?: string;
                    ignoreLASTEXITCODE?: string;
                    workingDirectory?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    pwsh: string;
                    errorActionPreference?: string;
                    failOnStderr?: string;
                    ignoreLASTEXITCODE?: string;
                    workingDirectory?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    bash: string;
                    failOnStderr?: string;
                    workingDirectory?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    checkout?: string;
                    clean?: string;
                    fetchDepth?: string;
                    fetchFilter?: string;
                    fetchTags?: string;
                    lfs?: string;
                    persistCredentials?: string;
                    submodules?: string;
                    path?: string;
                    sparseCheckoutDirectories?: string;
                    sparseCheckoutPatterns?: string;
                    workspaceRepo?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    download: string;
                    artifact?: string;
                    patterns?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    downloadBuild?: string;
                    artifact?: string;
                    path?: string;
                    patterns?: string;
                    inputs?: {};
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    getPackage?: string;
                    path?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    upload?: string;
                    artifact?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    publish?: string;
                    artifact?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | { template?: string; parameters?: {} }
              | {
                    reviewApp?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
          >;
          name?: string;
          appendCommitMessageToRunName?: string | string | string | string | string | string | string | string;
          trigger?:
              | string
              | Array<string>
              | { batch?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> }; paths?: { include?: Array<string>; exclude?: Array<string> }; tags?: { include?: Array<string>; exclude?: Array<string> } };
          parameters?: Array<{
              name?: string;
              displayName?: string;
              type?: string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string;
              default?: string | __schema0 | {};
              values?: Array<string>;
          }>;
          pr?:
              | string
              | Array<string>
              | {
                    autoCancel?: string | string | string | string | string | string | string | string;
                    branches?: { include?: Array<string>; exclude?: Array<string> };
                    paths?: { include?: Array<string>; exclude?: Array<string> };
                    drafts?: string | string | string | string | string | string | string | string;
                };
          schedules?: Array<{ cron?: string; displayName?: string; branches?: { include?: Array<string>; exclude?: Array<string> }; batch?: string | string | string | string | string | string | string | string; always?: string | string | string | string | string | string | string | string }>;
          resources?:
              | {
                    builds?: Array<{ build: string; type: string; connection: string; source: string; version?: string; branch?: string; trigger?: string | string }>;
                    containers?: Array<{
                        container: string;
                        type?: string | string;
                        trigger?: string | string | { enabled?: string | string | string | string | string | string | string | string; tags?: Array<string> | { include?: Array<string>; exclude?: Array<string> } };
                        azureSubscription?: string;
                        resourceGroup?: string;
                        registry?: string;
                        repository?: string;
                        localImage?: string | string | string | string | string | string | string | string;
                        endpoint?: string;
                        env?: {};
                        image: string;
                        mapDockerSocket?: string | string | string | string | string | string | string | string;
                        options?: string;
                        ports?: Array<string>;
                        volumes?: Array<string>;
                        mountReadOnly?: {
                            work?: string | string | string | string | string | string | string | string;
                            externals?: string | string | string | string | string | string | string | string;
                            tools?: string | string | string | string | string | string | string | string;
                            tasks?: string | string | string | string | string | string | string | string;
                        };
                    }>;
                    pipelines?: Array<{
                        pipeline: string;
                        project?: string;
                        source?: string;
                        version?: string;
                        branch?: string;
                        tags?: Array<string>;
                        trigger?: string | string | { enabled?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> } | Array<string>; stages?: Array<string>; tags?: Array<string> };
                    }>;
                    repositories?: Array<{
                        repository: string;
                        endpoint?: string;
                        trigger?:
                            | string
                            | Array<string>
                            | { batch?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> }; paths?: { include?: Array<string>; exclude?: Array<string> }; tags?: { include?: Array<string>; exclude?: Array<string> } };
                        checkoutOptions?: { clean?: string; fetchDepth?: string; fetchTags?: string; lfs?: string; submodules?: string; persistCredentials?: string };
                        name?: string;
                        ref?: string;
                        type?: string;
                    }>;
                    webhooks?: Array<{ webhook: string; connection: string; type?: string; filters?: Array<{ path: string; value: string }> }>;
                    packages?: Array<{ package: string; type: string; connection: string; name: string; version?: string; tag?: string; trigger?: string | string }>;
                }
              | Array<{ repo?: string; clean?: string; fetchDepth?: string; lfs?: string }>;
          variables?: {} | Array<{ name?: string; value?: string; readonly?: string | string | string | string | string | string | string | string } | { group?: string } | { template?: string; parameters?: {} }>;
          lockBehavior?: string | string;
      }
    | {
          continueOnError?: string;
          queue?: string | { cancelTimeoutInMinutes?: string; container?: string; demands?: string | Array<string>; matrix?: {} | string; name?: string; parallel?: string; timeoutInMinutes?: string; workspace?: { clean?: string } };
          steps: Array<
              | unknown
              | {
                    script: string;
                    failOnStderr?: string;
                    workingDirectory?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    powershell: string;
                    errorActionPreference?: string;
                    failOnStderr?: string;
                    ignoreLASTEXITCODE?: string;
                    workingDirectory?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    pwsh: string;
                    errorActionPreference?: string;
                    failOnStderr?: string;
                    ignoreLASTEXITCODE?: string;
                    workingDirectory?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    bash: string;
                    failOnStderr?: string;
                    workingDirectory?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    checkout?: string;
                    clean?: string;
                    fetchDepth?: string;
                    fetchFilter?: string;
                    fetchTags?: string;
                    lfs?: string;
                    persistCredentials?: string;
                    submodules?: string;
                    path?: string;
                    sparseCheckoutDirectories?: string;
                    sparseCheckoutPatterns?: string;
                    workspaceRepo?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    download: string;
                    artifact?: string;
                    patterns?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    downloadBuild?: string;
                    artifact?: string;
                    path?: string;
                    patterns?: string;
                    inputs?: {};
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    getPackage?: string;
                    path?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    upload?: string;
                    artifact?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    publish?: string;
                    artifact?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | { template?: string; parameters?: {} }
              | {
                    reviewApp?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
          >;
          name?: string;
          appendCommitMessageToRunName?: string | string | string | string | string | string | string | string;
          trigger?:
              | string
              | Array<string>
              | { batch?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> }; paths?: { include?: Array<string>; exclude?: Array<string> }; tags?: { include?: Array<string>; exclude?: Array<string> } };
          parameters?: Array<{
              name?: string;
              displayName?: string;
              type?: string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string;
              default?: string | __schema0 | {};
              values?: Array<string>;
          }>;
          pr?:
              | string
              | Array<string>
              | {
                    autoCancel?: string | string | string | string | string | string | string | string;
                    branches?: { include?: Array<string>; exclude?: Array<string> };
                    paths?: { include?: Array<string>; exclude?: Array<string> };
                    drafts?: string | string | string | string | string | string | string | string;
                };
          schedules?: Array<{ cron?: string; displayName?: string; branches?: { include?: Array<string>; exclude?: Array<string> }; batch?: string | string | string | string | string | string | string | string; always?: string | string | string | string | string | string | string | string }>;
          resources?:
              | {
                    builds?: Array<{ build: string; type: string; connection: string; source: string; version?: string; branch?: string; trigger?: string | string }>;
                    containers?: Array<{
                        container: string;
                        type?: string | string;
                        trigger?: string | string | { enabled?: string | string | string | string | string | string | string | string; tags?: Array<string> | { include?: Array<string>; exclude?: Array<string> } };
                        azureSubscription?: string;
                        resourceGroup?: string;
                        registry?: string;
                        repository?: string;
                        localImage?: string | string | string | string | string | string | string | string;
                        endpoint?: string;
                        env?: {};
                        image: string;
                        mapDockerSocket?: string | string | string | string | string | string | string | string;
                        options?: string;
                        ports?: Array<string>;
                        volumes?: Array<string>;
                        mountReadOnly?: {
                            work?: string | string | string | string | string | string | string | string;
                            externals?: string | string | string | string | string | string | string | string;
                            tools?: string | string | string | string | string | string | string | string;
                            tasks?: string | string | string | string | string | string | string | string;
                        };
                    }>;
                    pipelines?: Array<{
                        pipeline: string;
                        project?: string;
                        source?: string;
                        version?: string;
                        branch?: string;
                        tags?: Array<string>;
                        trigger?: string | string | { enabled?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> } | Array<string>; stages?: Array<string>; tags?: Array<string> };
                    }>;
                    repositories?: Array<{
                        repository: string;
                        endpoint?: string;
                        trigger?:
                            | string
                            | Array<string>
                            | { batch?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> }; paths?: { include?: Array<string>; exclude?: Array<string> }; tags?: { include?: Array<string>; exclude?: Array<string> } };
                        checkoutOptions?: { clean?: string; fetchDepth?: string; fetchTags?: string; lfs?: string; submodules?: string; persistCredentials?: string };
                        name?: string;
                        ref?: string;
                        type?: string;
                    }>;
                    webhooks?: Array<{ webhook: string; connection: string; type?: string; filters?: Array<{ path: string; value: string }> }>;
                    packages?: Array<{ package: string; type: string; connection: string; name: string; version?: string; tag?: string; trigger?: string | string }>;
                }
              | Array<{ repo?: string; clean?: string; fetchDepth?: string; lfs?: string }>;
          variables?: {} | Array<{ name?: string; value?: string; readonly?: string | string | string | string | string | string | string | string } | { group?: string } | { template?: string; parameters?: {} }>;
          lockBehavior?: string | string;
      }
    | {
          continueOnError?: string;
          server?: string | { cancelTimeoutInMinutes?: string; matrix?: {} | string; parallel?: string; timeoutInMinutes?: string };
          steps: Array<
              | unknown
              | {
                    script: string;
                    failOnStderr?: string;
                    workingDirectory?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    powershell: string;
                    errorActionPreference?: string;
                    failOnStderr?: string;
                    ignoreLASTEXITCODE?: string;
                    workingDirectory?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    pwsh: string;
                    errorActionPreference?: string;
                    failOnStderr?: string;
                    ignoreLASTEXITCODE?: string;
                    workingDirectory?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    bash: string;
                    failOnStderr?: string;
                    workingDirectory?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    checkout?: string;
                    clean?: string;
                    fetchDepth?: string;
                    fetchFilter?: string;
                    fetchTags?: string;
                    lfs?: string;
                    persistCredentials?: string;
                    submodules?: string;
                    path?: string;
                    sparseCheckoutDirectories?: string;
                    sparseCheckoutPatterns?: string;
                    workspaceRepo?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    download: string;
                    artifact?: string;
                    patterns?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    downloadBuild?: string;
                    artifact?: string;
                    path?: string;
                    patterns?: string;
                    inputs?: {};
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    getPackage?: string;
                    path?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    upload?: string;
                    artifact?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | {
                    publish?: string;
                    artifact?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
              | { template?: string; parameters?: {} }
              | {
                    reviewApp?: string;
                    condition?: string;
                    continueOnError?: string | string | string | string | string | string | string | string;
                    displayName?: string;
                    target?: string | { container?: string; commands?: string; settableVariables?: string | Array<string> };
                    enabled?: string | string | string | string | string | string | string | string;
                    env?: {};
                    name?: string;
                    timeoutInMinutes?: string;
                    retryCountOnTaskFailure?: string;
                }
          >;
          name?: string;
          appendCommitMessageToRunName?: string | string | string | string | string | string | string | string;
          trigger?:
              | string
              | Array<string>
              | { batch?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> }; paths?: { include?: Array<string>; exclude?: Array<string> }; tags?: { include?: Array<string>; exclude?: Array<string> } };
          parameters?: Array<{
              name?: string;
              displayName?: string;
              type?: string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string | string;
              default?: string | __schema0 | {};
              values?: Array<string>;
          }>;
          pr?:
              | string
              | Array<string>
              | {
                    autoCancel?: string | string | string | string | string | string | string | string;
                    branches?: { include?: Array<string>; exclude?: Array<string> };
                    paths?: { include?: Array<string>; exclude?: Array<string> };
                    drafts?: string | string | string | string | string | string | string | string;
                };
          schedules?: Array<{ cron?: string; displayName?: string; branches?: { include?: Array<string>; exclude?: Array<string> }; batch?: string | string | string | string | string | string | string | string; always?: string | string | string | string | string | string | string | string }>;
          resources?:
              | {
                    builds?: Array<{ build: string; type: string; connection: string; source: string; version?: string; branch?: string; trigger?: string | string }>;
                    containers?: Array<{
                        container: string;
                        type?: string | string;
                        trigger?: string | string | { enabled?: string | string | string | string | string | string | string | string; tags?: Array<string> | { include?: Array<string>; exclude?: Array<string> } };
                        azureSubscription?: string;
                        resourceGroup?: string;
                        registry?: string;
                        repository?: string;
                        localImage?: string | string | string | string | string | string | string | string;
                        endpoint?: string;
                        env?: {};
                        image: string;
                        mapDockerSocket?: string | string | string | string | string | string | string | string;
                        options?: string;
                        ports?: Array<string>;
                        volumes?: Array<string>;
                        mountReadOnly?: {
                            work?: string | string | string | string | string | string | string | string;
                            externals?: string | string | string | string | string | string | string | string;
                            tools?: string | string | string | string | string | string | string | string;
                            tasks?: string | string | string | string | string | string | string | string;
                        };
                    }>;
                    pipelines?: Array<{
                        pipeline: string;
                        project?: string;
                        source?: string;
                        version?: string;
                        branch?: string;
                        tags?: Array<string>;
                        trigger?: string | string | { enabled?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> } | Array<string>; stages?: Array<string>; tags?: Array<string> };
                    }>;
                    repositories?: Array<{
                        repository: string;
                        endpoint?: string;
                        trigger?:
                            | string
                            | Array<string>
                            | { batch?: string | string | string | string | string | string | string | string; branches?: { include?: Array<string>; exclude?: Array<string> }; paths?: { include?: Array<string>; exclude?: Array<string> }; tags?: { include?: Array<string>; exclude?: Array<string> } };
                        checkoutOptions?: { clean?: string; fetchDepth?: string; fetchTags?: string; lfs?: string; submodules?: string; persistCredentials?: string };
                        name?: string;
                        ref?: string;
                        type?: string;
                    }>;
                    webhooks?: Array<{ webhook: string; connection: string; type?: string; filters?: Array<{ path: string; value: string }> }>;
                    packages?: Array<{ package: string; type: string; connection: string; name: string; version?: string; tag?: string; trigger?: string | string }>;
                }
              | Array<{ repo?: string; clean?: string; fetchDepth?: string; lfs?: string }>;
          variables?: {} | Array<{ name?: string; value?: string; readonly?: string | string | string | string | string | string | string | string } | { group?: string } | { template?: string; parameters?: {} }>;
          lockBehavior?: string | string;
      }
    | string;

export type __schema0 = Array<string | __schema0 | {}>;
