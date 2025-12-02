"use client"

import { Search, LogOut, Home, Users, FileText, User, Settings, BarChart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { Sun, Moon, Bell, Globe, ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface SearchOption {
  label: string
  href: string
  icon: React.ReactNode
  roles: string[]
}

const searchOptions: SearchOption[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: <Home className="h-4 w-4" />,
    roles: ["ADMIN"]
  },
  {
    label: "Dashboard",
    href: "/participant",
    icon: <Home className="h-4 w-4" />,
    roles: ["PARTICIPANT"]
  },
  {
    label: "User Management",
    href: "/admin/users",
    icon: <Users className="h-4 w-4" />,
    roles: ["ADMIN"]
  },
  {
    label: "System Logs",
    href: "/admin/logs",
    icon: <FileText className="h-4 w-4" />,
    roles: ["ADMIN"]
  },
  {
    label: "My Profile",
    href: "/admin/profile",
    icon: <User className="h-4 w-4" />,
    roles: ["ADMIN"]
  },
  {
    label: "My Profile",
    href: "/participant/profile",
    icon: <User className="h-4 w-4" />,
    roles: ["PARTICIPANT"]
  },
 
]

export default function DashboardHeader() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
    }
  }, [session, status, router])

  // Fetch user profile with avatar
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile")
        if (response.ok) {
          const data = await response.json()
          setProfile(data)
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      }
    }

    if (session) {
      fetchProfile()
    }
  }, [session])

  // Keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  if (!session) return null

  const userRole = session.user.role
  const userEmail = session.user.email || ""
  const userInitial = userEmail.charAt(0).toUpperCase()

  // Filter search options based on user role
  const filteredOptions = searchOptions.filter(option => 
    option.roles.includes(userRole as string)
  )
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarUrl = () => {
    if (!profile) return null
    
    switch (userRole as string) {
      case "ADMIN":
        return profile.admin?.avatarUrl
      case "PARTICIPANT":
        return profile.participant?.avatarUrl
      default:
        return null
    }
  }

  const getUserName = () => {
    if (!profile) return userEmail
    
    switch (userRole as string) {
      case "ADMIN":
        return profile.admin?.name
      case "PARTICIPANT":
        return profile.participant?.name
      default:
        return userEmail
    }
  }

  const getRoleVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive"
      case "PARTICIPANT":
        return "default"
      default:
        return "secondary"
    }
  }

  return (
    <>
      <header className="w-full border-b bg-background">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* LEFT: Search Bar */}
          <div 
            className="relative w-72 cursor-pointer"
            onClick={() => setOpen(true)}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search... ⌘K"
              className="pl-10 rounded-full bg-muted/40 cursor-pointer"
              readOnly
            />
          </div>

          {/* RIGHT: Language / Theme / Notifications / Profile */}
          <div className="flex items-center gap-4">
            
            {/* Language Icon */}
            <Button variant="ghost" size="icon">
              <Globe className="h-5 w-5" />
            </Button>

            {/* Theme button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => document.documentElement.classList.toggle("dark")}
            >
              <Sun className="h-5 w-5 dark:hidden" />
              <Moon className="h-5 w-5 hidden dark:block" />
            </Button>

            {/* Notification */}
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20 hover:ring-primary/40 transition-all border-2 border-background shadow-sm">
                    {getAvatarUrl() ? (
                      <AvatarImage src={getAvatarUrl()!} alt={getUserName()} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold">
                        {profile ? getInitials(getUserName()) : userInitial}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium leading-none">{getUserName()}</p>
                    <p className="text-xs text-muted-foreground">{userRole}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getUserName()}</p>
                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                    <Badge variant={getRoleVariant(userRole as string)} className="text-xs mt-1 w-fit">
                      {userRole}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => router.push(`/${userRole.toLowerCase()}/profile`)}
                  className="cursor-pointer"
                >
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => router.push(`/${userRole.toLowerCase()}`)}
                  className="cursor-pointer"
                >
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Command Dialog for Search */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type to search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.href}
                onSelect={() => {
                  router.push(option.href)
                  setOpen(false)
                }}
                className="cursor-pointer"
              >
                {option.icon}
                <span className="ml-2">{option.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => {
                router.push(`/${userRole.toLowerCase()}/profile`)
                setOpen(false)
              }}
              className="cursor-pointer"
            >
              <User className="h-4 w-4" />
              <span className="ml-2">Go to Profile</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                signOut({ callbackUrl: "/login" })
                setOpen(false)
              }}
              className="cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2">Sign Out</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}