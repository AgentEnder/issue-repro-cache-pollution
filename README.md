# Reproduction of issue with external dependency hashing

See https://github.com/nrwl/nx/pull/15157

## Description

An enterprise client using module federation noted that they started to get errors from non-dev remotes after a developer changed branches and was working on a dependency upgrade. Troubleshooting on a call revealed that the dependency between their library and the npm package was drawn properly in the graph, but for some reason the cache was not getting burst.

## Example

Run `nx serve-static demo-app`, compare to `nx serve demo-app`.

`nx serve-static demo-app` retrieves build outputs from nx-cloud, and shows version 0.1.2 is installed for is-even
`nx serve demo-app` is not cacheable, and shows version 1.0.0 is installed for is-even

## Full repro steps

### Workspace Setup
```
> npx create-nx-workspace@latest test-npm-dep
- Integrated Monorepo
- Apps
- Nx Cloud enabled

> cd test-npm-dep
> npm i -d @nrwl/react @nrwl/web
> nx g @nrwl/react:app demo-app
```

### Install Dependencies
```
> npm i is-even@0.1.2
```
### Update App Code

Update the below files to match:

> apps/demo-app/src/app.tsx
```tsx
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.scss';

import * as json from 'is-even/package.json';

export function App() {
  return (
    <>
      {json.version}
      <div />
    </>
  );
}

export default App;
```

> apps/demo-app/tsconfig.app.json
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "types": ["node"],
    "resolveJsonModule": true
  },
  "files": [
    "../../node_modules/@nrwl/react/typings/cssmodule.d.ts",
    "../../node_modules/@nrwl/react/typings/image.d.ts"
  ],
  "exclude": [
    "jest.config.ts",
    "src/**/*.spec.ts",
    "src/**/*.test.ts",
    "src/**/*.spec.tsx",
    "src/**/*.test.tsx",
    "src/**/*.spec.js",
    "src/**/*.test.js",
    "src/**/*.spec.jsx",
    "src/**/*.test.jsx"
  ],
  "include": ["src/**/*.js", "src/**/*.jsx", "src/**/*.ts", "src/**/*.tsx"]
}
```

> apps/demo-app/project.json
```json
{
  "name": "demo-app",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/demo-app/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "@nrwl/webpack:webpack",
      "outputs": ["{options.outputPath}"],
      "defaultConfiguration": "production",
      "options": {
        "compiler": "babel",
        "outputPath": "dist/apps/demo-app",
        "index": "apps/demo-app/src/index.html",
        "baseHref": "/",
        "main": "apps/demo-app/src/main.tsx",
        "tsConfig": "apps/demo-app/tsconfig.app.json",
        "assets": ["apps/demo-app/src/favicon.ico", "apps/demo-app/src/assets"],
        "styles": ["apps/demo-app/src/styles.scss"],
        "scripts": [],
        "isolatedConfig": true,
        "webpackConfig": "apps/demo-app/webpack.config.js"
      },
      "configurations": {
        "development": {
          "extractLicenses": false,
          "optimization": false,
          "sourceMap": true,
          "vendorChunk": true
        },
        "production": {
          "fileReplacements": [
            {
              "replace": "apps/demo-app/src/environments/environment.ts",
              "with": "apps/demo-app/src/environments/environment.prod.ts"
            }
          ],
          "optimization": true,
          "outputHashing": "all",
          "sourceMap": false,
          "namedChunks": false,
          "extractLicenses": true,
          "vendorChunk": false
        }
      }
    },
    "serve": {
      "executor": "@nrwl/webpack:dev-server",
      "defaultConfiguration": "development",
      "options": {
        "buildTarget": "demo-app:build",
        "hmr": true
      },
      "configurations": {
        "development": {
          "buildTarget": "demo-app:build:development"
        },
        "production": {
          "buildTarget": "demo-app:build:production",
          "hmr": false
        }
      }
    },
    "lint": {
      "executor": "@nrwl/linter:eslint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/demo-app/**/*.{ts,tsx,js,jsx}"]
      }
    },
    "test": {
      "executor": "@nrwl/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "apps/demo-app/jest.config.ts",
        "passWithNoTests": true
      },
      "configurations": {
        "ci": {
          "ci": true,
          "codeCoverage": true
        }
      }
    },
    "serve-static": {
      "executor": "@nrwl/web:file-server",
      "options": {
        "buildTarget": "demo-app:build"
      }
    }
  },
  "tags": []
}

```

### Serve lib, and establish cache

```
> nx serve-static demo-app
```

### Update is-even

```
> npm i is-even@1.0.0
```

### Serve lib, note bad cache

```
> nx serve-static demo-app
```