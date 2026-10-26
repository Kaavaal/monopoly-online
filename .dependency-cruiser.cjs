// Architecture rules for monopoly-online, adapted from the course's stage-3-hexagonal config.
//
// Contexts are the folders under src/ other than shared/. Rules are written for any context,
// so a new context folder is covered without editing this file.
// src/app.ts and src/index.ts sit outside every context: they are the wiring layer and may
// import any module.ts.

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-no-infra',
      comment: 'domain/ knows nothing about SQLite, HTTP or other adapters.',
      severity: 'error',
      from: { path: '^src/[^/]+/domain(/|$)' },
      to: { path: '^src/[^/]+/infra(/|$)' },
    },
    {
      name: 'domain-no-app',
      comment: 'domain/ is the base layer; app/ depends on it, never the reverse.',
      severity: 'error',
      from: { path: '^src/[^/]+/domain(/|$)' },
      to: { path: '^src/[^/]+/app(/|$)' },
    },
    {
      name: 'app-no-infra',
      comment: 'app/ talks to adapters only through interfaces declared in domain/.',
      severity: 'error',
      from: { path: '^src/[^/]+/app(/|$)' },
      to: { path: '^src/[^/]+/infra(/|$)' },
    },
    {
      name: 'no-cross-context-internals',
      comment:
        'A context may import another context only through src/<other>/module.ts (its public api). ' +
        'Everything else in a context folder is private.',
      severity: 'error',
      from: { path: '^src/([^/]+)/', pathNot: '^src/shared/' },
      to: {
        path: '^src/[^/]+/',
        pathNot: ['^src/$1/', '^src/shared/', '^src/[^/]+/module\\.ts$'],
      },
    },
    {
      name: 'shared-no-contexts',
      comment: 'shared/ is the kernel every context uses; it imports no context and no wiring.',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: '^src/', pathNot: '^src/shared/' },
    },
    {
      name: 'no-circular',
      comment: 'Import cycles hide the real dependency direction.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],

  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    // Count `import type` too, otherwise a type-only import slips past the context rules.
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
