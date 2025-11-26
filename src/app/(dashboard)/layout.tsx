"use client"

import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CheckCircle, 
  UserCheck,
  Plus,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Eye,
  Edit,
  User,
  ChevronLeft,
  User2Icon,
  Mail
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface NavigationItem {
  name: string
  href: string
  icon: React.ReactNode
  roles: string[]
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ["ADMIN"]
  },
  {
    name: "Dashboard",
    href: "/participant",
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ["PARTICIPANT"]
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: <Users className="w-5 h-5" />,
    roles: ["ADMIN"]
  },
  {
    name: "System Logs",
    href: "/admin/logs",
    icon: <FileText className="w-5 h-5" />,
    roles: ["ADMIN"]
  },
   {
    name: "Profile",
    href: "/participant/profile",
    icon: <User2Icon className="w-5 h-5" />,
    roles: ["PARTICIPANT"]
  },
   {
    name: "Profile",
    href: "/admin/profile",
    icon: <User className="w-5 h-5" />,
    roles: ["ADMIN"]
  },


]

const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (role) {
    case "ADMIN":
      return "destructive"
    case "HOSTEL":
    case "PARTICIPANT":  
      return "default"
    default:
      return "outline"
  }
}

function NavItem({ 
  item, 
  isActive, 
  isCollapsed,
  onClick 
}: { 
  item: NavigationItem
  isActive: boolean
  isCollapsed: boolean
  onClick?: () => void 
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive 
          ? "bg-black text-white shadow-lg" 
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md",
        isCollapsed && "justify-center"
      )}
    >
      <div className={cn(
        "transition-transform duration-200",
        isActive && "scale-110"
      )}>
        {item.icon}
      </div>
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.name}</span>
          {isActive && (
            <ChevronRight className="h-4 w-4 animate-pulse" />
          )}
        </>
      )}
      {isCollapsed && (
        <div className="absolute left-full ml-2 hidden group-hover:block z-50">
          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl border border-gray-700">
            {item.name}
          </div>
        </div>
      )}
    </Link>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [profile, setProfile] = useState<any>(null)

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

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const userRole = session.user.role
  const userEmail = session.user.email || ""
  const userInitial = userEmail.charAt(0).toUpperCase()
  
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

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole)
  )

  const isCurrentPath = (href: string) => {
    const roleBase = `/${userRole.toLowerCase().replace('_', '-')}`
    if (href === roleBase) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex h-full flex-col">
  <div
  className={cn(
    "flex items-center gap-3 px-4 py-5",
    isCollapsed && !isMobile && "justify-center px-2"
  )}
>
  {!isCollapsed || isMobile ? (
    <Image
      src="/logo.png"
      alt="Hostel Management"
      width={120}
      height={30}
    />
  ) : (
    <Image
      src="/logo.png" // small square icon
      alt="Hostel Management"
      width={40}
      height={40}
    />
  )}
</div>

      
      <div className="h-px bg-gray-200 mx-3" />
      
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1.5 py-4">
          {filteredNavigation.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={isCurrentPath(item.href)}
              isCollapsed={isCollapsed && !isMobile}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </div>
      </ScrollArea>
      
      <div className="h-px bg-gray-200 mx-3" />
      
      <div className={cn(
        "p-4 space-y-3",
        isCollapsed && !isMobile && "px-2"
      )}>
        {(!isCollapsed || isMobile) ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <Avatar className="h-12 w-12 ring-2 ring-blue-100 hover:ring-blue-300 transition-all border-2 border-white shadow-md">
                    {getAvatarUrl() ? (
                      <AvatarImage src={getAvatarUrl()!} alt={getUserName()} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold">
                        {profile ? getInitials(getUserName()) : userInitial}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-medium leading-none text-gray-800 truncate">
                      {getUserName()}
                    </p>
                    <Badge 
                      variant={getRoleVariant(userRole)} 
                      className="text-xs"
                    >
                      {userRole.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-xl border-gray-200/50">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getUserName()}</p>
                    <p className="text-xs text-gray-500">{userEmail}</p>
                    <Badge variant={getRoleVariant(userRole)} className="text-xs mt-1 w-fit">
                      {userRole.replace('_', ' ')}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex flex-col items-center gap-3 cursor-pointer">
                <Avatar className="h-12 w-12 ring-2 ring-blue-100 hover:ring-blue-300 transition-all border-2 border-white shadow-md">
                  {getAvatarUrl() ? (
                    <AvatarImage src={getAvatarUrl()!} alt={getUserName()} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold text-sm">
                      {profile ? getInitials(getUserName()) : userInitial}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-xl border-gray-200/50">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{getUserName()}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                  <Badge variant={getRoleVariant(userRole)} className="text-xs mt-1 w-fit">
                    {userRole.replace('_', ' ')}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent 
          side="left" 
          className="w-72 p-0 bg-white/95 backdrop-blur-xl border-r border-gray-200"
        >
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>

      {/* Desktop Glassmorphism Sidebar */}
      <aside className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 z-40",
        "bg-white/95 backdrop-blur-2xl border-r border-gray-200 shadow-xl",
        isCollapsed ? "lg:w-20" : "lg:w-72"
      )}>
        <SidebarContent />
        
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute -right-3 top-8 h-6 w-6 rounded-full",
            "bg-white border-2 border-gray-300 shadow-lg",
            "flex items-center justify-center",
            "text-black hover:bg-indigo-50 transition-all duration-200",
            "hover:scale-110 hover:shadow-xl hover:border-indigo-400"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        isCollapsed ? "lg:pl-20" : "lg:pl-72"
      )}>
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 lg:hidden shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="hover:bg-indigo-50"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Hostel Management"
              width={120}
              height={30}
            />
              <span className="font-semibold  bg-clip-text text-transparent">
                Cocobyte
              </span>
            </div>
            
           
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)] lg:min-h-screen p-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 min-h-[calc(100vh-8rem)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}