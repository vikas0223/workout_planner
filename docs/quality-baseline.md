# Quality Baseline

Audit date: 2026-08-24

## Repository Checkout

The requested repository could not be audited in the original workspace path because that path contained only incomplete `.git` metadata and rejected ordinary file creation. The repository was cloned into the writable audit workspace:

```text
C:\Users\Vikas\.codex\visualizations\2026\08\23\01a03000-87f4-79d1-acc4-d2ce2db85ccb\workout_planner
```

Clone command:

```powershell
git clone https://github.com/vikas0223/workout_planner.git workout_planner
```

Result: success.

## Package Manager Validation

Command:

```powershell
pnpm --version
```

Result:

```text
11.19.0
```

Command:

```powershell
node --version
```

Result:

```text
v25.9.0
```

Command:

```powershell
Test-Path node_modules
```

Result:

```text
False
```

Command:

```powershell
Get-Content -Raw pnpm-lock.yaml
```

Result:

```yaml
lockfileVersion: '9.0'

settings:
  autoInstallPeers: true
  excludeLinksFromLockfile: false
```

Assessment:

- The project declares pnpm via lockfile presence, but the lockfile contains no dependency snapshots.
- `node_modules` is absent.
- Running pnpm script/exec commands attempts registry resolution because dependencies are absent and not locked.
- The audit instruction explicitly prohibited package installation, so dependency installation was not performed.

## Scripts

From `package.json`:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

Missing scripts:

- `typecheck`
- `test`
- `format`
- `coverage`

## Type Checking

Command attempted:

```powershell
pnpm exec tsc --noEmit
```

Baseline result:

- Could not complete under the "do not install packages" constraint.
- pnpm attempted to fetch dependencies from `https://registry.npmjs.org`.
- Fetches failed with `EACCES` in the restricted environment and were interrupted to avoid installing packages.

Representative output:

```text
[WARN] GET https://registry.npmjs.org/typescript error (EACCES). Will retry...
[WARN] GET https://registry.npmjs.org/react error (EACCES). Will retry...
[WARN] GET https://registry.npmjs.org/next error (EACCES). Will retry...
```

Current configuration issue:

- `tsconfig.json` has `strict: true`.
- `next.config.mjs` has `typescript.ignoreBuildErrors: true`, so production builds would ignore TypeScript errors.

## Linting

Command attempted:

```powershell
pnpm run lint
```

Baseline result:

- Could not complete under the "do not install packages" constraint.
- pnpm attempted registry resolution due absent dependencies/empty lockfile and was interrupted.

Configuration issue:

- `next.config.mjs` has `eslint.ignoreDuringBuilds: true`.
- `lint` uses `next lint`, which is not a reliable long-term script for newer Next.js projects without confirming installed Next behavior.

## Existing Tests

Command attempted:

```powershell
pnpm test
```

Baseline result:

- No `test` script exists in `package.json`.
- Because dependencies were absent and lockfile incomplete, pnpm began dependency resolution and was interrupted.

Static test discovery:

```powershell
rg --files | rg "(test|spec|vitest|jest|playwright|cypress|testing-library|\.test\.|\.spec\.)"
```

Only hit:

```text
components\ui\aspect-ratio.tsx
```

This is not a test file. No actual test files were found.

## Production Build

Command attempted:

```powershell
pnpm run build
```

Baseline result:

- Could not complete under the "do not install packages" constraint.
- pnpm attempted registry resolution due absent dependencies/empty lockfile and was interrupted.

Configuration issue:

```js
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}
```

This means even a successful `next build` would not currently prove type or lint correctness.

## Static Baseline Metrics

Largest source files:

| Lines | File |
|---:|---|
| 2934 | `components/workout-planner.tsx` |
| 2578 | `lib/exercise-database.ts` |
| 958 | `contexts/workout-completion-context.tsx` |
| 748 | `components/enhanced-dashboard.tsx` |
| 707 | `components/workout-plan-with-tracking.tsx` |
| 689 | `components/enhanced-dashboard-with-realtime.tsx` |
| 351 | `components/progress-dashboard.tsx` |
| 296 | `components/workout-recommendations.tsx` |
| 219 | `lib/difficulty_adjuster.ts` |
| 219 | `lib/difficulty-adjuster.ts` |

Duplicate files:

- `lib/difficulty_adjuster.ts` and `lib/difficulty-adjuster.ts` have identical content.
- `app/globals.css` and `styles/globals.css` have identical SHA256 hash:

```text
E35A06576EABC9C4E25382F6E95C5029979B84E09D59442484D05939496187FA
```

No generated dependency folders were left behind:

```powershell
Test-Path node_modules
```

Result after interrupted commands:

```text
False
```

Git status after audit document creation:

- Only `docs/` audit artifacts are intended changes.
- No source files, dependency files, database files, or Supabase configuration were modified.

## Current State

- Baseline commands cannot run cleanly without an approved dependency restoration phase.
- The package lockfile is not a usable reproducibility artifact.
- The project has no test runner or test suite.
- Production build is configured to ignore type and lint failures.

## Desired State

- Complete `pnpm-lock.yaml` with package snapshots.
- Reproducible `pnpm install --frozen-lockfile`.
- Scripts:
  - `typecheck`: `tsc --noEmit`
  - `lint`: supported ESLint command for the installed Next/ESLint setup
  - `test`: unit test runner
  - `build`: `next build`
- Build should fail on TypeScript and ESLint errors.
- Unit tests should cover domain services before refactoring UI.

## Migration Strategy

1. In the next approved phase, restore dependencies and lockfile with package installation explicitly allowed.
2. Add a `typecheck` script.
3. Add a test runner and initial domain tests.
4. Run current `lint`, `typecheck`, `test`, and `build`; record real failures.
5. Fix type/lint failures before removing `ignoreBuildErrors` and `ignoreDuringBuilds`.
6. Make quality gates required before any feature migration.
