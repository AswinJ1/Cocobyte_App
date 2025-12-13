"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  MapPin, 
  Users, 
  Loader2, 
  Navigation, 
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import Leaflet components (no SSR)
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
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
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
  "Amritapuri": { lat: 9.0942, lng: 76.4961, zoom: 16 },
  "Mysuru": { lat: 12.2958, lng: 76.6394, zoom: 16 },
  "Coimbatore": { lat: 10.9027, lng: 76.9006, zoom: 16 },
  "Bangalore": { lat: 12.9716, lng: 77.5946, zoom: 16 }
}

export default function LiveLocationMap() {
  const { data: session } = useSession()
  const [locations, setLocations] = useState<UserLocation[]>([])
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [userSite, setUserSite] = useState<string>("Amritapuri")
  const [isAdmin, setIsAdmin] = useState(false)
  const [canShare, setCanShare] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  const watchIdRef = useRef<number | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load Leaflet CSS and fix icons
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Add Leaflet CSS
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)

      // Fix marker icons
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
        document.head.removeChild(link)
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
        setUserSite(data.userSite || "Amritapuri")
        setIsAdmin(data.isAdmin)
        setCanShare(data.canShare)
        setLastUpdate(new Date())
      }
    } catch (err) {
      console.error("Failed to fetch locations:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Poll for updates every 3 seconds
  useEffect(() => {
    fetchLocations()

    pollIntervalRef.current = setInterval(() => {
      fetchLocations()
    }, 3000) // Poll every 3 seconds

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [fetchLocations])

  // Update location to server
  const updateServerLocation = useCallback(async (lat: number, lng: number) => {
    try {
      await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      })
    } catch (err) {
      console.error("Failed to update location:", err)
    }
  }, [])

  // Start sharing location
  const startSharing = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    setIsSharing(true)
    setError(null)

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setMyLocation({ lat: latitude, lng: longitude })
        updateServerLocation(latitude, longitude)
      },
      (err) => {
        console.error("Geolocation error:", err)
        setError("Failed to get location. Please enable location services.")
        setIsSharing(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )

    // Update every 5 seconds
    updateIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setMyLocation({ lat: latitude, lng: longitude })
          updateServerLocation(latitude, longitude)
        },
        () => {},
        { enableHighAccuracy: true }
      )
    }, 5000)
  }, [updateServerLocation])

  // Stop sharing location
  const stopSharing = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }

    setIsSharing(false)
    setMyLocation(null)

    try {
      await fetch("/api/location", { method: "DELETE" })
    } catch (err) {
      console.error("Failed to stop sharing:", err)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const siteCenter = SITE_CENTERS[userSite] || SITE_CENTERS["Amritapuri"]

  if (!leafletLoaded || isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
              <Navigation className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle>Live Location Map</CardTitle>
              <CardDescription>
                {isAdmin 
                  ? "Viewing all participants across all sites" 
                  : `Viewing participants at ${userSite}`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {locations.length} online
            </Badge>
            {isAdmin && (
              <Badge variant="secondary">Admin View</Badge>
            )}
            {lastUpdate && (
              <Badge variant="outline" className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                {lastUpdate.toLocaleTimeString()}
              </Badge>
            )}
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

        {/* Share Location Toggle */}
        {canShare ? (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className={`h-5 w-5 ${isSharing ? "text-green-500 animate-pulse" : "text-muted-foreground"}`} />
              <span className="text-sm font-medium">
                {isSharing ? "Sharing your location..." : "Share your location"}
              </span>
              {isSharing && myLocation && (
                <span className="text-xs text-muted-foreground">
                  ({myLocation.lat.toFixed(4)}, {myLocation.lng.toFixed(4)})
                </span>
              )}
            </div>
            <Button
              variant={isSharing ? "destructive" : "default"}
              size="sm"
              onClick={isSharing ? stopSharing : startSharing}
            >
              {isSharing ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Stop Sharing
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Start Sharing
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center p-3 bg-muted/50 rounded-lg">
            <Eye className="h-5 w-5 text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">
              {isAdmin ? "Admin view only - location sharing disabled" : "Loading..."}
            </span>
          </div>
        )}

        {/* Map Container */}
        <div className="h-[450px] rounded-lg overflow-hidden border">
          <MapContainer
            center={[myLocation?.lat || siteCenter.lat, myLocation?.lng || siteCenter.lng]}
            zoom={siteCenter.zoom}
            className="h-full w-full z-0"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* My location with pulsing circle */}
            {myLocation && (
              <>
                <Circle
                  center={[myLocation.lat, myLocation.lng]}
                  radius={15}
                  pathOptions={{ 
                    color: "#3b82f6", 
                    fillColor: "#3b82f6", 
                    fillOpacity: 0.4,
                    weight: 2
                  }}
                />
                <Marker position={[myLocation.lat, myLocation.lng]}>
                  <Popup>
                    <div className="text-center font-medium">
                      📍 You are here
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Other users' markers */}
            {locations.map((loc) => (
              <Marker
                key={loc.id}
                position={[loc.latitude, loc.longitude]}
              >
                <Popup>
                  <div className="text-center p-1 min-w-[120px]">
                    <p className="font-semibold text-sm">{loc.participantName}</p>
                    {loc.teamName && (
                      <p className="text-xs text-gray-500">{loc.teamName}</p>
                    )}
                    <p className="text-xs text-gray-500">{loc.siteName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(loc.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span>Your location</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span>Other participants</span>
            </div>
          </div>
          <span className="text-xs">Updates every 3 seconds</span>
        </div>
      </CardContent>
    </Card>
  )
}