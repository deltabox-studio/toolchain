// Generated from Biome's configuration_schema.json — do not edit.
// Run `yarn config:generate` to refresh.

export interface BiomeConfig {
    /** The assist configuration. */
    assist?: {
        actions?: {
            preset?: 'recommended' | 'all' | 'none' | null;
            recommended?: boolean | null;
            source?: {
                noDuplicateClasses?:
                    | 'off'
                    | 'on'
                    | {
                          level: 'off' | 'on';
                          options: {
                              attributes?: Array<string> | null;
                              functions?: Array<string> | null;
                          };
                      }
                    | null;
                organizeImports?:
                    | 'off'
                    | 'on'
                    | {
                          level: 'off' | 'on';
                          options: {
                              groups?: Array<
                                  | null
                                  | {
                                        kind?: 'bare' | '!bare' | null;
                                        source?:
                                            | ':ALIAS:'
                                            | ':BUN:'
                                            | ':NODE:'
                                            | ':PACKAGE:'
                                            | ':PACKAGE_WITH_PROTOCOL:'
                                            | ':PATH:'
                                            | ':STYLE:'
                                            | ':URL:'
                                            | '!:ALIAS:'
                                            | '!:BUN:'
                                            | '!:NODE:'
                                            | '!:PACKAGE:'
                                            | '!:PACKAGE_WITH_PROTOCOL:'
                                            | '!:PATH:'
                                            | '!:STYLE:'
                                            | '!:URL:'
                                            | string
                                            | Array<
                                                  | ':ALIAS:'
                                                  | ':BUN:'
                                                  | ':NODE:'
                                                  | ':PACKAGE:'
                                                  | ':PACKAGE_WITH_PROTOCOL:'
                                                  | ':PATH:'
                                                  | ':STYLE:'
                                                  | ':URL:'
                                                  | '!:ALIAS:'
                                                  | '!:BUN:'
                                                  | '!:NODE:'
                                                  | '!:PACKAGE:'
                                                  | '!:PACKAGE_WITH_PROTOCOL:'
                                                  | '!:PATH:'
                                                  | '!:STYLE:'
                                                  | '!:URL:'
                                                  | string
                                              >
                                            | null;
                                        type?: boolean | null;
                                    }
                                  | ':ALIAS:'
                                  | ':BUN:'
                                  | ':NODE:'
                                  | ':PACKAGE:'
                                  | ':PACKAGE_WITH_PROTOCOL:'
                                  | ':PATH:'
                                  | ':STYLE:'
                                  | ':URL:'
                                  | '!:ALIAS:'
                                  | '!:BUN:'
                                  | '!:NODE:'
                                  | '!:PACKAGE:'
                                  | '!:PACKAGE_WITH_PROTOCOL:'
                                  | '!:PATH:'
                                  | '!:STYLE:'
                                  | '!:URL:'
                                  | string
                                  | Array<
                                        | {
                                              kind?: 'bare' | '!bare' | null;
                                              source?:
                                                  | ':ALIAS:'
                                                  | ':BUN:'
                                                  | ':NODE:'
                                                  | ':PACKAGE:'
                                                  | ':PACKAGE_WITH_PROTOCOL:'
                                                  | ':PATH:'
                                                  | ':STYLE:'
                                                  | ':URL:'
                                                  | '!:ALIAS:'
                                                  | '!:BUN:'
                                                  | '!:NODE:'
                                                  | '!:PACKAGE:'
                                                  | '!:PACKAGE_WITH_PROTOCOL:'
                                                  | '!:PATH:'
                                                  | '!:STYLE:'
                                                  | '!:URL:'
                                                  | string
                                                  | Array<
                                                        | ':ALIAS:'
                                                        | ':BUN:'
                                                        | ':NODE:'
                                                        | ':PACKAGE:'
                                                        | ':PACKAGE_WITH_PROTOCOL:'
                                                        | ':PATH:'
                                                        | ':STYLE:'
                                                        | ':URL:'
                                                        | '!:ALIAS:'
                                                        | '!:BUN:'
                                                        | '!:NODE:'
                                                        | '!:PACKAGE:'
                                                        | '!:PACKAGE_WITH_PROTOCOL:'
                                                        | '!:PATH:'
                                                        | '!:STYLE:'
                                                        | '!:URL:'
                                                        | string
                                                    >
                                                  | null;
                                              type?: boolean | null;
                                          }
                                        | ':ALIAS:'
                                        | ':BUN:'
                                        | ':NODE:'
                                        | ':PACKAGE:'
                                        | ':PACKAGE_WITH_PROTOCOL:'
                                        | ':PATH:'
                                        | ':STYLE:'
                                        | ':URL:'
                                        | '!:ALIAS:'
                                        | '!:BUN:'
                                        | '!:NODE:'
                                        | '!:PACKAGE:'
                                        | '!:PACKAGE_WITH_PROTOCOL:'
                                        | '!:PATH:'
                                        | '!:STYLE:'
                                        | '!:URL:'
                                        | string
                                    >
                              > | null;
                              identifierOrder?: 'natural' | 'lexicographic' | null;
                              sortBareImports?: boolean | null;
                          };
                      }
                    | null;
                preset?: 'recommended' | 'all' | 'none' | null;
                recommended?: boolean | null;
                useSortedAttributes?:
                    | 'off'
                    | 'on'
                    | {
                          level: 'off' | 'on';
                          options: { sortOrder?: 'natural' | 'lexicographic' | null };
                      }
                    | null;
                useSortedEnumMembers?: 'off' | 'on' | { level: 'off' | 'on'; options: {} } | null;
                useSortedInterfaceMembers?:
                    | 'off'
                    | 'on'
                    | { level: 'off' | 'on'; options: {} }
                    | null;
                useSortedKeys?:
                    | 'off'
                    | 'on'
                    | {
                          level: 'off' | 'on';
                          options: {
                              groupByNesting?: boolean | null;
                              sortOrder?: 'natural' | 'lexicographic' | null;
                          };
                      }
                    | null;
                useSortedPackageJson?: 'off' | 'on' | { level: 'off' | 'on'; options: {} } | null;
                useSortedProperties?: 'off' | 'on' | { level: 'off' | 'on'; options: {} } | null;
                useSortedSelectionSet?: 'off' | 'on' | { level: 'off' | 'on'; options: {} } | null;
                useSortedTypeFields?: 'off' | 'on' | { level: 'off' | 'on'; options: {} } | null;
            } | null;
        } | null;
        enabled?: boolean | null;
        includes?: Array<string> | null;
    } | null;
    /** Configuration specific to CSS. */
    css?: {
        assist?: { enabled?: boolean | null } | null;
        formatter?: {
            delimiterSpacing?: boolean | null;
            enabled?: boolean | null;
            indentStyle?: 'tab' | 'space' | null;
            indentWidth?: number | null;
            lineEnding?: 'lf' | 'crlf' | 'cr' | 'auto' | null;
            lineWidth?: number | null;
            quoteStyle?: 'double' | 'single' | null;
            trailingNewline?: boolean | null;
        } | null;
        globals?: Array<string> | null;
        linter?: { enabled?: boolean | null } | null;
        parser?: {
            allowWrongLineComments?: boolean | null;
            cssModules?: boolean | null;
            tailwindDirectives?: boolean | null;
        } | null;
    } | null;
    /** A list of paths to other JSON files, used to extend the current configuration. */
    extends?: Array<string> | string | null;
    /** The file handling configuration. */
    files?: {
        experimentalScannerIgnores?: Array<string> | null;
        ignoreUnknown?: boolean | null;
        includes?: Array<string> | null;
        maxSize?: number | null;
    } | null;
    /** The formatter configuration. */
    formatter?: {
        attributePosition?: 'auto' | 'multiline' | null;
        bracketSameLine?: boolean | null;
        bracketSpacing?: boolean | null;
        delimiterSpacing?: boolean | null;
        enabled?: boolean | null;
        expand?: 'auto' | 'always' | 'never' | null;
        formatWithErrors?: boolean | null;
        includes?: Array<string> | null;
        indentStyle?: 'tab' | 'space' | null;
        indentWidth?: number | null;
        lineEnding?: 'lf' | 'crlf' | 'cr' | 'auto' | null;
        lineWidth?: number | null;
        trailingNewline?: boolean | null;
        useEditorconfig?: boolean | null;
    } | null;
    /** Configuration specific to GraphQL. */
    graphql?: {
        assist?: { enabled?: boolean | null } | null;
        formatter?: {
            bracketSpacing?: boolean | null;
            enabled?: boolean | null;
            indentStyle?: 'tab' | 'space' | null;
            indentWidth?: number | null;
            lineEnding?: 'lf' | 'crlf' | 'cr' | 'auto' | null;
            lineWidth?: number | null;
            quoteStyle?: 'double' | 'single' | null;
            trailingNewline?: boolean | null;
        } | null;
        linter?: { enabled?: boolean | null } | null;
    } | null;
    /** Configuration specific to GritQL. */
    grit?: {
        assist?: { enabled?: boolean | null } | null;
        formatter?: {
            enabled?: boolean | null;
            indentStyle?: 'tab' | 'space' | null;
            indentWidth?: number | null;
            lineEnding?: 'lf' | 'crlf' | 'cr' | 'auto' | null;
            lineWidth?: number | null;
            trailingNewline?: boolean | null;
        } | null;
        linter?: { enabled?: boolean | null } | null;
    } | null;
    /** Configuration specific to HTML. */
    html?: {
        assist?: { enabled?: boolean | null } | null;
        experimentalFullSupportEnabled?: boolean | null;
        formatter?: {
            attributePosition?: 'auto' | 'multiline' | null;
            bracketSameLine?: boolean | null;
            enabled?: boolean | null;
            indentScriptAndStyle?: boolean | null;
            indentStyle?: 'tab' | 'space' | null;
            indentWidth?: number | null;
            lineEnding?: 'lf' | 'crlf' | 'cr' | 'auto' | null;
            lineWidth?: number | null;
            selfCloseVoidElements?: 'never' | 'always' | null;
            trailingNewline?: boolean | null;
            whitespaceSensitivity?: 'css' | 'strict' | 'ignore' | null;
        } | null;
        linter?: { enabled?: boolean | null } | null;
        parser?: { interpolation?: boolean | null; vue?: boolean | null } | null;
    } | null;
    /** Configuration specific to JavaScript. */
    javascript?: {
        assist?: { enabled?: boolean | null } | null;
        experimentalEmbeddedSnippetsEnabled?: boolean | null;
        formatter?: {
            arrowParentheses?: 'always' | 'asNeeded' | null;
            attributePosition?: 'auto' | 'multiline' | null;
            bracketSameLine?: boolean | null;
            bracketSpacing?: boolean | null;
            delimiterSpacing?: boolean | null;
            enabled?: boolean | null;
            expand?: 'auto' | 'always' | 'never' | null;
            indentStyle?: 'tab' | 'space' | null;
            indentWidth?: number | null;
            jsxQuoteStyle?: 'double' | 'single' | null;
            lineEnding?: 'lf' | 'crlf' | 'cr' | 'auto' | null;
            lineWidth?: number | null;
            operatorLinebreak?: 'after' | 'before' | null;
            quoteProperties?: 'asNeeded' | 'preserve' | null;
            quoteStyle?: 'double' | 'single' | null;
            semicolons?: 'always' | 'asNeeded' | null;
            trailingCommas?: 'all' | 'es5' | 'none' | null;
            trailingNewline?: boolean | null;
        } | null;
        globals?: Array<string> | null;
        jsxRuntime?: 'transparent' | 'reactClassic' | null;
        linter?: { enabled?: boolean | null } | null;
        parser?: {
            gritMetavariables?: boolean | null;
            jsxEverywhere?: boolean | null;
            unsafeParameterDecoratorsEnabled?: boolean | null;
        } | null;
        resolver?: { experimentalPnpmCatalogs?: boolean | null } | null;
    } | null;
    /** Configuration specific to JSON. */
    json?: {
        assist?: { enabled?: boolean | null } | null;
        formatter?: {
            bracketSpacing?: boolean | null;
            delimiterSpacing?: boolean | null;
            enabled?: boolean | null;
            expand?: 'auto' | 'always' | 'never' | null;
            indentStyle?: 'tab' | 'space' | null;
            indentWidth?: number | null;
            lineEnding?: 'lf' | 'crlf' | 'cr' | 'auto' | null;
            lineWidth?: number | null;
            trailingCommas?: 'none' | 'all' | null;
            trailingNewline?: boolean | null;
        } | null;
        linter?: { enabled?: boolean | null } | null;
        parser?: { allowComments?: boolean | null; allowTrailingCommas?: boolean | null } | null;
    } | null;
    /** The linter configuration. */
    linter?: {
        domains?: {
            astro?: 'all' | 'none' | 'recommended';
            drizzle?: 'all' | 'none' | 'recommended';
            next?: 'all' | 'none' | 'recommended';
            playwright?: 'all' | 'none' | 'recommended';
            project?: 'all' | 'none' | 'recommended';
            qwik?: 'all' | 'none' | 'recommended';
            react?: 'all' | 'none' | 'recommended';
            reactNative?: 'all' | 'none' | 'recommended';
            solid?: 'all' | 'none' | 'recommended';
            svelte?: 'all' | 'none' | 'recommended';
            tailwind?: 'all' | 'none' | 'recommended';
            test?: 'all' | 'none' | 'recommended';
            turborepo?: 'all' | 'none' | 'recommended';
            types?: 'all' | 'none' | 'recommended';
            vue?: 'all' | 'none' | 'recommended';
        } | null;
        enabled?: boolean | null;
        includes?: Array<string> | null;
        rules?: {
            a11y?:
                | 'off'
                | 'on'
                | 'info'
                | 'warn'
                | 'error'
                | {
                      noAccessKey?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noAmbiguousAnchorText?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { words?: Array<string> | null };
                            }
                          | null;
                      noAriaHiddenOnFocusable?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noAriaUnsupportedElements?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noAutofocus?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noDistractingElements?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noHeaderScope?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noInteractiveElementToNoninteractiveRole?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noLabelWithoutControl?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    inputComponents?: Array<string> | null;
                                    labelAttributes?: Array<string> | null;
                                    labelComponents?: Array<string> | null;
                                };
                            }
                          | null;
                      noNoninteractiveElementInteractions?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noNoninteractiveElementToInteractiveRole?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noNoninteractiveTabindex?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noPositiveTabindex?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noRedundantAlt?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noRedundantRoles?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noStaticElementInteractions?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noSvgWithoutTitle?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      preset?: 'recommended' | 'all' | 'none' | null;
                      recommended?: boolean | null;
                      useAltText?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useAnchorContent?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useAriaActivedescendantWithTabindex?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useAriaPropsForRole?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useAriaPropsSupportedByRole?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useButtonType?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useFocusableInteractive?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useGenericFontNames?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useHeadingContent?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useHtmlLang?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useIframeTitle?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useKeyWithClickEvents?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useKeyWithMouseEvents?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useMediaCaption?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useSemanticElements?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useValidAnchor?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useValidAriaProps?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useValidAriaRole?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    allowInvalidRoles?: Array<string> | null;
                                    ignoreNonDom?: boolean | null;
                                };
                            }
                          | null;
                      useValidAriaValues?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useValidAutocomplete?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { inputComponents?: Array<string> | null };
                            }
                          | null;
                      useValidLang?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                  }
                | null;
            complexity?:
                | 'off'
                | 'on'
                | 'info'
                | 'warn'
                | 'error'
                | {
                      noAdjacentSpacesInRegex?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noArguments?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noBannedTypes?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noCommaOperator?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDivRegex?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noEmptyTypeParameters?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noExcessiveCognitiveComplexity?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { maxAllowedComplexity?: number | null };
                            }
                          | null;
                      noExcessiveLinesPerFunction?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    maxLines?: number | null;
                                    skipBlankLines?: boolean | null;
                                    skipIifes?: boolean | null;
                                };
                            }
                          | null;
                      noExcessiveNestedTestSuites?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noExtraBooleanCast?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noFlatMapIdentity?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noForEach?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { allowedIdentifiers?: Array<string> | null };
                            }
                          | null;
                      noImplicitCoercions?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { allowDoubleNegation?: boolean | null };
                            }
                          | null;
                      noImportantStyles?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noRedundantDefaultExport?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noStaticOnlyClass?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noThisInStatic?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessCatch?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessCatchBinding?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessConstructor?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessContinue?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessEmptyExport?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessEscapeInRegex?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessFragments?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessLabel?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessLoneBlockStatements?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessRename?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessReturn?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessStringConcat?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessStringRaw?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUselessSwitchCase?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessTernary?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessThisAlias?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessTypeConstraint?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessUndefined?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessUndefinedInitialization?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noVoid?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      preset?: 'recommended' | 'all' | 'none' | null;
                      recommended?: boolean | null;
                      useArrayFind?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useArrowFunction?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useDateNow?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useFlatMap?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useIndexOf?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useLiteralKeys?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useMaxParams?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { max?: number | null };
                            }
                          | null;
                      useNumericLiterals?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useOptionalChain?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useRegexLiterals?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useSimpleNumberKeys?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useSimplifiedLogicExpression?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useWhile?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                  }
                | null;
            correctness?:
                | 'off'
                | 'on'
                | 'info'
                | 'warn'
                | 'error'
                | {
                      noBeforeInteractiveScriptOutsideDocument?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noChildrenProp?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noConstAssign?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noConstantCondition?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noConstantMathMinMaxClamp?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noConstructorReturn?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateArgumentNames?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateAttributes?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateEnumValueNames?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateInputFieldNames?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateVariableNames?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noEmptyCharacterClassInRegex?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noEmptyPattern?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noGlobalDirnameFilename?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noGlobalObjectCalls?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noInnerDeclarations?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noInvalidBuiltinInstantiation?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noInvalidConstructorSuper?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noInvalidDirectionInLinearGradient?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noInvalidGridAreas?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noInvalidPositionAtImportRule?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noInvalidUseBeforeDeclaration?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noMissingVarFunction?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noNestedComponentDefinitions?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noNextAsyncClientComponent?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noNodejsModules?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noNonoctalDecimalEscape?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noPrecisionLoss?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noPrivateImports?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    defaultVisibility?: 'public' | 'package' | 'private' | null;
                                };
                            }
                          | null;
                      noProcessGlobal?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noQwikUseVisibleTask?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noReactPropAssignments?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noRenderReturnValue?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noRestrictedElements?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { elements?: {} | null };
                            }
                          | null;
                      noSelfAssign?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noSetterReturn?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noSolidDestructuredProps?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noStringCaseMismatch?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noSwitchDeclarations?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUndeclaredDependencies?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    bundleDependencies?: boolean | Array<string> | null;
                                    devDependencies?: boolean | Array<string> | null;
                                    optionalDependencies?: boolean | Array<string> | null;
                                    peerDependencies?: boolean | Array<string> | null;
                                };
                            }
                          | null;
                      noUndeclaredVariables?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { checkTypes?: boolean | null };
                            }
                          | null;
                      noUnknownFunction?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { ignore?: Array<string> };
                            }
                          | null;
                      noUnknownMediaFeatureName?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnknownProperty?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { ignore?: Array<string> };
                            }
                          | null;
                      noUnknownPseudoClass?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { ignore?: Array<string> };
                            }
                          | null;
                      noUnknownPseudoElement?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { ignore?: Array<string> };
                            }
                          | null;
                      noUnknownTypeSelector?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnknownUnit?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnmatchableAnbSelector?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnreachable?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnreachableSuper?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnresolvedImports?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnsafeFinally?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnsafeOptionalChaining?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnusedFunctionParameters?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { ignoreRestSiblings?: boolean | null };
                            }
                          | null;
                      noUnusedImports?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUnusedInstantiation?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnusedLabels?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUnusedPrivateClassMembers?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUnusedVariables?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    ignore?: {
                                        '*'?: Array<string> | null;
                                        class?: Array<string> | null;
                                        function?: Array<string> | null;
                                        interface?: Array<string> | null;
                                        typeAlias?: Array<string> | null;
                                        typeParameter?: Array<string> | null;
                                        variable?: Array<string> | null;
                                    } | null;
                                    ignoreRestSiblings?: boolean | null;
                                };
                            }
                          | null;
                      noVoidElementsWithChildren?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noVoidTypeReturn?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noVueDataObjectDeclaration?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noVueDuplicateKeys?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noVueReservedKeys?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noVueReservedProps?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noVueSetupPropsReactivityLoss?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noVueVIfWithVFor?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      preset?: 'recommended' | 'all' | 'none' | null;
                      recommended?: boolean | null;
                      useExhaustiveDependencies?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    hooks?: Array<{
                                        closureIndex?: number | null;
                                        dependenciesIndex?: number | null;
                                        name?: string;
                                        stableResult?:
                                            | boolean
                                            | Array<number>
                                            | Array<string>
                                            | null;
                                    }> | null;
                                    reportMissingDependenciesArray?: boolean | null;
                                    reportUnnecessaryDependencies?: boolean | null;
                                };
                            }
                          | null;
                      useGraphqlNamedOperations?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useHookAtTopLevel?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { ignore?: Array<string> | null };
                            }
                          | null;
                      useImageSize?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: null }
                          | null;
                      useImportExtensions?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    extensionMappings?: {} | null;
                                    forceJsExtensions?: boolean | null;
                                };
                            }
                          | null;
                      useInlineScriptId?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useIsNan?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useJsonImportAttributes?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useJsxKeyInIterable?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { checkShorthandFragments?: boolean | null };
                            }
                          | null;
                      useLoneAnonymousOperation?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useParseIntRadix?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useQwikClasslist?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useQwikMethodUsage?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useQwikValidLexicalScope?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useSingleJsDocAsterisk?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useUniqueElementIds?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { excludedComponents?: Array<string> | null };
                            }
                          | null;
                      useValidForDirection?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useValidTypeof?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useVueVForKey?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useVueValidTemplateRoot?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useVueValidVBind?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useVueValidVCloak?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useVueValidVElse?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useVueValidVElseIf?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useVueValidVHtml?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useVueValidVIf?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useVueValidVOn?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { modifiers?: Array<string> | null };
                            }
                          | null;
                      useVueValidVOnce?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useVueValidVPre?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useVueValidVText?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useYield?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                  }
                | null;
            nursery?:
                | 'off'
                | 'on'
                | 'info'
                | 'warn'
                | 'error'
                | {
                      noAstroSetHtmlDirective?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noBaseToString?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { ignoredTypeNames?: Array<string> | null };
                            }
                          | null;
                      noBunModules?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noComponentHookFactories?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noConditionalExpect?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDrizzleDeleteWithoutWhere?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { drizzleObjectName?: Array<string> | null };
                            }
                          | null;
                      noDrizzleUpdateWithoutWhere?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { drizzleObjectName?: Array<string> | null };
                            }
                          | null;
                      noDuplicateFieldDefinitionNames?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateSelectors?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noEmptyObjectKeys?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noExcessiveNestedCallbacks?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { max?: number | null };
                            }
                          | null;
                      noExcessiveSelectorClasses?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { maxClasses?: number | null };
                            }
                          | null;
                      noExtendNative?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { ignore?: Array<string> | null };
                            }
                          | null;
                      noFloatingPromises?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noIdenticalTestTitle?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noImpliedEval?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noInlineStyles?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noInvalidFileInputAccept?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noInvalidPropertyInitValue?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noJsRestrictedProperties?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    entries?: Array<{
                                        allowObjects?: Array<string>;
                                        allowProperties?: Array<string>;
                                        message?: string | null;
                                        object?: string | null;
                                        property?: string | null;
                                    }> | null;
                                };
                            }
                          | null;
                      noJsxLeakedDollar?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noJsxNamespace?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noLoopFunc?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noMisleadingReturnType?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noMisusedPromises?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noNegationInEqualityCheck?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noNonScalableViewport?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noPlaywrightElementHandle?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noPlaywrightEval?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noPlaywrightForceOption?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noPlaywrightMissingAwait?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noPlaywrightNetworkidle?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noPlaywrightPagePause?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noPlaywrightUselessAwait?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noPlaywrightWaitForNavigation?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noPlaywrightWaitForSelector?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noPlaywrightWaitForTimeout?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noReactNativeDeepImports?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noReactNativeLiteralColors?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noReactNativeRawText?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { skip?: Array<string> | null };
                            }
                          | null;
                      noReactStringRefs?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noRestrictedDependencies?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noSvelteAtHtmlTags?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noSvelteLegacyConst?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noSvelteUnnecessaryStateWrap?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    additionalReactiveClasses?: Array<string> | null;
                                    allowReassign?: boolean | null;
                                };
                            }
                          | null;
                      noTailwindArbitraryValue?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    attributes?: Array<string> | null;
                                    functions?: Array<string> | null;
                                };
                            }
                          | null;
                      noThisOutsideOfClass?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noTopLevelLiterals?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUndeclaredClasses?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUndeclaredCustomProperties?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnmodifiedLoopCondition?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnnecessaryTemplateExpression?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUnsafeIframeSandbox?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnsafePlusOperands?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnsafeTypeAssertion?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUntrustedLicenses?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    allow?: Array<string> | null;
                                    deny?: Array<string> | null;
                                    ignoreDeprecated?: boolean | null;
                                    requireFsfLibre?: boolean | null;
                                    requireOsiApproved?: boolean | null;
                                };
                            }
                          | null;
                      noUnusedClasses?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUselessTypeConversion?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noVueDeprecatedScopedSlots?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noVueImportCompilerMacros?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noVueRefAsOperand?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noVueVOnNumberValues?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noXorAsExponentiation?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      preset?: 'recommended' | 'all' | 'none' | null;
                      recommended?: boolean | null;
                      useArraySome?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useAstroClientOnlyDirectiveValue?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useAwaitThenable?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useBaseline?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    allowAtRules?: Array<string>;
                                    allowFunctions?: Array<string>;
                                    allowMediaConditions?: Array<string>;
                                    allowProperties?: Array<string>;
                                    allowPropertyValues?: {};
                                    allowSelectors?: Array<string>;
                                    available?: 'widely' | 'newly' | number;
                                };
                            }
                          | null;
                      useBetterDomTraversing?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useConsistentTestIt?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    function?: 'it' | 'test' | null;
                                    withinDescribe?: 'it' | 'test' | null;
                                };
                            }
                          | null;
                      useControlLabel?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useDisposables?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useDomNodeTextContent?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useDomQuerySelector?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { ignore?: Array<string> | null };
                            }
                          | null;
                      useExhaustiveSwitchCases?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useExpect?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useExplicitReturnType?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    allowExpressions?: boolean | null;
                                    allowIifes?: boolean | null;
                                    allowedNames?: Array<string> | null;
                                };
                            }
                          | null;
                      useExplicitType?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useFlatMathMinMax?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useIframeSandbox?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useImportsFirst?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useIncludes?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useLayeredStyles?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { requireImportLayers?: boolean | null };
                            }
                          | null;
                      useMathMinMax?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useModernMathApis?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useNamedCaptureGroup?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useNamedLayer?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useNullishCoalescing?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    ignoreBooleanCoercion?: boolean | null;
                                    ignoreConditionalTests?: boolean | null;
                                    ignoreIfStatements?: boolean | null;
                                    ignoreMixedLogicalExpressions?: boolean | null;
                                    ignorePrimitives?:
                                        | boolean
                                        | {
                                              bigint?: boolean;
                                              boolean?: boolean;
                                              number?: boolean;
                                              string?: boolean;
                                          }
                                        | null;
                                    ignoreTernaryTests?: boolean | null;
                                };
                            }
                          | null;
                      usePlaywrightValidDescribeCallback?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useQwikLoaderLocation?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useReactAsyncServerFunction?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useReactCompiler?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    compilationMode?: 'infer' | 'annotation' | 'all' | null;
                                };
                            }
                          | null;
                      useReactFunctionComponentDefinition?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    namedComponents?:
                                        | 'functionDeclaration'
                                        | 'functionExpression'
                                        | 'arrowFunction'
                                        | null;
                                };
                            }
                          | null;
                      useReactNamingConvention?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useReactNativePlatformComponents?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    androidPathPatterns?: Array<string> | null;
                                    iosPathPatterns?: Array<string> | null;
                                };
                            }
                          | null;
                      useReduceTypeParameter?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useRegexpExec?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useRegexpTest?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useScopedStyles?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useSortedClasses?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    attributes?: Array<string> | null;
                                    functions?: Array<string> | null;
                                };
                            }
                          | null;
                      useStringStartsEndsWith?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useSvelteRequireEachKey?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useTailwindShorthandClasses?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useTestHooksInOrder?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useTestHooksOnTop?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useThisInClassMethods?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    ignoreClassesWithImplements?:
                                        | 'none'
                                        | 'all'
                                        | 'public-fields'
                                        | null;
                                    ignoreMethods?: Array<string> | null;
                                    ignoreOverrideMethods?: boolean | null;
                                };
                            }
                          | null;
                      useUnicodeRegex?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useVarsOnTop?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useVueBaseImport?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useVueConsistentDefinePropsDeclaration?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { style?: 'type' | 'runtime' | null };
                            }
                          | null;
                      useVueNextTickPromise?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useVueValidVFor?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                  }
                | null;
            performance?:
                | 'off'
                | 'on'
                | 'info'
                | 'warn'
                | 'error'
                | {
                      noAccumulatingSpread?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noAwaitInLoops?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noBarrelFile?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDelete?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noDynamicNamespaceImportAccess?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noImgElement?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noJsxPropsBind?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noNamespaceImport?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noReExportAll?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noSyncScripts?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnwantedPolyfillio?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      preset?: 'recommended' | 'all' | 'none' | null;
                      recommended?: boolean | null;
                      useGoogleFontPreconnect?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useSolidForComponent?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useTopLevelRegex?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useVueVapor?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                  }
                | null;
            preset?: 'recommended' | 'all' | 'none' | null;
            recommended?: boolean | null;
            security?:
                | 'off'
                | 'on'
                | 'info'
                | 'warn'
                | 'error'
                | {
                      noBlankTarget?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    allowDomains?: Array<string>;
                                    allowNoReferrer?: boolean | null;
                                };
                            }
                          | null;
                      noDangerouslySetInnerHtml?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDangerouslySetInnerHtmlWithChildren?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noGlobalEval?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noScriptUrl?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noSecrets?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { entropyThreshold?: number | null };
                            }
                          | null;
                      preset?: 'recommended' | 'all' | 'none' | null;
                      recommended?: boolean | null;
                  }
                | null;
            style?:
                | 'off'
                | 'on'
                | 'info'
                | 'warn'
                | 'error'
                | {
                      noCommonJs?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noContinue?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDefaultExport?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDescendingSpecificity?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDoneCallback?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noEnum?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noExcessiveClassesPerFile?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { maxClasses?: number | null };
                            }
                          | null;
                      noExcessiveLinesPerFile?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    maxLines?: number | null;
                                    skipBlankLines?: boolean | null;
                                };
                            }
                          | null;
                      noExportedImports?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noHeadElement?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noHexColors?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noImplicitBoolean?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noIncrementDecrement?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { allowForLoopAfterthoughts?: boolean | null };
                            }
                          | null;
                      noInferrableTypes?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noJsxLiterals?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    allowedStrings?: Array<string> | null;
                                    ignoreProps?: boolean | null;
                                    noStrings?: boolean | null;
                                };
                            }
                          | null;
                      noMagicNumbers?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noMultiAssign?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noMultilineString?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noNamespace?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noNegationElse?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noNestedTernary?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noNonNullAssertion?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noParameterAssign?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { propertyAssignment?: 'allow' | 'deny' | null };
                            }
                          | null;
                      noParameterProperties?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noProcessEnv?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noRestrictedGlobals?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { deniedGlobals?: {} | null };
                            }
                          | null;
                      noRestrictedImports?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    paths?: {} | null;
                                    patterns?: Array<{
                                        group?:
                                            | ':ALIAS:'
                                            | ':BUN:'
                                            | ':NODE:'
                                            | ':PACKAGE:'
                                            | ':PACKAGE_WITH_PROTOCOL:'
                                            | ':PATH:'
                                            | ':STYLE:'
                                            | ':URL:'
                                            | '!:ALIAS:'
                                            | '!:BUN:'
                                            | '!:NODE:'
                                            | '!:PACKAGE:'
                                            | '!:PACKAGE_WITH_PROTOCOL:'
                                            | '!:PATH:'
                                            | '!:STYLE:'
                                            | '!:URL:'
                                            | string
                                            | Array<
                                                  | ':ALIAS:'
                                                  | ':BUN:'
                                                  | ':NODE:'
                                                  | ':PACKAGE:'
                                                  | ':PACKAGE_WITH_PROTOCOL:'
                                                  | ':PATH:'
                                                  | ':STYLE:'
                                                  | ':URL:'
                                                  | '!:ALIAS:'
                                                  | '!:BUN:'
                                                  | '!:NODE:'
                                                  | '!:PACKAGE:'
                                                  | '!:PACKAGE_WITH_PROTOCOL:'
                                                  | '!:PATH:'
                                                  | '!:STYLE:'
                                                  | '!:URL:'
                                                  | string
                                              >
                                            | null;
                                        importNamePattern?: string | null;
                                        invertImportNamePattern?: boolean;
                                        message?: string | null;
                                    }> | null;
                                };
                            }
                          | null;
                      noRestrictedTypes?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { types?: {} | null };
                            }
                          | null;
                      noRootType?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { disallow?: Array<string> };
                            }
                          | null;
                      noShoutyConstants?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noSubstr?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noTernary?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnusedTemplateLiteral?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessElse?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noValueAtRule?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noVueOptionsApi?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noYodaExpression?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      preset?: 'recommended' | 'all' | 'none' | null;
                      recommended?: boolean | null;
                      useArrayLiterals?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useAsConstAssertion?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useAtIndex?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useBlockStatements?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useCollapsedElseIf?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useCollapsedIf?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useComponentExportOnlyModules?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    allowConstantExport?: boolean | null;
                                    allowExportNames?: Array<string> | null;
                                };
                            }
                          | null;
                      useConsistentArrayType?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { syntax?: 'shorthand' | 'generic' | null };
                            }
                          | null;
                      useConsistentArrowReturn?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    requireForObjectLiteral?: boolean | null;
                                    style?: 'asNeeded' | 'always' | 'never' | null;
                                };
                            }
                          | null;
                      useConsistentBuiltinInstantiation?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useConsistentCurlyBraces?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useConsistentEnumValueType?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useConsistentGraphqlDescriptions?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { style?: 'block' | 'inline' | null };
                            }
                          | null;
                      useConsistentMemberAccessibility?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    accessibility?: 'noPublic' | 'explicit' | 'none' | null;
                                };
                            }
                          | null;
                      useConsistentMethodSignatures?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { style?: 'property' | 'method' | null };
                            }
                          | null;
                      useConsistentObjectDefinitions?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { syntax?: 'explicit' | 'shorthand' | null };
                            }
                          | null;
                      useConsistentTypeDefinitions?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { style?: 'interface' | 'type' | null };
                            }
                          | null;
                      useConst?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useDefaultParameterLast?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useDefaultSwitchClause?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useDeprecatedReason?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useDestructuring?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    assignmentExpression?: {
                                        array?: boolean | null;
                                        object?: boolean | null;
                                    } | null;
                                    variableDeclarator?: {
                                        array?: boolean | null;
                                        object?: boolean | null;
                                    } | null;
                                };
                            }
                          | null;
                      useEnumInitializers?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useErrorCause?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { requireCatchParameter?: boolean };
                            }
                          | null;
                      useExplicitLengthCheck?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useExponentiationOperator?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useExportType?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    style?: 'auto' | 'inlineType' | 'separatedType' | null;
                                };
                            }
                          | null;
                      useExportsLast?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useFilenamingConvention?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    filenameCases?: Array<
                                        | 'camelCase'
                                        | 'export'
                                        | 'kebab-case'
                                        | 'PascalCase'
                                        | 'snake_case'
                                    > | null;
                                    match?: string | null;
                                    requireAscii?: boolean | null;
                                    strictCase?: boolean | null;
                                };
                            }
                          | null;
                      useForOf?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useFragmentSyntax?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useGlobalThis?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useGraphqlNamingConvention?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useGroupedAccessorPairs?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useImportType?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    style?: 'auto' | 'inlineType' | 'separatedType' | null;
                                };
                            }
                          | null;
                      useInputName?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { checkInputType?: 'off' | 'loose' | 'strict' | null };
                            }
                          | null;
                      useLiteralEnumMembers?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useLoneExecutableDefinition?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useNamingConvention?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    conventions?: Array<{
                                        formats?: Array<
                                            | 'camelCase'
                                            | 'CONSTANT_CASE'
                                            | 'PascalCase'
                                            | 'snake_case'
                                        >;
                                        match?: string | null;
                                        selector?: {
                                            kind?:
                                                | 'class'
                                                | 'enum'
                                                | 'interface'
                                                | 'enumMember'
                                                | 'importNamespace'
                                                | 'exportNamespace'
                                                | 'variable'
                                                | 'const'
                                                | 'let'
                                                | 'using'
                                                | 'var'
                                                | 'catchParameter'
                                                | 'indexParameter'
                                                | 'exportAlias'
                                                | 'importAlias'
                                                | 'classGetter'
                                                | 'classSetter'
                                                | 'classMethod'
                                                | 'objectLiteralProperty'
                                                | 'objectLiteralGetter'
                                                | 'objectLiteralSetter'
                                                | 'objectLiteralMethod'
                                                | 'typeAlias'
                                                | 'any'
                                                | 'typeLike'
                                                | 'function'
                                                | 'namespaceLike'
                                                | 'namespace'
                                                | 'functionParameter'
                                                | 'typeParameter'
                                                | 'classMember'
                                                | 'classProperty'
                                                | 'objectLiteralMember'
                                                | 'typeMember'
                                                | 'typeGetter'
                                                | 'typeProperty'
                                                | 'typeSetter'
                                                | 'typeMethod';
                                            modifiers?: Array<
                                                | 'abstract'
                                                | 'private'
                                                | 'protected'
                                                | 'readonly'
                                                | 'static'
                                            >;
                                            scope?: 'any' | 'global';
                                        };
                                    }> | null;
                                    requireAscii?: boolean | null;
                                    strictCase?: boolean | null;
                                };
                            }
                          | null;
                      useNodeAssertStrict?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useNodejsImportProtocol?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useNumberNamespace?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useNumericSeparators?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    binary?: {
                                        groupLength?: number | null;
                                        minimumDigits?: number | null;
                                    } | null;
                                    decimal?: {
                                        groupLength?: number | null;
                                        minimumDigits?: number | null;
                                    } | null;
                                    hexadecimal?: {
                                        groupLength?: number | null;
                                        minimumDigits?: number | null;
                                    } | null;
                                    octal?: {
                                        groupLength?: number | null;
                                        minimumDigits?: number | null;
                                    } | null;
                                };
                            }
                          | null;
                      useObjectSpread?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useReactFunctionComponents?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useReadonlyClassProperties?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { checkAllProperties?: boolean | null };
                            }
                          | null;
                      useSelfClosingElements?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { ignoreHtmlElements?: boolean | null };
                            }
                          | null;
                      useShorthandAssign?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useShorthandFunctionType?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useSingleVarDeclarator?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useSpreadOverApply?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useSymbolDescription?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useTemplate?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useThrowNewError?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useThrowOnlyError?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useTrimStartEnd?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useUnifiedTypeSignatures?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    ignoreDifferentJsDoc?: boolean | null;
                                    ignoreDifferentlyNamedParameters?: boolean | null;
                                };
                            }
                          | null;
                      useVueConsistentVBindStyle?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { style?: 'shorthand' | 'longhand' | null };
                            }
                          | null;
                      useVueConsistentVOnStyle?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { style?: 'shorthand' | 'longhand' | null };
                            }
                          | null;
                      useVueDefineMacrosOrder?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { order?: Array<string> | null };
                            }
                          | null;
                      useVueHyphenatedAttributes?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    ignore?: Array<string> | null;
                                    ignoreTags?: Array<string> | null;
                                };
                            }
                          | null;
                      useVueMultiWordComponentNames?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { ignores?: Array<string> };
                            }
                          | null;
                  }
                | null;
            suspicious?:
                | 'off'
                | 'on'
                | 'info'
                | 'warn'
                | 'error'
                | {
                      noAlert?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noApproximativeNumericConstant?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noArrayIndexKey?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noAssignInExpressions?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noAsyncPromiseExecutor?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noBiomeFirstException?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noBitwiseOperators?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { allow?: Array<string> | null };
                            }
                          | null;
                      noCatchAssign?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noClassAssign?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noCommentText?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noCompareNegZero?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noConfusingLabels?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { allowedLabels?: Array<string> | null };
                            }
                          | null;
                      noConfusingVoidType?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noConsole?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { allow?: Array<string> | null };
                            }
                          | null;
                      noConstEnum?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noConstantBinaryExpressions?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noControlCharactersInRegex?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDebugger?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noDeprecatedImports?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDeprecatedMediaType?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { allow?: Array<string> | null };
                            }
                          | null;
                      noDocumentCookie?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDocumentImportInPage?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDoubleEquals?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { ignoreNull?: boolean | null };
                            }
                          | null;
                      noDuplicateAtImportRules?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateCase?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateClassMembers?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateCustomProperties?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateDependencies?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateElseIf?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateEnumValues?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateFields?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateFontNames?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateGraphqlOperationName?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateJsxProps?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateObjectKeys?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateParameters?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateProperties?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateSelectorsKeyframeBlock?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicateTestHooks?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noDuplicatedSpreadProps?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noEmptyBlock?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noEmptyBlockStatements?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noEmptyInterface?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noEmptySource?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { allowComments?: boolean | null };
                            }
                          | null;
                      noEqualsToNull?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noEvolvingTypes?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noExplicitAny?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noExportsInTest?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noExtraNonNullAssertion?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noFallthroughSwitchClause?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noFocusedTests?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noForIn?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noFunctionAssign?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noGlobalAssign?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noGlobalIsFinite?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noGlobalIsNan?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noHeadImportInDocument?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noImplicitAnyLet?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noImportAssign?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noImportCycles?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { ignoreTypes?: boolean | null };
                            }
                          | null;
                      noImportantInKeyframe?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noIrregularWhitespace?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noLabelVar?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noLeakedRender?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noMisleadingCharacterClass?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noMisleadingInstantiator?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noMisplacedAssertion?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noMisrefactoredShorthandAssign?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noNestedPromises?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noNonNullAssertedOptionalChain?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noOctalEscape?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noParametersOnlyUsedInRecursion?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noProto?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noPrototypeBuiltins?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noQuickfixBiome?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { additionalPaths?: Array<string> };
                            }
                          | null;
                      noReactForwardRef?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noReactSpecificProps?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noRedeclare?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noRedundantUseStrict?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noReturnAssign?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noSelfCompare?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noShadow?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    ignoreFunctionTypeParameterNameValueShadow?: boolean | null;
                                    ignoreTypeValueShadow?: boolean | null;
                                };
                            }
                          | null;
                      noShadowRestrictedNames?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noShorthandPropertyOverrides?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noSkippedTests?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noSparseArray?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noSuspiciousSemicolonInJsx?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noTemplateCurlyInString?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noThenProperty?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noTsIgnore?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUnassignedVariables?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUndeclaredEnvVars?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { allowedEnvVars?: Array<string> | null };
                            }
                          | null;
                      noUnknownAtRules?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { ignore?: Array<string> };
                            }
                          | null;
                      noUnknownAttribute?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { ignore?: Array<string> | null };
                            }
                          | null;
                      noUnnecessaryConditions?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnsafeDeclarationMerging?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUnsafeNegation?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUnusedExpressions?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noUselessEscapeInString?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noUselessRegexBackrefs?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      noVar?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noVueArrowFuncInWatch?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      noWith?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      preset?: 'recommended' | 'all' | 'none' | null;
                      recommended?: boolean | null;
                      useAdjacentOverloadSignatures?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useArraySortCompare?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useAwait?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useBiomeIgnoreFolder?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useDefaultSwitchClauseLast?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useDeprecatedDate?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { argumentName?: string | null };
                            }
                          | null;
                      useErrorMessage?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useGetterReturn?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useGoogleFontDisplay?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useGuardForIn?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                          | null;
                      useIsArray?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useIterableCallbackReturn?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {
                                    allowImplicit?: boolean | null;
                                    checkForEach?: boolean | null;
                                };
                            }
                          | null;
                      useNamespaceKeyword?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useNumberToFixedDigitsArgument?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useRequiredScripts?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: { requiredScripts?: Array<string> };
                            }
                          | null;
                      useStaticResponseMethods?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                      useStrictMode?:
                          | 'off'
                          | 'on'
                          | 'info'
                          | 'warn'
                          | 'error'
                          | {
                                fix?: 'none' | 'safe' | 'unsafe' | null;
                                level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                options?: {};
                            }
                          | null;
                  }
                | null;
        } | null;
    } | null;
    /** A list of granular patterns applied only to a subset of files. */
    overrides?: Array<{
        assist?: {
            actions?: {
                preset?: 'recommended' | 'all' | 'none' | null;
                recommended?: boolean | null;
                source?: {
                    noDuplicateClasses?:
                        | 'off'
                        | 'on'
                        | {
                              level: 'off' | 'on';
                              options: {
                                  attributes?: Array<string> | null;
                                  functions?: Array<string> | null;
                              };
                          }
                        | null;
                    organizeImports?:
                        | 'off'
                        | 'on'
                        | {
                              level: 'off' | 'on';
                              options: {
                                  groups?: Array<
                                      | null
                                      | {
                                            kind?: 'bare' | '!bare' | null;
                                            source?:
                                                | ':ALIAS:'
                                                | ':BUN:'
                                                | ':NODE:'
                                                | ':PACKAGE:'
                                                | ':PACKAGE_WITH_PROTOCOL:'
                                                | ':PATH:'
                                                | ':STYLE:'
                                                | ':URL:'
                                                | '!:ALIAS:'
                                                | '!:BUN:'
                                                | '!:NODE:'
                                                | '!:PACKAGE:'
                                                | '!:PACKAGE_WITH_PROTOCOL:'
                                                | '!:PATH:'
                                                | '!:STYLE:'
                                                | '!:URL:'
                                                | string
                                                | Array<
                                                      | ':ALIAS:'
                                                      | ':BUN:'
                                                      | ':NODE:'
                                                      | ':PACKAGE:'
                                                      | ':PACKAGE_WITH_PROTOCOL:'
                                                      | ':PATH:'
                                                      | ':STYLE:'
                                                      | ':URL:'
                                                      | '!:ALIAS:'
                                                      | '!:BUN:'
                                                      | '!:NODE:'
                                                      | '!:PACKAGE:'
                                                      | '!:PACKAGE_WITH_PROTOCOL:'
                                                      | '!:PATH:'
                                                      | '!:STYLE:'
                                                      | '!:URL:'
                                                      | string
                                                  >
                                                | null;
                                            type?: boolean | null;
                                        }
                                      | ':ALIAS:'
                                      | ':BUN:'
                                      | ':NODE:'
                                      | ':PACKAGE:'
                                      | ':PACKAGE_WITH_PROTOCOL:'
                                      | ':PATH:'
                                      | ':STYLE:'
                                      | ':URL:'
                                      | '!:ALIAS:'
                                      | '!:BUN:'
                                      | '!:NODE:'
                                      | '!:PACKAGE:'
                                      | '!:PACKAGE_WITH_PROTOCOL:'
                                      | '!:PATH:'
                                      | '!:STYLE:'
                                      | '!:URL:'
                                      | string
                                      | Array<
                                            | {
                                                  kind?: 'bare' | '!bare' | null;
                                                  source?:
                                                      | ':ALIAS:'
                                                      | ':BUN:'
                                                      | ':NODE:'
                                                      | ':PACKAGE:'
                                                      | ':PACKAGE_WITH_PROTOCOL:'
                                                      | ':PATH:'
                                                      | ':STYLE:'
                                                      | ':URL:'
                                                      | '!:ALIAS:'
                                                      | '!:BUN:'
                                                      | '!:NODE:'
                                                      | '!:PACKAGE:'
                                                      | '!:PACKAGE_WITH_PROTOCOL:'
                                                      | '!:PATH:'
                                                      | '!:STYLE:'
                                                      | '!:URL:'
                                                      | string
                                                      | Array<
                                                            | ':ALIAS:'
                                                            | ':BUN:'
                                                            | ':NODE:'
                                                            | ':PACKAGE:'
                                                            | ':PACKAGE_WITH_PROTOCOL:'
                                                            | ':PATH:'
                                                            | ':STYLE:'
                                                            | ':URL:'
                                                            | '!:ALIAS:'
                                                            | '!:BUN:'
                                                            | '!:NODE:'
                                                            | '!:PACKAGE:'
                                                            | '!:PACKAGE_WITH_PROTOCOL:'
                                                            | '!:PATH:'
                                                            | '!:STYLE:'
                                                            | '!:URL:'
                                                            | string
                                                        >
                                                      | null;
                                                  type?: boolean | null;
                                              }
                                            | ':ALIAS:'
                                            | ':BUN:'
                                            | ':NODE:'
                                            | ':PACKAGE:'
                                            | ':PACKAGE_WITH_PROTOCOL:'
                                            | ':PATH:'
                                            | ':STYLE:'
                                            | ':URL:'
                                            | '!:ALIAS:'
                                            | '!:BUN:'
                                            | '!:NODE:'
                                            | '!:PACKAGE:'
                                            | '!:PACKAGE_WITH_PROTOCOL:'
                                            | '!:PATH:'
                                            | '!:STYLE:'
                                            | '!:URL:'
                                            | string
                                        >
                                  > | null;
                                  identifierOrder?: 'natural' | 'lexicographic' | null;
                                  sortBareImports?: boolean | null;
                              };
                          }
                        | null;
                    preset?: 'recommended' | 'all' | 'none' | null;
                    recommended?: boolean | null;
                    useSortedAttributes?:
                        | 'off'
                        | 'on'
                        | {
                              level: 'off' | 'on';
                              options: { sortOrder?: 'natural' | 'lexicographic' | null };
                          }
                        | null;
                    useSortedEnumMembers?:
                        | 'off'
                        | 'on'
                        | { level: 'off' | 'on'; options: {} }
                        | null;
                    useSortedInterfaceMembers?:
                        | 'off'
                        | 'on'
                        | { level: 'off' | 'on'; options: {} }
                        | null;
                    useSortedKeys?:
                        | 'off'
                        | 'on'
                        | {
                              level: 'off' | 'on';
                              options: {
                                  groupByNesting?: boolean | null;
                                  sortOrder?: 'natural' | 'lexicographic' | null;
                              };
                          }
                        | null;
                    useSortedPackageJson?:
                        | 'off'
                        | 'on'
                        | { level: 'off' | 'on'; options: {} }
                        | null;
                    useSortedProperties?:
                        | 'off'
                        | 'on'
                        | { level: 'off' | 'on'; options: {} }
                        | null;
                    useSortedSelectionSet?:
                        | 'off'
                        | 'on'
                        | { level: 'off' | 'on'; options: {} }
                        | null;
                    useSortedTypeFields?:
                        | 'off'
                        | 'on'
                        | { level: 'off' | 'on'; options: {} }
                        | null;
                } | null;
            } | null;
            enabled?: boolean | null;
        } | null;
        css?: {
            assist?: { enabled?: boolean | null } | null;
            formatter?: {
                delimiterSpacing?: boolean | null;
                enabled?: boolean | null;
                indentStyle?: 'tab' | 'space' | null;
                indentWidth?: number | null;
                lineEnding?: 'lf' | 'crlf' | 'cr' | 'auto' | null;
                lineWidth?: number | null;
                quoteStyle?: 'double' | 'single' | null;
                trailingNewline?: boolean | null;
            } | null;
            globals?: Array<string> | null;
            linter?: { enabled?: boolean | null } | null;
            parser?: {
                allowWrongLineComments?: boolean | null;
                cssModules?: boolean | null;
                tailwindDirectives?: boolean | null;
            } | null;
        } | null;
        files?: { maxSize?: number | null } | null;
        formatter?: {
            attributePosition?: 'auto' | 'multiline' | null;
            bracketSameLine?: boolean | null;
            bracketSpacing?: boolean | null;
            delimiterSpacing?: boolean | null;
            enabled?: boolean | null;
            expand?: 'auto' | 'always' | 'never' | null;
            formatWithErrors?: boolean | null;
            indentSize?: number | null;
            indentStyle?: 'tab' | 'space' | null;
            indentWidth?: number | null;
            lineEnding?: 'lf' | 'crlf' | 'cr' | 'auto' | null;
            lineWidth?: number | null;
            trailingCommas?: 'all' | 'es5' | 'none' | null;
            trailingNewline?: boolean | null;
        } | null;
        graphql?: {
            assist?: { enabled?: boolean | null } | null;
            formatter?: {
                bracketSpacing?: boolean | null;
                enabled?: boolean | null;
                indentStyle?: 'tab' | 'space' | null;
                indentWidth?: number | null;
                lineEnding?: 'lf' | 'crlf' | 'cr' | 'auto' | null;
                lineWidth?: number | null;
                quoteStyle?: 'double' | 'single' | null;
                trailingNewline?: boolean | null;
            } | null;
            linter?: { enabled?: boolean | null } | null;
        } | null;
        grit?: {
            assist?: { enabled?: boolean | null } | null;
            formatter?: {
                enabled?: boolean | null;
                indentStyle?: 'tab' | 'space' | null;
                indentWidth?: number | null;
                lineEnding?: 'lf' | 'crlf' | 'cr' | 'auto' | null;
                lineWidth?: number | null;
                trailingNewline?: boolean | null;
            } | null;
            linter?: { enabled?: boolean | null } | null;
        } | null;
        html?: {
            assist?: { enabled?: boolean | null } | null;
            experimentalFullSupportEnabled?: boolean | null;
            formatter?: {
                attributePosition?: 'auto' | 'multiline' | null;
                bracketSameLine?: boolean | null;
                enabled?: boolean | null;
                indentScriptAndStyle?: boolean | null;
                indentStyle?: 'tab' | 'space' | null;
                indentWidth?: number | null;
                lineEnding?: 'lf' | 'crlf' | 'cr' | 'auto' | null;
                lineWidth?: number | null;
                selfCloseVoidElements?: 'never' | 'always' | null;
                trailingNewline?: boolean | null;
                whitespaceSensitivity?: 'css' | 'strict' | 'ignore' | null;
            } | null;
            linter?: { enabled?: boolean | null } | null;
            parser?: { interpolation?: boolean | null; vue?: boolean | null } | null;
        } | null;
        includes?: Array<string> | null;
        javascript?: {
            assist?: { enabled?: boolean | null } | null;
            experimentalEmbeddedSnippetsEnabled?: boolean | null;
            formatter?: {
                arrowParentheses?: 'always' | 'asNeeded' | null;
                attributePosition?: 'auto' | 'multiline' | null;
                bracketSameLine?: boolean | null;
                bracketSpacing?: boolean | null;
                delimiterSpacing?: boolean | null;
                enabled?: boolean | null;
                expand?: 'auto' | 'always' | 'never' | null;
                indentStyle?: 'tab' | 'space' | null;
                indentWidth?: number | null;
                jsxQuoteStyle?: 'double' | 'single' | null;
                lineEnding?: 'lf' | 'crlf' | 'cr' | 'auto' | null;
                lineWidth?: number | null;
                operatorLinebreak?: 'after' | 'before' | null;
                quoteProperties?: 'asNeeded' | 'preserve' | null;
                quoteStyle?: 'double' | 'single' | null;
                semicolons?: 'always' | 'asNeeded' | null;
                trailingCommas?: 'all' | 'es5' | 'none' | null;
                trailingNewline?: boolean | null;
            } | null;
            globals?: Array<string> | null;
            jsxRuntime?: 'transparent' | 'reactClassic' | null;
            linter?: { enabled?: boolean | null } | null;
            parser?: {
                gritMetavariables?: boolean | null;
                jsxEverywhere?: boolean | null;
                unsafeParameterDecoratorsEnabled?: boolean | null;
            } | null;
            resolver?: { experimentalPnpmCatalogs?: boolean | null } | null;
        } | null;
        json?: {
            assist?: { enabled?: boolean | null } | null;
            formatter?: {
                bracketSpacing?: boolean | null;
                delimiterSpacing?: boolean | null;
                enabled?: boolean | null;
                expand?: 'auto' | 'always' | 'never' | null;
                indentStyle?: 'tab' | 'space' | null;
                indentWidth?: number | null;
                lineEnding?: 'lf' | 'crlf' | 'cr' | 'auto' | null;
                lineWidth?: number | null;
                trailingCommas?: 'none' | 'all' | null;
                trailingNewline?: boolean | null;
            } | null;
            linter?: { enabled?: boolean | null } | null;
            parser?: {
                allowComments?: boolean | null;
                allowTrailingCommas?: boolean | null;
            } | null;
        } | null;
        linter?: {
            domains?: {
                astro?: 'all' | 'none' | 'recommended';
                drizzle?: 'all' | 'none' | 'recommended';
                next?: 'all' | 'none' | 'recommended';
                playwright?: 'all' | 'none' | 'recommended';
                project?: 'all' | 'none' | 'recommended';
                qwik?: 'all' | 'none' | 'recommended';
                react?: 'all' | 'none' | 'recommended';
                reactNative?: 'all' | 'none' | 'recommended';
                solid?: 'all' | 'none' | 'recommended';
                svelte?: 'all' | 'none' | 'recommended';
                tailwind?: 'all' | 'none' | 'recommended';
                test?: 'all' | 'none' | 'recommended';
                turborepo?: 'all' | 'none' | 'recommended';
                types?: 'all' | 'none' | 'recommended';
                vue?: 'all' | 'none' | 'recommended';
            } | null;
            enabled?: boolean | null;
            rules?: {
                a11y?:
                    | 'off'
                    | 'on'
                    | 'info'
                    | 'warn'
                    | 'error'
                    | {
                          noAccessKey?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noAmbiguousAnchorText?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { words?: Array<string> | null };
                                }
                              | null;
                          noAriaHiddenOnFocusable?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noAriaUnsupportedElements?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noAutofocus?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noDistractingElements?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noHeaderScope?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noInteractiveElementToNoninteractiveRole?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noLabelWithoutControl?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        inputComponents?: Array<string> | null;
                                        labelAttributes?: Array<string> | null;
                                        labelComponents?: Array<string> | null;
                                    };
                                }
                              | null;
                          noNoninteractiveElementInteractions?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noNoninteractiveElementToInteractiveRole?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noNoninteractiveTabindex?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noPositiveTabindex?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noRedundantAlt?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noRedundantRoles?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noStaticElementInteractions?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noSvgWithoutTitle?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          preset?: 'recommended' | 'all' | 'none' | null;
                          recommended?: boolean | null;
                          useAltText?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useAnchorContent?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useAriaActivedescendantWithTabindex?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useAriaPropsForRole?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useAriaPropsSupportedByRole?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useButtonType?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useFocusableInteractive?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useGenericFontNames?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useHeadingContent?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useHtmlLang?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useIframeTitle?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useKeyWithClickEvents?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useKeyWithMouseEvents?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useMediaCaption?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useSemanticElements?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useValidAnchor?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useValidAriaProps?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useValidAriaRole?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        allowInvalidRoles?: Array<string> | null;
                                        ignoreNonDom?: boolean | null;
                                    };
                                }
                              | null;
                          useValidAriaValues?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useValidAutocomplete?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { inputComponents?: Array<string> | null };
                                }
                              | null;
                          useValidLang?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                      }
                    | null;
                complexity?:
                    | 'off'
                    | 'on'
                    | 'info'
                    | 'warn'
                    | 'error'
                    | {
                          noAdjacentSpacesInRegex?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noArguments?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noBannedTypes?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noCommaOperator?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDivRegex?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noEmptyTypeParameters?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noExcessiveCognitiveComplexity?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { maxAllowedComplexity?: number | null };
                                }
                              | null;
                          noExcessiveLinesPerFunction?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        maxLines?: number | null;
                                        skipBlankLines?: boolean | null;
                                        skipIifes?: boolean | null;
                                    };
                                }
                              | null;
                          noExcessiveNestedTestSuites?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noExtraBooleanCast?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noFlatMapIdentity?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noForEach?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { allowedIdentifiers?: Array<string> | null };
                                }
                              | null;
                          noImplicitCoercions?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { allowDoubleNegation?: boolean | null };
                                }
                              | null;
                          noImportantStyles?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noRedundantDefaultExport?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noStaticOnlyClass?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noThisInStatic?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessCatch?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessCatchBinding?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessConstructor?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessContinue?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessEmptyExport?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessEscapeInRegex?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessFragments?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessLabel?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessLoneBlockStatements?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessRename?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessReturn?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessStringConcat?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessStringRaw?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUselessSwitchCase?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessTernary?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessThisAlias?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessTypeConstraint?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessUndefined?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessUndefinedInitialization?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noVoid?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          preset?: 'recommended' | 'all' | 'none' | null;
                          recommended?: boolean | null;
                          useArrayFind?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useArrowFunction?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useDateNow?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useFlatMap?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useIndexOf?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useLiteralKeys?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useMaxParams?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { max?: number | null };
                                }
                              | null;
                          useNumericLiterals?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useOptionalChain?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useRegexLiterals?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useSimpleNumberKeys?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useSimplifiedLogicExpression?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useWhile?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                      }
                    | null;
                correctness?:
                    | 'off'
                    | 'on'
                    | 'info'
                    | 'warn'
                    | 'error'
                    | {
                          noBeforeInteractiveScriptOutsideDocument?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noChildrenProp?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noConstAssign?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noConstantCondition?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noConstantMathMinMaxClamp?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noConstructorReturn?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateArgumentNames?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateAttributes?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateEnumValueNames?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateInputFieldNames?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateVariableNames?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noEmptyCharacterClassInRegex?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noEmptyPattern?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noGlobalDirnameFilename?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noGlobalObjectCalls?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noInnerDeclarations?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noInvalidBuiltinInstantiation?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noInvalidConstructorSuper?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noInvalidDirectionInLinearGradient?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noInvalidGridAreas?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noInvalidPositionAtImportRule?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noInvalidUseBeforeDeclaration?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noMissingVarFunction?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noNestedComponentDefinitions?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noNextAsyncClientComponent?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noNodejsModules?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noNonoctalDecimalEscape?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noPrecisionLoss?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noPrivateImports?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        defaultVisibility?: 'public' | 'package' | 'private' | null;
                                    };
                                }
                              | null;
                          noProcessGlobal?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noQwikUseVisibleTask?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noReactPropAssignments?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noRenderReturnValue?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noRestrictedElements?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { elements?: {} | null };
                                }
                              | null;
                          noSelfAssign?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noSetterReturn?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noSolidDestructuredProps?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noStringCaseMismatch?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noSwitchDeclarations?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUndeclaredDependencies?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        bundleDependencies?: boolean | Array<string> | null;
                                        devDependencies?: boolean | Array<string> | null;
                                        optionalDependencies?: boolean | Array<string> | null;
                                        peerDependencies?: boolean | Array<string> | null;
                                    };
                                }
                              | null;
                          noUndeclaredVariables?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { checkTypes?: boolean | null };
                                }
                              | null;
                          noUnknownFunction?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { ignore?: Array<string> };
                                }
                              | null;
                          noUnknownMediaFeatureName?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnknownProperty?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { ignore?: Array<string> };
                                }
                              | null;
                          noUnknownPseudoClass?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { ignore?: Array<string> };
                                }
                              | null;
                          noUnknownPseudoElement?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { ignore?: Array<string> };
                                }
                              | null;
                          noUnknownTypeSelector?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnknownUnit?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnmatchableAnbSelector?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnreachable?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnreachableSuper?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnresolvedImports?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnsafeFinally?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnsafeOptionalChaining?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnusedFunctionParameters?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { ignoreRestSiblings?: boolean | null };
                                }
                              | null;
                          noUnusedImports?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUnusedInstantiation?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnusedLabels?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUnusedPrivateClassMembers?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUnusedVariables?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        ignore?: {
                                            '*'?: Array<string> | null;
                                            class?: Array<string> | null;
                                            function?: Array<string> | null;
                                            interface?: Array<string> | null;
                                            typeAlias?: Array<string> | null;
                                            typeParameter?: Array<string> | null;
                                            variable?: Array<string> | null;
                                        } | null;
                                        ignoreRestSiblings?: boolean | null;
                                    };
                                }
                              | null;
                          noVoidElementsWithChildren?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noVoidTypeReturn?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noVueDataObjectDeclaration?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noVueDuplicateKeys?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noVueReservedKeys?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noVueReservedProps?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noVueSetupPropsReactivityLoss?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noVueVIfWithVFor?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          preset?: 'recommended' | 'all' | 'none' | null;
                          recommended?: boolean | null;
                          useExhaustiveDependencies?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        hooks?: Array<{
                                            closureIndex?: number | null;
                                            dependenciesIndex?: number | null;
                                            name?: string;
                                            stableResult?:
                                                | boolean
                                                | Array<number>
                                                | Array<string>
                                                | null;
                                        }> | null;
                                        reportMissingDependenciesArray?: boolean | null;
                                        reportUnnecessaryDependencies?: boolean | null;
                                    };
                                }
                              | null;
                          useGraphqlNamedOperations?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useHookAtTopLevel?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { ignore?: Array<string> | null };
                                }
                              | null;
                          useImageSize?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: null }
                              | null;
                          useImportExtensions?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        extensionMappings?: {} | null;
                                        forceJsExtensions?: boolean | null;
                                    };
                                }
                              | null;
                          useInlineScriptId?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useIsNan?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useJsonImportAttributes?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useJsxKeyInIterable?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { checkShorthandFragments?: boolean | null };
                                }
                              | null;
                          useLoneAnonymousOperation?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useParseIntRadix?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useQwikClasslist?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useQwikMethodUsage?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useQwikValidLexicalScope?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useSingleJsDocAsterisk?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useUniqueElementIds?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { excludedComponents?: Array<string> | null };
                                }
                              | null;
                          useValidForDirection?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useValidTypeof?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useVueVForKey?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useVueValidTemplateRoot?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useVueValidVBind?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useVueValidVCloak?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useVueValidVElse?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useVueValidVElseIf?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useVueValidVHtml?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useVueValidVIf?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useVueValidVOn?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { modifiers?: Array<string> | null };
                                }
                              | null;
                          useVueValidVOnce?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useVueValidVPre?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useVueValidVText?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useYield?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                      }
                    | null;
                nursery?:
                    | 'off'
                    | 'on'
                    | 'info'
                    | 'warn'
                    | 'error'
                    | {
                          noAstroSetHtmlDirective?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noBaseToString?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { ignoredTypeNames?: Array<string> | null };
                                }
                              | null;
                          noBunModules?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noComponentHookFactories?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noConditionalExpect?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDrizzleDeleteWithoutWhere?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { drizzleObjectName?: Array<string> | null };
                                }
                              | null;
                          noDrizzleUpdateWithoutWhere?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { drizzleObjectName?: Array<string> | null };
                                }
                              | null;
                          noDuplicateFieldDefinitionNames?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateSelectors?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noEmptyObjectKeys?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noExcessiveNestedCallbacks?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { max?: number | null };
                                }
                              | null;
                          noExcessiveSelectorClasses?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { maxClasses?: number | null };
                                }
                              | null;
                          noExtendNative?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { ignore?: Array<string> | null };
                                }
                              | null;
                          noFloatingPromises?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noIdenticalTestTitle?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noImpliedEval?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noInlineStyles?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noInvalidFileInputAccept?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noInvalidPropertyInitValue?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noJsRestrictedProperties?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        entries?: Array<{
                                            allowObjects?: Array<string>;
                                            allowProperties?: Array<string>;
                                            message?: string | null;
                                            object?: string | null;
                                            property?: string | null;
                                        }> | null;
                                    };
                                }
                              | null;
                          noJsxLeakedDollar?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noJsxNamespace?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noLoopFunc?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noMisleadingReturnType?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noMisusedPromises?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noNegationInEqualityCheck?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noNonScalableViewport?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noPlaywrightElementHandle?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noPlaywrightEval?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noPlaywrightForceOption?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noPlaywrightMissingAwait?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noPlaywrightNetworkidle?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noPlaywrightPagePause?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noPlaywrightUselessAwait?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noPlaywrightWaitForNavigation?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noPlaywrightWaitForSelector?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noPlaywrightWaitForTimeout?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noReactNativeDeepImports?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noReactNativeLiteralColors?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noReactNativeRawText?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { skip?: Array<string> | null };
                                }
                              | null;
                          noReactStringRefs?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noRestrictedDependencies?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noSvelteAtHtmlTags?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noSvelteLegacyConst?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noSvelteUnnecessaryStateWrap?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        additionalReactiveClasses?: Array<string> | null;
                                        allowReassign?: boolean | null;
                                    };
                                }
                              | null;
                          noTailwindArbitraryValue?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        attributes?: Array<string> | null;
                                        functions?: Array<string> | null;
                                    };
                                }
                              | null;
                          noThisOutsideOfClass?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noTopLevelLiterals?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUndeclaredClasses?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUndeclaredCustomProperties?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnmodifiedLoopCondition?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnnecessaryTemplateExpression?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUnsafeIframeSandbox?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnsafePlusOperands?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnsafeTypeAssertion?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUntrustedLicenses?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        allow?: Array<string> | null;
                                        deny?: Array<string> | null;
                                        ignoreDeprecated?: boolean | null;
                                        requireFsfLibre?: boolean | null;
                                        requireOsiApproved?: boolean | null;
                                    };
                                }
                              | null;
                          noUnusedClasses?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUselessTypeConversion?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noVueDeprecatedScopedSlots?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noVueImportCompilerMacros?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noVueRefAsOperand?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noVueVOnNumberValues?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noXorAsExponentiation?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          preset?: 'recommended' | 'all' | 'none' | null;
                          recommended?: boolean | null;
                          useArraySome?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useAstroClientOnlyDirectiveValue?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useAwaitThenable?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useBaseline?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        allowAtRules?: Array<string>;
                                        allowFunctions?: Array<string>;
                                        allowMediaConditions?: Array<string>;
                                        allowProperties?: Array<string>;
                                        allowPropertyValues?: {};
                                        allowSelectors?: Array<string>;
                                        available?: 'widely' | 'newly' | number;
                                    };
                                }
                              | null;
                          useBetterDomTraversing?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useConsistentTestIt?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        function?: 'it' | 'test' | null;
                                        withinDescribe?: 'it' | 'test' | null;
                                    };
                                }
                              | null;
                          useControlLabel?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useDisposables?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useDomNodeTextContent?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useDomQuerySelector?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { ignore?: Array<string> | null };
                                }
                              | null;
                          useExhaustiveSwitchCases?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useExpect?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useExplicitReturnType?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        allowExpressions?: boolean | null;
                                        allowIifes?: boolean | null;
                                        allowedNames?: Array<string> | null;
                                    };
                                }
                              | null;
                          useExplicitType?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useFlatMathMinMax?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useIframeSandbox?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useImportsFirst?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useIncludes?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useLayeredStyles?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { requireImportLayers?: boolean | null };
                                }
                              | null;
                          useMathMinMax?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useModernMathApis?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useNamedCaptureGroup?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useNamedLayer?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useNullishCoalescing?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        ignoreBooleanCoercion?: boolean | null;
                                        ignoreConditionalTests?: boolean | null;
                                        ignoreIfStatements?: boolean | null;
                                        ignoreMixedLogicalExpressions?: boolean | null;
                                        ignorePrimitives?:
                                            | boolean
                                            | {
                                                  bigint?: boolean;
                                                  boolean?: boolean;
                                                  number?: boolean;
                                                  string?: boolean;
                                              }
                                            | null;
                                        ignoreTernaryTests?: boolean | null;
                                    };
                                }
                              | null;
                          usePlaywrightValidDescribeCallback?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useQwikLoaderLocation?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useReactAsyncServerFunction?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useReactCompiler?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        compilationMode?: 'infer' | 'annotation' | 'all' | null;
                                    };
                                }
                              | null;
                          useReactFunctionComponentDefinition?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        namedComponents?:
                                            | 'functionDeclaration'
                                            | 'functionExpression'
                                            | 'arrowFunction'
                                            | null;
                                    };
                                }
                              | null;
                          useReactNamingConvention?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useReactNativePlatformComponents?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        androidPathPatterns?: Array<string> | null;
                                        iosPathPatterns?: Array<string> | null;
                                    };
                                }
                              | null;
                          useReduceTypeParameter?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useRegexpExec?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useRegexpTest?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useScopedStyles?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useSortedClasses?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        attributes?: Array<string> | null;
                                        functions?: Array<string> | null;
                                    };
                                }
                              | null;
                          useStringStartsEndsWith?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useSvelteRequireEachKey?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useTailwindShorthandClasses?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useTestHooksInOrder?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useTestHooksOnTop?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useThisInClassMethods?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        ignoreClassesWithImplements?:
                                            | 'none'
                                            | 'all'
                                            | 'public-fields'
                                            | null;
                                        ignoreMethods?: Array<string> | null;
                                        ignoreOverrideMethods?: boolean | null;
                                    };
                                }
                              | null;
                          useUnicodeRegex?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useVarsOnTop?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useVueBaseImport?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useVueConsistentDefinePropsDeclaration?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { style?: 'type' | 'runtime' | null };
                                }
                              | null;
                          useVueNextTickPromise?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useVueValidVFor?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                      }
                    | null;
                performance?:
                    | 'off'
                    | 'on'
                    | 'info'
                    | 'warn'
                    | 'error'
                    | {
                          noAccumulatingSpread?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noAwaitInLoops?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noBarrelFile?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDelete?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noDynamicNamespaceImportAccess?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noImgElement?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noJsxPropsBind?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noNamespaceImport?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noReExportAll?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noSyncScripts?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnwantedPolyfillio?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          preset?: 'recommended' | 'all' | 'none' | null;
                          recommended?: boolean | null;
                          useGoogleFontPreconnect?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useSolidForComponent?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useTopLevelRegex?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useVueVapor?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                      }
                    | null;
                preset?: 'recommended' | 'all' | 'none' | null;
                recommended?: boolean | null;
                security?:
                    | 'off'
                    | 'on'
                    | 'info'
                    | 'warn'
                    | 'error'
                    | {
                          noBlankTarget?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        allowDomains?: Array<string>;
                                        allowNoReferrer?: boolean | null;
                                    };
                                }
                              | null;
                          noDangerouslySetInnerHtml?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDangerouslySetInnerHtmlWithChildren?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noGlobalEval?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noScriptUrl?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noSecrets?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { entropyThreshold?: number | null };
                                }
                              | null;
                          preset?: 'recommended' | 'all' | 'none' | null;
                          recommended?: boolean | null;
                      }
                    | null;
                style?:
                    | 'off'
                    | 'on'
                    | 'info'
                    | 'warn'
                    | 'error'
                    | {
                          noCommonJs?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noContinue?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDefaultExport?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDescendingSpecificity?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDoneCallback?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noEnum?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noExcessiveClassesPerFile?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { maxClasses?: number | null };
                                }
                              | null;
                          noExcessiveLinesPerFile?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        maxLines?: number | null;
                                        skipBlankLines?: boolean | null;
                                    };
                                }
                              | null;
                          noExportedImports?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noHeadElement?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noHexColors?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noImplicitBoolean?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noIncrementDecrement?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { allowForLoopAfterthoughts?: boolean | null };
                                }
                              | null;
                          noInferrableTypes?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noJsxLiterals?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        allowedStrings?: Array<string> | null;
                                        ignoreProps?: boolean | null;
                                        noStrings?: boolean | null;
                                    };
                                }
                              | null;
                          noMagicNumbers?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noMultiAssign?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noMultilineString?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noNamespace?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noNegationElse?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noNestedTernary?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noNonNullAssertion?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noParameterAssign?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { propertyAssignment?: 'allow' | 'deny' | null };
                                }
                              | null;
                          noParameterProperties?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noProcessEnv?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noRestrictedGlobals?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { deniedGlobals?: {} | null };
                                }
                              | null;
                          noRestrictedImports?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        paths?: {} | null;
                                        patterns?: Array<{
                                            group?:
                                                | ':ALIAS:'
                                                | ':BUN:'
                                                | ':NODE:'
                                                | ':PACKAGE:'
                                                | ':PACKAGE_WITH_PROTOCOL:'
                                                | ':PATH:'
                                                | ':STYLE:'
                                                | ':URL:'
                                                | '!:ALIAS:'
                                                | '!:BUN:'
                                                | '!:NODE:'
                                                | '!:PACKAGE:'
                                                | '!:PACKAGE_WITH_PROTOCOL:'
                                                | '!:PATH:'
                                                | '!:STYLE:'
                                                | '!:URL:'
                                                | string
                                                | Array<
                                                      | ':ALIAS:'
                                                      | ':BUN:'
                                                      | ':NODE:'
                                                      | ':PACKAGE:'
                                                      | ':PACKAGE_WITH_PROTOCOL:'
                                                      | ':PATH:'
                                                      | ':STYLE:'
                                                      | ':URL:'
                                                      | '!:ALIAS:'
                                                      | '!:BUN:'
                                                      | '!:NODE:'
                                                      | '!:PACKAGE:'
                                                      | '!:PACKAGE_WITH_PROTOCOL:'
                                                      | '!:PATH:'
                                                      | '!:STYLE:'
                                                      | '!:URL:'
                                                      | string
                                                  >
                                                | null;
                                            importNamePattern?: string | null;
                                            invertImportNamePattern?: boolean;
                                            message?: string | null;
                                        }> | null;
                                    };
                                }
                              | null;
                          noRestrictedTypes?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { types?: {} | null };
                                }
                              | null;
                          noRootType?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { disallow?: Array<string> };
                                }
                              | null;
                          noShoutyConstants?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noSubstr?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noTernary?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnusedTemplateLiteral?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessElse?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noValueAtRule?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noVueOptionsApi?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noYodaExpression?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          preset?: 'recommended' | 'all' | 'none' | null;
                          recommended?: boolean | null;
                          useArrayLiterals?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useAsConstAssertion?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useAtIndex?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useBlockStatements?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useCollapsedElseIf?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useCollapsedIf?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useComponentExportOnlyModules?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        allowConstantExport?: boolean | null;
                                        allowExportNames?: Array<string> | null;
                                    };
                                }
                              | null;
                          useConsistentArrayType?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { syntax?: 'shorthand' | 'generic' | null };
                                }
                              | null;
                          useConsistentArrowReturn?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        requireForObjectLiteral?: boolean | null;
                                        style?: 'asNeeded' | 'always' | 'never' | null;
                                    };
                                }
                              | null;
                          useConsistentBuiltinInstantiation?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useConsistentCurlyBraces?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useConsistentEnumValueType?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useConsistentGraphqlDescriptions?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { style?: 'block' | 'inline' | null };
                                }
                              | null;
                          useConsistentMemberAccessibility?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        accessibility?: 'noPublic' | 'explicit' | 'none' | null;
                                    };
                                }
                              | null;
                          useConsistentMethodSignatures?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { style?: 'property' | 'method' | null };
                                }
                              | null;
                          useConsistentObjectDefinitions?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { syntax?: 'explicit' | 'shorthand' | null };
                                }
                              | null;
                          useConsistentTypeDefinitions?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { style?: 'interface' | 'type' | null };
                                }
                              | null;
                          useConst?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useDefaultParameterLast?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useDefaultSwitchClause?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useDeprecatedReason?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useDestructuring?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        assignmentExpression?: {
                                            array?: boolean | null;
                                            object?: boolean | null;
                                        } | null;
                                        variableDeclarator?: {
                                            array?: boolean | null;
                                            object?: boolean | null;
                                        } | null;
                                    };
                                }
                              | null;
                          useEnumInitializers?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useErrorCause?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { requireCatchParameter?: boolean };
                                }
                              | null;
                          useExplicitLengthCheck?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useExponentiationOperator?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useExportType?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        style?: 'auto' | 'inlineType' | 'separatedType' | null;
                                    };
                                }
                              | null;
                          useExportsLast?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useFilenamingConvention?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        filenameCases?: Array<
                                            | 'camelCase'
                                            | 'export'
                                            | 'kebab-case'
                                            | 'PascalCase'
                                            | 'snake_case'
                                        > | null;
                                        match?: string | null;
                                        requireAscii?: boolean | null;
                                        strictCase?: boolean | null;
                                    };
                                }
                              | null;
                          useForOf?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useFragmentSyntax?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useGlobalThis?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useGraphqlNamingConvention?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useGroupedAccessorPairs?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useImportType?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        style?: 'auto' | 'inlineType' | 'separatedType' | null;
                                    };
                                }
                              | null;
                          useInputName?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        checkInputType?: 'off' | 'loose' | 'strict' | null;
                                    };
                                }
                              | null;
                          useLiteralEnumMembers?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useLoneExecutableDefinition?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useNamingConvention?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        conventions?: Array<{
                                            formats?: Array<
                                                | 'camelCase'
                                                | 'CONSTANT_CASE'
                                                | 'PascalCase'
                                                | 'snake_case'
                                            >;
                                            match?: string | null;
                                            selector?: {
                                                kind?:
                                                    | 'class'
                                                    | 'enum'
                                                    | 'interface'
                                                    | 'enumMember'
                                                    | 'importNamespace'
                                                    | 'exportNamespace'
                                                    | 'variable'
                                                    | 'const'
                                                    | 'let'
                                                    | 'using'
                                                    | 'var'
                                                    | 'catchParameter'
                                                    | 'indexParameter'
                                                    | 'exportAlias'
                                                    | 'importAlias'
                                                    | 'classGetter'
                                                    | 'classSetter'
                                                    | 'classMethod'
                                                    | 'objectLiteralProperty'
                                                    | 'objectLiteralGetter'
                                                    | 'objectLiteralSetter'
                                                    | 'objectLiteralMethod'
                                                    | 'typeAlias'
                                                    | 'any'
                                                    | 'typeLike'
                                                    | 'function'
                                                    | 'namespaceLike'
                                                    | 'namespace'
                                                    | 'functionParameter'
                                                    | 'typeParameter'
                                                    | 'classMember'
                                                    | 'classProperty'
                                                    | 'objectLiteralMember'
                                                    | 'typeMember'
                                                    | 'typeGetter'
                                                    | 'typeProperty'
                                                    | 'typeSetter'
                                                    | 'typeMethod';
                                                modifiers?: Array<
                                                    | 'abstract'
                                                    | 'private'
                                                    | 'protected'
                                                    | 'readonly'
                                                    | 'static'
                                                >;
                                                scope?: 'any' | 'global';
                                            };
                                        }> | null;
                                        requireAscii?: boolean | null;
                                        strictCase?: boolean | null;
                                    };
                                }
                              | null;
                          useNodeAssertStrict?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useNodejsImportProtocol?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useNumberNamespace?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useNumericSeparators?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        binary?: {
                                            groupLength?: number | null;
                                            minimumDigits?: number | null;
                                        } | null;
                                        decimal?: {
                                            groupLength?: number | null;
                                            minimumDigits?: number | null;
                                        } | null;
                                        hexadecimal?: {
                                            groupLength?: number | null;
                                            minimumDigits?: number | null;
                                        } | null;
                                        octal?: {
                                            groupLength?: number | null;
                                            minimumDigits?: number | null;
                                        } | null;
                                    };
                                }
                              | null;
                          useObjectSpread?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useReactFunctionComponents?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useReadonlyClassProperties?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { checkAllProperties?: boolean | null };
                                }
                              | null;
                          useSelfClosingElements?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { ignoreHtmlElements?: boolean | null };
                                }
                              | null;
                          useShorthandAssign?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useShorthandFunctionType?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useSingleVarDeclarator?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useSpreadOverApply?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useSymbolDescription?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useTemplate?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useThrowNewError?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useThrowOnlyError?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useTrimStartEnd?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useUnifiedTypeSignatures?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        ignoreDifferentJsDoc?: boolean | null;
                                        ignoreDifferentlyNamedParameters?: boolean | null;
                                    };
                                }
                              | null;
                          useVueConsistentVBindStyle?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { style?: 'shorthand' | 'longhand' | null };
                                }
                              | null;
                          useVueConsistentVOnStyle?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { style?: 'shorthand' | 'longhand' | null };
                                }
                              | null;
                          useVueDefineMacrosOrder?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { order?: Array<string> | null };
                                }
                              | null;
                          useVueHyphenatedAttributes?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        ignore?: Array<string> | null;
                                        ignoreTags?: Array<string> | null;
                                    };
                                }
                              | null;
                          useVueMultiWordComponentNames?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { ignores?: Array<string> };
                                }
                              | null;
                      }
                    | null;
                suspicious?:
                    | 'off'
                    | 'on'
                    | 'info'
                    | 'warn'
                    | 'error'
                    | {
                          noAlert?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noApproximativeNumericConstant?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noArrayIndexKey?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noAssignInExpressions?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noAsyncPromiseExecutor?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noBiomeFirstException?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noBitwiseOperators?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { allow?: Array<string> | null };
                                }
                              | null;
                          noCatchAssign?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noClassAssign?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noCommentText?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noCompareNegZero?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noConfusingLabels?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { allowedLabels?: Array<string> | null };
                                }
                              | null;
                          noConfusingVoidType?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noConsole?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { allow?: Array<string> | null };
                                }
                              | null;
                          noConstEnum?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noConstantBinaryExpressions?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noControlCharactersInRegex?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDebugger?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noDeprecatedImports?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDeprecatedMediaType?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { allow?: Array<string> | null };
                                }
                              | null;
                          noDocumentCookie?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDocumentImportInPage?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDoubleEquals?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { ignoreNull?: boolean | null };
                                }
                              | null;
                          noDuplicateAtImportRules?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateCase?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateClassMembers?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateCustomProperties?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateDependencies?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateElseIf?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateEnumValues?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateFields?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateFontNames?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateGraphqlOperationName?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateJsxProps?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateObjectKeys?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateParameters?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateProperties?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateSelectorsKeyframeBlock?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicateTestHooks?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noDuplicatedSpreadProps?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noEmptyBlock?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noEmptyBlockStatements?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noEmptyInterface?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noEmptySource?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { allowComments?: boolean | null };
                                }
                              | null;
                          noEqualsToNull?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noEvolvingTypes?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noExplicitAny?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noExportsInTest?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noExtraNonNullAssertion?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noFallthroughSwitchClause?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noFocusedTests?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noForIn?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noFunctionAssign?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noGlobalAssign?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noGlobalIsFinite?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noGlobalIsNan?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noHeadImportInDocument?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noImplicitAnyLet?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noImportAssign?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noImportCycles?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { ignoreTypes?: boolean | null };
                                }
                              | null;
                          noImportantInKeyframe?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noIrregularWhitespace?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noLabelVar?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noLeakedRender?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noMisleadingCharacterClass?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noMisleadingInstantiator?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noMisplacedAssertion?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noMisrefactoredShorthandAssign?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noNestedPromises?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noNonNullAssertedOptionalChain?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noOctalEscape?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noParametersOnlyUsedInRecursion?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noProto?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noPrototypeBuiltins?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noQuickfixBiome?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { additionalPaths?: Array<string> };
                                }
                              | null;
                          noReactForwardRef?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noReactSpecificProps?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noRedeclare?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noRedundantUseStrict?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noReturnAssign?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noSelfCompare?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noShadow?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        ignoreFunctionTypeParameterNameValueShadow?: boolean | null;
                                        ignoreTypeValueShadow?: boolean | null;
                                    };
                                }
                              | null;
                          noShadowRestrictedNames?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noShorthandPropertyOverrides?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noSkippedTests?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noSparseArray?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noSuspiciousSemicolonInJsx?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noTemplateCurlyInString?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noThenProperty?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noTsIgnore?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUnassignedVariables?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUndeclaredEnvVars?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { allowedEnvVars?: Array<string> | null };
                                }
                              | null;
                          noUnknownAtRules?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { ignore?: Array<string> };
                                }
                              | null;
                          noUnknownAttribute?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { ignore?: Array<string> | null };
                                }
                              | null;
                          noUnnecessaryConditions?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnsafeDeclarationMerging?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUnsafeNegation?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUnusedExpressions?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noUselessEscapeInString?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noUselessRegexBackrefs?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          noVar?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noVueArrowFuncInWatch?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          noWith?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          preset?: 'recommended' | 'all' | 'none' | null;
                          recommended?: boolean | null;
                          useAdjacentOverloadSignatures?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useArraySortCompare?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useAwait?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useBiomeIgnoreFolder?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useDefaultSwitchClauseLast?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useDeprecatedDate?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { argumentName?: string | null };
                                }
                              | null;
                          useErrorMessage?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useGetterReturn?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useGoogleFontDisplay?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useGuardForIn?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | { level: 'off' | 'on' | 'info' | 'warn' | 'error'; options?: {} }
                              | null;
                          useIsArray?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useIterableCallbackReturn?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {
                                        allowImplicit?: boolean | null;
                                        checkForEach?: boolean | null;
                                    };
                                }
                              | null;
                          useNamespaceKeyword?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useNumberToFixedDigitsArgument?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useRequiredScripts?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: { requiredScripts?: Array<string> };
                                }
                              | null;
                          useStaticResponseMethods?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                          useStrictMode?:
                              | 'off'
                              | 'on'
                              | 'info'
                              | 'warn'
                              | 'error'
                              | {
                                    fix?: 'none' | 'safe' | 'unsafe' | null;
                                    level: 'off' | 'on' | 'info' | 'warn' | 'error';
                                    options?: {};
                                }
                              | null;
                      }
                    | null;
            } | null;
        } | null;
        plugins?: Array<string | { includes?: Array<string> | null; path: string }> | null;
    }> | null;
    /** List of plugins to load. */
    plugins?: Array<string | { includes?: Array<string> | null; path: string }> | null;
    /**
     * Indicates whether this configuration file is at the root of a Biome project. By default, this is
     * `true`.
     */
    root?: boolean | null;
    /** The version control integration configuration. */
    vcs?: {
        clientKind?: 'git' | null;
        defaultBranch?: string | null;
        enabled?: boolean | null;
        root?: string | null;
        useIgnoreFile?: boolean | null;
    } | null;
}
