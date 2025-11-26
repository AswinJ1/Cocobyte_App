"use client";

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { studentRegisterSchema } from "@/lib/validations/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { User, Mail, CreditCard, Users, Building, DoorOpen, Phone, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, UserPlus, Info } from "lucide-react"
import Image from "next/image"
type RegisterFormData = z.infer<typeof studentRegisterSchema>

const clubs = [
  { id: "icpc", name: "ICPC@Amrita", description: "Competitive Programming Club" },
  { id: "amfoss", name: "amFOSS", description: "Free and Open Source Software Club" },
  { id: "bios", name: "bi0s", description: "Cybersecurity Club" },
  { id: "dreamteam", name: "Dream Team", description: "Dream team" },
]

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedClub, setSelectedClub] = useState("")

  
 const {
  register,
  handleSubmit,
  formState: { errors },
  setValue,
  watch,
} = useForm<RegisterFormData>({
  resolver: zodResolver(studentRegisterSchema),
  defaultValues: {
    name: "",
    email: "",
    uid: "",
    password: "",
    confirmPassword: "",
    clubName: "", // critical for hidden input sync
    hostelName: "",
    roomNo: "",
    phoneNumber: ""
  },
})


  // Watch for club selection changes
  const watchClub = watch("clubName")

  const onSubmit = async (data: RegisterFormData) => {
    console.log("Submitting data:", data)
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      
      if (response.ok) {
        router.push("/login?message=Registration successful! Please login with your credentials.")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Registration failed. Please try again.")
      }
    } catch (error) {
      setError("Network error occurred. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

// const handleClubSelect = (value: string) => {
//   const club = clubs.find(c => c.id === value)
//   if (club) {
//     setSelectedClub(club.name)
//     setValue("clubName", club.name, { shouldValidate: true })
//   } else { 
//     setSelectedClub("")
//     setValue("clubName", "", { shouldValidate: true })
//   }
// }
const handleClubSelect = (value: string) => {
  // value is the club.id now!
  setSelectedClub(value);
  const club = clubs.find(c => c.id === value);
  if (club) {
    setValue("clubName", club.name, { shouldValidate: true });
  } else {
    setValue("clubName", "", { shouldValidate: true });
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-2xl w-full space-y-8">
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
          <h2 className="text-3xl font-bold text-black mb-2">Create Your Account</h2>
          <p className="text-gray-400">Join the hostel management system as a student</p>
        </div>

        {/* Registration Form */}
        <Card className="bg-white border-zinc-800">
          <CardHeader>
            <CardTitle className="text-black">Registration Details</CardTitle>
            <CardDescription className="text-gray-400">
              Please fill in all the required information to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-black">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      {...register("name")}
                      className="pl-10 bg-white border-zinc-700 text-black placeholder:text-black focus:ring-black focus:border-black"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-black">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      {...register("email")}
                      className="pl-10 bg-white border-zinc-700 text-black placeholder:text-black focus:ring-black focus:border-black"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* UID Field */}
                <div className="space-y-2">
                  <Label htmlFor="uid" className="text-black">Student UID</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                    <Input
                      id="uid"
                      type="text"
                      placeholder="Enter your student UID"
                      {...register("uid")}
                      className="pl-10 bg-white border-zinc-700 text-black placeholder:text-black focus:ring-black focus:border-black"
                    />
                  </div>
                  {errors.uid && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.uid.message}
                    </p>
                  )}
                </div>

                {/* Hostel Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="hostelName" className="text-black">Hostel Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                    <Input
                      id="hostelName"
                      type="text"
                      placeholder="Enter your hostel name"
                      {...register("hostelName")}
                      className="pl-10 bg-white border-zinc-700 text-black placeholder:text-black focus:ring-black focus:border-black"
                    />
                  </div>
                  {errors.hostelName && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.hostelName.message}
                    </p>
                  )}
                </div>

                {/* Room Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="roomNo" className="text-black">Room Number</Label>
                  <div className="relative">
                    <DoorOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                    <Input
                      id="roomNo"
                      type="text"
                      placeholder="Enter your room number"
                      {...register("roomNo")}
                      className="pl-10 bg-white border-zinc-700 text-black placeholder:text-black focus:ring-black focus:border-black"
                    />
                  </div>
                  {errors.roomNo && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.roomNo.message}
                    </p>
                  )}
                </div>

                {/* Phone Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-black">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="Enter your phone number"
                      {...register("phoneNumber")}
                      className="pl-10 bg-white border-zinc-700 text-black placeholder:text-black focus:ring-black focus:border-black"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.phoneNumber.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Club Selection Accordion */}
              <div className="space-y-2">
                <Label className="text-black">Club Selection</Label>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="club-selection" className="bg-white border-zinc-700 rounded-lg">
                    <AccordionTrigger className="text-black hover:text-black px-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
  {selectedClub ? clubs.find(c => c.id === selectedClub)?.name : "Select your club"}
</span>

                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {/* <RadioGroup value={selectedClub} onValueChange={handleClubSelect}>
                        <div className="space-y-3">
                          {clubs.map((club) => (
                            <div key={club.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-200 transition-colors">
                              <RadioGroupItem 
                                value={club.id} 
                                id={club.id}
                                className="mt-1 border-gray-500 text-black"
                              />
                              <Label 
                                htmlFor={club.id} 
                                className="flex-1 cursor-pointer"
                              >
                                <div className="text-black font-medium">{club.name}</div>
                                <div className="text-gray-400 text-sm">{club.description}</div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup> */}
                      <RadioGroup value={selectedClub} onValueChange={handleClubSelect}>
                      {clubs.map((club) => (
                        <div key={club.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-200 transition-colors">
                          <RadioGroupItem
                            value={club.id}
                            id={club.id}
                            className="mt-1 border-gray-500 text-black"
                          />
                          <Label htmlFor={club.id} className="flex-1 cursor-pointer">
                            <div className="text-black font-medium">{club.name}</div>
                            <div className="text-gray-400 text-sm">{club.description}</div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <input type="hidden" {...register("clubName")} />
                {errors.clubName && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.clubName.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-black">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    {...register("password")}
                    className="pl-10 pr-10 bg-white border-zinc-700 text-black placeholder:text-black focus:ring-black focus:border-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
                <p className="text-xs text-black">Password must be at least 6 characters long</p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-black">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...register("confirmPassword")}
                    className="pl-10 bg-white border-zinc-700 text-black placeholder:text-black focus:ring-black focus:border-black"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="bg-red-950 border-red-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Terms and Conditions */}
              <Alert className="bg-white border-zinc-700">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-black">
                  <p className="font-medium mb-1">By registering, you agree to:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Follow hostel rules and regulations</li>
                    <li>Provide accurate information</li>
                    <li>Use the system responsibly</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white hover:bg-black font-semibold"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-t border-zinc-800">
            <div className="w-full text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-black hover:text-black transition-colors">
                  Sign in here →
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>

        {/* Help Section */}

            <div className="text-center">
              <h3 className="text-sm font-semibold text-black mb-2">Need Help?</h3>
              <p className="text-xs text-gray-400">
                Contact your hostel administrator or IT support for assistance with registration.
              </p>
            </div>
       
      </div>
    </div>
  )
}

export default RegisterForm