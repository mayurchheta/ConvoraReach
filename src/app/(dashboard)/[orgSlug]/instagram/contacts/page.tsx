"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Users, Check, X, ChevronLeft, ChevronRight } from "lucide-react"

interface InstagramContact {
  id: string
  ig_user_id: string
  username: string | null
  email: string | null
  phone: string | null
  is_follower: boolean
  source: string | null
  first_seen_at: string
}

const SOURCE_LABELS: Record<string, string> = {
  comment_automation: "Comment",
  dm_automation: "DM",
  story_reply: "Story Reply",
  rewind: "Rewind",
  manual: "Manual",
}

const SOURCE_COLORS: Record<string, string> = {
  comment_automation: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
  dm_automation: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  story_reply: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  rewind: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
  manual: "bg-muted text-muted-foreground",
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function exportCsv(contacts: InstagramContact[]): void {
  const headers = ["Username", "Email", "Phone", "Source", "Follower", "First Seen"]
  const rows = contacts.map((c) => [
    c.username ?? "",
    c.email ?? "",
    c.phone ?? "",
    c.source ?? "",
    c.is_follower ? "Yes" : "No",
    formatDate(c.first_seen_at),
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `instagram-contacts-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function InstagramContactsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const [contacts, setContacts] = useState<InstagramContact[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [cursor, setCursor] = useState<string | null>(null)
  const [prevCursors, setPrevCursors] = useState<string[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchContacts = useCallback(
    async (opts: { cursorVal?: string | null; searchVal?: string; resetPage?: boolean } = {}) => {
      const { cursorVal = cursor, searchVal = search, resetPage = false } = opts
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchVal) params.set("search", searchVal)
        if (cursorVal) params.set("cursor", cursorVal)

        const res = await fetch(
          `/api/orgs/${orgSlug}/instagram/contacts?${params}`
        )
        if (!res.ok) throw new Error("Failed to load contacts")
        const data = (await res.json()) as {
          contacts: InstagramContact[]
          total: number
          nextCursor: string | null
        }

        setContacts(data.contacts)
        setTotal(data.total)
        setNextCursor(data.nextCursor)
        if (resetPage) {
          setPage(1)
          setPrevCursors([])
          setCursor(null)
        }
      } catch {
        toast.error("Failed to load contacts")
      } finally {
        setLoading(false)
      }
    },
    [orgSlug, cursor, search]
  )

  // Initial load
  useEffect(() => {
    fetchContacts({ cursorVal: null, searchVal: "", resetPage: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug])

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      fetchContacts({ cursorVal: null, searchVal: search, resetPage: true })
    }, 400)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleNextPage = useCallback(() => {
    if (!nextCursor) return
    setPrevCursors((prev) => [...prev, cursor ?? ""])
    setCursor(nextCursor)
    setPage((p) => p + 1)
    fetchContacts({ cursorVal: nextCursor, searchVal: search, resetPage: false })
  }, [nextCursor, cursor, search, fetchContacts])

  const handlePrevPage = useCallback(() => {
    if (prevCursors.length === 0) return
    const newPrev = [...prevCursors]
    const prevCur = newPrev.pop() ?? null
    setPrevCursors(newPrev)
    setCursor(prevCur)
    setPage((p) => p - 1)
    fetchContacts({ cursorVal: prevCur, searchVal: search, resetPage: false })
  }, [prevCursors, search, fetchContacts])

  const handleExport = useCallback(() => {
    if (contacts.length === 0) {
      toast.error("No contacts to export")
      return
    }
    exportCsv(contacts)
    toast.success(`Exported ${contacts.length} contacts`)
  }, [contacts])

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Users className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Instagram Contacts</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading…" : `${total.toLocaleString()} total contacts`}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={loading || contacts.length === 0}
        >
          <Download className="h-4 w-4 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8 h-9 text-sm"
          placeholder="Search by username or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Username
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Email
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Source
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Follower
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                First Seen
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="h-3.5 bg-muted animate-pulse rounded w-28" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3.5 bg-muted animate-pulse rounded w-40" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 bg-muted animate-pulse rounded-full w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded w-6" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-3.5 bg-muted animate-pulse rounded w-24" />
                    </td>
                  </tr>
                ))}
              </>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Users className="h-10 w-10 opacity-25" />
                    <div>
                      <p className="font-medium">No contacts captured yet</p>
                      <p className="text-sm mt-1">
                        Set up an automation to start capturing leads.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b last:border-b-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">
                    {contact.username ? (
                      <span>@{contact.username}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        {contact.ig_user_id}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {contact.email ?? (
                      <span className="text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {contact.source ? (
                      <Badge
                        className={`text-xs ${
                          SOURCE_COLORS[contact.source] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {SOURCE_LABELS[contact.source] ?? contact.source}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {contact.is_follower ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDate(contact.first_seen_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && contacts.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={prevCursors.length === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!nextCursor}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}