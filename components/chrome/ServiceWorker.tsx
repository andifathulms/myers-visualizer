'use client'

import { useEffect } from 'react'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/**
 * Registers the generated worker so the site is fully offline after first
 * load. PRD §11.
 *
 * The worker only exists in a built export — `pnpm dev` has no out/sw.js —
 * so registration is skipped in development rather than logging a 404 on
 * every page load.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register(`${BASE}/sw.js`, { scope: `${BASE}/` }).catch(() => {
      // Registration is refused in some contexts (private windows, disabled
      // workers). The site works without it; only offline reload is lost.
    })
  }, [])
  return null
}
