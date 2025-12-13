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
  Locate,
  WifiOff
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

// Only used as fallback when NO location data is available
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629, zoom: 5 } // Center of India

export default function LiveLocationMap() {
  const { data: session } = useSession()
  const [locations, setLocations] = useState<UserLocation[]>([])
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [userSite, setUserSite] = useState<string>("Unknown")
  const [isAdmin, setIsAdmin] = useState(false)
  const [canShare, setCanShare] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER)
  const [mapZoom, setMapZoom] = useState(DEFAULT_CENTER.zoom)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  
  const watchIdRef = useRef<number | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load Leaflet CSS and fix icons
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.id = "leaflet-css"
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

      // Check existing permission state
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          setLocationPermission(result.state as 'prompt' | 'granted' | 'denied')
          result.onchange = () => {
            setLocationPermission(result.state as 'prompt' | 'granted' | 'denied')
          }
        }).catch(() => {})
      }
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
        setUserSite(data.userSite || "Unknown")
        setIsAdmin(data.isAdmin || false)
        setCanShare(data.canShare !== false)
        setLastUpdate(new Date())
        
        // Auto-center on first load based on real GPS data
        if (isFirstLoad && locs.length > 0) {
          const avgLat = locs.reduce((sum: number, loc: UserLocation) => sum + loc.latitude, 0) / locs.length
          const avgLng = locs.reduce((sum: number, loc: UserLocation) => sum + loc.longitude, 0) / locs.length
          setMapCenter({ lat: avgLat, lng: avgLng })
          setMapZoom(locs.length === 1 ? 16 : 12)
          setIsFirstLoad(false)
        }
      }
    } catch (err) {
      console.error("Failed to fetch locations:", err)
    } finally {
      setIsLoading(false)
    }
  }, [isFirstLoad])

  // Poll for location updates
  useEffect(() => {
    fetchLocations()
    pollIntervalRef.current = setInterval(fetchLocations, 3000)
    
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [fetchLocations])

  // Update map center when my location changes (priority: my location > other users > default)
  useEffect(() => {
    if (myLocation) {
      // Priority 1: Center on my location when I'm sharing
      setMapCenter({ lat: myLocation.lat, lng: myLocation.lng })
      setMapZoom(17)
    }
    // Don't auto-recenter on others after first load (handled in fetchLocations)
  }, [myLocation])

  // Update location to server
  const updateServerLocation = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      })
      if (response.ok) {
        console.log("✅ Location updated:", lat.toFixed(6), lng.toFixed(6))
      }
    } catch (err) {
      console.error("Failed to update location:", err)
    }
  }, [])

  // Try to get location with multiple strategies
  const tryGetLocation = useCallback((
    attempt: number,
    onSuccess: (lat: number, lng: number) => void,
    onFail: (msg: string) => void
  ) => {
    const strategies: PositionOptions[] = [
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },      // GPS only, no cache
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 },      // GPS with longer timeout
      { enableHighAccuracy: true, timeout: 45000, maximumAge: 30000 },  // GPS with some cache
      { enableHighAccuracy: false, timeout: 60000, maximumAge: 60000 }, // Fallback only if GPS fails
    ]

    const options = strategies[Math.min(attempt, strategies.length - 1)]
    console.log(`📍 Location attempt ${attempt + 1}:`, options)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        console.log(`✅ Got location (accuracy: ${accuracy?.toFixed(0)}m):`, latitude, longitude)
        
        // Warn if accuracy is poor (> 100 meters)
        if (accuracy && accuracy > 100) {
          console.warn(`⚠️ Low accuracy: ${accuracy}m - location may be inaccurate`)
        }
        
        onSuccess(latitude, longitude)
      },
      (err) => {
        console.warn(`❌ Attempt ${attempt + 1} failed:`, err.code, err.message)
        
        if (attempt < strategies.length - 1) {
          setTimeout(() => tryGetLocation(attempt + 1, onSuccess, onFail), 1000)
        } else {
          let message = "Failed to get your location after multiple attempts."
          switch (err.code) {
            case 1:
              message = "Location permission denied. Please enable location access in your browser settings."
              setLocationPermission('denied')
              break
            case 2:
              message = "Location unavailable. Please ensure GPS/Location is enabled on your device and try outdoors."
              break
            case 3:
              message = "Location request timed out. Please move to an area with better GPS signal."
              break
          }
          onFail(message)
        }
      },
      options
    )
  }, [])

  // Start sharing location
  const startSharing = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    setError(null)
    setIsGettingLocation(true)

    tryGetLocation(
      0,
      (latitude, longitude) => {
        setMyLocation({ lat: latitude, lng: longitude })
        updateServerLocation(latitude, longitude)
        setIsSharing(true)
        setIsGettingLocation(false)
        setLocationPermission('granted')
        setError(null)

        // Start watching for updates - USE HIGH ACCURACY
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude: lat, longitude: lng, accuracy } = pos.coords
            console.log(`📍 Watch update (accuracy: ${accuracy?.toFixed(0)}m):`, lat.toFixed(6), lng.toFixed(6))
            setMyLocation({ lat, lng })
            updateServerLocation(lat, lng)
          },
          (err) => console.warn("Watch error:", err.code),
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }  // Changed to high accuracy
        )

        // Periodic update every 15 seconds - USE HIGH ACCURACY
        updateIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude: lat, longitude: lng } = pos.coords
              setMyLocation({ lat, lng })
              updateServerLocation(lat, lng)
            },
            () => {},
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }  // Changed to high accuracy
          )
        }, 15000)
      },
      (errorMessage) => {
        setError(errorMessage)
        setIsGettingLocation(false)
      }
    )
  }, [tryGetLocation, updateServerLocation])

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

  // Center on all participants
  const centerOnAll = useCallback(() => {
    const allLocs: { latitude: number; longitude: number }[] = myLocation 
      ? [...locations.map(l => ({ latitude: l.latitude, longitude: l.longitude })), { latitude: myLocation.lat, longitude: myLocation.lng }]
      : locations.map(l => ({ latitude: l.latitude, longitude: l.longitude }))
    
    if (allLocs.length > 0) {
      const avgLat = allLocs.reduce((sum, loc) => sum + loc.latitude, 0) / allLocs.length
      const avgLng = allLocs.reduce((sum, loc) => sum + loc.longitude, 0) / allLocs.length
      setMapCenter({ lat: avgLat, lng: avgLng })
      
      if (allLocs.length === 1) {
        setMapZoom(16)
      } else {
        const lats = allLocs.map(l => l.latitude)
        const lngs = allLocs.map(l => l.longitude)
        const spread = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs))
        
        if (spread > 1) setMapZoom(8)
        else if (spread > 0.1) setMapZoom(12)
        else if (spread > 0.01) setMapZoom(14)
        else setMapZoom(16)
      }
    }
  }, [myLocation, locations])

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
        {/* Error with retry */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="flex-1">{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={startSharing}
                disabled={isGettingLocation}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Share Location Toggle */}
        {canShare ? (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className={`h-5 w-5 ${isSharing ? "text-green-500 animate-pulse" : "text-muted-foreground"}`} />
              <div>
                <span className="text-sm font-medium">
                  {isGettingLocation 
                    ? "Getting your location..." 
                    : isSharing 
                      ? "Sharing your location" 
                      : "Share your location"}
                </span>
                {isSharing && myLocation && (
                  <p className="text-xs text-green-600 font-mono">
                    📍 {myLocation.lat.toFixed(6)}, {myLocation.lng.toFixed(6)}
                  </p>
                )}
                {isGettingLocation && (
                  <p className="text-xs text-muted-foreground">
                    Please wait, trying to get GPS...
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSharing && myLocation && (
                <Button variant="outline" size="sm" onClick={centerOnMe} title="Center on me">
                  <Locate className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant={isSharing ? "destructive" : "default"}
                size="sm"
                onClick={isSharing ? stopSharing : startSharing}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Wait...
                  </>
                ) : isSharing ? (
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

        {/* Permission denied warning */}
        {locationPermission === 'denied' && canShare && !error && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Location access is blocked. Please enable location in your browser settings, then refresh this page.
            </AlertDescription>
          </Alert>
        )}

        {/* Current location status - Shows REAL coordinates */}
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <Locate className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground font-mono">
              {myLocation 
                ? `Your GPS: ${myLocation.lat.toFixed(6)}, ${myLocation.lng.toFixed(6)}`
                : `Map center: ${mapCenter.lat.toFixed(6)}, ${mapCenter.lng.toFixed(6)}`
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isSharing && (
              <Badge className="text-xs bg-green-500 text-white">
                <MapPin className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2"
              onClick={centerOnAll}
              title="Center on all"
            >
              <Users className="h-3 w-3" />
            </Button>
            <Badge variant="outline" className="text-xs">Zoom: {mapZoom}</Badge>
          </div>
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
                  radius={30}
                  pathOptions={{ 
                    color: "#3b82f6", 
                    fillColor: "#3b82f6", 
                    fillOpacity: 0.3,
                    weight: 3
                  }}
                />
                <Marker position={[myLocation.lat, myLocation.lng]}>
                  <Popup>
                    <div className="text-center font-medium">
                      <p className="text-blue-600">📍 You are here</p>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
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
                    <p className="text-xs text-gray-400 mt-1 font-mono">
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
                      <p className="text-xs text-muted-foreground font-mono">
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
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

        {/* Empty state when no one online */}
        {locations.length === 0 && !myLocation && (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No participants sharing location</p>
            <p className="text-xs">Click &quot;Start&quot; to share yours!</p>
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