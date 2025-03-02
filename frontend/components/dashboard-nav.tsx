"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, LogOut, Settings, Key, Users, ClipboardList, Activity, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: BarChart2,
  },
  {
    title: "Credentials",
    href: "/credentials",
    icon: Key,
  },
  {
    title: "Applications",
    href: "/applications",
    icon: Users,
  },
  {
    title: "Policies",
    href: "/policies",
    icon: ClipboardList,
  },
  {
    title: "Audit Logs",
    href: "/audit-logs",
    icon: Activity,
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  
  const initials = user?.username 
    ? user.username.split(" ").map(n => n[0]).join("").toUpperCase()
    : "U"

  return (
    <div className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Shield className="h-6 w-6 text-primary" />
          <span>Credential Proxy</span>
        </Link>
        
        <nav className="hidden md:flex md:flex-1 md:items-center md:justify-center md:gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
        
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => {
                e.preventDefault();
                logout();
              }}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <nav className="md:hidden flex overflow-auto pb-2 px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
              pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4 mr-1" />
            <span>{item.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
} 