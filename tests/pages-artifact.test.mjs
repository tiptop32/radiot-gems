import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectArtifactIssues,
  ensureArtifactBuilt,
} from './pages-artifact-contract.mjs';

// Deployment contract for the GitHub Pages static export (dist/client).
// Guarded regression: a Pages build that loses the base path, drops the root
// HTML, or emits unresolvable asset URLs ships a broken site to
// https://tiptop32.github.io/radiot-gems/ — the workflow would deploy it
// without any server to fall back on.

test('Pages artifact is present and fully static', async () => {
  await ensureArtifactBuilt();
  const issues = await collectArtifactIssues();
  assert.deepEqual(issues, []);
});
