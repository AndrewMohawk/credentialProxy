"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function NewPolicyPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login")
      } else {
        // Redirect to the policies page with a query parameter to open the dialog
        router.push("/policies?createPolicy=true")
      }
    }
  }, [isLoading, isAuthenticated, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 rounded-full bg-primary mb-4" />
        <p className="text-muted-foreground">Redirecting to policy creation...</p>
      </div>
    </div>
  )
} 