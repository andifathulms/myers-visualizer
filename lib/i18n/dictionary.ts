import type { Locale } from './locales'

/**
 * Interface copy is Indonesian-first. Algorithm terms — snake, frontier,
 * edit script, diagonal — stay in English in both locales so a reader
 * recognises them in the paper and in source code afterwards. PRD §9.
 */
export type Dict = {
  nav: { graph: string; compare: string; presets: string; home: string }
  home: {
    tagline: string
    lede: string
    ctaGraph: string
    ctaCompare: string
    whatTitle: string
    what: string
    moves: { move: string; meaning: string; cost: string }
    moveRight: string
    moveDown: string
    moveDiag: string
    ambiguityTitle: string
    ambiguity: string
    creditsTitle: string
    notGit: string
  }
  input: {
    title: string
    sideA: string
    sideB: string
    granularity: string
    line: string
    char: string
    word: string
    ignoreWhitespace: string
    algorithm: string
    run: string
    swap: string
    presets: string
    /** Placeholders {n} {m} {cap} — the dictionary must stay serialisable. */
    tooLarge: string
  }
  graph: {
    title: string
    lede: string
    vstrip: string
    vstripHint: string
    noVStrip: string
    output: string
    stats: string
    d: string
    steps: string
    snakes: string
    tokens: string
    memory: string
    /** Placeholder {n}. */
    ambiguityCount: string
    ambiguityUnique: string
    ambiguityMany: string
    altScript: string
    linearSpace: string
    forward: string
    backward: string
    middleSnake: string
  }
  stepper: {
    play: string
    pause: string
    step: string
    stepBack: string
    nextD: string
    nextSnake: string
    reset: string
    end: string
    speed: string
  }
  compare: {
    title: string
    lede: string
    scriptLength: string
    hunks: string
    minimal: string
    yes: string
    no: string
    note: string
  }
  presets: { title: string; lede: string; open: string }
  legend: {
    title: string
    match: string
    explored: string
    frontier: string
    path: string
  }
}

