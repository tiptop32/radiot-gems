// Shared deployment contract for the GitHub Pages static export.
// Used by tests/pages-artifact.test.mjs and evals/pages-artifact.eval.mjs.
// The contract: the vinext output:'export' artifact under dist/client is
// self-contained — root HTML exists, every local asset reference carries the
// /radiot-gems/ base and resolves to a real static file, OG and favicon
// metadata point at the published Pages URLs. No server is needed to serve it.

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const BASE_PATH = '/radiot-gems';
export const PAGES_URL = 'https://tiptop32.github.io/radiot-gems';
export const ARTIFACT_ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'dist',
  'client',
  'radiot-gems',
);

const rootHtmlPath = () => path.join(ARTIFACT_ROOT, 'index.html');

export async function ensureArtifactBuilt() {
  if (!existsSync(rootHtmlPath()))
    throw new Error(
      'missing dist/client/radiot-gems/index.html — run npm run build:pages',
    );
}

function collectLocalRefs(html) {
  const refs = [];
  const pattern = /(?:href|src)="([^"]*)"/g;
  for (const match of html.matchAll(pattern)) refs.push(match[1]);
  return refs;
}

function collectCssRefs(css) {
  return [...css.matchAll(/url\((?:"|')?([^"')]+)(?:"|')?\)/g)].map(
    (match) => match[1],
  );
}

function collectJsRefs(js) {
  return [...js.matchAll(/(?:from|import\()\s*["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
}

// Every file under the artifact root, as a set of repo-relative POSIX paths.
async function listArtifactFiles(dir = ARTIFACT_ROOT, prefix = '') {
  const files = new Set();
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      for (const nested of await listArtifactFiles(
        path.join(dir, entry.name),
        relative,
      ))
        files.add(nested);
    } else {
      files.add(relative);
    }
  }
  return files;
}

export async function collectArtifactIssues() {
  const issues = [];

  const rootHtml = await readFile(rootHtmlPath(), 'utf8').catch(() => null);
  if (rootHtml === null) {
    return [`missing ${BASE_PATH}/index.html — run npm run build:pages`];
  }

  if (!existsSync(path.join(ARTIFACT_ROOT, '404.html'))) {
    issues.push(
      'missing 404.html at the artifact root (GitHub Pages custom 404)',
    );
  }

  for (const name of ['og.png', 'favicon.svg']) {
    if (!existsSync(path.join(ARTIFACT_ROOT, name))) {
      issues.push(`missing ${name} at the uploaded artifact root`);
    }
  }

  const files = await listArtifactFiles();
  for (const ref of collectLocalRefs(rootHtml)) {
    if (!ref.startsWith('/') || ref.startsWith('//')) continue;
    const [pathname] = ref.split('#');
    if (!pathname.startsWith(`${BASE_PATH}/`)) {
      issues.push(`local reference ${ref} is not under ${BASE_PATH}/`);
      continue;
    }
    const resolved = decodeURIComponent(pathname.slice(`${BASE_PATH}/`.length));
    if (!files.has(resolved)) {
      issues.push(
        `local reference ${ref} does not resolve to a file in the artifact`,
      );
    }
  }

  for (const file of files) {
    if (file.endsWith('.css')) {
      const css = await readFile(path.join(ARTIFACT_ROOT, file), 'utf8');
      for (const ref of collectCssRefs(css)) {
        if (ref.startsWith('/') && ref.startsWith(`${BASE_PATH}/`)) {
          const resolved = decodeURIComponent(
            ref.slice(`${BASE_PATH}/`.length),
          );
          if (!files.has(resolved))
            issues.push(
              `CSS reference ${ref} does not resolve to a file in the artifact`,
            );
        }
      }
    }
    if (file.endsWith('.js')) {
      const js = await readFile(path.join(ARTIFACT_ROOT, file), 'utf8');
      for (const ref of collectJsRefs(js)) {
        if (!ref.startsWith('.')) continue;
        const resolved = path.posix.normalize(
          path.posix.join(path.posix.dirname(file), ref),
        );
        if (!files.has(resolved) && !files.has(`${resolved}.js`))
          issues.push(
            `JS reference ${ref} from ${file} does not resolve to a file in the artifact`,
          );
      }
    }
  }

  const ogImage = rootHtml.match(/property="og:image" content="([^"]*)"/)?.[1];
  if (ogImage !== `${PAGES_URL}/og.png`) {
    issues.push(
      `og:image is ${ogImage ?? 'absent'}, expected ${PAGES_URL}/og.png`,
    );
  }

  const iconHref = rootHtml.match(/rel="icon" href="([^"]*)"/)?.[1];
  if (iconHref !== `${PAGES_URL}/favicon.svg`) {
    issues.push(
      `favicon link is ${iconHref ?? 'absent'}, expected ${PAGES_URL}/favicon.svg`,
    );
  }

  if (/\/_next\/server|\/__vinext\//.test(rootHtml)) {
    issues.push(
      'root HTML references server-only paths; the artifact must be fully static',
    );
  }

  return issues;
}
