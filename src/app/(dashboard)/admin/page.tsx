// app/(dashboard)/admin/page.tsx

"use client"

import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface Stats {
  totalUsers: number
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const [usersRes, logsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/logs"),
      ])

      if (!usersRes.ok) throw new Error(`Users API failed: ${usersRes.status}`)
      if (!logsRes.ok) throw new Error(`Logs API failed: ${logsRes.status}`)

      const users = await usersRes.json()
      const logs = await logsRes.json()

      const statusStats = logs.stats?.status || logs.stats || {}
      const requestsArray = logs.requests || logs || []

      setStats({
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalRequests: Array.isArray(requestsArray)
          ? requestsArray.length
          : logs.total || 0,
        pendingRequests: statusStats.PENDING || 0,
        approvedRequests: statusStats.APPROVED || 0,
        rejectedRequests: statusStats.REJECTED || 0,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {session?.user?.email}
            </span>
            <Button variant="destructive" size="sm" onClick={() => signOut()}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              {error}
              <Button size="sm" variant="secondary" onClick={fetchStats}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {loading ? (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalRequests}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-600">
                    {stats.pendingRequests}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Approved</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.approvedRequests}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rejected</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.rejectedRequests}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Action Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/users">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle>Manage Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create, view, and delete users
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/logs">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle>View Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  View stayback requests and filter by date
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/create-user">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle>Create User</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Add new participant or hostel users
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
