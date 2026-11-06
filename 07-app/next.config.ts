import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // This folder has its own lockfile, and the repository's root has another. This says which
  // one this app belongs to.
  outputFileTracingRoot: __dirname,

  // Lets the dev server answer a school's portal on its own address, such as
  // citu.localhost (FR-IAM-002).
  allowedDevOrigins: ['*.localhost'],

  // SRS §2.1: a Server Action's request is limited to 1 MB. Files will go straight to
  // storage instead, as FR-SCH-002 says, when filing is built.
  experimental: { serverActions: { bodySizeLimit: '1mb' } },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          // An activation link carries its token in the address, so the address must
          // never be sent to another site. "same-origin" does that and still sends the
          // Origin header that Server Actions check; "no-referrer" would blank it.
          { key: 'Referrer-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
