import "server-only"

const REQUIRED = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", value: process.env.NEXT_PUBLIC_SUPABASE_URL },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
  { name: "SUPABASE_SERVICE_ROLE_KEY", value: process.env.SUPABASE_SERVICE_ROLE_KEY }
]

/** Names of required environment variables that aren't set. */
export function missingEnv(): string[] {
  return REQUIRED.filter((v) => !v.value || !v.value.trim()).map((v) => v.name)
}
