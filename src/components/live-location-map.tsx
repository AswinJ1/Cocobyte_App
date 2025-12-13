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
  RefreshCw,
  Locate
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
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 9.0942, lng: 76.4961 })
  const [mapZoom, setMapZoom] = useState(16)
  
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

      // Check existing permission state (without triggering prompt)
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          setLocationPermission(result.state as 'prompt' | 'granted' | 'denied')
          result.onchange = () => {
            setLocationPermission(result.state as 'prompt' | 'granted' | 'denied')
          }
        }).catch(() => {
          // Permissions API not supported
        })
      }

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

  // Poll for location updates
  useEffect(() => {
    fetchLocations()
    pollIntervalRef.current = setInterval(fetchLocations, 3000)
    
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [fetchLocations])

  // Update map center based on my location or other participants
  useEffect(() => {
    if (myLocation) {
      // Center on user's own location when sharing
      setMapCenter({ lat: myLocation.lat, lng: myLocation.lng })
      setMapZoom(17)
    } else if (locations.length > 0) {
      // Center on average of all participants
      const avgLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length
      const avgLng = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length
      setMapCenter({ lat: avgLat, lng: avgLng })
      setMapZoom(locations.length === 1 ? 16 : 14)
    } else {
      // Fallback to site center
      const siteCenter = SITE_CENTERS[userSite] || SITE_CENTERS["Amritapuri"]
      setMapCenter({ lat: siteCenter.lat, lng: siteCenter.lng })
      setMapZoom(siteCenter.zoom)
    }
  }, [myLocation, locations, userSite])

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

  // Start sharing location - ONLY called on button click
  const startSharing = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setMyLocation({ lat: latitude, lng: longitude })
        updateServerLocation(latitude, longitude)
        setIsSharing(true)
        setLocationPermission('granted')

        // Start watching for updates
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords
            setMyLocation({ lat, lng })
            updateServerLocation(lat, lng)
          },
          (err) => {
            console.error("Watch position error:", err)
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        )

        // Update every 10 seconds
        updateIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude: lat, longitude: lng } = pos.coords
              setMyLocation({ lat, lng })
              updateServerLocation(lat, lng)
            },
            () => {},
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
          )
        }, 10000)
      },
      (err) => {
        console.error("Geolocation error:", err)
        setLocationPermission('denied')
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location permission denied. Please enable location access in your browser settings.")
            break
          case err.POSITION_UNAVAILABLE:
            setError("Location information unavailable. Please try again.")
            break
          case err.TIMEOUT:
            setError("Location request timed out. Please try again.")
            break
          default:
            setError("Failed to get your location. Please try again.")
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
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

  // Center map on my location
  const centerOnMe = useCallback(() => {
    if (myLocation) {
      setMapCenter({ lat: myLocation.lat, lng: myLocation.lng })
      setMapZoom(18)
    }
  }, [myLocation])

  // Center on a specific participant
  const centerOnUser = useCallback((loc: UserLocation) => {
    setMapCenter({ lat: loc.latitude, lng: loc.longitude })
    setMapZoom(18)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current)
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  if (!leafletLoaded || isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="flex items-center justify-center h-[400px]">
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
                {isAdmin ? "All sites" : `${userSite} participants`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {locations.length} online
            </Badge>
            {lastUpdate && (
              <Badge variant="secondary" className="text-xs">
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
              <div>
                <span className="text-sm font-medium">
                  {isSharing ? "Sharing your location" : "Share your location"}
                </span>
                {isSharing && myLocation && (
                  <p className="text-xs text-muted-foreground">
                    📍 {myLocation.lat.toFixed(4)}, {myLocation.lng.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSharing && myLocation && (
                <Button variant="outline" size="sm" onClick={centerOnMe}>
                  <Locate className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant={isSharing ? "destructive" : "default"}
                size="sm"
                onClick={isSharing ? stopSharing : startSharing}
              >
                {isSharing ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Stop
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center p-3 bg-muted/50 rounded-lg">
            <Eye className="h-5 w-5 text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">
              {isAdmin ? "Admin view - location sharing disabled" : "View only mode"}
            </span>
          </div>
        )}

        {/* Location Permission Warning */}
        {locationPermission === 'denied' && canShare && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Location access is blocked. Enable location in browser settings to share.
            </AlertDescription>
          </Alert>
        )}

        {/* Map Center Info */}
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <Locate className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              Center: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">Zoom: {mapZoom}</Badge>
        </div>

        {/* Map Container */}
        <div className="h-[400px] rounded-lg overflow-hidden border">
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
            {MapCenterUpdater && (
              <MapCenterUpdater center={[mapCenter.lat, mapCenter.lng]} zoom={mapZoom} />
            )}
            
            {/* My location with blue circle */}
            {myLocation && (
              <>
                <Circle
                  center={[myLocation.lat, myLocation.lng]}
                  radius={20}
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
                      <p>📍 You are here</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {myLocation.lat.toFixed(6)}, {myLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Other participants */}
            {locations.map((loc) => (
              <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
                <Popup>
                  <div className="text-center min-w-[140px]">
                    <p className="font-semibold text-sm">{loc.participantName}</p>
                    {loc.teamName && (
                      <p className="text-xs text-gray-500">{loc.teamName}</p>
                    )}
                    <p className="text-xs text-gray-500">{loc.siteName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      📍 {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
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

        {/* Participants List */}
        {locations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Nearby Participants</p>
            <div className="grid gap-2 max-h-[200px] overflow-y-auto">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => centerOnUser(loc)}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {loc.participantName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{loc.participantName}</p>
                      <p className="text-xs text-muted-foreground">
                        {loc.teamName || loc.siteName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(loc.updatedAt).toLocaleTimeString()}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Locate className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span>You</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span>Others</span>
            </div>
          </div>
          <span className="text-xs">Auto-updates every 3s</span>
        </div>
      </CardContent>
    </Card>
  )
}