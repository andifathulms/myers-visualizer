import type { Metadata } from 'next'
import { DM_Mono, Inter, Newsreader } from 'next/font/google'
import './globals.css'

// Self-hosted at build time: no runtime font fetch, so the site is fully
// offline after first load. PRD §11.
const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})
const serif = Newsreader({ subsets: ['latin'], variable: '--font-serif', display: 'swap' })
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

export const metadata: Metadata = {
  title: 'Myers Visualizer — the Myers diff algorithm, made watchable',
  description:
    'Watch the Myers diff algorithm run: the edit graph, the advancing frontier, the V array, and the backtrack that recovers the edit script.',
}

/**
 * `lang` is the default locale's; LocaleLang corrects it per route, because
 * this layout is shared by both.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mono.variable} ${serif.variable} ${sans.variable}`}>
      <body className="bg-cotton text-deepIndigo antialiased">{children}</body>
    </html>
  )
}
