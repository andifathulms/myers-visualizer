'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_PRESET, findPreset } from '@/data/presets'
import {
  DEFAULT_TOKENIZE_OPTIONS,
  tokenizePair,
  type Granularity,
  type TokenizeOptions,
} from '@/lib/tokenize'
import { ALGORITHMS, type AlgorithmId } from '@/lib/diff/types'

/**
 * Inputs, the equality options, and the URL hash they share by. No accounts,
 * no server: state lives in the hash. PRD §5.
 */
export type DiffInputs = {
  aText: string
  bText: string
  granularity: Granularity
  ignoreWhitespace: boolean
  presetId: string | null
  algorithm: AlgorithmId
  setAlgorithm: (value: AlgorithmId) => void
  setA: (value: string) => void
  setB: (value: string) => void
  setGranularity: (value: Granularity) => void
  setIgnoreWhitespace: (value: boolean) => void
  swap: () => void
  loadPreset: (id: string) => void
  tokenized: ReturnType<typeof tokenizePair>
  options: TokenizeOptions
  /** The shareable URL for the current state. */
  shareUrl: string
}

function readHash(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const raw = window.location.hash.replace(/^#/, '')
  if (raw === '') return {}
  const params = new URLSearchParams(raw)
  const out: Record<string, string> = {}
  params.forEach((value, key) => {
    out[key] = value
  })
  return out
}

export function useDiffInputs(): DiffInputs {
  const [aText, setA] = useState(DEFAULT_PRESET.a)
  const [bText, setB] = useState(DEFAULT_PRESET.b)
  const [granularity, setGranularity] = useState<Granularity>(DEFAULT_PRESET.granularity)
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)
  const [presetId, setPresetId] = useState<string | null>(DEFAULT_PRESET.id)
  const [algorithm, setAlgorithm] = useState<AlgorithmId>('myers')
  const [shareUrl, setShareUrl] = useState('')

  /**
   * Hash → state. Applied on mount and on every hashchange, so that pasting a
   * shared link into an already-open page actually loads it — and so the back
   * button moves between shared states instead of doing nothing. Our own
   * writes use replaceState, which never fires hashchange, so this cannot loop.
   */
  const applyHash = useCallback(() => {
    const hash = readHash()
    const preset = hash.p === undefined ? undefined : findPreset(hash.p)
    if (preset !== undefined) {
      setA(preset.a)
      setB(preset.b)
      setGranularity(preset.granularity)
      setPresetId(preset.id)
    } else if (hash.a !== undefined || hash.b !== undefined) {
      try {
        setA(decodeURIComponent(hash.a ?? ''))
        setB(decodeURIComponent(hash.b ?? ''))
        setPresetId(null)
      } catch {
        // A malformed hash is not worth an error state; keep what we have.
      }
    }
    if (hash.g === 'line' || hash.g === 'word' || hash.g === 'char') setGranularity(hash.g)
    setIgnoreWhitespace(hash.w === '1')
    if (hash.alg !== undefined && (ALGORITHMS as readonly string[]).includes(hash.alg)) {
      setAlgorithm(hash.alg as AlgorithmId)
    } else if (hash.p !== undefined || hash.a !== undefined) {
      setAlgorithm('myers') // absent means the default, not "unchanged"
    }
  }, [])

  useEffect(() => {
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [applyHash])

  // State → hash. Presets share by id so the link stays short and readable.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams()
    if (presetId !== null) {
      params.set('p', presetId)
    } else {
      params.set('a', encodeURIComponent(aText))
      params.set('b', encodeURIComponent(bText))
    }
    params.set('g', granularity)
    if (ignoreWhitespace) params.set('w', '1')
    if (algorithm !== 'myers') params.set('alg', algorithm)
    const next = `#${params.toString()}`
    if (next !== window.location.hash) {
      window.history.replaceState(null, '', next)
    }
    // Set unconditionally: on first load the hash may already match, and the
    // share button still needs a URL.
    setShareUrl(window.location.href)
  }, [aText, bText, granularity, ignoreWhitespace, presetId, algorithm])

  const options = useMemo<TokenizeOptions>(
    () => ({ ...DEFAULT_TOKENIZE_OPTIONS, granularity, ignoreWhitespace }),
    [granularity, ignoreWhitespace],
  )

  const tokenized = useMemo(
    () => tokenizePair(aText, bText, options),
    [aText, bText, options],
  )

  const onA = useCallback((value: string) => {
    setA(value)
    setPresetId(null)
  }, [])

  const onB = useCallback((value: string) => {
    setB(value)
    setPresetId(null)
  }, [])

  const swap = useCallback(() => {
    setA(bText)
    setB(aText)
    setPresetId(null)
  }, [aText, bText])

  const loadPreset = useCallback((id: string) => {
    const preset = findPreset(id)
    if (preset === undefined) return
    setA(preset.a)
    setB(preset.b)
    setGranularity(preset.granularity)
    setPresetId(preset.id)
  }, [])

  return {
    aText,
    bText,
    granularity,
    ignoreWhitespace,
    presetId,
    algorithm,
    setAlgorithm,
    setA: onA,
    setB: onB,
    setGranularity,
    setIgnoreWhitespace,
    swap,
    loadPreset,
    tokenized,
    options,
    shareUrl,
  }
}
