/**
 * Converts a string to a URL-friendly slug
 * @param text The string to convert
 * @returns A URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFKD') // Split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word characters except hyphens
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Generates a SEO-friendly URL for a property
 * @param id The property ID
 * @param title The property title
 * @returns A SEO-friendly URL
 */
export function getPropertyUrl(id: number, title: string): string {
  return `/property/${id}-${slugify(title)}`;
}

/**
 * Extracts the ID from a slug
 * @param slug The slug, e.g. "123-luxury-villa"
 * @returns The ID number
 */
export function getIdFromSlug(slug: string): number {
  const match = slug.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Generates a SEO-friendly URL for a city
 * @param name The city name
 * @returns A SEO-friendly URL
 */
export function getCityUrl(name: string): string {
  return `/city/${slugify(name)}`;
}

/**
 * Prepares a Next.js 13+ compatible path for dynamic routes
 * @param path The current path with params
 * @returns A Next.js compatible path
 */
export function prepareNextJsPath(path: string): string {
  // Convert /property/:id to /property/[id]
  return path.replace(/:(\w+)/g, '[$1]');
}