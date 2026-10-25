"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useInstagramStatus } from "@/lib/use-instagram-status"
import { ConnectInstagramPrompt } from "@/components/connect-prompt"
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Mail,
  Link as LinkIcon,
  UserCheck,
  MessageSquare,
} from "lucide-react"

type TriggerType =
  | "comment_keyword"
  | "story_reply"
  | "dm_keyword"
  | "all_comments"
  | "all_story_replies"
  | "all_dms"

interface Automation {
  id: string
  name: string
  trigger_type: TriggerType
  keywords: string[]
  comment_reply: string | null
  dm_message: string
  follow_gate: boolean
  collect_email: boolean
  email_prompt: string | null
  link_url: string | null
  is_active: boolean
  created_at: string
}

type FormData = {
  name: string
  trigger_type: TriggerType
  keywords: string[]
  comment_reply: string
  dm_message: string
  link_url: string
  follow_gate: boolean
  collect_email: boolean
  email_prompt: string
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  comment_keyword: "Comment Keyword",
  story_reply: "Story Reply",
  dm_keyword: "DM Keyword",
  all_comments: "All Comments",
  all_story_replies: "All Story Replies",
  all_dms: "All DMs",
}

function triggerBadgeClass(trigger: TriggerType): string {
  if (trigger === "comment_keyword") return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300"
  if (trigger === "story_reply") return "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
  if (trigger === "dm_keyword") return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
  return "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300"
}

function isKeywordTrigger(trigger: TriggerType) {
  return trigger === "comment_keyword" || trigger === "dm_keyword"
}

function isCommentTrigger(trigger: TriggerType) {
  return (
    trigger === "comment_keyword" ||
    trigger === "all_comments" ||
    trigger === "story_reply" ||
    trigger === "all_story_replies"
  )
}

const DEFAULT_FORM: FormData = {
  name: "",
  trigger_type: "comment_keyword",
  keywords: [],
  comment_reply: "",
  dm_message: "",
  link_url: "",
  follow_gate: false,
  collect_email: false,
  email_prompt: "Please share your email and I'll send you the link!",
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  )
}

