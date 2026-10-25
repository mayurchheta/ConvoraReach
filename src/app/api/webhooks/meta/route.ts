// Re-export the actual webhook handler so Meta's existing webhook URL works
// Meta has: https://reach.convora.io/api/webhooks/meta
// Our handler lives at: /api/webhooks/instagram
export { GET, POST } from "@/app/api/webhooks/instagram/route"
