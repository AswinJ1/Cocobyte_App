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
  Activity,
  LogIn,
  Globe,
  Monitor,
  MapPin,
  UsersRound,
  Home,  // Add this import for hostel icon
  TrendingDown,
  LogInIcon,
  LogsIcon
} from "lucide-react"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement } from 'chart.js'
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2'
import { SearchBar } from "@/components/search-bar"
import DashboardHeader from "@/components/dashboard-header"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement)

interface Stats {
  totalUsers: number
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
}

interface User {
  role: string
  participant?: {
    siteName?: string
    teamName?: string
    hostelName?: string
  }
}

interface LoginLog {
  id: string
  timestamp: string
  activity: string
  data: {
    IPAddress: string
    device: string
    os: string
    browser: string
    country: string
  }
}

interface LoginStats {
  logs: LoginLog[]
  stats: {
    SUCCESS: number
    FAILED: number
  }
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
  const [loginStats, setLoginStats] = useState<LoginStats>({ 
    logs: [], 
    stats: { SUCCESS: 0, FAILED: 0 } 
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

      const [usersRes, logsRes, loginLogsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/logs"),
        fetch("/api/logs"),
      ])

      if (!usersRes.ok) throw new Error(`Users API failed: ${usersRes.status}`)
      if (!loginLogsRes.ok) throw new Error(`Login logs API failed: ${loginLogsRes.status}`)

      const usersData = await usersRes.json()
      const loginLogsData = await loginLogsRes.json()

      setUsers(Array.isArray(usersData) ? usersData : [])
      setLoginStats(loginLogsData)
      
      setStats({
        totalUsers: Array.isArray(usersData) ? usersData.length : 0,
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  // Get participants only
  const participants = users.filter(u => u.role === 'PARTICIPANT' && u.participant)

  // Site distribution data
  const siteDistribution = participants.reduce((acc: { [key: string]: number }, user) => {
    const site = user.participant?.siteName || 'Not Set'
    acc[site] = (acc[site] || 0) + 1
    return acc
  }, {})

  const siteData = {
    labels: Object.keys(siteDistribution),
    datasets: [
      {
        label: 'Participants by Site',
        data: Object.values(siteDistribution),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // Blue - Mysuru
          'rgba(34, 197, 94, 0.8)',    // Green - Amritapuri
          'rgba(251, 191, 36, 0.8)',   // Yellow - Coimbatore
          'rgba(168, 85, 247, 0.8)',   // Purple - Bangalore
          'rgba(156, 163, 175, 0.8)',  // Gray - Not Set
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  // Team distribution data - Top 10 teams for pie chart
  const teamDistribution = participants.reduce((acc: { [key: string]: number }, user) => {
    const team = user.participant?.teamName?.trim() || ''
    if (team && team !== '' && team !== 'No Team') {
      acc[team] = (acc[team] || 0) + 1
    }
    return acc
  }, {})

  // Sort teams by count and get top 10
  const sortedTeams = Object.entries(teamDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  const teamData = {
    labels: sortedTeams.map(([team]) => team),
    datasets: [
      {
        label: 'Team Members',
        data: sortedTeams.map(([, count]) => count),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',    // Red
          'rgba(34, 197, 94, 0.8)',    // Green
          'rgba(59, 130, 246, 0.8)',   // Blue
          'rgba(251, 191, 36, 0.8)',   // Yellow
          'rgba(168, 85, 247, 0.8)',   // Purple
          'rgba(236, 72, 153, 0.8)',   // Pink
          'rgba(14, 165, 233, 0.8)',   // Cyan
          'rgba(132, 204, 22, 0.8)',   // Lime
          'rgba(249, 115, 22, 0.8)',   // Orange
          'rgba(99, 102, 241, 0.8)',   // Indigo
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(14, 165, 233, 1)',
          'rgba(132, 204, 22, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(99, 102, 241, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  // Hostel distribution data
  const hostelDistribution = participants.reduce((acc: { [key: string]: number }, user) => {
    const hostel = user.participant?.hostelName || 'Not Set'
    acc[hostel] = (acc[hostel] || 0) + 1
    return acc
  }, {})

  const hostelData = {
    labels: Object.keys(hostelDistribution),
    datasets: [
      {
        label: 'Participants by Hostel',
        data: Object.values(hostelDistribution),
        backgroundColor: [
          'rgba(14, 165, 233, 0.8)',   // Cyan
          'rgba(239, 68, 68, 0.8)',    // Red
          'rgba(34, 197, 94, 0.8)',    // Green
          'rgba(251, 191, 36, 0.8)',   // Yellow
          'rgba(168, 85, 247, 0.8)',   // Purple
          'rgba(236, 72, 153, 0.8)',   // Pink
          'rgba(249, 115, 22, 0.8)',   // Orange
          'rgba(99, 102, 241, 0.8)',   // Indigo
        ],
        borderColor: [
          'rgba(14, 165, 233, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(99, 102, 241, 1)',
        ],
        borderWidth: 2,
      },
    ],
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

  // Login success/fail data
  const loginActivityData = {
    labels: ['Successful', 'Failed'],
    datasets: [
      {
        label: 'Login Activity',
        data: [
          loginStats.stats.SUCCESS || 0,
          loginStats.stats.FAILED || 0,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  // Device distribution
  const deviceData = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [
      {
        label: 'Device Usage',
        data: [
          loginStats.logs.filter(log => log.data.device.toLowerCase().includes('desktop')).length,
          loginStats.logs.filter(log => log.data.device.toLowerCase().includes('mobile')).length,
          loginStats.logs.filter(log => log.data.device.toLowerCase().includes('tablet')).length,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(251, 191, 36, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(251, 191, 36, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  // Browser distribution
  const browserData = {
    labels: [...new Set(loginStats.logs.map(log => log.data.browser))].slice(0, 5),
    datasets: [
      {
        label: 'Browser Usage',
        data: [...new Set(loginStats.logs.map(log => log.data.browser))]
          .slice(0, 5)
          .map(browser => loginStats.logs.filter(log => log.data.browser === browser).length),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  }

  // Top countries
  const countryData = {
    labels: [...new Set(loginStats.logs.map(log => log.data.country))]
      .filter(c => c !== 'Unknown')
      .slice(0, 5),
    datasets: [
      {
        label: 'Login Locations',
        data: [...new Set(loginStats.logs.map(log => log.data.country))]
          .filter(c => c !== 'Unknown')
          .slice(0, 5)
          .map(country => loginStats.logs.filter(log => log.data.country === country).length),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
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
            size: 11,
          },
          boxWidth: 12,
          boxHeight: 12,
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
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
  }

  const barChartOptions = {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader />

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

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
                  <LogIn className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{loginStats.logs.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">All login attempts</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Successful</CardTitle>
                  <LogsIcon className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{loginStats.stats.SUCCESS}</div>
                  <p className="text-xs text-muted-foreground mt-1">Successful logins</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{loginStats.stats.FAILED}</div>
                  <p className="text-xs text-muted-foreground mt-1">Failed attempts</p>
                </CardContent>
              </Card>
{/* 
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
                  <Globe className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">
                    {new Set(loginStats.logs.map(log => log.data.IPAddress)).size}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Different IP addresses</p>
                </CardContent>
              </Card> */}
            </>
          )}
        </div>

        {/* Charts Section */}
        {!loading && (
          <>
            {/* First Row - User, Login, & Device */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Users by Role
                  </CardTitle>
                  <CardDescription>Distribution of admin and participant users</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="w-full max-w-[300px]">
                    <Pie data={userRoleData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    Login Activity
                  </CardTitle>
                  <CardDescription>Successful vs failed login attempts</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="w-full max-w-[300px]">
                    <Pie data={loginActivityData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-purple-600" />
                    Device Usage
                  </CardTitle>
                  <CardDescription>Login by device type</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="w-full max-w-[300px]">
                    <Pie data={deviceData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Second Row - Site, Hostel & Team Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Participants by Site
                  </CardTitle>
                  <CardDescription>Distribution across different sites</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="w-full max-w-[300px]">
                    <Doughnut data={siteData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-cyan-600" />
                    Participants by Hostel
                  </CardTitle>
                  <CardDescription>Distribution across different hostels</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="w-full max-w-[300px]">
                    <Pie data={hostelData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UsersRound className="h-5 w-5 text-purple-600" />
                      Teams
                  </CardTitle>
                  <CardDescription>Teams with most members</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="w-full max-w-[300px]">
                    <Pie data={teamData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Third Row - Browser & Location */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Browser Distribution</CardTitle>
                  <CardDescription>Top 5 browsers used for login</CardDescription>
                </CardHeader>
                <CardContent>
                  <Bar data={browserData} options={barChartOptions} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Login Locations</CardTitle>
                  <CardDescription>Top 5 countries by login count</CardDescription>
                </CardHeader>
                <CardContent>
                  <Bar data={countryData} options={barChartOptions} />
                </CardContent>
              </Card>
            </div>

            {/* Site Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(siteDistribution).map(([site, count]) => (
                <Card key={site} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{site}</CardTitle>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{count}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {participants.length > 0 
                        ? `${((count / participants.length) * 100).toFixed(1)}% of participants`
                        : '0% of participants'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
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
                  View Login Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  View login activity and filter by date
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}