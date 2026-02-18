/**
 * Verification Code Utilities
 *
 * Helpers for generating, formatting and normalizing 6-character
 * alphanumeric verification codes used in manual level verification.
 *
 * Ambiguous characters (0, O, I, 1) are excluded to make codes
 * easier to read aloud and type correctly.
 */

/**
 * Generates a cryptographically-safe random 6-character code.
 * Returns a plain string like "A7X99B" (no dash).
 */
export function generateVerificationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Formats a raw 6-char code for display: "A7X99B" → "A7X-99B"
 */
export function formatCode(code: string): string {
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (clean.length !== 6) return code
  return `${clean.slice(0, 3)}-${clean.slice(3)}`
}

/**
 * Strips the dash before DB queries: "A7X-99B" → "A7X99B"
 */
export function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "")
}