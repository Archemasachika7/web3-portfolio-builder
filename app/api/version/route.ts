import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/** The build this deployment is running. Compared by UpdateNotice in open tabs. */
export function GET() {
  return NextResponse.json(
    { version: process.env.NEXT_PUBLIC_BUILD_VERSION ?? null },
    { headers: { "Cache-Control": "no-store" } }
  )
}
