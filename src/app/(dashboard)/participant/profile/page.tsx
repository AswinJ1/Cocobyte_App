"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  ArrowLeft
} from "lucide-react"
import { AvatarSelector } from "@/components/avatar-selector"
import Image from 'next/image'


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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">{error || "Profile not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/participant")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header Card with Cover */}
        <Card className="mb-6 overflow-hidden">
          {/* Cover Image */}

          
          <CardContent className="relative pb-6 pt-20">
            {/* Avatar positioned over cover */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 mb-6">
              <div className="relative">
                <AvatarSelector
                  currentAvatar={profile.participant.avatarUrl}
                  gender={profile.participant.gender}
                  onSave={handleAvatarSave}
                  fallbackInitials={getInitials(profile.participant.name)}
                />
              </div>
              
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.participant.name}
                </h1>
                <p className="text-gray-600 mt-1">{profile.participant.college}</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    <User className="h-3 w-3 mr-1" />
                    Participant
                  </Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Active
                  </Badge>
                </div>
              </div>

              <Button
                onClick={() => router.push("/participant/edit_profile")}
                className="mt-4 sm:mt-0"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {/* <User className="h-5 w-5 text-blue-600" /> */}
                Personal Information
              </CardTitle>
              <CardDescription>Your basic details and identification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="text-gray-900 break-all">{profile.email}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <IdCard className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-500">UID</label>
                    <p className="text-gray-900 font-mono">{profile.uid}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-500">College</label>
                    <p className="text-gray-900">{profile.participant.college}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-500">Contact Number</label>
                    <p className="text-gray-900">{profile.participant.contactNumber}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hostel Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {/* <Home className="h-5 w-5 text-purple-600" /> */}
                Hostel Information
              </CardTitle>
              <CardDescription>Your accommodation details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-500">Hostel Name</label>
                    <p className="text-gray-900 font-semibold">{profile.participant.hostelName}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Wifi className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-500">WiFi UserName</label>
                    <p className="text-gray-900 font-mono">{profile.participant.wifiusername}</p>
                    <label className="text-sm font-medium text-gray-500">WiFi Password</label>
                    <p className="text-gray-900 font-mono">{profile.participant.wifiPassword}</p>
                  </div>
                </div>

                {profile.participant.hostelLocation && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-500">Location</label>
                        <a
                          href={profile.participant.hostelLocation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          View on Google Maps
                          <ArrowLeft className="h-3 w-3 rotate-180" />
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {/* <Shield className="h-5 w-5 text-green-600" /> */}
                Account Status
              </CardTitle>
              <CardDescription>Your account activity and timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-blue-900">Member Since</label>
                    <p className="text-blue-700 font-semibold mt-1">{formatDate(profile.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 border border-purple-100">
                  <User className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-purple-900">Account Type</label>
                    <p className="text-purple-700 font-semibold mt-1">{profile.role}</p>
                  </div>
                </div>

                {/* <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-100">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <label className="text-sm font-medium text-green-900">Status</label>
                    <p className="text-green-700 font-semibold mt-1">Active</p>
                  </div>
                </div> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}