"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Activity, 
  Globe, 
  Monitor, 
  Calendar,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"

interface EnrichedLog {
  id: string
  timestamp: string
  activity: string
  user: string
  email: string
  data: {
    IPAddress: string
    userAgent: string
    device: string
    os: string
    browser: string
    city: string
    region: string
    country: string
  }
}

interface LogsData {
  logs: EnrichedLog[]
  stats: Record<string, number>
}

const LogsPage = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<LogsData>({ logs: [], stats: {} })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    email: "",
    ipAddress: "",
    deviceType: "",
    country: "",
  })

  useEffect(() => {
    if (!session || (session.user.role as string) !== "ADMIN") {
      router.push("/")
      return
    }
    fetchLogs()
  }, [session, router])

  const fetchLogs = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value)
        }
      })
      
      const response = await fetch(`/api/logs?${queryParams.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
        setCurrentPage(1) // Reset to first page when fetching new data
      } else {
        setError("Failed to fetch login logs")
      }
    } catch (error) {
      setError("An error occurred while fetching login logs")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      email: "",
      ipAddress: "",
      deviceType: "",
      country: "",
    })
  }

  const toggleRowExpansion = (logId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
  }

  // Pagination calculations
  const totalItems = logs.logs.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentLogs = logs.logs.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setExpandedRows(new Set()) // Clear expanded rows when changing pages
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1) // Reset to first page
    setExpandedRows(new Set())
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
            <p className="text-muted-foreground mt-1">Track user login sessions & activity</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.logs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All login attempts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{logs.stats.SUCCESS || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Successful logins</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
              <Globe className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {new Set(logs.logs.map(log => log.data.IPAddress)).size}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Different IP addresses</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter logs by date, email, IP, device, or location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={filters.email}
                  onChange={(e) => handleFilterChange("email", e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ipAddress">IP Address</Label>
                <Input
                  id="ipAddress"
                  type="text"
                  value={filters.ipAddress}
                  onChange={(e) => handleFilterChange("ipAddress", e.target.value)}
                  placeholder="192.168.1.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deviceType">Device Type</Label>
                <Input
                  id="deviceType"
                  type="text"
                  value={filters.deviceType}
                  onChange={(e) => handleFilterChange("deviceType", e.target.value)}
                  placeholder="Mobile, Desktop..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  type="text"
                  value={filters.country}
                  onChange={(e) => handleFilterChange("country", e.target.value)}
                  placeholder="India, USA..."
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Button onClick={fetchLogs}>
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity ({logs.logs.length})</CardTitle>
                <CardDescription>View and analyze login activity logs</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="itemsPerPage" className="text-sm">Rows per page:</Label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {logs.logs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No login logs found matching your criteria.</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead className="w-[120px]">Activity</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentLogs.map((log) => (
                        <>
                          <TableRow key={log.id} className="cursor-pointer" onClick={() => toggleRowExpansion(log.id)}>
                            <TableCell className="font-mono text-xs">
                              {formatDate(log.timestamp)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={log.activity === 'Logged In' ? 'default' : 'destructive'}>
                                {log.activity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{log.user}</div>
                              <div className="text-xs text-muted-foreground">{log.email}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Monitor className="h-4 w-4 text-muted-foreground" />
                                <span>{log.data.device}</span>
                                <span className="text-muted-foreground">•</span>
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span>{log.data.country}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {expandedRows.has(log.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </TableCell>
                          </TableRow>
                          {expandedRows.has(log.id) && (
                            <TableRow>
                              <TableCell colSpan={5} className="bg-muted/50">
                                <div className="p-4 space-y-3">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <span className="text-sm font-medium">IP Address:</span>
                                      <code className="ml-2 text-sm bg-background px-2 py-1 rounded font-mono">
                                        {log.data.IPAddress}
                                      </code>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium">Location:</span>
                                      <span className="ml-2 text-sm">
                                        {log.data.city}, {log.data.region}, {log.data.country}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium">Device:</span>
                                      <span className="ml-2 text-sm">{log.data.device}</span>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium">OS:</span>
                                      <span className="ml-2 text-sm">{log.data.os}</span>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium">Browser:</span>
                                      <span className="ml-2 text-sm">{log.data.browser}</span>
                                    </div>
                                  </div>
                                  <div className="pt-2 border-t">
                                    <span className="text-sm font-medium">User Agent:</span>
                                    <code className="block mt-1 text-xs bg-background p-2 rounded font-mono overflow-x-auto">
                                      {log.data.userAgent}
                                    </code>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNumber}
                              variant={currentPage === pageNumber ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNumber)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LogsPage