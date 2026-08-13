'use client'

import { useEffect, useState } from 'react'
import type { Dict } from '@/lib/i18n/dictionary'

/**
 * Inputs and state share by URL hash — no accounts, no server. PRD §5.
 * Presets share by id, so a preset link stays short and readable.
 */
export function ShareLink({ url, dict }: { url: string; dict: Dict }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    const target = url === '' ? window.location.href : url
    try {
      await navigator.clipboard.writeText(target)
      setCopied(true)
    } catch {
      // Clipboard access can be refused; the URL is in the address bar either
      // way, so there is nothing worth interrupting the user about.
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded border border-indigo/30 px-2 py-1 font-sans text-fine hover:border-indigo focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-madder"
    >
      {copied ? dict.a11y.copied : dict.a11y.copyLink}
    </button>
  )
}
