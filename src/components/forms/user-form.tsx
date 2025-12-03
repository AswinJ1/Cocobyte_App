"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface UserFormProps {
  editingUser?: any
  onSuccess?: () => void
}

export default function UserForm({ editingUser, onSuccess }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    newPassword: "",
    uid: "",
    role: "PARTICIPANT",
    name: "",
    college: "",
    hostelName: "",
    roomNumber: "",
    wifiusername: "",
    wifiPassword: "",
    hostelLocation: "",
    contactNumber: "",
    gender: "male",
  })

  useEffect(() => {
    if (editingUser) {
      setFormData({
        email: editingUser.email,
        password: "",
        newPassword: "",
        uid: editingUser.uid || "",
        role: editingUser.role,
        name: editingUser.participant?.name || editingUser.admin?.name || "",
        college: editingUser.participant?.college || "",
        hostelName: editingUser.participant?.hostelName || "",
        roomNumber: editingUser.participant?.roomNumber || "",
        wifiusername: editingUser.participant?.wifiusername || "",
        wifiPassword: editingUser.participant?.wifiPassword || "",
        hostelLocation: editingUser.participant?.hostelLocation || "",
        contactNumber: editingUser.participant?.contactNumber || "",
        gender: editingUser.participant?.gender || editingUser.admin?.gender || "male",
      })
    }
  }, [editingUser])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = editingUser
        ? `/api/users?userId=${editingUser.id}`
        : "/api/users"
      
      const method = editingUser ? "PATCH" : "POST"

      const body: any = {
        name: formData.name,
        gender: formData.gender,
      }

      if (!editingUser) {
        // Creating new user
        body.email = formData.email
        body.password = formData.password
        body.uid = formData.uid
        body.role = formData.role
        
        // Add participant fields for new users
        if (formData.role === "PARTICIPANT") {
          body.college = formData.college
          body.hostelName = formData.hostelName
          body.roomNumber = formData.roomNumber
          body.wifiusername = formData.wifiusername
          body.wifiPassword = formData.wifiPassword
          body.hostelLocation = formData.hostelLocation
          body.contactNumber = formData.contactNumber
        }
      } else {
        // Updating existing user
        
        // Add password update if provided
        if (formData.newPassword && formData.newPassword.trim() !== "") {
          console.log("Sending password update:", formData.newPassword)
          body.newPassword = formData.newPassword
        }

        // Add participant fields if user is a participant
        if (editingUser.role === "PARTICIPANT") {
          body.college = formData.college
          body.hostelName = formData.hostelName
          body.roomNumber = formData.roomNumber
          body.wifiusername = formData.wifiusername
          body.wifiPassword = formData.wifiPassword
          body.hostelLocation = formData.hostelLocation
          body.contactNumber = formData.contactNumber
        }
      }

      console.log("Submitting update:", body)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setError(data.error || "Failed to save user")
      }
    } catch (error) {
      console.error("Form submission error:", error)
      setError("An error occurred while saving the user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter full name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="user@example.com"
            required
            disabled={!!editingUser}
          />
          {editingUser && (
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          )}
        </div>

        {!editingUser && (
          <>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uid">UID</Label>
              <Input
                id="uid"
                name="uid"
                value={formData.uid}
                onChange={handleInputChange}
                placeholder="Unique identifier (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleSelectChange("role", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARTICIPANT">Participant</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="gender">Gender *</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => handleSelectChange("gender", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Password Update Section (Only for editing) */}
      {editingUser && (
        <>
          <Separator />
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Update Password</h3>
              <p className="text-sm text-muted-foreground">Leave blank to keep current password</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter new password (optional)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {formData.newPassword && (
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Participant Details */}
      {formData.role === "PARTICIPANT" && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Participant Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="college">College *</Label>
              <Input
                id="college"
                name="college"
                value={formData.college}
                onChange={handleInputChange}
                placeholder="College name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hostelName">Hostel Name</Label>
                <Input
                  id="hostelName"
                  name="hostelName"
                  value={formData.hostelName}
                  onChange={handleInputChange}
                  placeholder="Hostel name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  placeholder="Room number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wifiusername">WiFi Username</Label>
                <Input
                  id="wifiusername"
                  name="wifiusername"
                  value={formData.wifiusername}
                  onChange={handleInputChange}
                  placeholder="WiFi username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wifiPassword">WiFi Password</Label>
                <Input
                  id="wifiPassword"
                  name="wifiPassword"
                  value={formData.wifiPassword}
                  onChange={handleInputChange}
                  placeholder="WiFi password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hostelLocation">Hostel Location URL</Label>
              <Input
                id="hostelLocation"
                name="hostelLocation"
                value={formData.hostelLocation}
                onChange={handleInputChange}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                placeholder="Phone number"
              />
            </div>
          </div>
        </>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {editingUser ? "Update User" : "Create User"}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}