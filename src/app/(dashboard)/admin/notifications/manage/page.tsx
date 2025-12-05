"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DashboardHeader from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Bell, 
  Trash2, 
  Edit, 
  Eye, 
  AlertCircle, 
  Users,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  MapPin
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  priority: string
  targetRole: string | null
  targetSite: string | null  // Add this line
  actionUrl: string | null
  createdAt: string
  userId: string | null
  isRead: boolean
  expiresAt: string | null
}

const SITES = ["Amritapuri", "Mysuru", "Coimbatore", "Bangalore"]

const ManageNotificationsPage = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editNotification, setEditNotification] = useState<Notification | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("ALL")
  const [filterPriority, setFilterPriority] = useState<string>("ALL")
  const [filterSite, setFilterSite] = useState<string>("ALL")

  const [editFormData, setEditFormData] = useState({
    title: "",
    message: "",
    type: "INFO",
    priority: "NORMAL",
    targetRole: "",
    targetSite: "",  // Add this line
    actionUrl: ""
  })

  useEffect(() => {
    if (!session || session.user.role !== "ADMIN") {
      router.push("/")
    } else {
      fetchNotifications()
    }
  }, [session, router])

  useEffect(() => {
    filterNotifications()
  }, [notifications, searchQuery, filterType, filterPriority, filterSite])  // Add filterSite

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/notifications/admin")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      } else {
        setError("Failed to fetch notifications")
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      setError("An error occurred while fetching notifications")
    } finally {
      setIsLoading(false)
    }
  }

  const filterNotifications = () => {
    let filtered = [...notifications]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (filterType !== "ALL") {
      filtered = filtered.filter(n => n.type === filterType)
    }

    // Priority filter
    if (filterPriority !== "ALL") {
      filtered = filtered.filter(n => n.priority === filterPriority)
    }

    // Site filter - Add this
    if (filterSite !== "ALL") {
      filtered = filtered.filter(n => n.targetSite === filterSite)
    }

    setFilteredNotifications(filtered)
  }

  const handleEdit = (notification: Notification) => {
    setEditNotification(notification)
    setEditFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      targetRole: notification.targetRole || "",
      targetSite: notification.targetSite || "",  // Add this line
      actionUrl: notification.actionUrl || ""
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateNotification = async () => {
    if (!editNotification) return

    try {
      const response = await fetch(`/api/notifications/admin?id=${editNotification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editFormData,
          targetRole: editFormData.targetRole === "ALL" || !editFormData.targetRole 
            ? null 
            : editFormData.targetRole,
          targetSite: editFormData.targetSite === "ALL" || !editFormData.targetSite
            ? null
            : editFormData.targetSite  // Add this
        })
      })

      if (response.ok) {
        setSuccess("Notification updated successfully")
        setIsEditDialogOpen(false)
        setEditNotification(null)
        fetchNotifications()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update notification")
      }
    } catch (error) {
      setError("An error occurred while updating")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setSuccess("Notification deleted successfully")
        fetchNotifications()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError("Failed to delete notification")
      }
    } catch (error) {
      setError("An error occurred while deleting")
    } finally {
      setDeleteId(null)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "WARNING":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "ERROR":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "CONTEST":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case "SYSTEM":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "ANNOUNCEMENT":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "HIGH":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "NORMAL":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "LOW":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="space-y-4">
            <Skeleton className="h-24 sm:h-32 w-full" />
            <Skeleton className="h-48 sm:h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manage Notifications</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Edit, delete, and manage all system notifications
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={fetchNotifications} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => router.push("/admin/notifications")} className="w-full sm:w-auto">
              <Bell className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800">
            <AlertDescription className="text-sm">{success}</AlertDescription>
          </Alert>
        )}

        {/* Statistics - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{notifications.length}</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Notifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Broadcast</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {notifications.filter(n => !n.userId).length}
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">Public</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">High Priority</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                {notifications.filter(n => n.priority === "HIGH" || n.priority === "URGENT").length}
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">Urgent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {notifications.filter(n => !n.expiresAt || new Date(n.expiresAt) > new Date()).length}
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">Live</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters - Responsive */}
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filterType" className="text-sm">Filter by Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                    <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                    <SelectItem value="CONTEST">Contest</SelectItem>
                    <SelectItem value="SYSTEM">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filterPriority" className="text-sm">Filter by Priority</Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Priorities</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filterSite" className="text-sm flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Filter by Site
                </Label>
                <Select value={filterSite} onValueChange={setFilterSite}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Sites</SelectItem>
                    {SITES.map((site) => (
                      <SelectItem key={site} value={site}>{site}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Table/Cards - Responsive */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">All Notifications ({filteredNotifications.length})</CardTitle>
            <CardDescription className="text-sm">Manage and edit your notifications</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 px-4 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-base sm:text-lg font-medium">No notifications found</p>
                <p className="text-sm">Try adjusting your filters or create a new notification</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block lg:hidden space-y-4 p-4">
                  {filteredNotifications.map((notification) => (
                    <Card key={notification.id} className="overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{notification.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {notification.actionUrl && (
                                <DropdownMenuItem onClick={() => router.push(notification.actionUrl!)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Destination
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleEdit(notification)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteId(notification.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getTypeColor(notification.type))}
                          >
                            {notification.type}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getPriorityColor(notification.priority))}
                          >
                            {notification.priority}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {notification.userId 
                              ? "Personal" 
                              : notification.targetRole || "All"}
                          </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {formatDateShort(notification.createdAt)}
                        </div>

                        {/* Site badge - Mobile */}
                        {notification.targetSite && (
                          <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/20">
                            <MapPin className="h-3 w-3 mr-1" />
                            {notification.targetSite}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <div className="overflow-x-auto"> {/* ADD THIS WRAPPER */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[150px]">Title</TableHead>
                            <TableHead className="w-[250px]">Message</TableHead>
                            <TableHead className="w-[120px]">Type</TableHead>
                            <TableHead className="w-[100px]">Priority</TableHead>
                            <TableHead className="w-[120px]">Target</TableHead>
                            <TableHead className="w-[120px]">Site</TableHead>
                            <TableHead className="w-[180px]">Date</TableHead>
                            <TableHead className="w-[140px] text-right sticky right-0 bg-background">Actions</TableHead> {/* MAKE IT STICKY */}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredNotifications.map((notification) => (
                            <TableRow key={notification.id}>
                              <TableCell className="font-medium w-[150px]">
                                <div className="truncate">{notification.title}</div>
                              </TableCell>
                              <TableCell className="w-[250px]">
                                <div className="truncate text-sm text-muted-foreground">
                                  {notification.message}
                                </div>
                              </TableCell>
                              <TableCell className="w-[120px]">
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", getTypeColor(notification.type))}
                                >
                                  {notification.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="w-[100px]">
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", getPriorityColor(notification.priority))}
                                >
                                  {notification.priority}
                                </Badge>
                              </TableCell>
                              <TableCell className="w-[120px]">
                                <Badge variant="secondary" className="text-xs">
                                  {notification.userId 
                                    ? "Personal" 
                                    : notification.targetRole || "All"}
                                </Badge>
                              </TableCell>
                              <TableCell className="w-[120px]">
                                {notification.targetSite ? (
                                  <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/20">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {notification.targetSite}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">All Sites</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap w-[180px]">
                                {formatDate(notification.createdAt)}
                              </TableCell>
                              <TableCell className="w-[140px] text-right sticky right-0 bg-background"> {/* MAKE IT STICKY */}
                                <div className="flex items-center justify-end gap-1">
                                  {notification.actionUrl && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => router.push(notification.actionUrl!)}
                                      title="View destination"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEdit(notification)}
                                    title="Edit notification"
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setDeleteId(notification.id)}
                                    title="Delete notification"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div> {/* CLOSE WRAPPER */}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog - Responsive */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Notification</DialogTitle>
            <DialogDescription className="text-sm">
              Update the notification details below
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-sm">Title *</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Notification title"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-message" className="text-sm">Message *</Label>
              <Textarea
                id="edit-message"
                value={editFormData.message}
                onChange={(e) => setEditFormData({ ...editFormData, message: e.target.value })}
                placeholder="Notification message"
                rows={4}
                className="text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type" className="text-sm">Type</Label>
                <Select
                  value={editFormData.type}
                  onValueChange={(value) => setEditFormData({ ...editFormData, type: value })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                    <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                    <SelectItem value="CONTEST">Contest</SelectItem>
                    <SelectItem value="SYSTEM">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-priority" className="text-sm">Priority</Label>
                <Select
                  value={editFormData.priority}
                  onValueChange={(value) => setEditFormData({ ...editFormData, priority: value })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-targetRole" className="text-sm">Target Role</Label>
                <Select
                  value={editFormData.targetRole || "ALL"}
                  onValueChange={(value) => setEditFormData({ 
                    ...editFormData, 
                    targetRole: value === "ALL" ? "" : value 
                  })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Users</SelectItem>
                    <SelectItem value="ADMIN">Admins Only</SelectItem>
                    <SelectItem value="PARTICIPANT">Participants Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-targetSite" className="text-sm flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Target Site
                </Label>
                <Select
                  value={editFormData.targetSite || "ALL"}
                  onValueChange={(value) => setEditFormData({ 
                    ...editFormData, 
                    targetSite: value === "ALL" ? "" : value 
                  })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="All sites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Sites</SelectItem>
                    {SITES.map((site) => (
                      <SelectItem key={site} value={site}>{site}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-actionUrl" className="text-sm">Action URL (Optional)</Label>
              <Input
                id="edit-actionUrl"
                value={editFormData.actionUrl}
                onChange={(e) => setEditFormData({ ...editFormData, actionUrl: e.target.value })}
                placeholder="/participant/contest_info"
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateNotification}
              className="w-full sm:w-auto"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Responsive */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This action cannot be undone. This will permanently delete the notification
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto m-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ManageNotificationsPage