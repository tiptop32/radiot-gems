import {
  collectArtifactIssues,
  ensureArtifactBuilt,
} from '../tests/pages-artifact-contract.mjs';

// Deployment-contract eval for the GitHub Pages static export.
// Complements tests/pages-artifact.test.mjs by reporting the same contract as
// named checks, so a failing Pages build says which deployment guarantee broke.

await ensureArtifactBuilt();

const issues = await collectArtifactIssues();

const checks = [
  [
    'root HTML and 404.html exist in the artifact',
    !issues.some(
      (issue) => issue.includes('index.html') || issue.includes('404.html'),
    ),
  ],
  [
    'og.png and favicon.svg ship at the uploaded artifact root',
    !issues.some((issue) => issue.includes('missing og.png') || issue.includes('missing favicon.svg')),
  ],
  [
    'every local reference resolves under /radiot-gems/',
    !issues.some((issue) => issue.includes('local reference')),
  ],
  [
    'OG and favicon metadata point at the Pages URLs',
    !issues.some(
      (issue) => issue.includes('og:image') || issue.includes('favicon link'),
    ),
  ],
  [
    'no server dependency',
    !issues.some((issue) => issue.includes('server-only')),
  ],
];

const failures = checks.filter(([, passed]) => !passed);

for (const [name, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${name}`);
}

if (failures.length > 0) {
  console.error('\nArtifact contract violations:');
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`\nAll ${checks.length} Pages artifact checks passed.`);
