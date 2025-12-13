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
  MapPinOff,
  Locate,
  Globe
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

// Component to update map center dynamically
const MapCenterUpdater = dynamic(
  () => import("react-leaflet").then((mod) => {
    const { useMap } = mod
    return function MapCenterUpdaterInner({ center, zoom }: { center: [number, number]; zoom: number }) {
      const map = useMap()
      useEffect(() => {
        map.setView(center, zoom)
      }, [map, center, zoom])
      return null
    }
  }),
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

// Only used as fallback when NO users are online
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629, zoom: 5 } // Center of India

const SITE_COLORS: Record<string, string> = {
  "Amritapuri": "#10b981",
  "Mysuru": "#3b82f6",
  "Coimbatore": "#f59e0b",
  "Bangalore": "#ef4444",
  "Unknown": "#6b7280"
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
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER)
  const [mapZoom, setMapZoom] = useState(DEFAULT_CENTER.zoom)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check admin access
  useEffect(() => {
    if (session && session.user.role !== "ADMIN") {
      router.push("/unauthorized")
    }
  }, [session, router])

  // Load Leaflet CSS and fix icons
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!document.getElementById("leaflet-css-admin")) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.id = "leaflet-css-admin"
        document.head.appendChild(link)
      }

      import("leaflet").then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        })
        setLeafletLoaded(true)
      })
    }
  }, [])

  // Fetch locations from server
  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch("/api/location")
      if (response.ok) {
        const data = await response.json()
        const locs = data.locations || []
        setLocations(locs)
        setLastUpdate(new Date())
        setError(null)
        
        // Auto-center on first load if we have locations
        if (isFirstLoad && locs.length > 0) {
          const avgLat = locs.reduce((sum: number, loc: UserLocation) => sum + loc.latitude, 0) / locs.length
          const avgLng = locs.reduce((sum: number, loc: UserLocation) => sum + loc.longitude, 0) / locs.length
          setMapCenter({ lat: avgLat, lng: avgLng })
          setMapZoom(locs.length === 1 ? 16 : 10)
          setIsFirstLoad(false)
        }
      } else {
        setError("Failed to fetch locations")
      }
    } catch (err) {
      console.error("Failed to fetch locations:", err)
      setError("Connection error")
    } finally {
      setIsLoading(false)
    }
  }, [isFirstLoad])

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
    let filtered: UserLocation[]
    
    if (selectedSite === "All Sites") {
      filtered = locations
    } else {
      filtered = locations.filter(loc => loc.siteName === selectedSite)
    }
    
    setFilteredLocations(filtered)
  }, [locations, selectedSite])

  // Center on all filtered locations
  const centerOnAll = useCallback(() => {
    if (filteredLocations.length > 0) {
      const avgLat = filteredLocations.reduce((sum, loc) => sum + loc.latitude, 0) / filteredLocations.length
      const avgLng = filteredLocations.reduce((sum, loc) => sum + loc.longitude, 0) / filteredLocations.length
      setMapCenter({ lat: avgLat, lng: avgLng })
      
      // Calculate appropriate zoom based on spread
      if (filteredLocations.length === 1) {
        setMapZoom(16)
      } else {
        const latSpread = Math.max(...filteredLocations.map(l => l.latitude)) - Math.min(...filteredLocations.map(l => l.latitude))
        const lngSpread = Math.max(...filteredLocations.map(l => l.longitude)) - Math.min(...filteredLocations.map(l => l.longitude))
        const maxSpread = Math.max(latSpread, lngSpread)
        
        if (maxSpread > 5) setMapZoom(5)
        else if (maxSpread > 2) setMapZoom(7)
        else if (maxSpread > 0.5) setMapZoom(10)
        else if (maxSpread > 0.1) setMapZoom(12)
        else setMapZoom(14)
      }
    }
  }, [filteredLocations])

  // Center on specific user
  const centerOnUser = (loc: UserLocation) => {
    setMapCenter({ lat: loc.latitude, lng: loc.longitude })
    setMapZoom(18)
  }

  // Get site statistics
  const getSiteStats = () => {
    const stats: Record<string, number> = {}
    locations.forEach(loc => {
      stats[loc.siteName] = (stats[loc.siteName] || 0) + 1
    })
    return stats
  }

  const siteStats = getSiteStats()
  const uniqueSites = Object.keys(siteStats)

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
                Real-time participant locations (centered on actual GPS data)
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

          {/* Stats Cards - Dynamic based on actual data */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card 
              className={`cursor-pointer transition-all ${selectedSite === "All Sites" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
              onClick={() => {
                setSelectedSite("All Sites")
                centerOnAll()
              }}
            >
              <CardContent className="p-4 text-center">
                <Globe className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{locations.length}</p>
                <p className="text-xs text-muted-foreground">All Users</p>
              </CardContent>
            </Card>
            
            {uniqueSites.map((site) => (
              <Card 
                key={site}
                className={`cursor-pointer transition-all ${selectedSite === site ? "ring-2 ring-primary" : "hover:shadow-md"}`}
                onClick={() => {
                  setSelectedSite(site)
                  const siteLocs = locations.filter(l => l.siteName === site)
                  if (siteLocs.length > 0) {
                    const avgLat = siteLocs.reduce((sum, loc) => sum + loc.latitude, 0) / siteLocs.length
                    const avgLng = siteLocs.reduce((sum, loc) => sum + loc.longitude, 0) / siteLocs.length
                    setMapCenter({ lat: avgLat, lng: avgLng })
                    setMapZoom(siteLocs.length === 1 ? 16 : 14)
                  }
                }}
              >
                <CardContent className="p-4 text-center">
                  <MapPin 
                    className="h-6 w-6 mx-auto mb-2" 
                    style={{ color: SITE_COLORS[site] || SITE_COLORS["Unknown"] }} 
                  />
                  <p className="text-2xl font-bold">{siteStats[site]}</p>
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
                  <Select value={selectedSite} onValueChange={(val) => {
                    setSelectedSite(val)
                    if (val === "All Sites") {
                      centerOnAll()
                    } else {
                      const siteLocs = locations.filter(l => l.siteName === val)
                      if (siteLocs.length > 0) {
                        const avgLat = siteLocs.reduce((sum, loc) => sum + loc.latitude, 0) / siteLocs.length
                        const avgLng = siteLocs.reduce((sum, loc) => sum + loc.longitude, 0) / siteLocs.length
                        setMapCenter({ lat: avgLat, lng: avgLng })
                        setMapZoom(siteLocs.length === 1 ? 16 : 14)
                      }
                    }
                  }}>
                    <SelectTrigger className="w-[160px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Sites">All Sites</SelectItem>
                      {uniqueSites.map(site => (
                        <SelectItem key={site} value={site}>{site}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={centerOnAll}
                    title="Center on all users"
                  >
                    <Locate className="h-4 w-4" />
                  </Button>
                  
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

              {/* Current Map Center Info - Shows REAL coordinates */}
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <Locate className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground font-mono">
                    Center: {mapCenter.lat.toFixed(6)}, {mapCenter.lng.toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {filteredLocations.length > 0 && (
                    <Badge variant="default" className="bg-green-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      LIVE DATA
                    </Badge>
                  )}
                  <Badge variant="outline">Zoom: {mapZoom}</Badge>
                </div>
              </div>

              {/* Map */}
              <div className="h-[500px] rounded-lg overflow-hidden border">
                <MapContainer
                  center={[mapCenter.lat, mapCenter.lng]}
                  zoom={mapZoom}
                  className="h-full w-full z-0"
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* Dynamic map center update */}
                  <MapCenterUpdater center={[mapCenter.lat, mapCenter.lng]} zoom={mapZoom} />
                  
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
                              borderColor: SITE_COLORS[loc.siteName] || SITE_COLORS["Unknown"],
                              color: SITE_COLORS[loc.siteName] || SITE_COLORS["Unknown"]
                            }}
                          >
                            {loc.siteName}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            📍 {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                          </p>
                          <p className="text-xs text-gray-400">
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
                    No active participants sharing location
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Participants need to click &quot;Start&quot; to share their GPS location
                  </p>
                </div>
              )}

              {/* Dynamic Legend based on actual data */}
              {uniqueSites.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                  <div className="flex flex-wrap items-center gap-4">
                    {uniqueSites.map((site) => (
                      <div key={site} className="flex items-center gap-1">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: SITE_COLORS[site] || SITE_COLORS["Unknown"] }}
                        />
                        <span className="text-muted-foreground">{site} ({siteStats[site]})</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Auto-refresh every 3 seconds
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants Table */}
          {filteredLocations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Participants</CardTitle>
                <CardDescription>Click on a row to center the map on that participant&apos;s real GPS location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Team</th>
                        <th className="text-left p-2 font-medium">Site</th>
                        <th className="text-left p-2 font-medium">GPS Coordinates</th>
                        <th className="text-left p-2 font-medium">Last Update</th>
                        <th className="text-left p-2 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLocations.map((loc) => (
                        <tr 
                          key={loc.id} 
                          className="border-b hover:bg-muted/50 cursor-pointer"
                          onClick={() => centerOnUser(loc)}
                        >
                          <td className="p-2 font-medium">{loc.participantName}</td>
                          <td className="p-2 text-muted-foreground">{loc.teamName || "-"}</td>
                          <td className="p-2">
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: SITE_COLORS[loc.siteName] || SITE_COLORS["Unknown"],
                                color: SITE_COLORS[loc.siteName] || SITE_COLORS["Unknown"]
                              }}
                            >
                              {loc.siteName}
                            </Badge>
                          </td>
                          <td className="p-2 font-mono text-xs text-muted-foreground">
                            {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {new Date(loc.updatedAt).toLocaleTimeString()}
                          </td>
                          <td className="p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                centerOnUser(loc)
                              }}
                            >
                              <Locate className="h-4 w-4 mr-1" />
                              Focus
                            </Button>
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