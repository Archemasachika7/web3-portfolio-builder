import { execSync } from "node:child_process"

/**
 * One version per build, identical in the server and browser bundles.
 * The config is evaluated more than once during a build, so the value is
 * pinned in process.env on first use rather than recomputed.
 */
function buildVersion() {
  if (process.env.NEXT_PUBLIC_BUILD_VERSION) return process.env.NEXT_PUBLIC_BUILD_VERSION
  let version = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID
  if (!version) {
    try {
      version = execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim()
    } catch {
      version = "dev"
    }
  }
  process.env.NEXT_PUBLIC_BUILD_VERSION = version
  return version
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // A tab opened before a deploy compares this with /api/version and
    // offers a reload, instead of running stale code.
    NEXT_PUBLIC_BUILD_VERSION: buildVersion()
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
