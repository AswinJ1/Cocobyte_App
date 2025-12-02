"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Lock, Building, Wifi, MapPin, Phone } from "lucide-react"

// Create user schema for validation
const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  uid: z.string().min(1, "UID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["PARTICIPANT"]),
  name: z.string().min(1, "Name is required"),
  college: z.string().optional(),
  hostelName: z.string().min(1, "Hostel name is required"),
  wifiusername: z.string().min(1, "WiFi username is required"),
  wifiPassword: z.string().min(1, "WiFi password is required"),
  hostelLocation: z.string().url("Invalid URL format").optional().or(z.literal("")),
  contactNumber: z.string().regex(/^[0-9]{10}$/, "Contact number must be 10 digits"),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface UserFormProps {
  onSuccess?: () => void
}

const UserForm = ({ onSuccess }: UserFormProps) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: "PARTICIPANT",
    },
  })
  
  const watchRole = watch("role")
  
  const onSubmit = async (data: CreateUserFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      
      if (response.ok) {
        const result = await response.json()
        setSuccess("User created successfully!")
        reset()
        
        setTimeout(() => {
          if (onSuccess) {
            onSuccess()
          } else {
            router.push("/admin/users")
          }
        }, 1500)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create user")
      }
    } catch (error) {
      setError("An error occurred while creating the user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Role Selection - Hidden but kept for form structure */}
      <input type="hidden" {...register("role")} value="PARTICIPANT" />

      {/* Personal Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Personal Information</h3>
        </div>
        <Separator />
        
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              id="email"
              {...register("email")}
              className="pl-10"
              placeholder="user@example.com"
            />
          </div>
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email.message}</p>
          )}
        </div>

        {/* UID */}
        <div className="space-y-2">
          <Label htmlFor="uid">UID (Unique Identifier) *</Label>
          <Input
            type="text"
            id="uid"
            {...register("uid")}
            placeholder="Enter unique identifier"
          />
          {errors.uid && (
            <p className="text-destructive text-sm">{errors.uid.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              id="password"
              {...register("password")}
              className="pl-10"
              placeholder="Enter password (min. 6 characters)"
            />
          </div>
          {errors.password && (
            <p className="text-destructive text-sm">{errors.password.message}</p>
          )}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              id="name"
              {...register("name")}
              className="pl-10"
              placeholder="Enter full name"
            />
          </div>
          {errors.name && (
            <p className="text-destructive text-sm">{errors.name.message}</p>
          )}
        </div>

        {/* College */}
        <div className="space-y-2">
          <Label htmlFor="college">College (Optional)</Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              id="college"
              {...register("college")}
              className="pl-10"
              placeholder="Enter college name"
            />
          </div>
          {errors.college && (
            <p className="text-destructive text-sm">{errors.college.message}</p>
          )}
        </div>

        {/* Contact Number */}
        <div className="space-y-2">
          <Label htmlFor="contactNumber">Contact Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="tel"
              id="contactNumber"
              {...register("contactNumber")}
              className="pl-10"
              placeholder="Enter 10-digit contact number"
              maxLength={10}
            />
          </div>
          {errors.contactNumber && (
            <p className="text-destructive text-sm">{errors.contactNumber.message}</p>
          )}
        </div>
      </div>

      {/* Hostel Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Hostel Information</h3>
        </div>
        <Separator />
        
        {/* Hostel Name */}
        <div className="space-y-2">
          <Label htmlFor="hostelName">Hostel Name *</Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              id="hostelName"
              {...register("hostelName")}
              className="pl-10"
              placeholder="Enter hostel name"
            />
          </div>
          {errors.hostelName && (
            <p className="text-destructive text-sm">{errors.hostelName.message}</p>
          )}
        </div>

        {/* WiFi Username */}
        <div className="space-y-2">
          <Label htmlFor="wifiusername">WiFi Username *</Label>
          <div className="relative">
            <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              id="wifiusername"
              {...register("wifiusername")}
              className="pl-10"
              placeholder="Enter WiFi username"
            />
          </div>
          {errors.wifiusername && (
            <p className="text-destructive text-sm">{errors.wifiusername.message}</p>
          )}
        </div>

        {/* WiFi Password */}
        <div className="space-y-2">
          <Label htmlFor="wifiPassword">WiFi Password *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              id="wifiPassword"
              {...register("wifiPassword")}
              className="pl-10"
              placeholder="Enter WiFi password"
            />
          </div>
          {errors.wifiPassword && (
            <p className="text-destructive text-sm">{errors.wifiPassword.message}</p>
          )}
        </div>

        {/* Hostel Location (Google Maps Link) */}
        <div className="space-y-2">
          <Label htmlFor="hostelLocation">Hostel Location (Google Maps Link)</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="url"
              id="hostelLocation"
              {...register("hostelLocation")}
              className="pl-10"
              placeholder="https://maps.google.com/..."
            />
          </div>
          {errors.hostelLocation && (
            <p className="text-destructive text-sm">{errors.hostelLocation.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Optional: Paste Google Maps link for hostel location
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? "Creating User..." : "Create User"}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess ? onSuccess() : router.push("/admin/users")}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default UserForm