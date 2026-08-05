import type { Granularity } from '@/lib/tokenize'
import type { Locale } from '@/lib/i18n/locales'

/**
 * The preset library. Every preset carries the phenomenon it exists to show —
 * a preset without a documented reason is just sample data. §6.8
 *
 * Ids are stable and readable: they appear in shared URLs.
 *
 * The sample text is English in both locales — it is one shared body of data,
 * and English is the default locale.
 */
export type Preset = {
  readonly id: string
  readonly title: Record<Locale, string>
  readonly phenomenon: Record<Locale, string>
  readonly a: string
  readonly b: string
  readonly granularity: Granularity
}

const braceA = `function add(x) {
  return x + 1
}

function total(xs) {
  return xs.length
}`

const braceB = `function add(x) {
  return x + 1
}

function average(xs) {
  return sum(xs) / xs.length
}

function total(xs) {
  return xs.length
}`

// Repeated boilerplate (`enabled`, `replicas`) with unique anchors
// (`- name: …`). Myers is free to match the boilerplate across entry
// boundaries; patience refuses to anchor on lines that appear more than once.
const patienceA = `services:
  - name: web
    enabled: true
    replicas: 2
  - name: cache
    enabled: true
    replicas: 2
  - name: queue
    enabled: true
    replicas: 2`

const patienceB = `services:
  - name: web
    enabled: true
    replicas: 2
  - name: search
    enabled: true
    replicas: 2
  - name: metrics
    enabled: true
    replicas: 2
  - name: queue
    enabled: true
    replicas: 2`

export const PRESETS: readonly Preset[] = [
  {
    id: 'minimal-edit',
    title: { id: 'Suntingan minimal', en: 'A minimal edit' },
    phenomenon: {
      id: 'Satu baris berubah. D kecil, dan sebagian besar lattice adalah satu snake panjang — inilah kenapa diff cepat pada perubahan nyata.',
      en: 'One line changes. D is small and most of the lattice is one long snake — this is why diff is fast on real edits.',
    },
    a: 'one\ntwo\nthree\nfour\nfive',
    b: 'one\ntwo\nTHREE\nfour\nfive',
    granularity: 'line',
  },
  {
    id: 'pure-insert',
    title: { id: 'Sisipan murni', en: 'A pure insertion' },
    phenomenon: {
      id: 'Tidak ada yang dihapus. Jalur hanya bergerak ke bawah lalu menyusuri diagonal: D sama dengan jumlah baris yang disisipkan.',
      en: 'Nothing is deleted. The path only moves down, then runs the diagonal: D equals the number of inserted lines.',
    },
    a: 'one\ntwo\nthree',
    b: 'one\nnew A\nnew B\ntwo\nthree',
    granularity: 'line',
  },
  {
    id: 'pure-delete',
    title: { id: 'Penghapusan murni', en: 'A pure deletion' },
    phenomenon: {
      id: 'Cermin dari sisipan murni: jalur hanya bergerak ke kanan. D sama dengan jumlah baris yang dihapus.',
      en: 'The mirror of a pure insertion: the path only moves right. D equals the number of deleted lines.',
    },
    a: 'one\nold A\nold B\ntwo\nthree',
    b: 'one\ntwo\nthree',
    granularity: 'line',
  },
  {
    id: 'transposition',
    title: { id: 'Transposisi', en: 'A transposition' },
    phenomenon: {
      id: 'Dua blok bertukar tempat. Diff berbasis baris tidak punya konsep "pindah" — hasilnya satu blok dihapus dan disisipkan lagi di tempat baru.',
      en: 'Two blocks swap places. A line diff has no notion of "move", so one block is deleted and inserted again elsewhere.',
    },
    a: 'A\nB\nC\nD\nE\nF',
    b: 'D\nE\nF\nA\nB\nC',
    granularity: 'line',
  },
  {
    id: 'brace-misattribution',
    title: { id: 'Kurung kurawal salah alamat', en: 'The misattributed brace' },
    phenomenon: {
      id: 'Fungsi baru disisipkan di antara dua fungsi lama. Ada tiga edit script yang sama-sama minimal — telusuri alternatifnya, dan salah satunya mengaitkan kurung kurawal penutup ke fungsi yang salah: inilah diff jelek yang pernah dilihat semua orang. Implementasi di sini kebetulan memilih yang terbaca; mana yang muncul ditentukan oleh tie-breaking, bukan oleh penilaian mana yang lebih masuk akal.',
      en: 'A new function is inserted between two existing ones. Three edit scripts are equally minimal — step through the alternatives and one of them attributes the closing brace to the wrong function: the ugly diff everybody has seen. This implementation happens to pick a readable one; which you get is decided by tie-breaking, not by any judgement about which reads better.',
    },
    a: braceA,
    b: braceB,
    granularity: 'line',
  },
  {
    id: 'patience-wins',
    title: { id: 'Saat patience menang', en: 'Where patience wins' },
    phenomenon: {
      id: 'Satu entri diganti dua entri baru. Ketiga algoritma sepakat D = 5 — sama-sama minimal — tetapi Myers memecahnya jadi dua hunk terpisah karena bebas mencocokkan baris berulang "enabled" dan "replicas" melintasi batas entri. Patience menolak berlabuh pada baris yang muncul lebih dari sekali, jadi ia berlabuh pada baris "- name:" yang unik dan menyatukan perubahan dalam satu blok. Panjang sama, keterbacaan tidak.',
      en: 'One entry is replaced by two new ones. All three algorithms agree on D = 5 — equally minimal — but Myers splits it into two separate hunks, because it is free to match the repeated "enabled" and "replicas" lines across entry boundaries. Patience refuses to anchor on any line appearing more than once, so it anchors on the unique "- name:" lines and keeps the change in one block. Same length, different readability.',
    },
    a: patienceA,
    b: patienceB,
    granularity: 'line',
  },
  {
    id: 'worst-case',
    title: { id: 'Kasus terburuk', en: 'The worst case' },
    phenomenon: {
      id: 'Tidak ada satu pun elemen yang sama, jadi D = N + M dan tidak ada diagonal gratis sama sekali. Ini jalur patologis yang sengaja bisa dijangkau: pencarian berjalan di worker dengan step budget, jadi UI tidak pernah membeku.',
      en: 'No element is shared, so D = N + M and there are no free diagonals at all. The pathological path is deliberately reachable: the search runs in a worker with a step budget, so the UI never freezes.',
    },
    a: Array.from({ length: 40 }, (_, i) => `left ${i}`).join('\n'),
    b: Array.from({ length: 40 }, (_, i) => `right ${i}`).join('\n'),
    granularity: 'line',
  },
  {
    id: 'char-level',
    title: { id: 'Granularitas karakter', en: 'Character granularity' },
    phenomenon: {
      id: 'Masukan yang sama pada tingkat karakter. Elemen yang dibandingkan adalah pilihan, bukan sifat bawaan diff — ganti granularitas dan lattice-nya berubah total.',
      en: 'The same input at character level. What counts as an element is a choice, not a property of diff — change the granularity and the lattice changes completely.',
    },
    a: 'ABCABBA',
    b: 'CBABAC',
    granularity: 'char',
  },
]

export function findPreset(id: string): Preset | undefined {
  return PRESETS.find((preset) => preset.id === id)
}

export const DEFAULT_PRESET = PRESETS[0]