const id: Dict = {
  nav: { graph: 'Edit graph', compare: 'Banding', presets: 'Contoh', home: 'Selisih' },
  home: {
    tagline: 'Algoritma diff Myers, dibuat bisa ditonton.',
    lede: 'Lihat edit graph-nya, ikuti frontier yang memuai, telusuri backtrack yang memulihkan edit script — dan pahami kenapa diff kadang menyalahkan baris yang keliru.',
    ctaGraph: 'Buka edit graph',
    ctaCompare: 'Bandingkan algoritma',
    whatTitle: 'Algoritmanya, singkat',
    what: 'Diberi dua urutan A (panjang N) dan B (panjang M), bentuk sebuah edit graph: kisi (N+1) × (M+1) titik, di mana titik (x, y) berarti "sudah memakai x elemen A dan y elemen B". Diff adalah jalur dari (0,0) ke (N,M). Edit script terpendek adalah jalur dengan langkah non-diagonal paling sedikit.',
    moves: { move: 'Langkah', meaning: 'Arti', cost: 'Biaya' },
    moveRight: 'hapus A[x]',
    moveDown: 'sisip B[y]',
    moveDiag: 'pertahankan — hanya bila A[x] == B[y]',
    ambiguityTitle: 'Edit script terpendek tidak tunggal',
    ambiguity: 'Untuk satu masukan sering ada beberapa edit script yang sama-sama minimal. Mana yang Anda lihat ditentukan oleh tie-breaking algoritma, bukan oleh penilaian soal mana yang lebih masuk akal. Di sinilah kurung kurawal penutup bisa dikaitkan ke fungsi yang salah.',
    creditsTitle: 'Bacaan',
    notGit: 'Ini bukan git. Implementasi Myers di git memakai heuristik dan fallback tambahan yang tidak direproduksi di sini; tidak ada klaim keluaran identik byte-per-byte dengan git diff.',
  },
  input: {
    title: 'Masukan',
    sideA: 'A — sebelum',
    sideB: 'B — sesudah',
    granularity: 'Granularitas',
    line: 'Baris',
    char: 'Karakter',
    word: 'Kata',
    ignoreWhitespace: 'Abaikan spasi',
    algorithm: 'Algoritma',
    run: 'Jalankan',
    swap: 'Tukar A/B',
    presets: 'Contoh',
    tooLarge:
      'Masukan {n}×{m} melampaui batas tampilan {cap}×{cap}. Lattice sebesar itu tidak terbaca, jadi tidak digambar — hasil diff tetap ditampilkan di bawah.',
  },
  graph: {
    title: 'Edit graph',
    lede: 'Posisi cocok ditandai sebelum pencarian mulai, jadi struktur yang akan dimanfaatkan algoritma terlihat lebih dulu.',
    vstrip: 'Array V',
    vstripHint: 'Satu sel per diagonal k. Arahkan kursor ke sebuah k untuk menyorot diagonalnya di lattice.',
    noVStrip: 'Algoritma ini tidak memelihara array V. Ia berlabuh pada elemen dan membelah rekursif, jadi tidak ada frontier untuk ditonton.',
    output: 'Keluaran diff',
    stats: 'Statistik',
    d: 'D (jarak edit)',
    steps: 'Langkah terekam',
    snakes: 'Snake',
    tokens: 'Token',
    memory: 'Sel V tersimpan',
    ambiguityCount: '{n} edit script minimal ditemukan',
    ambiguityUnique: 'Edit script minimal tunggal — tidak ada ambiguitas pada masukan ini.',
    ambiguityMany: 'Beberapa script sama-sama minimal. Algoritma memilih satu lewat tie-breaking.',
    altScript: 'Script alternatif',
    linearSpace: 'Ruang linear',
    forward: 'Frontier maju',
    backward: 'Frontier mundur',
    middleSnake: 'Middle snake',
  },
  stepper: {
    play: 'Putar',
    pause: 'Jeda',
    step: 'Maju',
    stepBack: 'Mundur',
    nextD: 'd berikutnya',
    nextSnake: 'Snake berikutnya',
    reset: 'Awal',
    end: 'Akhir',
    speed: 'Kecepatan',
  },
  compare: {
    title: 'Banding algoritma',
    lede: 'Myers, patience, dan histogram pada masukan yang sama. Patience biasanya menghasilkan script lebih panjang — itu memang tujuannya: minimal tidak sama dengan mudah dibaca.',
    scriptLength: 'Panjang script (D)',
    hunks: 'Jumlah hunk',
    minimal: 'Minimal',
    yes: 'Ya',
    no: 'Tidak',
    note: 'Hanya Myers yang menjamin D minimal. Patience dan histogram menukar minimalitas dengan keterbacaan.',
  },
  presets: {
    title: 'Contoh',
    lede: 'Tiap contoh memuat fenomena yang ingin ditunjukkan.',
    open: 'Buka di edit graph',
  },
  legend: {
    title: 'Legenda',
    match: 'Posisi cocok',
    explored: 'Wilayah terjelajah',
    frontier: 'Frontier',
    path: 'Jalur terpilih',
  },
}

