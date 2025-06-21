export const siteConfig = {
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

export function getCallbackUrl(next = '/dashboard') {
  return `${siteConfig.url}/auth/callback?next=${encodeURIComponent(next)}`;
}