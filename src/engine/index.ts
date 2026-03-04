/**
 * Engine layer public barrel.
 *
 * Consumers inside the project should import engine types and classes from
 * this module rather than reaching into the internal `core/` sub-directories.
 *
 * Directory structure:
 *   src/
 *     engine/           ← core business logic (this barrel)
 *       index.ts
 *     components/       ← React UI (toolbar, color picker, frame timeline, …)
 *     App.tsx           ← root application shell
 */
export * from '../core';
