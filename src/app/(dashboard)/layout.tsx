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
  Mail,
  Bell,
  Settings,
  List,
  Cloud,
  Server,
  Calendar1,
  CalendarCheck,
  HelpingHand,
  HandHelpingIcon,
  HandHeartIcon,
  Contact2Icon,
  Contact,
  BookCheckIcon,
  CheckLineIcon,
  CheckIcon,
  MapPin,
  Map,
  CalendarArrowUp,
  LucideCalendarSearch,
  LucideBuilding,
  LucideBuilding2,
  Building,
  Building2Icon,
  Plane
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { FaPlane, FaPlaneArrival } from "react-icons/fa"

interface NavigationItem {
  name: string
  href?: string
  icon: React.ReactNode
  roles: string[]
  subItems?: NavigationItem[]
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
    name: "Check-Ins",
    href: "/admin/check-ins",
    icon: <CheckIcon className="w-5 h-5" />,
    roles: ["ADMIN"]
  },
  {
    name: "System Logs",
    href: "/admin/logs",
    icon: <Server className="w-5 h-5" />,
    roles: ["ADMIN"]
  },
  {
    name: "Profile",
    href: "/participant/profile",
    icon: <User2Icon className="w-5 h-5" />,
    roles: ["PARTICIPANT"]
  },
  {
    name: "Notifications",
    href: "/participant/notification",
    icon: <Bell className="w-5 h-5" />,
    roles: ["PARTICIPANT"]
  },
  {
    name: "Schedule",
    href: "/participant/schedule",
    icon: <CalendarCheck className="w-5 h-5" />,
    roles: ["PARTICIPANT"]
  },
  {
    name: "Help Desk",
    href: "/participant/helpdesk",
    icon: <Contact className="w-5 h-5" />,
    roles: ["PARTICIPANT"]
  },
    {
    name: "Hostel Check In",
    href: "/participant/check_in",
    icon: <Building2Icon className="w-5 h-5" />,
    roles: ["PARTICIPANT"]
  },
     {
    name: "Arrival List",
    href: "/participant/timings",
    icon: <LucideCalendarSearch className="w-5 h-5" />,
    roles: ["PARTICIPANT"]
  },
  {
    name: "Profile",
    href: "/admin/profile",
    icon: <User className="w-5 h-5" />,
    roles: ["ADMIN"]
  },
  //  {
  //   name: "Realtime map",
  //   href: "/admin/live-map",
  //   icon: <Map className="w-5 h-5" />,
  //   roles: ["ADMIN"]
  // },
  {
    name: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    roles: ["ADMIN"],
    subItems: [
      {
        name: "Create Notification",
        href: "/admin/notifications",
        icon: <Plus className="w-4 h-4" />,
        roles: ["ADMIN"]
      },
      {
        name: "Manage Notifications",
        href: "/admin/notifications/manage",
        icon: <Settings className="w-4 h-4" />,
        roles: ["ADMIN"]
      },
    ]
  },
  {
    name: "Arrival Details",
    href: "/admin/arrival-details",
    icon: <Plane className="w-5 h-5" />,
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
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Check if any subitem is active
  const hasActiveSubItem = item.subItems?.some(subItem => 
    subItem.href && pathname.startsWith(subItem.href)
  )

  // If item has subitems, render as dropdown
  if (item.subItems && item.subItems.length > 0) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              hasActiveSubItem || isActive
                ? "bg-primary text-primary-foreground shadow-lg" 
                : " hover:bg-accent hover:text-accent-foreground hover:shadow-md",
              isCollapsed && "justify-center"
            )}
          >
            <div className={cn(
              "transition-transform duration-200",
              (hasActiveSubItem || isActive) && "scale-110"
            )}>
              {item.icon}
            </div>
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.name}</span>
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen && "rotate-90"
                )} />
              </>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-2 hidden group-hover:block z-50">
                <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl border">
                  {item.name}
                </div>
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          side={isCollapsed ? "right" : "bottom"} 
          align={isCollapsed ? "start" : "start"}
          className="w-56"
        >
          <DropdownMenuLabel>{item.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.subItems.map((subItem) => (
            <DropdownMenuItem key={subItem.href} asChild>
              <Link
                href={subItem.href || "#"}
                onClick={onClick}
                className="flex items-center gap-2 cursor-pointer"
              >
                {subItem.icon}
                <span>{subItem.name}</span>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Regular nav item without subitems
  return (
    <Link
      href={item.href || "#"}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive 
          ? "bg-primary text-primary-foreground shadow-lg" 
          : " hover:bg-accent hover:text-accent-foreground hover:shadow-md",
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
          <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl border">
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

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const userRole = session.user.role

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole)
  )

  const isCurrentPath = (href?: string) => {
    if (!href) return false
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
            src="/logo.png"
            alt="Hostel Management"
            width={40}
            height={40}
          />
        )}
      </div>

      <Separator />
      
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1.5 py-4">
          {filteredNavigation.map((item) => (
            <NavItem
              key={item.href || item.name}
              item={item}
              isActive={isCurrentPath(item.href)}
              isCollapsed={isCollapsed && !isMobile}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </div>
      </ScrollArea>
      
      <Separator />
      
      {/* Logout Button */}
      <div className={cn(
        "p-4",
        isCollapsed && !isMobile && "px-2"
      )}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10",
            isCollapsed && !isMobile && "justify-center px-2"
          )}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-5 w-5" />
          {(!isCollapsed || isMobile) && <span className="ml-3">Sign out</span>}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent 
          side="left" 
          className="w-72 p-0"
        >
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 z-40",
        "bg-card border-r shadow-sm",
        isCollapsed ? "lg:w-20" : "lg:w-72"
      )}>
        <SidebarContent />
        
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute -right-3 top-8 h-6 w-6 rounded-full",
            "bg-background border-2 shadow-lg",
            "flex items-center justify-center",
            "hover:bg-accent transition-all duration-200",
            "hover:scale-110"
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
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
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)] lg:min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}