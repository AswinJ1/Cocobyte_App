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
  EyeOff
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
    hostelName: string
    wifiusername: string,
    wifiPassword: string ,
    hostelLocation?: string
    contactNumber: string
    createdAt: string
    gender: "male" | "female"
    avatarUrl?: string
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 cursor-pointer ring-2 ring-blue-100 hover:ring-blue-300 transition-all">
                {profile?.participant?.avatarUrl ? (
                  <AvatarImage src={profile.participant.avatarUrl} alt={profile.participant.name} />
                ) : (
                  <AvatarFallback className="bg-blue-600 text-white">
                    {profile?.participant?.name ? getInitials(profile.participant.name) : "PT"}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {profile?.participant?.name || "Participant"}
                </h1>
                <p className="text-sm text-gray-600">
                  {profile?.participant?.college || "Participant Dashboard"}
                </p>
              </div>
            </div>

            {/* <Button
              onClick={() => signOut()}
              variant="destructive"
              size="default"
            >
              Logout
            </Button> */}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Welcome Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Welcome back, {profile?.participant?.name?.split(" ")[0] || "Participant"}! 👋
              </h2>
              <p className="text-gray-600 mt-1">
                Here's your hostel information and essential details
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hostel Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Hostel Name */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Hostel Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Hostel Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {profile?.participant?.hostelName || "Not assigned"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">UID</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-gray-900">{profile?.uid}</p>
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

          {/* WiFi Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-green-600" />
                WiFi Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                <p className="text-sm text-gray-600 mb-1">WiFi UserName</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono font-semibold text-gray-900">
                    {profile?.participant?.wifiusername||"Unknown UserName"}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(profile?.participant?.wifiusername || "", "wifi")}
                  >
                    {copiedField === "wifi" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">WiFi Password</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono font-semibold text-gray-900">
                    {showWifiPassword ? profile?.participant?.wifiPassword : "••••••••"}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(profile?.participant?.wifiPassword || "", "wifi")}
                  >
                    {copiedField === "wifi" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-orange-600" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Contact Number</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-gray-900">
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
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="text-lg font-semibold text-gray-900">{profile?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Hostel Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile?.participant?.hostelLocation ? (
                <a
                  href={profile.participant.hostelLocation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span className="text-lg font-semibold">View on Google Maps</span>
                  <ExternalLink className="h-5 w-5" />
                </a>
              ) : (
                <p className="text-gray-500">Location not provided</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Account Information */}
     
      </main>
    </div>
  )
}