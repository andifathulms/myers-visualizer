import type { Granularity } from '@/lib/tokenize'
import type { Locale } from '@/lib/i18n/locales'

/**
 * The preset library. Every preset carries the phenomenon it exists to show —
 * a preset without a documented reason is just sample data. §6.8
 *
 * Ids are stable and readable: they appear in shared URLs.
 */
export type Preset = {
  readonly id: string
  readonly title: Record<Locale, string>
  readonly phenomenon: Record<Locale, string>
  readonly a: string
  readonly b: string
  readonly granularity: Granularity
}

const braceA = `function hitung(x) {
  return x + 1
}

function total(xs) {
  return xs.length
}`

const braceB = `function hitung(x) {
  return x + 1
}

function rerata(xs) {
  return jumlah(xs) / xs.length
}

function total(xs) {
  return xs.length
}`

const patienceA = `#include <stdio.h>

int main(void) {
  printf("satu\\n");
  return 0;
}

int helper(void) {
  printf("dua\\n");
  return 0;
}`

const patienceB = `#include <stdio.h>

int helper(void) {
  printf("dua\\n");
  return 0;
}

int main(void) {
  printf("satu\\n");
  return 0;
}`

export const PRESETS: readonly Preset[] = [
  {
    id: 'minimal-edit',
    title: { id: 'Suntingan minimal', en: 'A minimal edit' },
    phenomenon: {
      id: 'Satu baris berubah. D kecil, dan sebagian besar lattice adalah satu snake panjang — inilah kenapa diff cepat pada perubahan nyata.',
      en: 'One line changes. D is small and most of the lattice is one long snake — this is why diff is fast on real edits.',
    },
    a: 'satu\ndua\ntiga\nempat\nlima',
    b: 'satu\ndua\nTIGA\nempat\nlima',
    granularity: 'line',
  },
  {
    id: 'pure-insert',
    title: { id: 'Sisipan murni', en: 'A pure insertion' },
    phenomenon: {
      id: 'Tidak ada yang dihapus. Jalur hanya bergerak ke bawah lalu menyusuri diagonal: D sama dengan jumlah baris yang disisipkan.',
      en: 'Nothing is deleted. The path only moves down, then runs the diagonal: D equals the number of inserted lines.',
    },
    a: 'satu\ndua\ntiga',
    b: 'satu\nbaru A\nbaru B\ndua\ntiga',
    granularity: 'line',
  },
  {
    id: 'pure-delete',
    title: { id: 'Penghapusan murni', en: 'A pure deletion' },
    phenomenon: {
      id: 'Cermin dari sisipan murni: jalur hanya bergerak ke kanan. D sama dengan jumlah baris yang dihapus.',
      en: 'The mirror of a pure insertion: the path only moves right. D equals the number of deleted lines.',
    },
    a: 'satu\nlama A\nlama B\ndua\ntiga',
    b: 'satu\ndua\ntiga',
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
      id: 'Dua fungsi bertukar urutan. Myers menghasilkan script terpendek dengan mencocokkan baris-baris umum seperti "return 0;" dan kurung penutup, sehingga hunk-nya terpotong-potong. Patience mengabaikan baris yang berulang dan menghasilkan diff lebih panjang tetapi jauh lebih mudah dibaca.',
      en: 'Two functions swap order. Myers finds the shortest script by matching common lines like "return 0;" and closing braces, which shreds the hunks. Patience ignores repeated lines and produces a longer but far more readable diff.',
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
    a: Array.from({ length: 40 }, (_, i) => `kiri ${i}`).join('\n'),
    b: Array.from({ length: 40 }, (_, i) => `kanan ${i}`).join('\n'),
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
