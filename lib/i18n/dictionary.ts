import { APP_NAME } from '../brand'
import type { Locale } from './locales'

/**
 * Interface copy is Indonesian-first. Algorithm terms — snake, frontier,
 * edit script, diagonal — stay in English in both locales so a reader
 * recognises them in the paper and in source code afterwards. PRD §9.
 *
 * Because those terms stay English, every one of them is *also* defined in
 * plain language: the glossary below, the panel hints, and the home page's
 * three steps exist so that a reader who has never opened a diff can still
 * follow what the picture is doing. The technical detail is not diluted, it
 * is preceded.
 */
export type Dict = {
  nav: { graph: string; compare: string; presets: string; home: string; brand: string }
  home: {
    kicker: string
    tagline: string
    lede: string
    ctaGraph: string
    ctaCompare: string
    /** The hero's still edit graph — the picture the page opens with. */
    figure: {
      alt: string
      axisA: string
      axisB: string
      deleted: string
      inserted: string
      keyMatch: string
      keySearch: string
      keyPath: string
    }
    /** The 20-second "what even is a diff" worked example. */
    exampleTitle: string
    exampleLede: string
    exampleBefore: string
    exampleAfter: string
    exampleResult: string
    exampleCaption: string
    stepsTitle: string
    stepsLede: string
    steps: readonly { readonly title: string; readonly body: string }[]
    whatTitle: string
    what: string
    moves: { move: string; meaning: string; cost: string }
    moveRight: string
    moveDown: string
    moveDiag: string
    ambiguityTitle: string
    ambiguity: string
    glossaryTitle: string
    glossaryLede: string
    creditsTitle: string
    creditsLede: string
    notGit: string
  }
  glossary: readonly { readonly term: string; readonly plain: string }[]
  input: {
    title: string
    hint: string
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
    options: string
    /** Placeholders {n} {m} {cap} — the dictionary must stay serialisable. */
    tooLarge: string
  }
  graph: {
    title: string
    lede: string
    stepInput: string
    stepInputHint: string
    stepWatch: string
    stepWatchHint: string
    stepResult: string
    stepResultHint: string
    canvas: string
    canvasHint: string
    axisA: string
    axisB: string
    vstrip: string
    vstripHint: string
    noVStrip: string
    /** Before the first step: the lattice and the strip are honestly empty. */
    idleCanvas: string
    idleVStrip: string
    output: string
    outputHint: string
    stats: string
    statsHint: string
    d: string
    /** Placeholder {current}. Progress toward D, said in words not as a ratio. */
    dReached: string
    steps: string
    snakes: string
    tokens: string
    memory: string
    memoryNaive: string
    ambiguityCount: string
    ambiguityTitle: string
    ambiguityHint: string
    ambiguityUnique: string
    ambiguityMany: string
    altScript: string
    altScriptHint: string
    /** Per-line contestedness in the diff output. §6.4 */
    contested: string
    /** Placeholders {used} {total}. */
    contestedShare: string
    /**
     * The accessible name of a diff line. Placeholders {kind} {line} {text},
     * plus {share} which is either empty or lineShare.
     */
    lineLabel: string
    lineKept: string
    lineDeleted: string
    lineInserted: string
    /** Placeholders {used} {total}. Appended to lineLabel when contested. */
    lineShare: string
    contestedNone: string
    /** The tie-break, at the step where it fires. §6.4 */
    step: string
    stepHint: string
    /** Placeholders {d} {k}. */
    stepAt: string
    stepDown: string
    stepRight: string
    stepStart: string
    stepTied: string
    stepNoTie: string
    stepNoSteps: string
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
    keys: string
    /** Said when the OS asks for reduced motion and autoplay is therefore off. */
    reducedMotion: string
    progress: string
  }
  compare: {
    title: string
    lede: string
    plain: string
    scriptLength: string
    scriptLengthHint: string
    hunks: string
    hunksHint: string
    minimal: string
    minimalHint: string
    yes: string
    no: string
    note: string
    /** Shown only when every algorithm returns the same shape of answer. Placeholder {preset}. */
    allAgree: string
    /** Shown only when the linear-space variant stored more than greedy did. */
    memoryCrossover: string
    tableTitle: string
    outputTitle: string
    outputHint: string
    shortest: string
  }
  presets: { title: string; lede: string; open: string; linkFragment: string }
  a11y: {
    skipToContent: string
    graphLabel: string
    /** Placeholders {d} {maxD} {k} {x} {y}. */
    stepAnnouncement: string
    copyLink: string
    copied: string
    switchLocale: string
  }
  legend: {
    title: string
    match: string
    matchHint: string
    explored: string
    exploredHint: string
    frontier: string
    frontierHint: string
    path: string
    pathHint: string
  }
}

