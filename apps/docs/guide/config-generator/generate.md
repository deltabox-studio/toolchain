# Generate

Every generator is a method on the bound engine:

```ts
engine.collectEnvVars(); // EnvVarDef[] across every scope
engine.requiredEnvVars('server'); // required var names for a scope

engine.writeEnvFile({ output: '.env.example' });
engine.writeEnvTypes({ outputDir: 'types' });
engine.writeConfigTypes({ outputDir: 'types' });
engine.writeJsonSchema({ output: 'config.schema.json' });
engine.writeMarkdown({ outDir: 'docs/reference/configuration' });

engine.generateCliOptions({ output: 'cli-options.json' });
engine.buildConfigJson(); // the config metadata document
```