function KeywordInput({
  keywords,
  onChange,
}: {
  keywords: string[]
  onChange: (kws: string[]) => void
}) {
  const [inputVal, setInputVal] = useState("")

  function addKeyword(raw: string) {
    const kw = raw.trim().toLowerCase()
    if (!kw || keywords.includes(kw)) return
    onChange([...keywords, kw])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addKeyword(inputVal)
      setInputVal("")
    }
  }

  function handleBlur() {
    if (inputVal.trim()) {
      addKeyword(inputVal)
      setInputVal("")
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 border rounded-md bg-background">
        {keywords.map((kw) => (
          <span
            key={kw}
            className="inline-flex items-center gap-1 bg-muted text-sm px-2 py-0.5 rounded-full"
          >
            {kw}
            <button
              type="button"
              onClick={() => onChange(keywords.filter((k) => k !== kw))}
              className="hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={keywords.length === 0 ? "Type keyword, press Enter…" : "Add more…"}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add. Case-insensitive.
      </p>
    </div>
  )
}

export default function InstagramAutomationsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const igConnected = useInstagramStatus(orgSlug)
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadAutomations()
  }, [orgSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAutomations() {
    try {
      const res = await fetch(`/api/orgs/${orgSlug}/instagram/automations`)
      if (!res.ok) throw new Error("Failed to load")
      const data = (await res.json()) as { automations: Automation[] }
      setAutomations(data.automations)
    } catch {
      toast.error("Failed to load automations")
    } finally {
      setLoading(false)
    }
  }

  function startCreate() {
    setEditingId(null)
    setForm(DEFAULT_FORM)
    setShowForm(true)
  }

  function startEdit(automation: Automation) {
    setEditingId(automation.id)
    setForm({
      name: automation.name,
      trigger_type: automation.trigger_type,
      keywords: automation.keywords ?? [],
      comment_reply: automation.comment_reply ?? "",
      dm_message: automation.dm_message,
      link_url: automation.link_url ?? "",
      follow_gate: automation.follow_gate,
      collect_email: automation.collect_email,
      email_prompt:
        automation.email_prompt ??
        "Please share your email and I'll send you the link!",
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(DEFAULT_FORM)
  }

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!form.dm_message.trim()) {
      toast.error("DM message is required")
      return
    }
    if (isKeywordTrigger(form.trigger_type) && form.keywords.length === 0) {
      toast.error("At least one keyword is required for this trigger type")
      return
    }
    if (form.collect_email && !form.email_prompt.trim()) {
      toast.error("Email prompt is required when collect email is on")
      return
    }

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        trigger_type: form.trigger_type,
        keywords: isKeywordTrigger(form.trigger_type) ? form.keywords : [],
        comment_reply:
          isCommentTrigger(form.trigger_type) && form.comment_reply.trim()
            ? form.comment_reply.trim()
            : null,
        dm_message: form.dm_message.trim(),
        link_url: form.link_url.trim() || null,
        follow_gate: form.follow_gate,
        collect_email: form.collect_email,
        email_prompt: form.collect_email ? form.email_prompt.trim() : null,
      }

      let res: Response
      if (editingId) {
        res = await fetch(
          `/api/orgs/${orgSlug}/instagram/automations/${editingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        )
      } else {
        res = await fetch(`/api/orgs/${orgSlug}/instagram/automations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }

      const json = (await res.json()) as {
        automation?: Automation
        error?: string
      }
      if (!res.ok) throw new Error(json.error ?? "Save failed")

      if (editingId) {
        setAutomations((prev) =>
          prev.map((a) =>
            a.id === editingId ? (json.automation ?? a) : a
          )
        )
        toast.success("Automation updated")
      } else {
        setAutomations((prev) => [json.automation!, ...prev])
        toast.success("Automation created")
      }
      cancelForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(automation: Automation) {
    const newActive = !automation.is_active
    setAutomations((prev) =>
      prev.map((a) =>
        a.id === automation.id ? { ...a, is_active: newActive } : a
      )
    )
    try {
      const res = await fetch(
        `/api/orgs/${orgSlug}/instagram/automations/${automation.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: newActive }),
        }
      )
      if (!res.ok) throw new Error("Toggle failed")
      toast.success(newActive ? "Automation activated" : "Automation paused")
    } catch {
      // Revert on failure
      setAutomations((prev) =>
        prev.map((a) =>
          a.id === automation.id ? { ...a, is_active: !newActive } : a
        )
      )
      toast.error("Failed to update automation")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this automation? This cannot be undone.")) return
    setDeletingId(id)
    try {
      const res = await fetch(
        `/api/orgs/${orgSlug}/instagram/automations/${id}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error("Delete failed")
      setAutomations((prev) => prev.filter((a) => a.id !== id))
      toast.success("Automation deleted")
    } catch {
      toast.error("Failed to delete automation")
    } finally {
      setDeletingId(null)
    }
  }

  if (igConnected === false) {
    return <div className="p-6"><ConnectInstagramPrompt feature="Automations" /></div>
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        {[1, 2].map((i) => (
          <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Instagram Automations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-reply to comments and DMs based on keywords or triggers.
          </p>
        </div>
        {!showForm && (
          <Button onClick={startCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Automation
          </Button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card className="p-6 space-y-5 border-2 border-primary/20">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">
              {editingId ? "Edit Automation" : "New Automation"}
            </h2>
            <button
              type="button"
              onClick={cancelForm}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Link in Bio Reply"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Trigger Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Trigger Type</label>
            <select
              value={form.trigger_type}
              onChange={(e) =>
                setField("trigger_type", e.target.value as TriggerType)
              }
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="comment_keyword">Comment Keyword</option>
              <option value="story_reply">Story Reply</option>
              <option value="dm_keyword">DM Keyword</option>
              <option value="all_comments">All Comments</option>
              <option value="all_story_replies">All Story Replies</option>
              <option value="all_dms">All DMs</option>
            </select>
          </div>

          {/* Keywords (only for keyword triggers) */}
          {isKeywordTrigger(form.trigger_type) && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Keywords</label>
              <KeywordInput
                keywords={form.keywords}
                onChange={(kws) => setField("keywords", kws)}
              />
            </div>
          )}

          {/* Comment Reply (only for comment/story triggers) */}
          {isCommentTrigger(form.trigger_type) && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Comment Reply{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <textarea
                value={form.comment_reply}
                onChange={(e) => setField("comment_reply", e.target.value)}
                placeholder="Public reply posted on the comment itself (leave blank to skip)"
                rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          )}

          {/* DM Message */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              DM Message{" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.dm_message}
              onChange={(e) => setField("dm_message", e.target.value)}
              placeholder="Message to send via DM…"
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Link URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Link URL{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <input
              type="url"
              value={form.link_url}
              onChange={(e) => setField("link_url", e.target.value)}
              placeholder="https://example.com/your-offer"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Require Follow</p>
                <p className="text-xs text-muted-foreground">
                  Only send DM if user follows your account
                </p>
              </div>
              <Toggle
                checked={form.follow_gate}
                onChange={(v) => setField("follow_gate", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Capture Email</p>
                <p className="text-xs text-muted-foreground">
                  Ask for email before sending the link
                </p>
              </div>
              <Toggle
                checked={form.collect_email}
                onChange={(v) => setField("collect_email", v)}
              />
            </div>
          </div>

          {/* Email Prompt (shown only when collect_email is on) */}
          {form.collect_email && (
            <div className="space-y-1.5 pl-4 border-l-2 border-muted">
              <label className="text-sm font-medium">Email Prompt</label>
              <textarea
                value={form.email_prompt}
                onChange={(e) => setField("email_prompt", e.target.value)}
                rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Automation"}
            </Button>
            <Button variant="outline" onClick={cancelForm} disabled={saving}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Automation List */}
      {automations.length === 0 && !showForm ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No automations yet</p>
          <p className="text-sm mt-1">
            Create your first automation to start replying automatically.
          </p>
          <Button onClick={startCreate} className="mt-4" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Automation
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((automation) => (
            <Card
              key={automation.id}
              className={cn(
                "p-5 transition-opacity",
                !automation.is_active && "opacity-60"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Active Toggle */}
                <Toggle
                  checked={automation.is_active}
                  onChange={() => handleToggle(automation)}
                />

                {/* Main Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-medium text-sm">{automation.name}</span>
                    <Badge
                      className={cn(
                        "text-xs px-2 py-0.5",
                        triggerBadgeClass(automation.trigger_type)
                      )}
                    >
                      {TRIGGER_LABELS[automation.trigger_type]}
                    </Badge>
                    {!automation.is_active && (
                      <Badge className="bg-muted text-muted-foreground text-xs px-2 py-0.5">
                        Paused
                      </Badge>
                    )}
                  </div>

                  {/* Keywords */}
                  {automation.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {automation.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="bg-muted text-xs px-2 py-0.5 rounded-full"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* DM Preview */}
                  <p className="text-xs text-muted-foreground truncate max-w-sm">
                    DM: {automation.dm_message}
                  </p>

                  {/* Indicators */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {automation.follow_gate && (
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5" />
                        Follow gate
                      </span>
                    )}
                    {automation.collect_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        Email capture
                      </span>
                    )}
                    {automation.link_url && (
                      <span className="flex items-center gap-1">
                        <LinkIcon className="h-3.5 w-3.5" />
                        Link
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(automation)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(automation.id)}
                    disabled={deletingId === automation.id}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}