const id: Dict = {
  nav: {
    graph: 'Edit graph',
    compare: 'Banding',
    presets: 'Contoh',
    home: 'Beranda',
    brand: APP_NAME,
  },
  home: {
    kicker: 'Algoritma diff Myers, dibuat bisa ditonton',
    tagline: 'Bagaimana komputer tahu apa yang berubah?',
    lede: 'Setiap kali Anda menyimpan berkas, Git membandingkan versi lama dan versi baru, lalu menampilkan baris mana yang ditambah dan mana yang dihapus. Di balik itu ada satu algoritma dari 1986. Situs ini menjalankannya pelan-pelan supaya bisa ditonton.',
    ctaGraph: 'Tonton algoritmanya bekerja',
    ctaCompare: 'Bandingkan algoritma',
    figure: {
      alt: 'Edit graph untuk dua daftar belanja: rute terpendek menuruni kisi, empat langkah diagonal gratis, satu langkah ke kanan yang menghapus satu baris, dan satu langkah ke bawah yang menyisipkan satu baris.',
      axisA: 'teks lama',
      axisB: 'teks baru',
      deleted: '− dihapus',
      inserted: '+ disisipkan',
      keyMatch: 'baris yang sama — gratis',
      keySearch: 'yang sempat dicoba',
      keyPath: 'rute terpendek',
    },

    exampleTitle: 'Apa itu diff?',
    exampleLede: 'Diff adalah daftar perubahan terkecil yang mengubah satu teks menjadi teks lain. Dua daftar belanja ini hampir sama — hanya satu baris yang berbeda.',
    exampleBefore: 'Sebelum',
    exampleAfter: 'Sesudah',
    exampleResult: 'Diff',
    exampleCaption: 'Tanda − berarti dihapus, tanda + berarti ditambahkan, sisanya tidak berubah. Pertanyaan sesungguhnya: bagaimana komputer memutuskan bahwa itu satu penggantian, bukan menghapus lima baris lalu menulis lima baris baru?',

    stepsTitle: 'Cara kerjanya, dalam tiga langkah',
    stepsLede: 'Tidak ada matematika di bagian ini. Ini seluruh idenya.',
    steps: [
      {
        title: 'Susun jadi kisi',
        body: 'Teks lama ditulis mendatar, teks baru menurun. Setiap titik pada kisi berarti "sudah memakai sekian baris lama dan sekian baris baru". Perubahan menjadi soal mencari jalan dari pojok kiri atas ke pojok kanan bawah.',
      },
      {
        title: 'Cari jalan termurah',
        body: 'Melangkah ke kanan berarti menghapus satu baris lama. Ke bawah berarti menyisipkan satu baris baru. Menyusuri diagonal gratis — itu baris yang sama persis di kedua sisi. Diff terbaik adalah jalur dengan langkah berbayar paling sedikit.',
      },
      {
        title: 'Baca jalurnya',
        body: 'Jalur yang menang diterjemahkan kembali menjadi daftar − dan + yang biasa Anda lihat. Kanan menjadi baris terhapus, bawah menjadi baris tersisip, diagonal menjadi baris yang dibiarkan.',
      },
    ],

    whatTitle: 'Untuk yang ingin detailnya',
    what: 'Diberi dua urutan A (panjang N) dan B (panjang M), bentuk sebuah edit graph: kisi (N+1) × (M+1) titik, di mana titik (x, y) berarti "sudah memakai x elemen A dan y elemen B". Diff adalah jalur dari (0,0) ke (N,M). Edit script terpendek adalah jalur dengan langkah non-diagonal paling sedikit.',
    moves: { move: 'Langkah', meaning: 'Arti', cost: 'Biaya' },
    moveRight: 'hapus A[x]',
    moveDown: 'sisip B[y]',
    moveDiag: 'pertahankan — hanya bila A[x] == B[y]',

    ambiguityTitle: 'Kenapa diff kadang menyalahkan baris yang keliru',
    ambiguity: 'Sering ada beberapa jalur yang sama-sama terpendek. Semuanya benar, dan semuanya sama singkat — jadi algoritma memilih satu lewat aturan tie-breaking, bukan lewat penilaian mana yang lebih masuk akal bagi manusia. Di sinilah kurung kurawal penutup bisa dikaitkan ke fungsi yang salah. Situs ini menghitung berapa banyak jalur minimal yang ada dan membiarkan Anda melihat alternatifnya.',

    glossaryTitle: 'Istilah',
    glossaryLede: 'Istilah algoritma sengaja dibiarkan dalam bahasa Inggris supaya Anda mengenalinya lagi di paper dan di kode. Ini terjemahannya ke bahasa manusia.',

    creditsTitle: 'Bacaan',
    creditsLede: 'Situs ini menunjuk ke sumbernya, bukan menggantikannya.',
    notGit: 'Ini bukan git. Implementasi Myers di git memakai heuristik dan fallback tambahan yang tidak direproduksi di sini; tidak ada klaim keluaran identik byte-per-byte dengan git diff.',
  },
  glossary: [
    { term: 'diff', plain: 'Daftar perubahan antara dua teks — baris apa yang dihapus, apa yang ditambah.' },
    { term: 'edit script', plain: 'Urutan langkah yang mengubah A menjadi B. Itulah "jawaban" yang dicari.' },
    { term: 'edit graph', plain: 'Kisi yang menjadi papan pencariannya. Satu sumbu untuk teks lama, satu untuk teks baru.' },
    { term: 'D', plain: 'Berapa banyak langkah berbayar dalam jawaban — jumlah baris yang dihapus ditambah yang disisipkan. Makin kecil makin ringkas.' },
    { term: 'snake', plain: 'Deretan baris yang sama persis di kedua sisi, dilalui gratis. Di gambar tampak sebagai garis miring.' },
    { term: 'frontier', plain: 'Sejauh mana pencarian sudah sampai. Ia memuai selangkah demi selangkah — itu bagian yang bergerak.' },
    { term: 'diagonal k', plain: 'Nomor jalur miring pada kisi, k = x − y. Cara algoritma menyebut "sedang di garis miring yang mana".' },
    { term: 'array V', plain: 'Catatan kecil berisi titik terjauh yang dicapai pada setiap diagonal. Ini satu-satunya data yang benar-benar disimpan algoritma.' },
  ],
  input: {
    title: 'Masukan',
    hint: 'Tempel teks apa pun, atau pilih salah satu contoh. Perubahan langsung dijalankan.',
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
    options: 'Opsi',
    tooLarge:
      'Masukan {n}×{m} melampaui batas tampilan {cap}×{cap}. Lattice sebesar itu tidak terbaca, jadi tidak digambar — hasil diff tetap ditampilkan di bawah.',
  },
  graph: {
    title: 'Edit graph',
    lede: 'Pencarian yang sama, dari tiga sudut: kisinya, catatan yang dipakai algoritma, dan diff yang keluar. Gerakkan satu, dua lainnya ikut.',
    stepInput: 'Masukkan dua teks',
    stepInputHint: 'Kiri versi lama, kanan versi baru. Belum punya bahan? Ambil dari daftar Contoh.',
    stepWatch: 'Tonton pencariannya',
    stepWatchHint: 'Tekan putar, atau maju selangkah demi selangkah. Pencarian sudah direkam, jadi mundur pun gratis.',
    stepResult: 'Baca hasilnya',
    stepResultHint: 'Jalur yang menang, ditulis ulang sebagai diff biasa. Klik satu baris untuk melihat langkahnya di kisi.',
    canvas: 'Kisi pencarian',
    canvasHint: 'Tiap garis miring — titik kecil bila kisinya rapat — menandai baris yang sama di kedua sisi. Itulah langkah gratis yang akan diincar algoritma.',
    axisA: 'A — sebelum →',
    axisB: 'B — sesudah ↓',
    vstrip: 'Array V',
    vstripHint: 'Satu sel per diagonal k. Arahkan kursor ke sebuah k untuk menyorot diagonalnya di lattice.',
    idleCanvas: 'Belum ada yang dicari. Tekan putar di bawah, atau melangkah satu per satu.',
    idleVStrip: 'Masih kosong — V baru terisi setelah langkah pertama.',
    noVStrip: 'Algoritma ini tidak memelihara array V. Ia berlabuh pada elemen dan membelah rekursif, jadi tidak ada frontier untuk ditonton.',
    output: 'Keluaran diff',
    outputHint: 'Klik sebuah baris untuk menyorot langkah yang menghasilkannya di kisi.',
    stats: 'Statistik',
    statsHint: 'Angka di balik gambar, termasuk memori yang benar-benar dipakai.',
    d: 'D (jarak edit)',
    dReached: 'tercapai sejauh ini: {current}',
    steps: 'Langkah terekam',
    snakes: 'Snake',
    tokens: 'Token',
    memory: 'Sel V tersimpan',
    memoryNaive: 'Sel V bila naif',
    ambiguityCount: 'edit script minimal ditemukan',
    ambiguityTitle: 'Ambiguitas',
    ambiguityHint: 'Berapa banyak jawaban sependek ini yang sebenarnya ada.',
    ambiguityUnique: 'Edit script minimal tunggal — tidak ada ambiguitas pada masukan ini.',
    ambiguityMany: 'Beberapa script sama-sama minimal. Algoritma memilih satu lewat tie-breaking.',
    altScript: 'Script alternatif',
    altScriptHint: 'Sama-sama sependek yang dipilih algoritma. Coba beralih dan lihat diff di bawah berubah.',
    contested: 'Angka di kanan sebuah baris berarti baris itu diperdebatkan: sekian dari sekian script terpendek mengaitkan perubahan seperti ini. Baris tanpa angka ada di semua script terpendek — bagian diff itu bukan pilihan.',
    contestedShare: '{used} dari {total}',
    lineLabel: 'Baris {line}, {kind}: {text}{share}',
    lineKept: 'tetap',
    lineDeleted: 'dihapus',
    lineInserted: 'disisipkan',
    lineShare: ' — ada di {used} dari {total} script terpendek',
    contestedNone: 'Setiap baris di bawah ada di semua script terpendek.',
    step: 'Langkah ini',
    stepHint: 'Dari mana langkah di bawah kursor datang, dan apakah pilihannya seri. Saat seri, yang menang ditentukan tie-breaking — implementasi ini membandingkan dengan < bukan ≤, bukan dengan menilai mana yang lebih enak dibaca.',
    stepAt: 'd = {d} · k = {k}',
    stepDown: 'turun dari k+1 — menyisipkan satu baris',
    stepRight: 'ke kanan dari k−1 — menghapus satu baris',
    stepStart: 'titik awal (0,0)',
    stepTied: 'seri — k−1 mencapai titik yang sama, dan tie-breaking yang memilih.',
    stepNoTie: 'bukan seri — pendahulu satunya tidak sejauh ini.',
    stepNoSteps: 'Hanya untuk Myers greedy — algoritma lain tidak memakai V.',
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
    keys: 'Papan ketik: spasi untuk putar, ← → untuk melangkah, ↑ ↓ untuk lompat per d.',
    reducedMotion: 'Sistem Anda meminta gerak dikurangi, jadi putar otomatis dimatikan — melangkah tetap berfungsi.',
    progress: 'Posisi',
  },
  compare: {
    title: 'Banding algoritma',
    lede: 'Myers, patience, dan histogram pada masukan yang sama. Patience biasanya menghasilkan script lebih panjang — itu memang tujuannya: minimal tidak sama dengan mudah dibaca.',
    plain: 'Git punya lebih dari satu cara membuat diff. Semuanya menghasilkan jawaban yang benar; yang berbeda adalah jawaban mana yang paling enak dibaca manusia. Halaman ini menjalankan semuanya sekaligus supaya bedanya terlihat.',
    scriptLength: 'Panjang script (D)',
    scriptLengthHint: 'Jumlah baris yang dihapus dan disisipkan. Lebih kecil berarti lebih ringkas.',
    hunks: 'Jumlah hunk',
    hunksHint: 'Berapa banyak potongan terpisah yang harus dibaca. Lebih sedikit biasanya lebih enak.',
    minimal: 'Menjamin minimal',
    minimalHint: 'Apakah algoritma menjamin D sekecil mungkin — bukan apakah D-nya kebetulan minimal pada masukan ini.',
    yes: 'Ya',
    no: 'Tidak dijamin',
    note: 'Hanya Myers yang menjamin D minimal. Patience dan histogram menukar minimalitas dengan keterbacaan.',
    memoryCrossover: 'Varian linear-space menyimpan lebih banyak sel daripada greedy di sini. Itu bukan salah hitung: ia menukar penyimpanan O(D²) dengan O(N+M) plus biaya tetap rekursi, dan pada masukan sekecil ini biaya tetapnya yang menang. Bedanya berbalik saat D bertambah — buka contoh yang lebih besar di edit graph untuk melihatnya.',
    allAgree: 'Pada masukan ini keempatnya sepakat: D sama, jumlah hunk sama. Itu biasa pada suntingan kecil — perbedaannya muncul ketika ada baris berulang yang memberi Myers tempat berlabuh lain. Coba contoh "{preset}".',
    tableTitle: 'Angkanya',
    outputTitle: 'Keluarannya, berdampingan',
    outputHint: 'Masukan yang sama, empat cara membacanya.',
    shortest: 'terpendek',
  },
  presets: {
    title: 'Contoh',
    lede: 'Tiap contoh memuat fenomena yang ingin ditunjukkan. Buka salah satu, lalu tekan putar.',
    open: 'Buka di edit graph',
    linkFragment: 'Potongan tautan untuk contoh ini',
  },
  a11y: {
    skipToContent: 'Lompat ke konten',
    graphLabel:
      'Edit graph — visualisasi kanvas. Angka yang sama tersedia di panel statistik dan array V di sebelahnya.',
    stepAnnouncement: 'd = {d} dari {maxD}, diagonal k = {k}, titik ({x}, {y})',
    copyLink: 'Salin tautan',
    copied: 'Tersalin',
    switchLocale: 'Ganti bahasa',
  },
  legend: {
    title: 'Legenda',
    match: 'Posisi cocok',
    matchHint: 'baris yang sama di kedua sisi',
    explored: 'Wilayah terjelajah',
    exploredHint: 'sudah dicoba dan ditinggalkan',
    frontier: 'Frontier',
    frontierHint: 'sejauh ini pencarian sampai',
    path: 'Jalur terpilih',
    pathHint: 'jawabannya',
  },
}