const en: Dict = {
  nav: { graph: 'Edit graph', compare: 'Compare', presets: 'Presets', home: 'Selisih' },
  home: {
    tagline: 'The Myers diff algorithm, made watchable.',
    lede: 'See the edit graph, watch the frontier expand, follow the backtrack that recovers the edit script — and find out why diffs sometimes attribute the wrong lines.',
    ctaGraph: 'Open the edit graph',
    ctaCompare: 'Compare algorithms',
    whatTitle: 'The algorithm in brief',
    what: 'Given sequences A (length N) and B (length M), build an edit graph: a grid of (N+1) × (M+1) points, where point (x, y) means "consumed x elements of A and y of B". A diff is a path from (0,0) to (N,M). The shortest edit script is the path with the fewest non-diagonal moves.',
    moves: { move: 'Move', meaning: 'Meaning', cost: 'Cost' },
    moveRight: 'delete A[x]',
    moveDown: 'insert B[y]',
    moveDiag: 'keep — only when A[x] == B[y]',
    ambiguityTitle: 'A shortest edit script is not unique',
    ambiguity: 'Several equally-minimal edit scripts routinely exist for one input. Which one you see is decided by the algorithm’s tie-breaking, not by any judgement about which reads better. That is how a closing brace ends up attributed to the wrong function.',
    creditsTitle: 'Reading',
    notGit: 'This is not git. Git’s Myers implementation applies additional heuristics and fallbacks that are not reproduced here; no claim is made of byte-identical parity with git diff.',
  },
  input: {
    title: 'Input',
    sideA: 'A — before',
    sideB: 'B — after',
    granularity: 'Granularity',
    line: 'Line',
    char: 'Character',
    word: 'Word',
    ignoreWhitespace: 'Ignore whitespace',
    algorithm: 'Algorithm',
    run: 'Run',
    swap: 'Swap A/B',
    presets: 'Presets',
    tooLarge:
      'Input {n}×{m} is above the viewable cap of {cap}×{cap}. A lattice that dense is not readable, so it is not drawn — the diff result is still shown below.',
  },
  graph: {
    title: 'Edit graph',
    lede: 'Match positions are marked before the search starts, so the structure the algorithm will exploit is visible up front.',
    vstrip: 'The V array',
    vstripHint: 'One cell per diagonal k. Hover a k cell to highlight that diagonal in the lattice.',
    noVStrip: 'This algorithm maintains no V array. It anchors on elements and splits recursively, so there is no frontier to watch.',
    output: 'Diff output',
    stats: 'Stats',
    d: 'D (edit distance)',
    steps: 'Recorded steps',
    snakes: 'Snakes',
    tokens: 'Tokens',
    memory: 'V cells stored',
    ambiguityCount: '{n} minimal edit scripts found',
    ambiguityUnique: 'The minimal edit script is unique — no ambiguity on this input.',
    ambiguityMany: 'Several scripts are equally minimal. The algorithm picks one by tie-breaking.',
    altScript: 'Alternative script',
    linearSpace: 'Linear space',
    forward: 'Forward frontier',
    backward: 'Backward frontier',
    middleSnake: 'Middle snake',
  },
  stepper: {
    play: 'Play',
    pause: 'Pause',
    step: 'Step',
    stepBack: 'Step back',
    nextD: 'Next d',
    nextSnake: 'Next snake',
    reset: 'Start',
    end: 'End',
    speed: 'Speed',
  },
  compare: {
    title: 'Algorithm comparison',
    lede: 'Myers, patience, and histogram on the same input. Patience usually produces a longer script — that is the point: minimal is not the same as readable.',
    scriptLength: 'Script length (D)',
    hunks: 'Hunk count',
    minimal: 'Minimal',
    yes: 'Yes',
    no: 'No',
    note: 'Only Myers guarantees a minimal D. Patience and histogram trade minimality for readability.',
  },
  presets: {
    title: 'Presets',
    lede: 'Each preset carries the phenomenon it exists to show.',
    open: 'Open in the edit graph',
  },
  legend: {
    title: 'Legend',
    match: 'Match position',
    explored: 'Explored region',
    frontier: 'Frontier',
    path: 'Chosen path',
  },
}

const DICTS: Record<Locale, Dict> = { id, en }

export function getDict(locale: Locale): Dict {
  return DICTS[locale]
}

/**
 * Fill {placeholders}. Copy stays plain strings so the whole dictionary can be
 * handed from a server component to a client one — functions cannot cross that
 * boundary.
 */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  )
}
