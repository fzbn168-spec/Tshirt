import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin();

// Dynamically include API host for Next Image remote patterns
const remotePatterns: NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> = [
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
  },
  {
    protocol: 'http',
    hostname: 'localhost',
  },
];

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (apiUrl) {
  try {
    const u = new URL(apiUrl);
    remotePatterns.push({
      protocol: (u.protocol.replace(':', '') as 'http' | 'https') || 'https',
      hostname: u.hostname,
    });
  } catch {
    // ignore invalid URL
  }
}

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns,
  },
};

export default withNextIntl(nextConfig);
