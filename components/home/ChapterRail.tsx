'use client'

import { useEffect, useState } from 'react'

/**
 * The home page's table of contents, held beside the reading on wide screens.
 * The page is a sequence — every chapter builds on the last, in the order
 * CLAUDE.md fixes — so the chapters are numbered: here the order is the
 * information. Without script it is a plain list of anchor links; with it,
 * the chapter being read is marked.
 */
export function ChapterRail({
  label,
  chapters,
}: {
  label: string
  chapters: readonly { readonly id: string; readonly name: string }[]
}) {
  const [current, setCurrent] = useState<string | null>(null)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const visible = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.intersectionRatio)
        // The first chapter in page order that is on screen at all wins, so
        // the mark moves when a heading crosses the top, not mid-paragraph.
        const first = chapters.find((chapter) => (visible.get(chapter.id) ?? 0) > 0)
        if (first !== undefined) setCurrent(first.id)
      },
      { rootMargin: '-80px 0px -55% 0px', threshold: [0, 0.01] },
    )
    for (const chapter of chapters) {
      const element = document.getElementById(chapter.id)
      if (element !== null) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [chapters])

  return (
    <nav aria-label={label} className="sticky top-24 hidden self-start lg:block">
      <p className="eyebrow mb-3 pl-3">{label}</p>
      <ol className="flex flex-col font-sans text-sm">
        {chapters.map((chapter, index) => {
          const on = chapter.id === current
          return (
            <li key={chapter.id}>
              <a
                href={`#${chapter.id}`}
                aria-current={on ? 'location' : undefined}
                className={`flex gap-3 border-l-2 py-1.5 pl-3 transition-colors ${
                  on ? 'border-ink font-medium text-ink' : 'border-rule text-muted hover:text-ink'
                }`}
              >
                <span aria-hidden className="w-4 shrink-0 font-mono text-fine tabular-nums">
                  {index + 1}
                </span>
                {chapter.name}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
