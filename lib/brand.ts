/**
 * The product's identity, in one place.
 *
 * The name is not locale copy — it reads the same in both dictionaries — and
 * it is needed by the document title, the manifest and the nav, which have no
 * other file in common. Brand asset masters live in `exports/` (untracked);
 * the subset the site ships is committed under `public/brand/` and `app/`.
 */
export const APP_NAME = 'Myers Visualizer'

export const APP_TITLE = `${APP_NAME} — the Myers diff algorithm, made watchable`

export const APP_DESCRIPTION =
  'Watch the Myers diff algorithm run: the edit graph, the advancing frontier, the V array, and the backtrack that recovers the edit script.'
