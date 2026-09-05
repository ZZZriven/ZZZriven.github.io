import type { NextConfig } from 'next';
// Export without redirect normalization; the Pages exporter creates directory URLs.
const nextConfig: NextConfig = { output: 'export', trailingSlash: false };
export default nextConfig;
