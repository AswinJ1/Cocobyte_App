"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, User, Mail, Lock, Shield } from "lucide-react"

interface participantProfile {
  id: string
  email: string
  uid: string
  participant: {
    name: string
    college: string
  }
}

export default function participantEditProfile() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    college: "",
    email: "",
    uid: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

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
      // Use dedicated profile endpoint
      const response = await fetch("/api/profile")
      
      if (response.ok) {
        const currentUser = await response.json() as participantProfile
        
        setFormData({
          name: currentUser.participant.name,
          college: currentUser.participant.college,
          email: currentUser.email,
          uid: currentUser.uid,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        setError("Failed to load profile")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    // Validate password if changing
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError("Current password is required to change password")
        setIsSaving(false)
        return
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        setError("New passwords do not match")
        setIsSaving(false)
        return
      }
      
      if (formData.newPassword.length < 6) {
        setError("Password must be at least 6 characters")
        setIsSaving(false)
        return
      }
    }

    try {
      const updateData: any = {
        name: formData.name,
        college: formData.college,
      }

      // Include passwords if user wants to change it
      if (formData.newPassword && formData.currentPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      console.log("Sending update request:", updateData) // Debug log

      const response = await fetch("/api/profile", {
        method: "PATCH", // Changed from PUT to PATCH
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()
      console.log("Response:", response.status, data) // Debug log

      if (response.ok) {
        setSuccess("Profile updated successfully!")
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }))
        
        // Update session if name changed
        await update()
        
        // Refresh profile data
        await fetchProfile()
      } else {
        setError(data.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("An error occurred while updating profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Edit Profile
          </h1>
          <p className="text-gray-600 mt-2">Update your security profile information</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="college">college</Label>
                <Input
                  id="college"
                  name="college"
                  value={formData.college}
                  onChange={handleInputChange}
                  placeholder="Enter your college"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="pl-10 bg-gray-50"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed. Contact admin if needed.
                </p>
              </div>

              <div>
                <Label htmlFor="uid">UID</Label>
                <Input
                  id="uid"
                  name="uid"
                  value={formData.uid}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  UID cannot be changed. Contact admin if needed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Leave blank if you don't want to change your password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter new password (min. 6 characters)"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                />
              </div>
            </CardContent>
          </Card> */}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
