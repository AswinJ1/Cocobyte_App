"use client"

import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import DashboardHeader from "@/components/dashboard-header"
import { 
  Loader2, 
  Wifi,
  MapPin,
  Phone,
  Building2,
  Copy,
  ExternalLink,
  CheckCircle,
  Eye,
  EyeOff,
  Map,
  DoorOpen,
  Users
} from "lucide-react"

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
    siteName?: string
    teamName?: string
    hostelName: string
    roomNumber: string
    wifiusername: string
    wifiPassword: string
    hostelLocation?: string
    contactNumber: string
    createdAt: string
    gender: "male" | "female"
    avatarUrl?: string
  }
}

// Site-specific map embeds
const SITE_MAPS: Record<string, { url: string; title: string }> = {
  "Amritapuri": {
    url: "https://www.google.com/maps/d/embed?mid=1Tla0OCvXmOd0oR9VD_lIqDL2DnQ&ehbc=2E312F",
    title: "Amritapuri Campus Map"
  },
  "Mysuru": {
    url: "https://www.google.com/maps/d/embed?mid=13fWSWJ8bscqtdqRUEi030VjKWgY&ehbc=2E312F",
    title: "Mysuru Campus Map"
  },
  "Coimbatore": {
    url: "https://www.google.com/maps/d/embed?mid=1kFElh2vG7KrAg7X6_jBgiS1uFbg&ehbc=2E312F",
    title: "Coimbatore Campus Map"
  },
  "Bangalore": {
    url: "https://www.google.com/maps/d/embed?mid=108VvwUWjN3osuiL-LvyNqmetGrQ&ehbc=2E312F",
    title: "Bangalore Campus Map"
  }
}

export default function ParticipantDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ParticipantProfile | null>(null)
  const [showWifiPassword, setShowWifiPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.role !== "PARTICIPANT") {
      router.push("/unauthorized")
      return
    }
    fetchProfile()
  }, [session, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      } else {
        setError("Failed to load profile data")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError("Error loading profile")
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const getSiteMap = () => {
    const siteName = profile?.participant?.siteName
    if (!siteName || !SITE_MAPS[siteName]) {
      // Default to Amritapuri if no site or invalid site
      return SITE_MAPS["Amritapuri"]
    }
    return SITE_MAPS[siteName]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const siteMap = getSiteMap()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Welcome Section */}
        <Card className="mb-8 shadow-lg border-none bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardContent className="p-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Welcome back, {profile?.participant?.name?.split(" ")[0] || "Participant"}! 👋
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Here's your hostel information and essential details
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hostel Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Hostel Name & Room */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Hostel Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Hostel Name</p>
                <p className="text-lg font-semibold">
                  {profile?.participant?.hostelName || "Not assigned"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <DoorOpen className="h-4 w-4" />
                  Room Number
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {profile?.participant?.roomNumber || "Not assigned"}
                  </p>
                  {profile?.participant?.roomNumber && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(profile?.participant?.roomNumber || "", "roomNumber")}
                    >
                      {copiedField === "roomNumber" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">UID</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold font-mono">{profile?.uid}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(profile?.uid || "", "uid")}
                  >
                    {copiedField === "uid" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Site & Team Information */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                Site & Team Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Site Location
                </p>
                <div className="flex items-center gap-2">
                  {profile?.participant?.siteName ? (
                    <>
                      <Badge variant="outline" className="text-base font-semibold px-3 py-1">
                        {profile.participant.siteName}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(profile?.participant?.siteName || "", "siteName")}
                      >
                        {copiedField === "siteName" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  ) : (
                    <p className="text-lg text-muted-foreground">Not assigned</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Name
                </p>
                <div className="flex items-center gap-2">
                  {profile?.participant?.teamName ? (
                    <>
                      <p className="text-lg font-semibold">{profile.participant.teamName}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(profile?.participant?.teamName || "", "teamName")}
                      >
                        {copiedField === "teamName" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  ) : (
                    <p className="text-lg text-muted-foreground">Not assigned</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WiFi Credentials */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                WiFi Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">WiFi Username</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono font-semibold">
                    {profile?.participant?.wifiusername || "Not provided"}
                  </p>
                  {profile?.participant?.wifiusername && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(profile?.participant?.wifiusername || "", "username")}
                    >
                      {copiedField === "username" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">WiFi Password</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono font-semibold">
                    {showWifiPassword 
                      ? (profile?.participant?.wifiPassword || "Not provided")
                      : "••••••••"}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWifiPassword(!showWifiPassword)}
                  >
                    {showWifiPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  {profile?.participant?.wifiPassword && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(profile?.participant?.wifiPassword || "", "password")}
                    >
                      {copiedField === "password" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Contact Number</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {profile?.participant?.contactNumber || "Not provided"}
                  </p>
                  {profile?.participant?.contactNumber && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(profile?.participant?.contactNumber || "", "phone")}
                    >
                      {copiedField === "phone" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="text-lg font-semibold break-all">{profile?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">College</p>
                <p className="text-lg font-semibold">{profile?.participant?.college || "Not provided"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hostel Location (if provided) */}
        {profile?.participant?.hostelLocation && (
          <Card className="shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                Hostel Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={profile.participant.hostelLocation}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <span className="text-lg font-semibold">View on Google Maps</span>
                <ExternalLink className="h-5 w-5" />
              </a>
            </CardContent>
          </Card>
        )}

        {/* Dynamic Campus Map based on Site */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Map className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              {siteMap.title}
            </CardTitle>
            <CardDescription>
              {profile?.participant?.siteName 
                ? `Interactive map showing hostel locations and campus facilities at ${profile.participant.siteName}` 
                : "Interactive map showing hostel locations and campus facilities"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex-1">
              <div className="w-full px-[2vw] max-md:mt-[2vw] max-md:mb-[2vw]">
                <iframe 
                  width="100%" 
                  height="" 
                  className="h-[700px] max-md:h-[500px] rounded-lg"
                  title={siteMap.title}
                  src={siteMap.url}
                  loading="lazy"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}