const en: Dict = {
  nav: {
    graph: 'Edit graph',
    compare: 'Compare',
    presets: 'Presets',
    home: 'Home',
    brand: APP_NAME,
  },
  home: {
    kicker: 'The Myers diff algorithm, made watchable',
    tagline: 'How does a computer know what changed?',
    lede: 'Every time you save a file, Git compares the old version with the new one and shows you which lines were added and which were removed. Behind that is a single algorithm from 1986. This site runs it slowly enough to watch.',
    ctaGraph: 'Watch the algorithm run',
    ctaCompare: 'Compare algorithms',
    figure: {
      alt: 'An edit graph for two shopping lists: the shortest route down the grid, four free diagonal steps, one step right that deletes a line, and one step down that inserts one.',
      axisA: 'old text',
      axisB: 'new text',
      deleted: '− deleted',
      inserted: '+ inserted',
      keyMatch: 'identical line — free',
      keySearch: 'what it tried',
      keyPath: 'shortest route',
    },

    exampleTitle: 'What is a diff?',
    exampleLede: 'A diff is the smallest list of changes that turns one text into another. These two shopping lists are nearly identical — one line differs.',
    exampleBefore: 'Before',
    exampleAfter: 'After',
    exampleResult: 'Diff',
    exampleCaption: 'A − means removed, a + means added, everything else stayed put. The real question is the interesting one: how does a computer decide that this is one substitution rather than deleting five lines and writing five new ones?',

    stepsTitle: 'How it works, in three steps',
    stepsLede: 'No mathematics in this part. This is the whole idea.',
    steps: [
      {
        title: 'Lay it out as a grid',
        body: 'The old text runs across the top, the new text runs down the side. Every point on the grid means "used this many old lines and this many new ones". The change becomes a question of finding a route from the top-left corner to the bottom-right.',
      },
      {
        title: 'Find the cheapest route',
        body: 'Stepping right deletes one old line. Stepping down inserts one new line. Running along a diagonal is free — those are the lines that are identical on both sides. The best diff is the route with the fewest paid steps.',
      },
      {
        title: 'Read the route back',
        body: 'The winning route is translated back into the list of − and + lines you are used to seeing. Right becomes a deleted line, down becomes an inserted one, diagonal becomes a line left alone.',
      },
    ],

    whatTitle: 'If you want the detail',
    what: 'Given sequences A (length N) and B (length M), build an edit graph: a grid of (N+1) × (M+1) points, where point (x, y) means "consumed x elements of A and y of B". A diff is a path from (0,0) to (N,M). The shortest edit script is the path with the fewest non-diagonal moves.',
    moves: { move: 'Move', meaning: 'Meaning', cost: 'Cost' },
    moveRight: 'delete A[x]',
    moveDown: 'insert B[y]',
    moveDiag: 'keep — only when A[x] == B[y]',

    ambiguityTitle: 'Why a diff sometimes blames the wrong line',
    ambiguity: 'Several routes are often equally short. All of them are correct and all of them are the same length — so the algorithm picks one by a tie-breaking rule, not by any judgement about which reads better to a human. That is how a closing brace ends up attributed to the wrong function. This site counts how many minimal routes exist and lets you look at the alternatives.',

    glossaryTitle: 'Glossary',
    glossaryLede: 'The algorithm terms are deliberately left in English so you recognise them again in the paper and in real source code. Here they are in plain language.',

    creditsTitle: 'Reading',
    creditsLede: 'This site points at its sources rather than replacing them.',
    notGit: 'This is not git. Git’s Myers implementation applies additional heuristics and fallbacks that are not reproduced here; no claim is made of byte-identical parity with git diff.',
  },
  glossary: [
    { term: 'diff', plain: 'The list of changes between two texts — what was removed, what was added.' },
    { term: 'edit script', plain: 'The sequence of steps that turns A into B. It is the answer being searched for.' },
    { term: 'edit graph', plain: 'The grid the search happens on. One axis is the old text, the other is the new one.' },
    { term: 'D', plain: 'How many paid steps the answer takes — lines deleted plus lines inserted. Smaller is tighter.' },
    { term: 'snake', plain: 'A run of lines that are identical on both sides, travelled for free. It shows up as a diagonal.' },
    { term: 'frontier', plain: 'How far the search has reached so far. It expands one step at a time — it is the part that moves.' },
    { term: 'diagonal k', plain: 'Which diagonal of the grid you are on, k = x − y. The algorithm’s way of saying "which slanted lane".' },
    { term: 'the V array', plain: 'A small note of the furthest point reached on each diagonal. It is the only data the algorithm really keeps.' },
  ],
  input: {
    title: 'Input',
    hint: 'Paste anything, or pick one of the presets. Edits run immediately.',
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
    options: 'Options',
    tooLarge:
      'Input {n}×{m} is above the viewable cap of {cap}×{cap}. A lattice that dense is not readable, so it is not drawn — the diff result is still shown below.',
  },
  graph: {
    title: 'Edit graph',
    lede: 'One search from three angles: the grid, the note the algorithm keeps, and the diff that comes out. Move one and the others follow.',
    stepInput: 'Give it two texts',
    stepInputHint: 'Old version on the left, new version on the right. Nothing to hand? Take one from the presets.',
    stepWatch: 'Watch it search',
    stepWatchHint: 'Press play, or move one step at a time. The search is recorded, so stepping back costs nothing.',
    stepResult: 'Read the result',
    stepResultHint: 'The winning route, written back out as an ordinary diff. Click a line to see the move that produced it.',
    canvas: 'The search grid',
    canvasHint: 'Each diagonal thread — a small knot when the grid is dense — marks a line that is identical on both sides. Those are the free steps the algorithm will aim for.',
    axisA: 'A — before →',
    axisB: 'B — after ↓',
    vstrip: 'The V array',
    vstripHint: 'One cell per diagonal k. Hover a k cell to highlight that diagonal in the lattice.',
    idleCanvas: 'Nothing has been searched yet. Press play below, or step through it one move at a time.',
    idleVStrip: 'Empty until the first step — V fills in as d advances.',
    noVStrip: 'This algorithm maintains no V array. It anchors on elements and splits recursively, so there is no frontier to watch.',
    output: 'Diff output',
    outputHint: 'Click a line to highlight the move that produced it on the grid.',
    stats: 'Stats',
    statsHint: 'The numbers behind the picture, including the memory actually used.',
    d: 'D (edit distance)',
    dReached: 'reached so far: {current}',
    steps: 'Recorded steps',
    snakes: 'Snakes',
    tokens: 'Tokens',
    memory: 'V cells stored',
    memoryNaive: 'V cells if naive',
    ambiguityCount: 'minimal edit scripts found',
    ambiguityTitle: 'Ambiguity',
    ambiguityHint: 'How many answers this short actually exist.',
    ambiguityUnique: 'The minimal edit script is unique — no ambiguity on this input.',
    ambiguityMany: 'Several scripts are equally minimal. The algorithm picks one by tie-breaking.',
    altScript: 'Alternative script',
    altScriptHint: 'Every bit as short as the one the algorithm chose. Switch between them and watch the diff below change.',
    contested: 'A number beside a line means that line is contested: that many of the shortest scripts attribute the change this way. Lines without one appear in every shortest script — that part of the diff is not a choice.',
    contestedShare: '{used} of {total}',
    lineLabel: 'Line {line}, {kind}: {text}{share}',
    lineKept: 'unchanged',
    lineDeleted: 'removed',
    lineInserted: 'added',
    lineShare: ' — in {used} of {total} shortest scripts',
    contestedNone: 'Every line below appears in all of the shortest scripts.',
    step: 'This step',
    stepHint: 'Where the step under the cursor came from, and whether the choice was a tie. When it is, the winner is decided by tie-breaking — this implementation compares with < rather than ≤, not by judging which reads better.',
    stepAt: 'd = {d} · k = {k}',
    stepDown: 'down from k+1 — inserts a line',
    stepRight: 'right from k−1 — deletes a line',
    stepStart: 'the starting point (0,0)',
    stepTied: 'a tie — k−1 reached the same point, and the tie-break chose.',
    stepNoTie: 'not a tie — the other predecessor fell short.',
    stepNoSteps: 'Myers greedy only — the other algorithms keep no V.',
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
    keys: 'Keyboard: space to play, ← → to step, ↑ ↓ to jump by d.',
    reducedMotion: 'Your system asks for reduced motion, so autoplay is off — stepping still works.',
    progress: 'Position',
  },
  compare: {
    title: 'Algorithm comparison',
    lede: 'Myers, patience, and histogram on the same input. Patience usually produces a longer script — that is the point: minimal is not the same as readable.',
    plain: 'Git has more than one way of producing a diff. All of them are correct; what differs is which answer a human finds easiest to read. This page runs all of them at once so the difference is visible.',
    scriptLength: 'Script length (D)',
    scriptLengthHint: 'Lines deleted plus lines inserted. Smaller is tighter.',
    hunks: 'Hunk count',
    hunksHint: 'How many separate chunks you have to read. Fewer is usually kinder.',
    minimal: 'Guarantees minimal',
    minimalHint: 'Whether the algorithm guarantees the smallest possible D — not whether its D happens to be minimal on this input.',
    yes: 'Yes',
    no: 'Not guaranteed',
    note: 'Only Myers guarantees a minimal D. Patience and histogram trade minimality for readability.',
    memoryCrossover: 'The linear-space variant stored more cells than greedy here. That is not a miscount: it trades O(D²) storage for O(N+M) plus a fixed recursion overhead, and on an input this small the overhead wins. The order reverses as D grows — open a larger preset in the edit graph to watch it.',
    allAgree: 'On this input all four agree: same D, same number of hunks. That is the common case on small edits — the differences appear when a repeated line gives Myers somewhere else to anchor. Try the "{preset}" preset.',
    tableTitle: 'The numbers',
    outputTitle: 'The output, side by side',
    outputHint: 'One input, four ways of reading it.',
    shortest: 'shortest',
  },
  presets: {
    title: 'Presets',
    lede: 'Each preset carries the phenomenon it exists to show. Open one, then press play.',
    open: 'Open in the edit graph',
    linkFragment: 'The link fragment for this preset',
  },
  a11y: {
    skipToContent: 'Skip to content',
    graphLabel:
      'Edit graph — a canvas visualisation. The same numbers are available in the stats panel and the V array beside it.',
    stepAnnouncement: 'd = {d} of {maxD}, diagonal k = {k}, point ({x}, {y})',
    copyLink: 'Copy link',
    copied: 'Copied',
    switchLocale: 'Switch language',
  },
  legend: {
    title: 'Legend',
    match: 'Match position',
    matchHint: 'the same line on both sides',
    explored: 'Explored region',
    exploredHint: 'tried and left behind',
    frontier: 'Frontier',
    frontierHint: 'how far the search has reached',
    path: 'Chosen path',
    pathHint: 'the answer',
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
