/**
 * The maker's mark: a quiet author credit, not a badge.
 *
 * It is deliberately kept apart from the not-git disclaimer it shares a bar
 * with — that one is a claim about the software, this one is a person's name,
 * and merging them would make each read as the other. Opposite ends of the
 * same seam is as close as they get.
 *
 * Everything personal lives in MAKER, so updating a handle or adding a
 * platform is one edit in one place.
 */
const MAKER = {
  name: 'Andi Fathul Mukminin',
  portfolio: 'https://andifathulms.github.io/en/',
  links: [
    { label: 'Portfolio', href: 'https://andifathulms.github.io/en/', icon: GlobeIcon },
    { label: 'GitHub', href: 'https://github.com/andifathulms', icon: GitHubIcon },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/andifathulmukminin/', icon: LinkedInIcon },
    { label: 'Instagram', href: 'https://www.instagram.com/andifathulms/', icon: InstagramIcon },
  ],
} as const

export function MakerSignature() {
  // Static export, so this is the build year — which is what the credit means.
  const year = new Date().getFullYear()

  return (
    <div className="flex flex-col gap-1.5 font-sans text-[13px] text-muted sm:items-end">
      <p>
        Designed &amp; built by{' '}
        <a
          href={MAKER.portfolio}
          target="_blank"
          rel="noopener noreferrer"
          className="text-deepIndigo underline decoration-rule underline-offset-4 transition-colors hover:text-madder hover:decoration-madder"
        >
          {MAKER.name}
        </a>{' '}
        {/* Only the figure is monospaced; a mono space either side of © reads as a gap. */}
        · © <span className="font-mono tabular-nums">{year}</span>
      </p>

      <ul className="-mx-1.5 flex items-center sm:-mr-1.5">
        {MAKER.links.map(({ label, href, icon: Icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-indigo/10 hover:text-deepIndigo"
            >
              <Icon />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * 18px, currentColor, so each mark inherits the link's muted-to-ink hover.
 * GitHub and LinkedIn are filled because their brand marks are; the globe and
 * Instagram are drawn as thread, which is both correct for Instagram's own
 * mark and the house style everywhere else on this site.
 */
type IconProps = { readonly size?: number }

function GlobeIcon({ size = 18 }: IconProps) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" />
    </svg>
  )
}

function GitHubIcon({ size = 18 }: IconProps) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

function LinkedInIcon({ size = 18 }: IconProps) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  )
}

function InstagramIcon({ size = 18 }: IconProps) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
