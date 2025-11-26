"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

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

const UserForm = () => {
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
          router.push("/admin/users")
        }, 2000)
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
            <p className="text-gray-600 mt-2">
              Create participant users for the system
            </p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Role Selection - Hidden but kept for form structure */}
            <input type="hidden" {...register("role")} value="PARTICIPANT" />

            {/* Personal Information Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h2>
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  {...register("email")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="user@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* UID */}
              <div>
                <label htmlFor="uid" className="block text-sm font-medium text-gray-700 mb-2">
                  UID (Unique Identifier) *
                </label>
                <input
                  type="text"
                  id="uid"
                  {...register("uid")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter unique identifier"
                />
                {errors.uid && (
                  <p className="text-red-500 text-sm mt-1">{errors.uid.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  {...register("password")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password (min. 6 characters)"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  {...register("name")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* College */}
              <div>
                <label htmlFor="college" className="block text-sm font-medium text-gray-700 mb-2">
                  College (Optional)
                </label>
                <input
                  type="text"
                  id="college"
                  {...register("college")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter college name"
                />
                {errors.college && (
                  <p className="text-red-500 text-sm mt-1">{errors.college.message}</p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  {...register("contactNumber")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter 10-digit contact number"
                  maxLength={10}
                />
                {errors.contactNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactNumber.message}</p>
                )}
              </div>
            </div>

            {/* Hostel Information Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Hostel Information</h2>
              
              {/* Hostel Name */}
              <div>
                <label htmlFor="hostelName" className="block text-sm font-medium text-gray-700 mb-2">
                  Hostel Name *
                </label>
                <input
                  type="text"
                  id="hostelName"
                  {...register("hostelName")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter hostel name"
                />
                {errors.hostelName && (
                  <p className="text-red-500 text-sm mt-1">{errors.hostelName.message}</p>
                )}
              </div>

              {/* WiFi Username */}
                <div>
                <label htmlFor="wifiusername" className="block text-sm font-medium text-gray-700 mb-2">
                  WiFi Username*
                </label>
                <input
                  type="text"
                  id="wifiusername"
                  {...register("wifiusername")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter WiFi username"
                />
                {errors.wifiusername && (
                  <p className="text-red-500 text-sm mt-1">{errors.wifiusername.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="wifiPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  WiFi Password *
                </label>
                <input
                  type="text"
                  id="wifiPassword"
                  {...register("wifiPassword")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter WiFi password"
                />
                {errors.wifiPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.wifiPassword.message}</p>
                )}
              </div>

              {/* Hostel Location (Google Maps Link) */}
              <div>
                <label htmlFor="hostelLocation" className="block text-sm font-medium text-gray-700 mb-2">
                  Hostel Location (Google Maps Link)
                </label>
                <input
                  type="url"
                  id="hostelLocation"
                  {...register("hostelLocation")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://maps.google.com/..."
                />
                {errors.hostelLocation && (
                  <p className="text-red-500 text-sm mt-1">{errors.hostelLocation.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Paste Google Maps link for hostel location
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="text-green-700 text-sm">{success}</div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating User..." : "Create User"}
              </button>
              
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UserForm