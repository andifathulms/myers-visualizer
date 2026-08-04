// GitHub Pages runs Jekyll unless told otherwise, and Jekyll drops _next/.
// PRD §12: `.nojekyll` must exist in the output root.
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

await writeFile(join(process.cwd(), 'out', '.nojekyll'), '')
console.log('postbuild: wrote out/.nojekyll')
