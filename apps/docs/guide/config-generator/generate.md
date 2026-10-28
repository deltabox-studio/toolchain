# Generate

Every generator is a method on the bound engine:

```ts
engine.collectVars(); // ConfigDef[] across every scope
engine.requiredVars('server'); // required var names for a scope

engine.writeEnvFile({ output: '.env.example' });
engine.writeEnvTypes({ outputDir: 'types' });
engine.writeConfigTypes({ outputDir: 'types' });
engine.writeJsonSchema({ output: 'config.schema.json' });
engine.writeMarkdown({ outputDir: 'docs/reference/configuration' });

engine.generateCliOptions({ output: 'cli-options.json' });
engine.buildConfigJson(); // the config metadata document
```
