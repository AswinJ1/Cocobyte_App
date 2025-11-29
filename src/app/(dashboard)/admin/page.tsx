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
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Users, 
  UserPlus, 
  FileText, 
  TrendingUp,
  Activity 
} from "lucide-react"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

interface Stats {
  totalUsers: number
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
}

interface User {
  role: string
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
  const [users, setUsers] = useState<User[]>([])
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

      const usersData = await usersRes.json()
      const logs = await logsRes.json()

      const statusStats = logs.stats?.status || logs.stats || {}
      const requestsArray = logs.requests || logs || []

      setUsers(Array.isArray(usersData) ? usersData : [])
      setStats({
        totalUsers: Array.isArray(usersData) ? usersData.length : 0,
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

  // Calculate user role distribution
  const userRoleData = {
    labels: ['Admin', 'Participant'],
    datasets: [
      {
        label: 'Users by Role',
        data: [
          users.filter(u => u.role === 'ADMIN').length,
          users.filter(u => u.role === 'PARTICIPANT').length,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  // Request status data
  const requestStatusData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        label: 'Requests by Status',
        data: [
          stats.pendingRequests,
          stats.approvedRequests,
          stats.rejectedRequests,
        ],
        backgroundColor: [
          'rgba(251, 191, 36, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(251, 191, 36, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  // Bar chart for comparison
  const comparisonData = {
    labels: ['Total Users'],
    datasets: [
      {
        label: 'Statistics Overview',
        data: [
          stats.totalUsers,
          stats.totalRequests,
          stats.pendingRequests,
          stats.approvedRequests,
          stats.rejectedRequests,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
      },
    },
  }

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, {session?.user?.email}
            </p>
          </div>
          <Button variant="destructive" size="default" onClick={() => signOut()}>
            Logout
          </Button>
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

        {/* Stats Cards */}
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
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">All registered users</p>
                </CardContent>
              </Card>

             
            </>
          )}
        </div>

        {/* Charts Section */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Distribution Pie Chart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Users by Role</CardTitle>
                <CardDescription>Distribution of admin and participant users</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-full max-w-[300px]">
                  <Pie data={userRoleData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Request Status Pie Chart */}
           

            {/* Bar Chart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Statistics Overview</CardTitle>
                <CardDescription>Comparison of all metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <Bar data={comparisonData} options={barChartOptions} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/users">
            <Card className="hover:bg-muted/50 hover:shadow-lg transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Manage Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create, view, and delete users
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/logs">
            <Card className="hover:bg-muted/50 hover:shadow-lg transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  View Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  View stayback requests and filter by date
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/create-user">
            <Card className="hover:bg-muted/50 hover:shadow-lg transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-green-600" />
                  Create User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Add new participant users
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}