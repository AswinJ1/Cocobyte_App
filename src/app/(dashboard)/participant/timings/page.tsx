"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import DashboardHeader from "@/components/dashboard-header"
import ArrivalDetailsPopup from "@/components/arrival-details-popup"
import {
  Loader2,
  Plane,
  Train,
  Bus,
  Car,
  MapPin,
  Clock,
  Users,
  Search,
  Calendar,
  ArrowRight,
  Filter,
  RefreshCw,
  UserCheck,
  AlertCircle,
  Phone,
  Building2,
  ChevronDown,
  ChevronUp,
  Info,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  UserPlus,
  Heart,
  HeartHandshake,
  Send,
  Bell,
  Timer
} from "lucide-react"

interface CarpoolInterestData {
  id: string
  interestedParticipant: {
    id: string
    name: string
    college: string
    avatarUrl: string | null
  }
  contactNumber: string
  message: string | null
  createdAt: string
}

interface ArrivalData {
  id: string
  name: string
  college: string
  teamName: string | null
  transportMode: string | null
  arrivalFrom: string | null
  arrivalTo: string | null
  expectedArrivalTime: string | null
  interestedInCarpool: boolean | null
  carpoolContactNumber: string | null
  gender: string
  avatarUrl: string | null
  userId: string
  carpoolInterestsReceived: CarpoolInterestData[]
  updatedAt?: string
  createdAt?: string
}

interface SiteArrivalsResponse {
  siteName: string
  arrivals: ArrivalData[]
  stats: {
    total: number
    totalParticipants: number
    submissionRate: number
    byTransportMode: {
      flight: number
      train: number
      bus: number
      other: number
    }
    interestedInCarpool: number
  }
  currentUserId: string
  currentParticipantId: string
  interestedInIds: string[]
}

const TRANSPORT_CONFIG: Record<string, { icon: typeof Plane; color: string; bgColor: string; label: string }> = {
  FLIGHT: { 
    icon: Plane, 
    color: "text-blue-600 dark:text-blue-400", 
    bgColor: "bg-transparent dark:bg-transparent",
    label: "Flight"
  },
  TRAIN: { 
    icon: Train, 
    color: "text-green-600 dark:text-green-400", 
    bgColor: "bg-transparent dark:bg-transparent",
    label: "Train"
  },
  BUS: { 
    icon: Bus, 
    color: "text-orange-600 dark:text-orange-400", 
    bgColor: "bg-transparent dark:bg-transparent",
    label: "Bus"
  },
  OTHER: { 
    icon: Car, 
    color: "text-purple-600 dark:text-purple-400", 
    bgColor: "bg-transparent dark:bg-transparent",
    label: "Other"
  },
}

// Time filter options in hours
const TIME_FILTER_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "1", label: "Last 1 Hour" },
  { value: "2", label: "Last 2 Hours" },
  { value: "3", label: "Last 3 Hours" },
  { value: "4", label: "Last 4 Hours" },
  { value: "6", label: "Last 6 Hours" },
  { value: "12", label: "Last 12 Hours" },
  { value: "24", label: "Last 24 Hours" },
  { value: "48", label: "Last 2 Days" },
  { value: "168", label: "Last Week" },
]

