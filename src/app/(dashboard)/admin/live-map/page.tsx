"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  MapPin, 
  Users, 
  Loader2, 
  Navigation, 
  AlertCircle,
  RefreshCw,
  Filter,
  MapPinOff
} from "lucide-react"
import dynamic from "next/dynamic"
import DashboardHeader from "@/components/dashboard-header"

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
)

interface UserLocation {
  id: string
  participantId: string
  participantName: string
  avatarUrl?: string
  teamName?: string
  latitude: number
  longitude: number
  siteName: string
  updatedAt: string
}

const SITE_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  "All Sites": { lat: 12.0, lng: 77.0, zoom: 6 },
  "Amritapuri": { lat: 9.0942, lng: 76.4961, zoom: 16 },
  "Mysuru": { lat: 12.2958, lng: 76.6394, zoom: 16 },
  "Coimbatore": { lat: 10.9027, lng: 76.9006, zoom: 16 },
  "Bangalore": { lat: 12.9716, lng: 77.5946, zoom: 16 }
}

const SITE_COLORS: Record<string, string> = {
  "Amritapuri": "#10b981",
  "Mysuru": "#3b82f6",
  "Coimbatore": "#f59e0b",
  "Bangalore": "#ef4444"
}

export default function AdminLiveMapPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [locations, setLocations] = useState<UserLocation[]>([])
  const [filteredLocations, setFilteredLocations] = useState<UserLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [selectedSite, setSelectedSite] = useState<string>("All Sites")
  const [isPolling, setIsPolling] = useState(true)
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mapRef = useRef<any>(null)

  // Check admin access
  useEffect(() => {
    if (session && session.user.role !== "ADMIN") {
      router.push("/unauthorized")
    }
  }, [session, router])

  // Load Leaflet CSS and fix icons
  useEffect(() => {
    if (typeof window !== "undefined") {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)

      import("leaflet").then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        })
        setLeafletLoaded(true)
      })

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link)
        }
      }
    }
  }, [])

  // Fetch locations from server
  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch("/api/location")
      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations)
        setLastUpdate(new Date())
        setError(null)
      } else {
        setError("Failed to fetch locations")
      }
    } catch (err) {
      console.error("Failed to fetch locations:", err)
      setError("Connection error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Poll for updates
  useEffect(() => {
    fetchLocations()

    if (isPolling) {
      pollIntervalRef.current = setInterval(fetchLocations, 3000)
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [fetchLocations, isPolling])

  // Filter locations by site
  useEffect(() => {
    if (selectedSite === "All Sites") {
      setFilteredLocations(locations)
    } else {
      setFilteredLocations(locations.filter(loc => loc.siteName === selectedSite))
    }
  }, [locations, selectedSite])

  // Get site statistics
  const getSiteStats = () => {
    const stats: Record<string, number> = {
      "Amritapuri": 0,
      "Mysuru": 0,
      "Coimbatore": 0,
      "Bangalore": 0
    }
    locations.forEach(loc => {
      if (stats[loc.siteName] !== undefined) {
        stats[loc.siteName]++
      }
    })
    return stats
  }

  const siteStats = getSiteStats()
  const siteCenter = SITE_CENTERS[selectedSite] || SITE_CENTERS["All Sites"]

  if (!leafletLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="p-6">
          <Card className="shadow-lg">
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
                <p className="text-muted-foreground">Loading live map...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Navigation className="h-8 w-8 text-emerald-600" />
                Live Location Tracker
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time participant locations across all sites
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isPolling ? "default" : "secondary"} className="flex items-center gap-1">
                <RefreshCw className={`h-3 w-3 ${isPolling ? "animate-spin" : ""}`} />
                {isPolling ? "Live" : "Paused"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPolling(!isPolling)}
              >
                {isPolling ? "Pause" : "Resume"}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card 
              className={`cursor-pointer transition-all ${selectedSite === "All Sites" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
              onClick={() => setSelectedSite("All Sites")}
            >
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{locations.length}</p>
                <p className="text-xs text-muted-foreground">All Sites</p>
              </CardContent>
            </Card>
            
            {Object.entries(siteStats).map(([site, count]) => (
              <Card 
                key={site}
                className={`cursor-pointer transition-all ${selectedSite === site ? "ring-2 ring-primary" : "hover:shadow-md"}`}
                onClick={() => setSelectedSite(site)}
              >
                <CardContent className="p-4 text-center">
                  <MapPin 
                    className="h-6 w-6 mx-auto mb-2" 
                    style={{ color: SITE_COLORS[site] }} 
                  />
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{site}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Map Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                    <Navigation className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle>
                      {selectedSite === "All Sites" ? "All Participants" : selectedSite}
                    </CardTitle>
                    <CardDescription>
                      {filteredLocations.length} participant{filteredLocations.length !== 1 ? "s" : ""} online
                      {lastUpdate && ` • Updated ${lastUpdate.toLocaleTimeString()}`}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger className="w-[160px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Sites">All Sites</SelectItem>
                      <SelectItem value="Amritapuri">Amritapuri</SelectItem>
                      <SelectItem value="Mysuru">Mysuru</SelectItem>
                      <SelectItem value="Coimbatore">Coimbatore</SelectItem>
                      <SelectItem value="Bangalore">Bangalore</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="icon" onClick={fetchLocations}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Map */}
              <div className="h-[500px] rounded-lg overflow-hidden border">
                <MapContainer
                  key={selectedSite}
                  center={[siteCenter.lat, siteCenter.lng]}
                  zoom={siteCenter.zoom}
                  className="h-full w-full z-0"
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {filteredLocations.map((loc) => (
                    <Marker
                      key={loc.id}
                      position={[loc.latitude, loc.longitude]}
                    >
                      <Popup>
                        <div className="text-center min-w-[150px]">
                          <p className="font-bold text-sm">{loc.participantName}</p>
                          {loc.teamName && (
                            <p className="text-xs text-gray-600">Team: {loc.teamName}</p>
                          )}
                          <Badge 
                            variant="outline" 
                            className="mt-1 text-xs"
                            style={{ 
                              borderColor: SITE_COLORS[loc.siteName],
                              color: SITE_COLORS[loc.siteName]
                            }}
                          >
                            {loc.siteName}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(loc.updatedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* Empty State */}
              {filteredLocations.length === 0 && (
                <div className="text-center py-8">
                  <MapPinOff className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No active participants {selectedSite !== "All Sites" ? `at ${selectedSite}` : ""}
                  </p>
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="flex flex-wrap items-center gap-4">
                  {Object.entries(SITE_COLORS).map(([site, color]) => (
                    <div key={site} className="flex items-center gap-1">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-muted-foreground">{site}</span>
                    </div>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  Auto-refresh every 3 seconds
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Participants Table */}
          {filteredLocations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Team</th>
                        <th className="text-left p-2 font-medium">Site</th>
                        <th className="text-left p-2 font-medium">Coordinates</th>
                        <th className="text-left p-2 font-medium">Last Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLocations.map((loc) => (
                        <tr key={loc.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{loc.participantName}</td>
                          <td className="p-2 text-muted-foreground">{loc.teamName || "-"}</td>
                          <td className="p-2">
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: SITE_COLORS[loc.siteName],
                                color: SITE_COLORS[loc.siteName]
                              }}
                            >
                              {loc.siteName}
                            </Badge>
                          </td>
                          <td className="p-2 font-mono text-xs text-muted-foreground">
                            {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {new Date(loc.updatedAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}