"use client"

import { useEffect } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { signIn, type LoginState } from "./actions"
import styles from "./login.module.css"

const initialState: LoginState = { error: null }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  )
}

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useFormState(signIn, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.error === null && state !== initialState) {
      router.replace(next)
      router.refresh()
    }
  }, [state, next, router])

  return (
    <form action={formAction} className={styles.form}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="input"
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  )
}
