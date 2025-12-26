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
import LiveLocationMap from "@/components/live-location-map"
import ArrivalDetailsPopup from "@/components/arrival-details-popup"
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
  Users,
  Plane,
  Train,
  Bus,
  Car
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
    isCheckedIn?: boolean
    // Arrival details
    transportMode?: string
    arrivalFrom?: string
    arrivalTo?: string
    expectedArrivalTime?: string
    interestedInCarpool?: boolean
    arrivalDetailsSubmitted?: boolean
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
  const [showArrivalPopup, setShowArrivalPopup] = useState(false)

  useEffect(() => {
    if (session?.user?.role !== "PARTICIPANT") {
      router.push("/unauthorized")
      return
    }
    fetchProfile()
  }, [session, router])

  // Show arrival popup if not submitted yet
  useEffect(() => {
    if (profile && !profile.participant?.arrivalDetailsSubmitted) {
      // Delay popup slightly for better UX
      const timer = setTimeout(() => {
        setShowArrivalPopup(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [profile])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        console.log("Profile data:", data)
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
      return SITE_MAPS["Amritapuri"]
    }
    return SITE_MAPS[siteName]
  }

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case "flight": return <Plane className="h-4 w-4 text-blue-500" />
      case "train": return <Train className="h-4 w-4 text-green-500" />
      case "bus": return <Bus className="h-4 w-4 text-orange-500" />
      default: return <Car className="h-4 w-4 text-purple-500" />
    }
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

      {/* Arrival Details Popup */}
      <ArrivalDetailsPopup
        isOpen={showArrivalPopup}
        onClose={() => setShowArrivalPopup(false)}
        onSuccess={() => fetchProfile()}
        siteName={profile?.participant?.siteName || "Amritapuri"}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Welcome Section */}
        <Card className="mb-8  ">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Welcome back, {profile?.participant?.teamName || "Team"}! 👋
                  {/* participant?.name?.split(" ")[0] */}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Here's your hostel information and essential details
                </p>
              </div>
              
              {/* Arrival Details Quick View / Button */}
              {profile?.participant?.arrivalDetailsSubmitted ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowArrivalPopup(true)}
                  className="gap-2"
                >
                  {/* {getTransportIcon(profile.participant.transportMode || "")} */}
                  <span className="hidden sm:inline">View Travel Details</span>
                  <span className="sm:hidden">Details</span>
                </Button>
              ) : (
                <Button
                  onClick={() => setShowArrivalPopup(true)}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Arrival Details</span>
                  <span className="sm:hidden">Arrival</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Arrival Details Card (if submitted) */}
        {profile?.participant?.arrivalDetailsSubmitted && profile.participant.transportMode !== "other" && (
          <Card className="mb-8 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {/* {getTransportIcon(profile.participant.transportMode || "")} */}
                Your Travel Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">From</p>
                  <p className="font-medium">{profile.participant.arrivalFrom}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">To</p>
                  <p className="font-medium">{profile.participant.arrivalTo}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Arrival Time</p>
                  <p className="font-medium">
                    {profile.participant.expectedArrivalTime 
                      ? new Date(profile.participant.expectedArrivalTime).toLocaleString()
                      : "Not specified"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Carpool</p>
                  <Badge variant={profile.participant.interestedInCarpool ? "default" : "outline"}>
                    {profile.participant.interestedInCarpool ? "Interested" : "Not interested"}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArrivalPopup(true)}
                className="mt-3 gap-1"
              >
                Edit details
                <ExternalLink className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Hostel Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Hostel Name & Room */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10  flex items-center justify-center">
                  <Building2 className="h-5 w-5 " />
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
                <div className="h-10 w-10  flex items-center justify-center">
                  <MapPin className="h-5 w-5 " />
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

           {/* WiFi Credentials - Only show if checked in */}
          {profile?.participant?.isCheckedIn ? (
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-10 w-10  flex items-center justify-center">
                    <Wifi className="h-5 w-5 " />
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
          ) : (
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-10 w-10  flex items-center justify-center">
                    <Wifi className="h-5 w-5 " />
                  </div>
                  WiFi Credentials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <Wifi className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    WiFi credentials will be available after check-in
                  </p>
                  <Badge variant="outline" className="mt-2">
                    Not Checked In
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10  flex items-center justify-center">
                  <Phone className="h-5 w-5 " />
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
                <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                  <MapPin className="h-5 w-5 " />
                </div>
                Hostel Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={profile.participant.hostelLocation}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2  transition-colors"
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
              <div className="h-10 w-10  flex items-center justify-center">
                <Map className="h-5 w-5 " />
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
                  className="h-[700px] max-md:h-[500px] "
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