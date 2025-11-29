"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading login logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
              <p className="text-gray-600 mt-1">Track user login sessions & activity</p>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Logins</h3>
            <p className="text-2xl font-bold text-gray-900">{logs.logs.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Successful</h3>
            <p className="text-2xl font-bold text-green-600">{logs.stats.SUCCESS || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Unique IPs</h3>
            <p className="text-2xl font-bold text-blue-600">
              {new Set(logs.logs.map(log => log.data.IPAddress)).size}
            </p>
          </div>
        </div>

        {/* Filters - SAME AS BEFORE */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={filters.email}
                onChange={(e) => handleFilterChange("email", e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
              <input
                type="text"
                value={filters.ipAddress}
                onChange={(e) => handleFilterChange("ipAddress", e.target.value)}
                placeholder="192.168.1.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
              <input
                type="text"
                value={filters.deviceType}
                onChange={(e) => handleFilterChange("deviceType", e.target.value)}
                placeholder="Mobile, Desktop..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={filters.country}
                onChange={(e) => handleFilterChange("country", e.target.value)}
                placeholder="India, USA..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              onClick={fetchLogs}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* NEW PERFECT TABLE FORMAT */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Activity ({logs.logs.length})
            </h3>
          </div>
          
          {logs.logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No login logs found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Activity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.activity === 'Logged In' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.activity}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.user}</div>
                        <div className="text-xs text-gray-500">{log.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">IP:</span>
                            <code className="text-sm bg-white px-2 py-1 rounded font-mono">
                              {log.data.IPAddress}
                            </code>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Device:</span> 
                            <span className="ml-1">{log.data.device} • {log.data.os} • {log.data.browser}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            <span>Location:</span> {log.data.city}, {log.data.country}
                          </div>
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-blue-600 hover:underline">User Agent</summary>
                            <code className="bg-white p-2 rounded text-xs block mt-1 font-mono border">
                              {log.data.userAgent}
                            </code>
                          </details>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LogsPage