export default function TimingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SiteArrivalsResponse | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMode, setFilterMode] = useState<string>("all")
  const [filterCarpool, setFilterCarpool] = useState<string>("all")
  const [filterSubmittedTime, setFilterSubmittedTime] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("time")
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [showArrivalPopup, setShowArrivalPopup] = useState(false)
  
  // Interest dialog state
  const [interestDialogOpen, setInterestDialogOpen] = useState(false)
  const [selectedArrival, setSelectedArrival] = useState<ArrivalData | null>(null)
  const [interestContactNumber, setInterestContactNumber] = useState("")
  const [interestMessage, setInterestMessage] = useState("")
  const [isSubmittingInterest, setIsSubmittingInterest] = useState(false)
  
  // Connect dialog state (for viewing interested participants)
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)
  const [selectedInterest, setSelectedInterest] = useState<CarpoolInterestData | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  // View interests dialog (for arrival owners)
  const [viewInterestsDialogOpen, setViewInterestsDialogOpen] = useState(false)
  const [viewInterestsArrival, setViewInterestsArrival] = useState<ArrivalData | null>(null)

  useEffect(() => {
    if (session?.user?.role !== "PARTICIPANT") {
      router.push("/unauthorized")
      return
    }
    fetchArrivals()
  }, [session, router])

  const fetchArrivals = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/site-arrivals")
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to load arrivals")
      }
    } catch (err) {
      console.error("Error fetching arrivals:", err)
      setError("Failed to load arrival data")
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

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Not specified"
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateString)
  }

  const isWithinTimeFilter = (dateString: string | null | undefined, hoursFilter: string): boolean => {
    // If "all" is selected, show everything
    if (hoursFilter === "all") return true
    
    // If no date provided, don't filter it out - show it
    if (!dateString) return true
    
    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) return true
      
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      
      // Only show if submitted within the specified hours
      return diffHours >= 0 && diffHours <= parseFloat(hoursFilter)
    } catch {
      return true
    }
  }

  const toggleCardExpand = (id: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCards(newExpanded)
  }

  // Open interest dialog
  const openInterestDialog = (arrival: ArrivalData) => {
    setSelectedArrival(arrival)
    setInterestContactNumber("")
    setInterestMessage("")
    setInterestDialogOpen(true)
  }

  // Submit interest
  const submitInterest = async () => {
    if (!selectedArrival) return
    
    if (!interestContactNumber || interestContactNumber.length < 10) {
      return
    }

    setIsSubmittingInterest(true)
    try {
      const response = await fetch("/api/carpool-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arrivalOwnerId: selectedArrival.id,
          contactNumber: interestContactNumber,
          message: interestMessage,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setInterestDialogOpen(false)
        // Refresh data to update the UI
        fetchArrivals()
      } else {
        setError(result.error || "Failed to submit interest")
      }
    } catch (err) {
      console.error("Error submitting interest:", err)
      setError("Failed to submit interest")
    } finally {
      setIsSubmittingInterest(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // Format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('0')) {
      cleaned = '91' + cleaned.substring(1)
    } else if (cleaned.length === 10) {
      cleaned = '91' + cleaned
    }
    return cleaned
  }

  // Open WhatsApp
  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = formatPhoneForWhatsApp(phone)
    const message = encodeURIComponent(
      `Hi ${name}! 👋\n\n` +
      `I saw you're interested in carpooling for the ICPC Regionals at ${data?.siteName}.\n\n` +
      `Let's coordinate our travel together! 🚀`
    )
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
  }

  // Open view interests dialog
  const openViewInterestsDialog = (arrival: ArrivalData) => {
    setViewInterestsArrival(arrival)
    setViewInterestsDialogOpen(true)
  }

  // Connect with interested participant
  const connectWithInterest = (interest: CarpoolInterestData) => {
    setSelectedInterest(interest)
    setConnectDialogOpen(true)
    setViewInterestsDialogOpen(false)
  }

  // Filter and sort arrivals
  const filteredArrivals = data?.arrivals.filter(arrival => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      arrival.name.toLowerCase().includes(searchLower) ||
      arrival.college.toLowerCase().includes(searchLower) ||
      arrival.teamName?.toLowerCase().includes(searchLower) ||
      arrival.arrivalFrom?.toLowerCase().includes(searchLower) ||
      arrival.arrivalTo?.toLowerCase().includes(searchLower)

    const matchesMode = filterMode === "all" || arrival.transportMode === filterMode

    const matchesCarpool = 
      filterCarpool === "all" || 
      (filterCarpool === "yes" && arrival.interestedInCarpool) ||
      (filterCarpool === "no" && !arrival.interestedInCarpool)

    // Check if submission time matches filter
    // Use updatedAt first, then createdAt, then expectedArrivalTime as fallback
    const submissionTime = arrival.updatedAt || arrival.createdAt || arrival.expectedArrivalTime
    const matchesSubmittedTime = isWithinTimeFilter(submissionTime, filterSubmittedTime)

    return matchesSearch && matchesMode && matchesCarpool && matchesSubmittedTime
  }).sort((a, b) => {
    if (sortBy === "time") {
      if (!a.expectedArrivalTime) return 1
      if (!b.expectedArrivalTime) return -1
      return new Date(a.expectedArrivalTime).getTime() - new Date(b.expectedArrivalTime).getTime()
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name)
    } else if (sortBy === "college") {
      return a.college.localeCompare(b.college)
    } else if (sortBy === "submitted") {
      const aTime = a.updatedAt || a.createdAt || a.expectedArrivalTime
      const bTime = b.updatedAt || b.createdAt || b.expectedArrivalTime
      if (!aTime) return 1
      if (!bTime) return -1
      return new Date(bTime).getTime() - new Date(aTime).getTime() // Most recent first
    }
    return 0
  }) || []

  // Group arrivals by date
  const groupedByDate = filteredArrivals.reduce((acc, arrival) => {
    const dateKey = arrival.expectedArrivalTime 
      ? formatDate(arrival.expectedArrivalTime)
      : "Not Specified"
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(arrival)
    return acc
  }, {} as Record<string, ArrivalData[]>)

  // Check if current user has submitted arrival details
  const currentUserArrival = data?.arrivals.find(a => a.userId === data.currentUserId)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading arrival details...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      {/* Arrival Details Popup */}
      <ArrivalDetailsPopup
        isOpen={showArrivalPopup}
        onClose={() => setShowArrivalPopup(false)}
        onSuccess={() => fetchArrivals()}
        siteName={data?.siteName || "Amritapuri"}
      />

      {/* Express Interest Dialog */}
      <Dialog open={interestDialogOpen} onOpenChange={setInterestDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-pink-500" />
              Express Carpool Interest
            </DialogTitle>
            <DialogDescription>
              Let {selectedArrival?.name.split(" ")[0]} know you're interested in carpooling together
            </DialogDescription>
          </DialogHeader>

          {selectedArrival && (
            <div className="space-y-4 py-4">
              {/* Arrival Info */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedArrival.avatarUrl || undefined} />
                    <AvatarFallback>{getInitials(selectedArrival.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedArrival.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedArrival.college}</p>
                  </div>
                </div>
                {selectedArrival.transportMode !== "OTHER" && (
                  <div className="text-sm flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{selectedArrival.arrivalFrom} → {selectedArrival.arrivalTo}</span>
                  </div>
                )}
                <div className="text-sm flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDateTime(selectedArrival.expectedArrivalTime)}</span>
                </div>
              </div>

              {/* Contact Number Input */}
              <div className="space-y-2">
                <Label htmlFor="contactNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Your Contact Number *
                </Label>
                <Input
                  id="contactNumber"
                  placeholder="Enter your phone number"
                  value={interestContactNumber}
                  onChange={(e) => setInterestContactNumber(e.target.value)}
                  type="tel"
                />
                <p className="text-xs text-muted-foreground">
                  This will be shared with {selectedArrival.name.split(" ")[0]} so they can contact you
                </p>
              </div>

              {/* Optional Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="e.g., I'm arriving around the same time, would love to share a cab!"
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setInterestDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitInterest} 
              disabled={isSubmittingInterest || !interestContactNumber || interestContactNumber.length < 10}
              className="gap-2"
            >
              {isSubmittingInterest ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Interest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Interests Dialog (for arrival owners) */}
      <Dialog open={viewInterestsDialogOpen} onOpenChange={setViewInterestsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Interested Participants
            </DialogTitle>
            <DialogDescription>
              These participants want to carpool with you
            </DialogDescription>
          </DialogHeader>

          {viewInterestsArrival && (
            <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
              {viewInterestsArrival.carpoolInterestsReceived.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No one has expressed interest yet</p>
                </div>
              ) : (
                viewInterestsArrival.carpoolInterestsReceived.map((interest) => (
                  <Card key={interest.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={interest.interestedParticipant.avatarUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(interest.interestedParticipant.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{interest.interestedParticipant.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {interest.interestedParticipant.college}
                          </p>
                          {interest.message && (
                            <p className="text-sm mt-2 italic text-muted-foreground">
                              "{interest.message}"
                            </p>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => connectWithInterest(interest)}
                          className="gap-1"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Connect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewInterestsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connect Dialog (to contact interested participant) */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Connect with {selectedInterest?.interestedParticipant.name.split(" ")[0]}
            </DialogTitle>
            <DialogDescription>
              Reach out to coordinate carpooling
            </DialogDescription>
          </DialogHeader>

          {selectedInterest && (
            <div className="space-y-4 py-4">
              {/* Participant Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedInterest.interestedParticipant.avatarUrl || undefined} />
                  <AvatarFallback>
                    {getInitials(selectedInterest.interestedParticipant.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedInterest.interestedParticipant.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedInterest.interestedParticipant.college}
                  </p>
                </div>
              </div>

              {selectedInterest.message && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm italic">"{selectedInterest.message}"</p>
                </div>
              )}

              {/* Phone Number */}
              {/* <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{selectedInterest.contactNumber}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(selectedInterest.contactNumber, "phone")}
                  >
                    {copiedField === "phone" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div> */}

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  onClick={() => openWhatsApp(
                    selectedInterest.contactNumber, 
                    selectedInterest.interestedParticipant.name.split(" ")[0]
                  )}
                >
                  <MessageCircle className="h-4 w-4" />
                  Message on WhatsApp
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>

                <Button 
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => window.open(`tel:${selectedInterest.contactNumber}`, '_self')}
                >
                  <Phone className="h-4 w-4" />
                  Call Directly
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Arrival Timings
              </h1>
              <p className="text-muted-foreground mt-1">
                See when other participants from {data?.siteName} are arriving
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchArrivals} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={() => setShowArrivalPopup(true)} className="gap-2">
                <MapPin className="h-4 w-4" />
                {currentUserArrival ? "Edit Arrival" : "Add Your Arrival"}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Show interests received notification for current user */}
        {currentUserArrival && currentUserArrival.carpoolInterestsReceived.length > 0 && (
          <Alert className="mb-6 ">
            <Bell className="h-4 w-4 " />
            <div className=" flex items-center justify-between">
              <span>
                <strong>{currentUserArrival.carpoolInterestsReceived.length}</strong> participant(s) interested in carpooling with you!
              </span>
              {/* <Button
                size="sm"
                variant="outline"
                className="ml-4 dark:bg-white bg-black text-white dark:text-black "
                onClick={() => openViewInterestsDialog(currentUserArrival)}
              >
                View & Connect
              </Button> */}
            </div>
          </Alert>
        )}

        {/* Prompt to add arrival details if not submitted */}
        {!currentUserArrival && (
          <Alert className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              You haven't added your arrival details yet.{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto text-blue-600 dark:text-blue-400 underline"
                onClick={() => setShowArrivalPopup(true)}
              >
                Add now
              </Button>{" "}
              to help coordinate with other participants.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data?.stats.total || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    of {data?.stats.totalParticipants || 0} submitted ({data?.stats.submissionRate || 0}%)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.entries(TRANSPORT_CONFIG).map(([mode, config]) => {
            const Icon = config.icon
            const count = data?.stats.byTransportMode[mode.toLowerCase() as keyof typeof data.stats.byTransportMode] || 0
            return (
              <Card key={mode}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{config.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div> */}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, college, team, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div> */}

              <Select value={filterMode} onValueChange={setFilterMode}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Transport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="FLIGHT">Flight</SelectItem>
                  <SelectItem value="TRAIN">Train</SelectItem>
                  <SelectItem value="BUS">Bus</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCarpool} onValueChange={setFilterCarpool}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Carpool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Participants</SelectItem>
                  <SelectItem value="yes"> Open to Carpool</SelectItem>
                  <SelectItem value="no">Solo Travel</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSubmittedTime} onValueChange={setFilterSubmittedTime}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <Timer className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Submitted" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
{/* 
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Arrival Time</SelectItem>
                  <SelectItem value="submitted">Recently Added</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                </SelectContent>
              </Select> */}
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredArrivals.length} of {data?.stats.total || 0} arrivals
            {filterSubmittedTime !== "all" && (
              <span className="ml-1">
                (submitted in {TIME_FILTER_OPTIONS.find(o => o.value === filterSubmittedTime)?.label.toLowerCase()})
              </span>
            )}
          </p>
          {data?.stats.interestedInCarpool && data.stats.interestedInCarpool > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {data.stats.interestedInCarpool} open to carpool
            </Badge>
          )}
        </div>

        {/* Arrivals List */}
        {filteredArrivals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No arrivals found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterMode !== "all" || filterCarpool !== "all" || filterSubmittedTime !== "all"
                  ? "Try adjusting your filters"
                  : "No participants have submitted their arrival details yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([date, arrivals]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{date}</h3>
                  <Badge variant="outline" className="ml-2">{arrivals.length}</Badge>
                </div>

                
                <div className="grid gap-3">
                  {arrivals.map((arrival) => {
                    const transportConfig = arrival.transportMode 
                      ? TRANSPORT_CONFIG[arrival.transportMode] 
                      : null
                    const TransportIcon = transportConfig?.icon || Car
                    const isExpanded = expandedCards.has(arrival.id)
                    const isCurrentUser = arrival.userId === data?.currentUserId
                    const hasExpressedInterest = data?.interestedInIds.includes(arrival.id)
                    const interestCount = arrival.carpoolInterestsReceived?.length || 0
                    const submittedTime = arrival.updatedAt || arrival.createdAt

                    return (
                      <Card 
                        key={arrival.id} 
                        className={`overflow-hidden transition-all ${
                          isCurrentUser 
                            ? "ring-2 ring-primary ring-offset-2" 
                            : "hover:shadow-md"
                        }`}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                            {/* Avatar and Transport Icon Row for Mobile */}
                            <div className="flex items-center justify-between sm:hidden">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 flex-shrink-0">
                                  <AvatarImage src={arrival.avatarUrl || undefined} />
                                  <AvatarFallback className={transportConfig?.bgColor}>
                                    {getInitials(arrival.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                      {arrival.name}
                                    </h4>
                                    {isCurrentUser && (
                                      <Badge variant="default" className="text-xs">You</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {arrival.college}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {transportConfig && (
                                  <div className={`h-8 w-8 ${transportConfig.bgColor} flex items-center justify-center`}>
                                    <TransportIcon className={`h-4 w-4 ${transportConfig.color}`} />
                                  </div>
                                )}
                                <div className="text-right">
                                  {/* <p className="font-semibold text-sm">
                                    {formatTime(arrival.expectedArrivalTime)}
                                  </p> */}
                                  <p className="font-semibold text-sm">
                                  {submittedTime && (
                                      <div>
                                        <p className="text-muted-foreground text-xs">Submitted</p>
                                        <p className="font-medium text-sm">{formatRelativeTime(submittedTime)}</p>
                            
                                      </div>
                                    )}
                                    </p>

                                </div>
                              
                              </div>
                            </div>

                            {/* Desktop Avatar */}
                            <Avatar className="h-12 w-12 flex-shrink-0 hidden sm:flex">
                              <AvatarImage src={arrival.avatarUrl || undefined} />
                              <AvatarFallback className={transportConfig?.bgColor}>
                                {getInitials(arrival.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              {/* Desktop Header */}
                              <div className="hidden sm:flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                      {arrival.name}
                                    </h4>
                                    {isCurrentUser && (
                                      <Badge variant="default" className="text-xs">You</Badge>
                                    )}
                                    {arrival.interestedInCarpool && (
                                      <Badge variant="secondary" className="text-xs gap-1 bg-background">
                                        {/* <Users className="h-3 w-3" /> */}
                                        Open to Carpool
                                      </Badge>
                                    )}
                                    {isCurrentUser && interestCount > 0 && (
                                      <Badge variant="secondary" className="text-xs gap-1 bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">
                                        <Heart className="h-3 w-3" />
                                        {interestCount} interested
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {arrival.college}
                                    {arrival.teamName && (
                                      <span className="ml-2">• Team: {arrival.teamName}</span>
                                    )}
                                  </p>
                                  {submittedTime && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                      <Timer className="h-3 w-3" />
                                      Added {formatRelativeTime(submittedTime)}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 flex-shrink-0">
                                  {transportConfig && (
                                    <div className={`h-10 w-10  ${transportConfig.bgColor} flex items-center justify-center`}>
                                      <TransportIcon className={`h-5 w-5 ${transportConfig.color}`} />
                                    </div>
                                  )}
                                  <div className="text-right">
                                    <p className="font-semibold text-lg">
                                      {formatTime(arrival.expectedArrivalTime)}
                                    </p>
                                    {/* <p className="text-xs text-muted-foreground">
                                      {transportConfig?.label || "Other"}
                                    </p> */}
                                  </div>
                                </div>
                              </div>

                              {/* Mobile Badges */}
                              <div className="flex items-center gap-2 flex-wrap sm:hidden mt-2">
                                {arrival.interestedInCarpool && (
                                  <Badge variant="secondary" className="text-xs gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    <Users className="h-3 w-3" />
                                    Carpool
                                  </Badge>
                                )}
                                {isCurrentUser && interestCount > 0 && (
                                  <Badge variant="secondary" className="text-xs gap-1 bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">
                                    <Heart className="h-3 w-3" />
                                    {interestCount}
                                  </Badge>
                                )}
                                {arrival.teamName && (
                                  <Badge variant="outline" className="text-xs">
                                    {arrival.teamName}
                                  </Badge>
                                )}
                              </div>

                              {arrival.transportMode !== "OTHER" && arrival.arrivalFrom && arrival.arrivalTo && (
                                <div className="mt-2 sm:mt-3 flex items-center gap-2 text-xs sm:text-sm bg-muted/50 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
                                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{arrival.arrivalFrom}</span>
                                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                  <span className="truncate">{arrival.arrivalTo}</span>
                                </div>
                              )}

                              {isExpanded && (
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t space-y-3 animate-in fade-in-50 duration-200">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground text-xs">Expected Arrival</p>
                                      <p className="font-medium text-sm">{formatDateTime(arrival.expectedArrivalTime)}</p>
                                    </div>
                                    {submittedTime && (
                                      <div>
                                        <p className="text-muted-foreground text-xs">Submitted</p>
                                        <p className="font-medium text-sm">{formatDateTime(submittedTime)}</p>
                            
                                      </div>
                                    )}
                                    
                                    {arrival.interestedInCarpool && arrival.carpoolContactNumber && isCurrentUser && (
                                      <div>
                                        <p className="text-muted-foreground text-xs">Your Carpool Contact</p>
                                        <p className="font-medium flex items-center gap-1 text-sm">
                                          <Phone className="h-3 w-3" />
                                          {arrival.carpoolContactNumber}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons Row */}
                              <div className="mt-2 sm:mt-3 flex items-center gap-2 flex-wrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1 text-muted-foreground hover:text-foreground h-8 px-2 sm:px-3"
                                  onClick={() => toggleCardExpand(arrival.id)}
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-4 w-4" />
                                      <span className="hidden sm:inline">Less</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4" />
                                      <span className="hidden sm:inline">More</span>
                                    </>
                                  )}
                                </Button>

                                {/* View Interests Button (for current user's own arrival) */}
                                {isCurrentUser && interestCount > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 border-pink-300 text-pink-700 hover:bg-pink-50 h-8 px-2 sm:px-3 text-xs sm:text-sm"
                                    onClick={() => openViewInterestsDialog(arrival)}
                                  >
                                    <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">View</span> {interestCount}
                                  </Button>
                                )}

                                {/* Interest Button (for other users' arrivals that accept carpool) */}
                                {!isCurrentUser && arrival.interestedInCarpool && (
                                  hasExpressedInterest ? (
                                    <Badge variant="outline" className="gap-1 p-1 text-xs">
                                      <Check className="h-3 w-3" />
                                      <span className="hidden sm:inline">Interest</span> Sent
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1 h-8 px-2 sm:px-3 text-xs sm:text-sm"
                                      onClick={() => openInterestDialog(arrival)}
                                    >
                                      <HeartHandshake className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span className="hidden sm:inline">I'm</span> Interested
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}