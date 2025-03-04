import { Metadata } from "next"
import { PoliciesPage } from "./components/policies-page"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Policy Management",
  description: "Manage access policies for credential access",
}

// Simple loading component
function LoadingFallback() {
  return (
    <div className="container mx-auto py-8 flex justify-center items-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PoliciesPage />
    </Suspense>
  )
}

