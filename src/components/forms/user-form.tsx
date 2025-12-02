"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

interface User {
  id: string
  email: string
  uid?: string
  role: string
  participant?: {
    name: string
    college?: string
    hostelName?: string
    wifiusername?: string
    wifiPassword?: string
    hostelLocation?: string
    contactNumber?: string
    gender?: string
  }
  admin?: {
    name: string
    gender?: string
  }
}

interface UserFormProps {
  editingUser?: User | null
  onSuccess?: () => void
}

export default function UserForm({ editingUser, onSuccess }: UserFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    uid: "",
    role: "PARTICIPANT",
    name: "",
    college: "",
    hostelName: "",
    wifiusername: "",
    wifiPassword: "",
    hostelLocation: "",
    contactNumber: "",
    gender: "male",
  })

  // Populate form when editing
  useEffect(() => {
    if (editingUser) {
      setFormData({
        email: editingUser.email,
        password: "", // Don't populate password
        uid: editingUser.uid || "",
        role: editingUser.role,
        name: editingUser.participant?.name || editingUser.admin?.name || "",
        college: editingUser.participant?.college || "",
        hostelName: editingUser.participant?.hostelName || "",
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
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const url = editingUser 
        ? `/api/users?userId=${editingUser.id}`
        : "/api/users"
      
      const method = editingUser ? "PATCH" : "POST"

      const body: any = {
        role: formData.role,
        name: formData.name,
        gender: formData.gender,
      }

      // Only include email and password for new users
      if (!editingUser) {
        body.email = formData.email
        body.password = formData.password
        body.uid = formData.uid
      }

      // Include role-specific fields
      if (formData.role === "PARTICIPANT") {
        body.college = formData.college
        body.hostelName = formData.hostelName
        body.wifiusername = formData.wifiusername
        body.wifiPassword = formData.wifiPassword
        body.hostelLocation = formData.hostelLocation
        body.contactNumber = formData.contactNumber
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(editingUser ? "User updated successfully!" : "User created successfully!")
        
        if (!editingUser) {
          // Reset form only for new users
          setFormData({
            email: "",
            password: "",
            uid: "",
            role: "PARTICIPANT",
            name: "",
            college: "",
            hostelName: "",
            wifiusername: "",
            wifiPassword: "",
            hostelLocation: "",
            contactNumber: "",
            gender: "male",
          })
        }

        // Call onSuccess callback
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 1500)
        }
      } else {
        setError(data.error || `Failed to ${editingUser ? "update" : "create"} user`)
      }
    } catch (error) {
      setError(`An error occurred while ${editingUser ? "updating" : "creating"} user`)
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

      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information - Only for new users */}
      {!editingUser && (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Minimum 6 characters"
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uid">UID *</Label>
            <Input
              id="uid"
              name="uid"
              value={formData.uid}
              onChange={handleInputChange}
              required
              placeholder="Unique identifier"
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => handleSelectChange("role", value)}
          disabled={!!editingUser} // Disable role change when editing
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PARTICIPANT">Participant</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          placeholder="Full name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Gender *</Label>
        <Select
          value={formData.gender}
          onValueChange={(value) => handleSelectChange("gender", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Participant-specific fields */}
      {formData.role === "PARTICIPANT" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="college">College</Label>
            <Input
              id="college"
              name="college"
              value={formData.college}
              onChange={handleInputChange}
              placeholder="College name"
            />
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="hostelLocation">Hostel Location (Google Maps URL)</Label>
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
        </>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {editingUser ? "Update User" : "Create User"}
      </Button>
    </form>
  )
}