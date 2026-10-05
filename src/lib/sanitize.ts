import sanitizeHtml from "sanitize-html";

/**
 * Strip all markup from a user-submitted string and normalize
 * whitespace. Menu item names/descriptions and restaurant profile
 * fields are free text that gets rendered on the public menu page, so
 * every one of them goes through this before it's stored — storing the
 * sanitized value (not just sanitizing at render time) means every
 * consumer of the data is safe by construction, not by convention.
 */
export function sanitizePlainText(input: string): string {
  // allowedTags/allowedAttributes: {} means strip ALL html tags/attributes
  // and return plain text content only.
  const clean = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
  return clean.replace(/\s+/g, " ").trim();
}
