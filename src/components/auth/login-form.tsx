"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Role } from "@prisma/client"
import { loginSchema } from "@/lib/validations/auth"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "PARTICIPANT",
      email: "",
      uid: "",
      password: "",
    },
  })
  
  const watchRole = form.watch("role")
  
  // Determine which credential fields to show
  const showEmail = watchRole === "ADMIN" || watchRole === "PARTICIPANT" 
  const showUID = watchRole === "PARTICIPANT"
  const isUIDRequired = watchRole === "PARTICIPANT"
  const isEmailRequired = watchRole === "ADMIN"

  const handleRoleChange = (role: Role) => {
    form.setValue("role", role)
    // Clear previous credential values when role changes
    form.setValue("email", "")
    form.setValue("uid", "")
    setError(null)
  }
  
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await signIn("credentials", {
        email: data.email || "",
        uid: data.uid || "",
        password: data.password,
        role: data.role,
        redirect: false,
      })
      
      if (result?.error) {
        setError("Invalid credentials. Please check your email/UID and password.")
      } else {
        // Successful login - redirect to appropriate dashboard
        router.push(getDashboardUrl(data.role))
        router.refresh()
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleVariant = (role: Role): "default" | "secondary" | "destructive" | "outline" => {
    const variants = {
      PARTICIPANT: "default", 
      ADMIN: "destructive",
    }
    return variants[role] as "default" | "destructive"
  }

  const getRoleDescription = (role: Role) => {
    const descriptions = {
      STUDENT: "Access your stayback requests and club activities",
      PARTICIPANT: "Manage your hostel stay and activities", 
      ADMIN: "Full system administration access",
    }
    return descriptions[role]
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Amrita Logo"
              width={120}
              height={120}
              priority
            />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-muted-foreground">
            Sign in to your hostel management account
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                {/* Role Selection */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Your Role</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          handleRoleChange(value as Role)
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="PARTICIPANT">Participant</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
                        <Badge variant={getRoleVariant(watchRole)}>
                          {watchRole.replace("_", " ")}
                        </Badge>
                        <FormDescription className="sm:text-right">
                          {getRoleDescription(watchRole)}
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                {showEmail && (
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Email Address {isEmailRequired && <span className="text-red-500">*</span>}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* UID Field */}
                {showUID && (
                  <FormField
                    control={form.control}
                    name="uid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          UID {isUIDRequired && <span className="text-red-500">*</span>}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder={isUIDRequired ? "Enter your participant UID" : "Enter your UID"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Password Field */}
                <FormField
                  control={form.control as any}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="sr-only">
                              {showPassword ? "Hide password" : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w- mt-5"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>

                <Separator className="my-2" />

                {/* Footer Links */}
                <div className="w-full space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <Button variant="link" asChild className="p-0 h-auto font-normal">
                      <Link href="/register">
                        New here? Contact Admin
                      </Link>
                    </Button>
                    <Button variant="link" asChild className="p-0 h-auto font-normal text-muted-foreground">
                      <Link href="/forgot-password">
                        Forgot password?
                      </Link>
                    </Button>
                  </div>
                  
                  {/* Help Text */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Need help? Contact your hostel administrator
                    </p>
                  </div>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  )
}

function getDashboardUrl(role: Role): string {
  const dashboards: Record<Role, string> = {
    ADMIN: "/admin",
    PARTICIPANT: "/participant",
  }
  return dashboards[role] || "/"
}