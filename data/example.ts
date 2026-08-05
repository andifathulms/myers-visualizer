import type { Locale } from '@/lib/i18n/locales'

/**
 * The home page's worked example — a shopping list, not code.
 *
 * It sits above every mention of graphs, paths or edit scripts, and it is
 * deliberately not about programming: the first thing a visitor should
 * understand is what a diff *is*, and a grocery list needs no explaining.
 * Example data lives beside the presets rather than in the dictionary,
 * because it is content, not interface copy.
 */
export type ExampleLine = { readonly type: 'keep' | 'delete' | 'insert'; readonly text: string }

export const EXAMPLE: Record<
  Locale,
  { readonly a: readonly string[]; readonly b: readonly string[]; readonly diff: readonly ExampleLine[] }
> = {
  id: {
    a: ['susu', 'telur', 'gula', 'roti', 'kopi'],
    b: ['susu', 'telur', 'garam', 'roti', 'kopi'],
    diff: [
      { type: 'keep', text: 'susu' },
      { type: 'keep', text: 'telur' },
      { type: 'delete', text: 'gula' },
      { type: 'insert', text: 'garam' },
      { type: 'keep', text: 'roti' },
      { type: 'keep', text: 'kopi' },
    ],
  },
  en: {
    a: ['milk', 'eggs', 'sugar', 'bread', 'coffee'],
    b: ['milk', 'eggs', 'salt', 'bread', 'coffee'],
    diff: [
      { type: 'keep', text: 'milk' },
      { type: 'keep', text: 'eggs' },
      { type: 'delete', text: 'sugar' },
      { type: 'insert', text: 'salt' },
      { type: 'keep', text: 'bread' },
      { type: 'keep', text: 'coffee' },
    ],
  },
}
