"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import DashboardHeader from "@/components/dashboard-header"
import Image from "next/image"
import { 
  Loader2, 
  Shield, 
  Mail, 
  User, 
  Building2, 
  Calendar,
  Edit,
  IdCard,
  Phone,
  MapPin,
  Wifi,
  Home,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Lock,
  UserCircle,
  Award,
  Clock
} from "lucide-react"
import { AvatarSelector } from "@/components/avatar-selector"
import { cn } from "@/lib/utils"

interface ParticipantProfile {
  id: string
  email: string
  uid: string
  role: string
  createdAt: string
  participant: {
    id: string
    name: string
    college: string
    hostelName: string
    wifiusername: string
    wifiPassword: string
    hostelLocation?: string
    contactNumber: string
    createdAt: string
    gender: "male" | "female"
    avatarUrl?: string
  }
}

export default function ParticipantProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<ParticipantProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user || (session.user.role as string) !== "PARTICIPANT") {
      router.push("/unauthorized")
      return
    }
    fetchProfile()
  }, [session, router])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/profile")
      
      if (response.ok) {
        const currentUser = await response.json()
        setProfile(currentUser)
      } else {
        setError("Failed to load profile")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError("An error occurred while loading profile")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleAvatarSave = async (avatarUrl: string, gender: "male" | "female") => {
    try {
      const response = await fetch("/api/profile/avatar", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatarUrl, gender }),
      })

      if (response.ok) {
        await fetchProfile()
      } else {
        throw new Error("Failed to update avatar")
      }
    } catch (error) {
      console.error("Error updating avatar:", error)
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-destructive">{error || "Profile not found"}</p>
              <Button 
                onClick={() => router.push("/participant")}
                className="w-full mt-4"
                variant="outline"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/participant")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <span>/</span>
          <span className="text-foreground">Profile</span>
        </div>

        {/* Header Card with Gradient Background */}
        <Card className="mb-6 overflow-hidden border-none shadow-xl">
          {/* Gradient Background with ICPC Logo */}
          <div className="h-32 sm:h-48  relative">
            <div className="absolute inset-0 bg-black/10" />
            
            {/* ICPC Foundation Logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 ">
                <Image
                  src="/icpc_foundation.png"
                  alt="ICPC Foundation"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Optional: Add text overlay */}
         
          </div>
          
          <CardContent className="relative pb-6 -mt-16 sm:-mt-20">
            {/* Avatar and Info Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
              {/* Avatar */}
              <div className="relative">
                  <AvatarSelector
                    currentAvatar={profile.participant.avatarUrl}
                    gender={profile.participant.gender}
                    onSave={handleAvatarSave}
                    fallbackInitials={getInitials(profile.participant.name)}
                  />
                
               
              </div>
              
              {/* Name and Details */}
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold">
                  {profile.participant.name}
                </h1>
                <p className="text-muted-foreground text-lg mt-1">
                  {profile.participant.college}
                </p>
               
              </div>

              {/* Edit Button */}
              <Button
                onClick={() => router.push("/participant/edit_profile")}
                className="gap-2"
                size="lg"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Personal Information
              </CardTitle>
              <CardDescription>Your basic details and identification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoItem
                icon={<Mail className="h-5 w-5" />}
                label="Email Address"
                value={profile.email}
                className="text-blue-600"
              />
              
              <InfoItem
                icon={<IdCard className="h-5 w-5" />}
                label="Unique ID"
                value={profile.uid}
                className="font-mono"
              />
              
              <InfoItem
                icon={<Building2 className="h-5 w-5" />}
                label="College"
                value={profile.participant.college}
              />
              
              <InfoItem
                icon={<Phone className="h-5 w-5" />}
                label="Contact Number"
                value={profile.participant.contactNumber}
              />
            </CardContent>
          </Card>

          {/* Hostel Information Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Home className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                Hostel Information
              </CardTitle>
              <CardDescription>Your accommodation details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoItem
                icon={<Building2 className="h-5 w-5" />}
                label="Hostel Name"
                value={profile.participant.hostelName}
                className="font-semibold"
              />

              <div className="space-y-3 pt-2">
                <Separator />
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                  <Wifi className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">WiFi Username</label>
                      <p className="text-sm font-mono mt-0.5">{profile.participant.wifiusername}</p>
                    </div>
                    <Separator />
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">WiFi Password</label>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm font-mono">{profile.participant.wifiPassword}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {profile.participant.hostelLocation && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors border">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground">Location</label>
                      <a
                        href={profile.participant.hostelLocation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        View on Google Maps
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Account Status Card - Full Width */}
          <Card className="md:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                Account Status
              </CardTitle>
              <CardDescription>Your account activity and timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard
                  icon={<Calendar className="h-6 w-6" />}
                  label="Member Since"
                  value={formatDate(profile.createdAt)}
                  color="blue"
                />
                
                <StatCard
                  icon={<UserCircle className="h-6 w-6" />}
                  label="Account Type"
                  value={profile.role}
                  color="purple"
                />
                
                <StatCard
                  icon={<Clock className="h-6 w-6" />}
                  label="Last Updated"
                  value={formatDate(profile.participant.createdAt)}
                  color="green"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Info Item Component
function InfoItem({ 
  icon, 
  label, 
  value, 
  className 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  className?: string 
}) {
  return (
    <>
      <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="text-muted-foreground mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <label className="text-xs font-medium text-muted-foreground block">{label}</label>
          <p className={cn("text-sm mt-1 break-words", className)}>{value}</p>
        </div>
      </div>
      <Separator />
    </>
  )
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: "blue" | "purple" | "green"
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800",
    purple: "bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800",
    green: "bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800"
  }

  const iconColorClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
    green: "text-green-600 dark:text-green-400"
  }

  const textColorClasses = {
    blue: "text-blue-900 dark:text-blue-100",
    purple: "text-purple-900 dark:text-purple-100",
    green: "text-green-900 dark:text-green-100"
  }

  return (
    <div className={cn("flex items-start gap-4 p-6 rounded-xl border-2", colorClasses[color])}>
      <div className={cn("mt-1", iconColorClasses[color])}>
        {icon}
      </div>
      <div className="flex-1">
        <label className={cn("text-sm font-medium", textColorClasses[color])}>
          {label}
        </label>
        <p className={cn("font-semibold mt-1 text-lg", textColorClasses[color])}>
          {value}
        </p>
      </div>
    </div>
  )
}