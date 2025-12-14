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
  WifiOff,
  Monitor,
  Route,
  X,
  ArrowRight,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  RotateCcw
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
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
)

// Component to update map center dynamically - ONLY when triggered
const MapCenterUpdater = dynamic(
  () => import("react-leaflet").then((mod) => {
    const { useMap } = mod
    // Import useRef and useEffect from React for this component
    const React = require('react')
    
    return function MapCenterUpdaterInner({ center, zoom, shouldUpdate }: { center: [number, number]; zoom: number; shouldUpdate: boolean }) {
      const map = useMap()
      const hasUpdatedRef = React.useRef(false)
      
      React.useEffect(() => {
        // Only update when shouldUpdate becomes true
        if (shouldUpdate && !hasUpdatedRef.current) {
          map.setView(center, zoom)
          hasUpdatedRef.current = true
        } else if (!shouldUpdate) {
          hasUpdatedRef.current = false
        }
      }, [map, center, zoom, shouldUpdate])
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

interface RouteStep {
  instruction: string
  distance: number
  duration: number
  maneuver: string
}

interface RouteInfo {
  coordinates: [number, number][]
  distance: number // in meters
  duration: number // in seconds
  steps: RouteStep[]
}

// Only used as fallback when NO location data is available
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629, zoom: 5 } // Center of India

// Detect if user is on mobile device
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Get maneuver icon
const getManeuverIcon = (maneuver: string) => {
  if (maneuver.includes('turn-right') || maneuver.includes('right')) {
    return <CornerUpRight className="h-4 w-4 text-blue-600" />
  } else if (maneuver.includes('turn-left') || maneuver.includes('left')) {
    return <CornerUpLeft className="h-4 w-4 text-blue-600" />
  } else if (maneuver.includes('straight') || maneuver.includes('continue')) {
    return <ArrowUp className="h-4 w-4 text-blue-600" />
  } else if (maneuver.includes('uturn') || maneuver.includes('u-turn')) {
    return <RotateCcw className="h-4 w-4 text-blue-600" />
  } else if (maneuver.includes('arrive') || maneuver.includes('destination')) {
    return <MapPin className="h-4 w-4 text-green-600" />
  } else {
    return <ArrowRight className="h-4 w-4 text-blue-600" />
  }
}

// Format distance
const formatDistance = (meters: number) => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

// Format duration
const formatDuration = (seconds: number) => {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)} min`
  } else {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.round((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }
}

export default function LiveLocationMap() {
  const { data: session } = useSession()
  const [locations, setLocations] = useState<UserLocation[]>([])
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null)
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
  const [isMobile, setIsMobile] = useState(true)
  const [lowAccuracyWarning, setLowAccuracyWarning] = useState(false)
  const [shouldRecenter, setShouldRecenter] = useState(false) // Control recentering
  const [shouldUpdateMap, setShouldUpdateMap] = useState(false) // Add this state
  
  // Routing state
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null)
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [showDirections, setShowDirections] = useState(false)
  
  const watchIdRef = useRef<number | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentUserIdRef = useRef<string | null>(null)
  const routeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load Leaflet CSS and fix icons
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(isMobileDevice())
      
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

  // Store current user ID
  useEffect(() => {
    if (session?.user?.id) {
      currentUserIdRef.current = session.user.id
    }
  }, [session])

  // Fetch route from OSRM
  const fetchRoute = useCallback(async (
    fromLat: number, 
    fromLng: number, 
    toLat: number, 
    toLng: number
  ): Promise<RouteInfo | null> => {
    try {
      // OSRM expects coordinates as lng,lat
      const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`
      
      const response = await fetch(url)
      if (!response.ok) return null
      
      const data = await response.json()
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) return null
      
      const route = data.routes[0]
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] // Convert to [lat, lng] for Leaflet
      )
      
      // Extract steps with instructions
      const steps: RouteStep[] = []
      if (route.legs && route.legs[0] && route.legs[0].steps) {
        route.legs[0].steps.forEach((step: any) => {
          if (step.maneuver && step.maneuver.instruction) {
            steps.push({
              instruction: step.maneuver.instruction,
              distance: step.distance,
              duration: step.duration,
              maneuver: step.maneuver.type + (step.maneuver.modifier ? `-${step.maneuver.modifier}` : '')
            })
          }
        })
      }
      
      return {
        coordinates,
        distance: route.distance,
        duration: route.duration,
        steps
      }
    } catch (err) {
      console.error("Failed to fetch route:", err)
      return null
    }
  }, [])

  // Start navigation to a user
  const startNavigation = useCallback(async (targetUser: UserLocation) => {
    if (!myLocation) {
      setError("Please start sharing your location first to navigate")
      return
    }
    
    setSelectedUser(targetUser)
    setIsLoadingRoute(true)
    setShowDirections(true)
    
    const route = await fetchRoute(
      myLocation.lat, 
      myLocation.lng, 
      targetUser.latitude, 
      targetUser.longitude
    )
    
    setRouteInfo(route)
    setIsLoadingRoute(false)
    
    if (route) {
      // Fit map to show the entire route
      const allLats = route.coordinates.map(c => c[0])
      const allLngs = route.coordinates.map(c => c[1])
      const centerLat = (Math.max(...allLats) + Math.min(...allLats)) / 2
      const centerLng = (Math.max(...allLngs) + Math.min(...allLngs)) / 2
      setMapCenter({ lat: centerLat, lng: centerLng })
      
      const latSpread = Math.max(...allLats) - Math.min(...allLats)
      const lngSpread = Math.max(...allLngs) - Math.min(...allLngs)
      const maxSpread = Math.max(latSpread, lngSpread)
      
      if (maxSpread > 0.1) setMapZoom(12)
      else if (maxSpread > 0.01) setMapZoom(14)
      else if (maxSpread > 0.001) setMapZoom(16)
      else setMapZoom(17)
      
      // Trigger map update
      setShouldUpdateMap(true)
      setTimeout(() => setShouldUpdateMap(false), 100)
    }
  }, [myLocation, fetchRoute])

  // Stop navigation
  const stopNavigation = useCallback(() => {
    setSelectedUser(null)
    setRouteInfo(null)
    setShowDirections(false)
    if (routeUpdateIntervalRef.current) {
      clearInterval(routeUpdateIntervalRef.current)
      routeUpdateIntervalRef.current = null
    }
  }, [])

  // Update route when my location changes (if navigating)
  useEffect(() => {
    if (!selectedUser || !myLocation || !isSharing) {
      return
    }
    
    // Initial route fetch when navigation starts
    const updateRoute = async () => {
      const updatedTarget = locations.find(l => l.id === selectedUser.id)
      if (updatedTarget) {
        const route = await fetchRoute(
          myLocation.lat,
          myLocation.lng,
          updatedTarget.latitude,
          updatedTarget.longitude
        )
        if (route) {
          setRouteInfo(route)
          setSelectedUser(updatedTarget)
        }
      }
    }
    
    // Update route every 10 seconds while navigating
    routeUpdateIntervalRef.current = setInterval(updateRoute, 10000)
    
    return () => {
      if (routeUpdateIntervalRef.current) {
        clearInterval(routeUpdateIntervalRef.current)
        routeUpdateIntervalRef.current = null
      }
    }
  }, [selectedUser?.id, myLocation?.lat, myLocation?.lng, isSharing, locations, fetchRoute])

  // Fetch locations from server
  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch("/api/location")
      if (response.ok) {
        const data = await response.json()
        const locs = data.locations || []
        
        // Filter out current user from locations (they see themselves as blue marker)
        const filteredLocs = locs.filter((loc: UserLocation) => 
          loc.participantId !== currentUserIdRef.current
        )
        
        setLocations(filteredLocs)
        setUserSite(data.userSite || "Unknown")
        setIsAdmin(data.isAdmin || false)
        setCanShare(data.canShare !== false)
        setLastUpdate(new Date())
        
        // Auto-center on first load based on real GPS data
        if (isFirstLoad && filteredLocs.length > 0) {
          const avgLat = filteredLocs.reduce((sum: number, loc: UserLocation) => sum + loc.latitude, 0) / filteredLocs.length
          const avgLng = filteredLocs.reduce((sum: number, loc: UserLocation) => sum + loc.longitude, 0) / filteredLocs.length
          setMapCenter({ lat: avgLat, lng: avgLng })
          setMapZoom(filteredLocs.length === 1 ? 16 : 12)
          setIsFirstLoad(false)
          
          // Trigger map update for first load
          setShouldUpdateMap(true)
          setTimeout(() => setShouldUpdateMap(false), 100)
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

  // Update map center ONLY when shouldRecenter is true (walking mode) AND not navigating
  useEffect(() => {
    if (myLocation && shouldRecenter && !selectedUser) {
      setMapCenter({ lat: myLocation.lat, lng: myLocation.lng })
      setShouldUpdateMap(true)
      // Reset after short delay
      setTimeout(() => setShouldUpdateMap(false), 100)
    }
  }, [myLocation, shouldRecenter, selectedUser])

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
    onSuccess: (lat: number, lng: number, accuracy: number) => void,
    onFail: (msg: string) => void
  ) => {
    const strategies: PositionOptions[] = [
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 },
      { enableHighAccuracy: true, timeout: 45000, maximumAge: 30000 },
      { enableHighAccuracy: false, timeout: 60000, maximumAge: 60000 },
    ]

    const options = strategies[Math.min(attempt, strategies.length - 1)]
    console.log(`📍 Location attempt ${attempt + 1}:`, options)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        console.log(`✅ Got location (accuracy: ${accuracy?.toFixed(0)}m):`, latitude, longitude)
        
        if (accuracy && accuracy > 500) {
          console.warn(`⚠️ Low accuracy: ${accuracy}m - likely using IP-based location`)
          setLowAccuracyWarning(true)
        } else {
          setLowAccuracyWarning(false)
        }
        
        onSuccess(latitude, longitude, accuracy || 0)
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
    setLowAccuracyWarning(false)

    tryGetLocation(
      0,
      (latitude, longitude, accuracy) => {
        setMyLocation({ lat: latitude, lng: longitude, accuracy })
        updateServerLocation(latitude, longitude)
        setIsSharing(true)
        setIsGettingLocation(false)
        setLocationPermission('granted')
        setError(null)
        
        setMapCenter({ lat: latitude, lng: longitude })
        setMapZoom(17)
        
        // Trigger map update when starting to share
        setShouldUpdateMap(true)
        setTimeout(() => setShouldUpdateMap(false), 100)
        
        if (isMobile) {
          setShouldRecenter(true)
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords
            console.log(`📍 Watch update (accuracy: ${acc?.toFixed(0)}m):`, lat.toFixed(6), lng.toFixed(6))
            setMyLocation({ lat, lng, accuracy: acc })
            updateServerLocation(lat, lng)
            
            if (acc && acc > 500) {
              setLowAccuracyWarning(true)
            }
          },
          (err) => console.warn("Watch error:", err.code),
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
        )

        updateIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords
              setMyLocation({ lat, lng, accuracy: acc })
              updateServerLocation(lat, lng)
            },
            () => {},
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
          )
        }, 15000)
      },
      (errorMessage) => {
        setError(errorMessage)
        setIsGettingLocation(false)
      }
    )
  }, [tryGetLocation, updateServerLocation, isMobile])

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
    setShouldRecenter(false)
    setLowAccuracyWarning(false)
    stopNavigation()

    try {
      await fetch("/api/location", { method: "DELETE" })
    } catch (err) {
      console.error("Failed to stop sharing:", err)
    }
  }, [stopNavigation])

  // Center map on my location (manual focus)
  const centerOnMe = useCallback(() => {
    if (myLocation) {
      setMapCenter({ lat: myLocation.lat, lng: myLocation.lng })
      setMapZoom(18)
      setShouldUpdateMap(true)
      setTimeout(() => setShouldUpdateMap(false), 100)
    }
  }, [myLocation])

  // Toggle walking recenter mode
  const toggleRecenter = useCallback(() => {
    const newValue = !shouldRecenter
    setShouldRecenter(newValue)
    
    // When enabling, center immediately and trigger update
    if (newValue && myLocation) {
      setMapCenter({ lat: myLocation.lat, lng: myLocation.lng })
      setMapZoom(17)
      setShouldUpdateMap(true)
      setTimeout(() => setShouldUpdateMap(false), 100)
    }
  }, [shouldRecenter, myLocation])

  // Center on all participants (manual)
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
      
      setShouldUpdateMap(true)
      setTimeout(() => setShouldUpdateMap(false), 100)
    }
  }, [myLocation, locations])

  // Center on a specific participant (manual focus)
  const centerOnUser = useCallback((loc: UserLocation) => {
    setMapCenter({ lat: loc.latitude, lng: loc.longitude })
    setMapZoom(18)
    setShouldUpdateMap(true)
    setTimeout(() => setShouldUpdateMap(false), 100)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current)
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (routeUpdateIntervalRef.current) clearInterval(routeUpdateIntervalRef.current)
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

        {/* Low accuracy warning for desktop/laptop */}
        {lowAccuracyWarning && isSharing && (
          <Alert>
            <Monitor className="h-4 w-4" />
            <AlertDescription>
              <strong>Low accuracy detected.</strong> Desktop/laptop browsers often use IP-based location which can be inaccurate. 
              For precise location, please use a mobile device with GPS enabled.
              {myLocation?.accuracy && (
                <span className="text-xs ml-1">(Accuracy: ~{Math.round(myLocation.accuracy)}m)</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation Panel - Shows when navigating to someone */}
        {selectedUser && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Route className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Navigating to {selectedUser.participantName}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={stopNavigation}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {isLoadingRoute ? (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating route...
              </div>
            ) : routeInfo ? (
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    📏 {formatDistance(routeInfo.distance)}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    ⏱️ {formatDuration(routeInfo.duration)}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowDirections(!showDirections)}
                    className="text-xs"
                  >
                    {showDirections ? "Hide" : "Show"} Directions
                  </Button>
                </div>
                
                {/* Turn-by-turn directions */}
                {showDirections && routeInfo.steps.length > 0 && (
                  <div className="mt-2 max-h-[150px] overflow-y-auto space-y-1">
                    {routeInfo.steps.map((step, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-start gap-2 p-2 bg-white dark:bg-gray-800 rounded text-sm"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getManeuverIcon(step.maneuver)}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 dark:text-gray-200">{step.instruction}</p>
                          <p className="text-xs text-gray-500">
                            {formatDistance(step.distance)} • {formatDuration(step.duration)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-red-600">Could not calculate route. Try again.</p>
            )}
          </div>
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
                    {myLocation.accuracy && (
                      <span className="text-gray-500 ml-1">(±{Math.round(myLocation.accuracy)}m)</span>
                    )}
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
                <>
                  <Button 
                    variant={shouldRecenter ? "default" : "outline"} 
                    size="sm" 
                    onClick={toggleRecenter} 
                    title={shouldRecenter ? "Auto-follow ON" : "Auto-follow OFF"}
                    className="text-xs"
                  >
                    <Navigation className={`h-4 w-4 ${shouldRecenter ? "animate-pulse" : ""}`} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={centerOnMe} title="Center on me">
                    <Locate className="h-4 w-4" />
                  </Button>
                </>
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

        {/* Current location status */}
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
              <>
                <Badge className="text-xs bg-green-500 text-white">
                  <MapPin className="h-3 w-3 mr-1" />
                  LIVE
                </Badge>
                {shouldRecenter && (
                  <Badge variant="outline" className="text-xs">
                    <Navigation className="h-3 w-3 mr-1" />
                    Follow
                  </Badge>
                )}
              </>
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

            {/* Dynamic map center update - only when triggered */}
            {MapCenterUpdater && (
              <MapCenterUpdater 
                center={[mapCenter.lat, mapCenter.lng]} 
                zoom={mapZoom} 
                shouldUpdate={shouldUpdateMap}
              />
            )}
            
            {/* Route line */}
            {routeInfo && routeInfo.coordinates.length > 0 && (
              <Polyline
                positions={routeInfo.coordinates}
                pathOptions={{
                  color: "#3b82f6",
                  weight: 5,
                  opacity: 0.8,
                  dashArray: "10, 10"
                }}
              />
            )}
            
            {/* My location with blue circle */}
            {myLocation && (
              <>
                <Circle
                  center={[myLocation.lat, myLocation.lng]}
                  radius={myLocation.accuracy ? Math.min(myLocation.accuracy, 100) : 30}
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
                      {myLocation.accuracy && (
                        <p className="text-xs text-gray-400">
                          Accuracy: ±{Math.round(myLocation.accuracy)}m
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Other participants (already filtered, no duplicates) */}
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

        {/* Participants List with Navigate button */}
        {locations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Nearby Participants</p>
            <div className="grid gap-2 max-h-[200px] overflow-y-auto">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                    selectedUser?.id === loc.id 
                      ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300" 
                      : "bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <div 
                    className="flex items-center gap-2 cursor-pointer flex-1"
                    onClick={() => centerOnUser(loc)}
                  >
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <span className="text-xs font-medium text-red-600">
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
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground mr-1">
                      {new Date(loc.updatedAt).toLocaleTimeString()}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      onClick={() => centerOnUser(loc)}
                      title="Focus"
                    >
                      <Locate className="h-3 w-3" />
                    </Button>
                    {myLocation && (
                      <Button 
                        variant={selectedUser?.id === loc.id ? "default" : "outline"}
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => selectedUser?.id === loc.id ? stopNavigation() : startNavigation(loc)}
                        title={selectedUser?.id === loc.id ? "Stop navigation" : "Navigate to"}
                      >
                        <Route className="h-3 w-3" />
                      </Button>
                    )}
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
            <div className="flex items-center gap-1">
              <div className="h-3 w-1 bg-blue-500" style={{ borderRadius: 2 }} />
              <span>Route</span>
            </div>
          </div>
          <span className="text-xs">
            {!isMobile && "📱 Use mobile for better GPS • "}
            Auto-updates every 3s
          </span>
        </div>
      </CardContent>
    </Card>
  )
}