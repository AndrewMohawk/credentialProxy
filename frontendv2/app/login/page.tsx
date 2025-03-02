"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Fingerprint, KeyRound, ArrowRight, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { ModeToggle } from "@/components/mode-toggle"

export default function LoginPage() {
  const [step, setStep] = useState<"username" | "password" | "passkey">("username")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username) return

    // In a real app, you would check if the user has passkeys registered
    // For this demo, we'll randomly choose between password and passkey
    const authMethod = Math.random() > 0.5 ? "password" : "passkey"
    setStep(authMethod)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In a real app, you would validate credentials here
      if (password.length < 6) {
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: "Invalid password. Please try again.",
        })
        setIsLoading(false)
        return
      }

      // Success - redirect to dashboard
      router.push("/")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: "An error occurred. Please try again.",
      })
      setIsLoading(false)
    }
  }

  const handlePasskeySubmit = async () => {
    setIsLoading(true)

    try {
      // Simulate API call for WebAuthn verification
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real app, you would use the WebAuthn API here
      // Success - redirect to dashboard
      router.push("/")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: "Passkey verification failed. Please try again.",
      })
      setIsLoading(false)
    }
  }

  const resetFlow = () => {
    setStep("username")
    setPassword("")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Credential Proxy</CardTitle>
            <CardDescription className="text-center">
              {step === "username"
                ? "Enter your username to continue"
                : step === "password"
                  ? `Welcome back, ${username}`
                  : `Verify with passkey, ${username}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "username" && (
              <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button variant="link" className="px-0 text-xs" onClick={resetFlow}>
                      Not you?
                    </Button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Authenticating..." : "Sign in"}
                </Button>
                <div className="text-center">
                  <Button variant="link" className="text-xs" onClick={() => setStep("passkey")}>
                    Use passkey instead
                  </Button>
                </div>
              </form>
            )}

            {step === "passkey" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Passkey Authentication</Label>
                  <Button variant="link" className="px-0 text-xs" onClick={resetFlow}>
                    Not you?
                  </Button>
                </div>
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Fingerprint className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Use your biometric or security key to verify your identity
                  </p>
                </div>
                <Button onClick={handlePasskeySubmit} className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify with passkey"}
                </Button>
                <div className="text-center">
                  <Button variant="link" className="text-xs" onClick={() => setStep("password")}>
                    Use password instead
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-0">
                {/* Current login flow is shown here */}
              </TabsContent>
              <TabsContent value="register" className="mt-4">
                <p className="text-center text-sm text-muted-foreground">
                  Contact your administrator to register a new account
                </p>
              </TabsContent>
            </Tabs>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}

