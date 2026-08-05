import type { Metadata, Viewport } from 'next'
import { DM_Mono, Inter, Newsreader } from 'next/font/google'
import './globals.css'
import { APP_DESCRIPTION, APP_NAME, APP_TITLE } from '@/lib/brand'
import { PALETTE } from '@/lib/palette'

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

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
const SITE = 'https://andifathulms.github.io/myers-visualizer'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  // Next does not apply basePath to the manifest link, and a 404 here fails
  // silently: the install prompt simply never appears. Hence the explicit path.
  manifest: `${BASE}/manifest.webmanifest`,
  // Next emits the <link rel="icon"> and <link rel="apple-touch-icon"> from
  // app/icon.svg and app/apple-icon.png; this is the rest of the set.
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    url: SITE,
    // Absolute: metadataBase already carries the basePath, so a root-relative
    // path here gets it a second time.
    images: [{ url: `${SITE}/brand/og.png`, width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: [`${SITE}/brand/og.png`],
  },
}

/**
 * The browser chrome takes the ground colour, not the mark's ink: on a phone
 * the address bar sits directly above the page, and matching it to the paper
 * is what makes the site look like one surface rather than two.
 */
export const viewport: Viewport = {
  themeColor: PALETTE.cotton,
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
