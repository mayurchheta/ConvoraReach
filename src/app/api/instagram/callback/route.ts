// Re-export the actual callback handler so Meta's existing redirect URI works
// Meta has: https://reach.convora.io/api/instagram/callback
// Our handler lives at: /api/auth/instagram/callback
export { GET } from "@/app/api/auth/instagram/callback/route"
