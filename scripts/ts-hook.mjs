// Test-only ESM loader: resolve extensionless relative imports
// (Expo/Metro style, e.g. `./nutrition`) to their .ts files so plain-Node
// type-stripping tests can import src modules. Not used by the app.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (e) {
    if (e?.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.')) {
      const parentPath = fileURLToPath(context.parentURL);
      const base = path.resolve(path.dirname(parentPath), specifier);
      for (const cand of [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
        if (existsSync(cand)) return { url: pathToFileURL(cand).href, shortCircuit: true };
      }
    }
    throw e;
  }
}
