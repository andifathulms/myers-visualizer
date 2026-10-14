/**
 * Theme constants shared by the server layout and the client hook. Kept out
 * of the `'use client'` module on purpose: a server component importing a
 * string from a client module receives a client reference, not the string.
 */
export const THEME_STORAGE_KEY = 'mv-theme'

/**
 * Runs before first paint, inline in <head>, so a stored choice never flashes
 * the other theme first. A string because it is injected as-is; it reads the
 * same key the toggle writes and tolerates storage being refused.
 */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`
