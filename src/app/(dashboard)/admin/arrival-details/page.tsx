"use client"

import { useEffect, useState } from "react"
import DashboardHeader from "@/components/dashboard-header"

const SITES = ["All", "Bangalore", "Mysuru", "Amritapuri", "Coimbatore"]
const ITEMS_PER_PAGE = 10

interface ArrivalData {
  id: string
  name: string
  user?: {
    email: string
  }
  transportMode?: string
  arrivalFrom?: string
  arrivalTo?: string
  expectedArrivalTime?: string
  interestedInCarpool: boolean
}

interface DataState {
  data: ArrivalData[]
  summary: {
    total: number
    submitted: number
    interestedInCarpool: number
    byTransportMode: {
      FLIGHT: number
    }
  }
}

export default function ArrivalDetailsPage() {
  const [data, setData] = useState<DataState | null>(null)
  const [loading, setLoading] = useState(true)
  const [site, setSite] = useState("All")
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchData()
  }, [site])

  const fetchData = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (site !== "All") params.set("siteName", site)

      const res = await fetch(`/api/admin/arrival-details?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")

      const result = await res.json()

      setData({
        data: result.data ?? [],
        summary: result.summary ?? {
          total: 0,
          submitted: 0,
          interestedInCarpool: 0,
          byTransportMode: { FLIGHT: 0 },
        },
      })

      setPage(1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil((data?.data.length || 0) / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedData = data?.data.slice(startIndex, endIndex) || []

  const goToFirstPage = () => setPage(1)
  const goToLastPage = () => setPage(totalPages)
  const goToNextPage = () => setPage(prev => Math.min(prev + 1, totalPages))
  const goToPreviousPage = () => setPage(prev => Math.max(prev - 1, 1))

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getRoleVariant = (mode: string | undefined) => {
    switch (mode) {
      case "FLIGHT": return ""
      case "TRAIN": return ""
      case "BUS": return ""
      case "CAR": return ""
      default: return ""
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="space-y-4">
            <div className="h-24 sm:h-32 w-full bg-gray-200 dark:bg-gray-800  animate-pulse" />
            <div className="h-48 sm:h-64 w-full bg-gray-200 dark:bg-gray-800  animate-pulse" />
            <div className="h-64 sm:h-96 w-full bg-gray-200 dark:bg-gray-800  animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Arrival Details</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Monitor participant arrival information
            </p>
          </div>
          {/* <button
            onClick={fetchData}
            className="w-full sm:w-auto px-4 py-2 border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium"
          >
            Refresh
          </button> */}
        </div>

        {/* Main Content Card */}
        <div className="bg-card text-card-foreground  border border-border shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <h3 className="text-lg font-semibold">All Arrivals ({data?.data.length || 0})</h3>
                  <p className="text-sm text-muted-foreground">View and filter participant arrivals</p>
                </div>
              </div>

              {/* Site Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {SITES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSite(s)}
                    className={`px-3 py-1.5  text-sm font-medium transition-colors ${
                      site === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4 mt-4">
              {paginatedData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No participants found</p>
                </div>
              ) : (
                paginatedData.map((p) => (
                  <div key={p.id} className="border border-border  p-4 space-y-3 bg-card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{p.user?.email || "—"}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-block px-2 py-1  text-xs font-medium ${getRoleVariant(p.transportMode)}`}>
                        {p.transportMode || "—"}
                      </span>
                      {p.interestedInCarpool && (
                        <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                          Carpool
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div className="text-muted-foreground">
                        Route: {p.arrivalFrom && p.arrivalTo ? `${p.arrivalFrom} → ${p.arrivalTo}` : "—"}
                      </div>
                      <div className="text-muted-foreground">
                        Arrival: {formatDate(p.expectedArrivalTime)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block rounded-md border border-border overflow-hidden mt-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Transport</th>
                      <th className="px-4 py-3 text-left font-medium">Route</th>
                      <th className="px-4 py-3 text-left font-medium">Arrival Time</th>
                      <th className="px-4 py-3 text-left font-medium">Carpool</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No participants found
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="font-medium">{p.name}</div>
                            <div className="text-muted-foreground text-xs">
                              {p.user?.email || "—"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRoleVariant(p.transportMode)}`}>
                              {p.transportMode || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {p.arrivalFrom && p.arrivalTo
                              ? `${p.arrivalFrom} → ${p.arrivalTo}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {formatDate(p.expectedArrivalTime)}
                          </td>
                          <td className="px-4 py-3">
                            {p.interestedInCarpool ? (
                              <span className="inline-block px-2 py-1  text-xs font-medium">
                                Yes
                              </span>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-4 border-t border-border">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, data?.data.length || 0)}</span> of{' '}
                  <span className="font-medium">{data?.data.length || 0}</span> arrivals
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToFirstPage}
                    disabled={page === 1}
                    className="hidden sm:block px-3 py-1.5 border border-input bg-background rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground text-sm"
                  >
                    ««
                  </button>
                  <button
                    onClick={goToPreviousPage}
                    disabled={page === 1}
                    className="px-3 py-1.5 border border-input bg-background rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground text-sm"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-sm font-medium">{page}</span>
                    <span className="text-sm text-muted-foreground">/</span>
                    <span className="text-sm text-muted-foreground">{totalPages}</span>
                  </div>
                  <button
                    onClick={goToNextPage}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 border border-input bg-background rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground text-sm"
                  >
                    Next
                  </button>
                  <button
                    onClick={goToLastPage}
                    disabled={page === totalPages}
                    className="hidden sm:block px-3 py-1.5 border border-input bg-background rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground text-sm"
                  >
                    »»
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}