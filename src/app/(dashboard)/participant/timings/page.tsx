"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Info
} from "lucide-react"

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
  gender: string
  avatarUrl: string | null
  contactNumber: string | null
  userId: string
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
}

const TRANSPORT_CONFIG: Record<string, { icon: typeof Plane; color: string; bgColor: string; label: string }> = {
  FLIGHT: { 
    icon: Plane, 
    color: "text-blue-600 dark:text-blue-400", 
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    label: "Flight"
  },
  TRAIN: { 
    icon: Train, 
    color: "text-green-600 dark:text-green-400", 
    bgColor: "bg-green-100 dark:bg-green-900/30",
    label: "Train"
  },
  BUS: { 
    icon: Bus, 
    color: "text-orange-600 dark:text-orange-400", 
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    label: "Bus"
  },
  OTHER: { 
    icon: Car, 
    color: "text-purple-600 dark:text-purple-400", 
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    label: "Other"
  },
}

export default function TimingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SiteArrivalsResponse | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMode, setFilterMode] = useState<string>("all")
  const [filterCarpool, setFilterCarpool] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("time")
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [showArrivalPopup, setShowArrivalPopup] = useState(false)

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

  const toggleCardExpand = (id: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCards(newExpanded)
  }

  // Filter and sort arrivals
  const filteredArrivals = data?.arrivals.filter(arrival => {
    // Search filter
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      arrival.name.toLowerCase().includes(searchLower) ||
      arrival.college.toLowerCase().includes(searchLower) ||
      arrival.teamName?.toLowerCase().includes(searchLower) ||
      arrival.arrivalFrom?.toLowerCase().includes(searchLower) ||
      arrival.arrivalTo?.toLowerCase().includes(searchLower)

    // Transport mode filter
    const matchesMode = filterMode === "all" || arrival.transportMode === filterMode

    // Carpool filter
    const matchesCarpool = 
      filterCarpool === "all" || 
      (filterCarpool === "yes" && arrival.interestedInCarpool) ||
      (filterCarpool === "no" && !arrival.interestedInCarpool)

    return matchesSearch && matchesMode && matchesCarpool
  }).sort((a, b) => {
    if (sortBy === "time") {
      if (!a.expectedArrivalTime) return 1
      if (!b.expectedArrivalTime) return -1
      return new Date(a.expectedArrivalTime).getTime() - new Date(b.expectedArrivalTime).getTime()
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name)
    } else if (sortBy === "college") {
      return a.college.localeCompare(b.college)
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
              {!currentUserArrival && (
                <Button onClick={() => setShowArrivalPopup(true)} className="gap-2">
                  <MapPin className="h-4 w-4" />
                  Add Your Arrival
                </Button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
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
        {/* <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8"> */}
          {/* Total Submissions */}
          {/* <Card className="col-span-2">
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
          </Card> */}

          {/* By Transport Mode */}
          {/* {Object.entries(TRANSPORT_CONFIG).map(([mode, config]) => {
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
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, college, team, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Transport Mode Filter */}
              <Select value={filterMode} onValueChange={setFilterMode}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Transport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="FLIGHT">✈️ Flight</SelectItem>
                  <SelectItem value="TRAIN">🚂 Train</SelectItem>
                  <SelectItem value="BUS">🚌 Bus</SelectItem>
                  <SelectItem value="OTHER">🚗 Other</SelectItem>
                </SelectContent>
              </Select>

              {/* Carpool Filter */}
              <Select value={filterCarpool} onValueChange={setFilterCarpool}>
                <SelectTrigger className="w-full md:w-[160px]">
                  {/* <Users className="h-4 w-4 mr-2" /> */}
                  <SelectValue placeholder="Carpool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Wants Carpool</SelectItem>
                  <SelectItem value="no">Solo Travel</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              {/* <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">⏰ Arrival Time</SelectItem>
                  <SelectItem value="name">👤 Name</SelectItem>
                  <SelectItem value="college">🏫 College</SelectItem>
                </SelectContent>
              </Select> */}
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredArrivals.length} of {data?.stats.total || 0} arrivals
          </p>
          {data?.stats.interestedInCarpool && data.stats.interestedInCarpool > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {data.stats.interestedInCarpool} interested in carpool
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
                {searchQuery || filterMode !== "all" || filterCarpool !== "all"
                  ? "Try adjusting your filters"
                  : "No participants have submitted their arrival details yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([date, arrivals]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{date}</h3>
                  <Badge variant="outline" className="ml-2">{arrivals.length}</Badge>
                </div>

                {/* Arrivals for this date */}
                <div className="grid gap-3">
                  {arrivals.map((arrival) => {
                    const transportConfig = arrival.transportMode 
                      ? TRANSPORT_CONFIG[arrival.transportMode] 
                      : null
                    const TransportIcon = transportConfig?.icon || Car
                    const isExpanded = expandedCards.has(arrival.id)
                    const isCurrentUser = arrival.userId === data?.currentUserId

                    return (
                      <Card 
                        key={arrival.id} 
                        className={`overflow-hidden transition-all ${
                          isCurrentUser 
                            ? "ring-2 ring-primary ring-offset-2" 
                            : "hover:shadow-md"
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <Avatar className="h-12 w-12 flex-shrink-0">
                              <AvatarImage src={arrival.avatarUrl || undefined} />
                              <AvatarFallback className={transportConfig?.bgColor}>
                                {getInitials(arrival.name)}
                              </AvatarFallback>
                            </Avatar>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                      {arrival.name}
                                    </h4>
                                    {isCurrentUser && (
                                      <Badge variant="default" className="text-xs">You</Badge>
                                    )}
                                    {arrival.interestedInCarpool && (
                                      <Badge variant="secondary" className="text-xs gap-1">
                                        <Users className="h-3 w-3" />
                                        Carpool
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
                                </div>

                                {/* Transport Mode & Time */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  {transportConfig && (
                                    <div className={`h-10 w-10 rounded-lg ${transportConfig.bgColor} flex items-center justify-center`}>
                                      <TransportIcon className={`h-5 w-5 ${transportConfig.color}`} />
                                    </div>
                                  )}
                                  <div className="text-right">
                                    <p className="font-semibold text-lg">
                                      {formatTime(arrival.expectedArrivalTime)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {transportConfig?.label || "Other"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Route Info */}
                              {arrival.transportMode !== "OTHER" && arrival.arrivalFrom && arrival.arrivalTo && (
                                <div className="mt-3 flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{arrival.arrivalFrom}</span>
                                  <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                                  <span className="truncate">{arrival.arrivalTo}</span>
                                </div>
                              )}

                              {/* Expanded Details */}
                              {isExpanded && (
                                <div className="mt-4 pt-4 border-t space-y-3 animate-in fade-in-50 duration-200">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Expected Arrival</p>
                                      <p className="font-medium">{formatDateTime(arrival.expectedArrivalTime)}</p>
                                    </div>
                                    {arrival.contactNumber && !isCurrentUser && (
                                      <div>
                                        <p className="text-muted-foreground">Contact</p>
                                        <p className="font-medium flex items-center gap-1">
                                          <Phone className="h-3 w-3" />
                                          {arrival.contactNumber}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  {arrival.interestedInCarpool && (
                                    <Alert className="">
                                      {/* <Users className="h-4 w-4 text-green-600" /> */}
                                      <AlertDescription className="">
                                        This participant is interested in carpooling. Feel free to reach out!
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </div>
                              )}

                              {/* Expand Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 w-full gap-1 text-muted-foreground hover:text-foreground"
                                onClick={() => toggleCardExpand(arrival.id)}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-4 w-4" />
                                    Show less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4" />
                                    Show more
                                  </>
                                )}
                              </Button>
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