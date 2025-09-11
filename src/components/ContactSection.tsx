"use client"

import React, { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { Mail, SendHorizontal, Linkedin, Link2, IdCard, MessageSquare, MailCheck } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

type ContactPayload = {
  name: string
  email: string
  subject: string
  message: string
}

type SocialLinks = {
  ens?: string
  lens?: string
  github?: string
  linkedin?: string
}

export type ContactSectionProps = {
  title?: string
  subtitle?: string
  endpoint?: string
  onSubmit?: (payload: ContactPayload) => Promise<void>
  social?: SocialLinks
  className?: string
  style?: React.CSSProperties
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ContactSection({
  title = "Get in touch",
  subtitle = "Have a question, collaboration idea, or just want to say hi? Drop a message and I’ll get back soon.",
  endpoint,
  onSubmit,
  social,
  className,
  style,
}: ContactSectionProps) {
  const [values, setValues] = useState<ContactPayload>({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ContactPayload, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const hasAnySocial = useMemo(
    () => Boolean(social?.ens || social?.lens || social?.github || social?.linkedin),
    [social]
  )

  const validate = useCallback((v: ContactPayload) => {
    const next: Partial<Record<keyof ContactPayload, string>> = {}
    if (!v.name || v.name.trim().length < 2) next.name = "Please enter your full name."
    if (!v.email || !emailRegex.test(v.email)) next.email = "Please enter a valid email address."
    if (!v.subject || v.subject.trim().length < 3) next.subject = "Subject should be at least 3 characters."
    if (!v.message || v.message.trim().length < 10) next.message = "Message should be at least 10 characters."
    return next
  }, [])

  const handleChange =
    (field: keyof ContactPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextVal = e.target.value
      setValues((prev) => ({ ...prev, [field]: nextVal }))
      if (hasSubmitted) {
        // live-validate after first submit attempt
        const next = validate({ ...values, [field]: nextVal })
        setErrors(next)
      }
    }

  const submitToEndpoint = async (payload: ContactPayload) => {
    if (!endpoint) return
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => "Failed to send message.")
      throw new Error(msg || "Failed to send message.")
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setHasSubmitted(true)

    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the errors in the form.")
      return
    }

    setIsSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit(values)
      } else if (endpoint) {
        await submitToEndpoint(values)
      } else {
        // Fallback: simulate network delay
        await new Promise((r) => setTimeout(r, 800))
      }
      toast.success("Message sent successfully!", {
        description: "Thanks for reaching out — I’ll respond soon.",
        icon: <MailCheck className="h-4 w-4 text-chart-2" aria-hidden="true" />,
      })
      setValues({ name: "", email: "", subject: "", message: "" })
      setErrors({})
      setHasSubmitted(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong."
      toast.error("Could not send your message.", {
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const wrapperClass = [
    "w-full max-w-full bg-card border rounded-2xl p-6 md:p-8",
    "shadow-sm",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <section className={wrapperClass} style={style} aria-label="Contact section">
      <div className="w-full max-w-full space-y-6">
        <header className="w-full max-w-full">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-secondary text-secondary-foreground p-2 ring-1 ring-border">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-heading leading-tight break-words">
                {title}
              </h2>
              <p className="mt-1 text-sm sm:text-base text-muted-foreground">
                {subtitle}
              </p>
            </div>
          </div>
        </header>

        {hasAnySocial && (
          <div className="w-full max-w-full">
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {social?.ens && (
                <li>
                  <a
                    href={`https://app.ens.domains/name/${encodeURIComponent(social.ens)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-xl border bg-secondary/50 hover:bg-secondary transition-colors px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="rounded-md bg-card p-2 ring-1 ring-border">
                        <IdCard className="h-4 w-4 text-foreground" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">ENS</p>
                        <p className="text-xs text-muted-foreground truncate" title={social.ens}>
                          {social.ens}
                        </p>
                      </div>
                    </div>
                    <Link2 className="h-4 w-4 text-muted-foreground opacity-80 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  </a>
                </li>
              )}
              {social?.lens && (
                <li>
                  <a
                    href={`https://hey.xyz/u/${encodeURIComponent(social.lens.replace(/^@/, ""))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-xl border bg-secondary/50 hover:bg-secondary transition-colors px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="rounded-md bg-card p-2 ring-1 ring-border">
                        <MessageSquare className="h-4 w-4 text-foreground" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">Lens</p>
                        <p className="text-xs text-muted-foreground truncate" title={social.lens}>
                          @{social.lens.replace(/^@/, "")}
                        </p>
                      </div>
                    </div>
                    <Link2 className="h-4 w-4 text-muted-foreground opacity-80 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  </a>
                </li>
              )}
              {social?.github && (
                <li>
                  <a
                    href={`https://github.com/${encodeURIComponent(social.github.replace(/^@/, ""))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-xl border bg-secondary/50 hover:bg-secondary transition-colors px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="rounded-md bg-card p-2 ring-1 ring-border">
                        <Link2 className="h-4 w-4 text-foreground" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">GitHub</p>
                        <p className="text-xs text-muted-foreground truncate" title={social.github}>
                          @{social.github.replace(/^@/, "")}
                        </p>
                      </div>
                    </div>
                    <Link2 className="h-4 w-4 text-muted-foreground opacity-80 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  </a>
                </li>
              )}
              {social?.linkedin && (
                <li>
                  <a
                    href={social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-xl border bg-secondary/50 hover:bg-secondary transition-colors px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="rounded-md bg-card p-2 ring-1 ring-border">
                        <Linkedin className="h-4 w-4 text-foreground" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">LinkedIn</p>
                        <p className="text-xs text-muted-foreground truncate" title="Open LinkedIn profile">
                          External profile
                        </p>
                      </div>
                    </div>
                    <Link2 className="h-4 w-4 text-muted-foreground opacity-80 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-full space-y-5"
          aria-describedby="contact-form-helper"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                name="name"
                type="text"
                placeholder="Your full name"
                required
                value={values.name}
                onChange={handleChange("name")}
                aria-invalid={Boolean(errors.name) || undefined}
                aria-describedby={errors.name ? "error-name" : undefined}
                className="bg-secondary/50 border-input focus-visible:ring-ring placeholder:text-muted-foreground"
                autoComplete="name"
              />
              {errors.name && (
                <p id="error-name" className="text-xs text-destructive">
                  {errors.name}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 min-w-0">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                inputMode="email"
                placeholder="you@example.com"
                required
                value={values.email}
                onChange={handleChange("email")}
                aria-invalid={Boolean(errors.email) || undefined}
                aria-describedby={errors.email ? "error-email" : undefined}
                className="bg-secondary/50 border-input focus-visible:ring-ring placeholder:text-muted-foreground"
                autoComplete="email"
              />
              {errors.email && (
                <p id="error-email" className="text-xs text-destructive">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <Label htmlFor="contact-subject">Subject</Label>
            <Input
              id="contact-subject"
              name="subject"
              type="text"
              placeholder="How can I help?"
              required
              value={values.subject}
              onChange={handleChange("subject")}
              aria-invalid={Boolean(errors.subject) || undefined}
              aria-describedby={errors.subject ? "error-subject" : undefined}
              className="bg-secondary/50 border-input focus-visible:ring-ring placeholder:text-muted-foreground"
              autoComplete="off"
            />
            {errors.subject && (
              <p id="error-subject" className="text-xs text-destructive">
                {errors.subject}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              name="message"
              placeholder="Share some details about your project, idea, or question..."
              required
              value={values.message}
              onChange={handleChange("message")}
              aria-invalid={Boolean(errors.message) || undefined}
              aria-describedby={errors.message ? "error-message" : "contact-form-helper"}
              className="min-h-[140px] bg-secondary/50 border-input focus-visible:ring-ring placeholder:text-muted-foreground resize-y"
            />
            {!errors.message && (
              <p id="contact-form-helper" className="text-xs text-muted-foreground">
                I usually respond within 24–48 hours.
              </p>
            )}
            {errors.message && (
              <p id="error-message" className="text-xs text-destructive">
                {errors.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs text-muted-foreground">
              This form respects your privacy. No spam — ever.
            </p>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={isSubmitting ? "Sending message" : "Send message"}
            >
              {isSubmitting ? (
                <>
                  <SendHorizontal className="h-4 w-4 animate-pulse" aria-hidden="true" />
                  Sending...
                </>
              ) : (
                <>
                  <SendHorizontal className="h-4 w-4" aria-hidden="true" />
                  Send message
                </>
              )}
            </Button>
          </div>
        </form>

        <div aria-live="polite" className="sr-only">
          {isSubmitting ? "Submitting form" : "Form idle"}
        </div>
      </div>
    </section>
  )
}