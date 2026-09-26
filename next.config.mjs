/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Identifies this build. A tab opened before a deploy compares it with
    // /api/version and offers a reload, instead of running stale code.
    NEXT_PUBLIC_BUILD_VERSION:
      process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || `local-${Date.now()}`
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**"
      }
    ]
  }
}

export default nextConfig
