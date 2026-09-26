"use client"

import { useEffect, useState } from "react"

/**
 * Local state seeded from server props that also follows those props
 * when the server re-renders (after a Server Action revalidates, or
 * router.refresh()). Plain useState(initial) only reads the prop once,
 * which is why newly added items didn't appear until a full reload.
 */
export function useServerState<T>(serverValue: T) {
  const [value, setValue] = useState(serverValue)
  useEffect(() => setValue(serverValue), [serverValue])
  return [value, setValue] as const
}
