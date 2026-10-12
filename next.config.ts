import type { NextConfig } from 'next';

// GitHub Pages build (npm run build:pages / CI): static export under the
// repository subpath. Ordinary Cloudflare builds keep the default config.
const isPagesExport = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = isPagesExport
  ? {
      output: 'export',
      basePath: '/radiot-gems',
      // GitHub Pages resolves /radiot-gems/ to radiot-gems/index.html on disk.
      trailingSlash: true,
    }
  : {};

export default nextConfig;
