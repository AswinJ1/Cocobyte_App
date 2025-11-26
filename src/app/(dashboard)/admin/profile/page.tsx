"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  IdCard
} from "lucide-react"
import { AvatarSelector } from "@/components/avatar-selector"

interface AdminProfile {
  id: string
  email: string
  uid: string
  role: string
  createdAt: string
  admin: {
    id: string
    name: string
    college: string
    createdAt: string
    gender: "male" | "female"
    avatarUrl?: string
  }
}

export default function AdminProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user || (session.user.role as string) !== "ADMIN") {
      router.push("/unauthorized")
      return
    }
    fetchProfile()
  }, [session, router])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      // Use the dedicated profile endpoint instead
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
    const handleAvatarSave = async (avatarUrl: string) => {
    try {
      const response = await fetch("/api/profile/avatar", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatarUrl }),
      })

      if (response.ok) {
        // Refresh profile data
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              My Profile
            </h1>
            <p className="text-gray-600 mt-2">View and manage your security profile</p>
          </div>
          <Button
            onClick={() => router.push("/admin/edit_profile")}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                  <AvatarSelector
                  currentAvatar={profile.admin.avatarUrl}
                  gender={profile.admin.gender}
                  onSave={handleAvatarSave}
                  fallbackInitials={getInitials(profile.admin.name)}
                  />
                
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {profile.admin.name}
                </h2>
                
                <Badge variant="secondary" className="mb-4">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin Member
                </Badge>

                {/* <div className="w-full mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    <span>{profile.admin.college}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <IdCard className="h-4 w-4" />
                    <span>{profile.uid}</span>
                  </div>
                </div> */}
              </div>
            </CardContent>
          </Card>

          {/* Details Cards */}
          <div className="md:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>Your contact details and identification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="text-gray-900 mt-1">{profile.email}</p>
                  </div>
                  
                  {/* <div>
                    <label className="text-sm font-medium text-gray-500">UID</label>
                    <p className="text-gray-900 mt-1">{profile.uid}</p>
                  </div> */}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900 mt-1">{profile.admin.name}</p>
                  </div>
{/*                   
                  <div>
                    <label className="text-sm font-medium text-gray-500">college</label>
                    <p className="text-gray-900 mt-1">{profile.admin.college}</p>
                  </div> */}
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>Your account details and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Type</label>
                    <div className="mt-1">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {profile.role}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Status</label>
                    <div className="mt-1">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Member Since
                    </label>
                    <p className="text-gray-900 mt-1">{formatDate(profile.createdAt)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Profile Created</label>
                    <p className="text-gray-900 mt-1">{formatDate(profile.admin.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {/* <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push("/participant/edit_profile")}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile Information
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push("/security/monitoring")}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  View Security Monitoring
                </Button>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>
    </div>
  )
}
