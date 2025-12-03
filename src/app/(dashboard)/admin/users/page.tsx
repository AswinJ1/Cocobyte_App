"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import UserForm from '@/components/forms/user-form'
import DashboardHeader from '@/components/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Users, 
  UserPlus, 
  Trash2, 
  RefreshCw, 
  Mail, 
  Calendar,
  MoreVertical,
  Edit,
  Eye,
  Upload,
  Loader2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  UsersRound,
  X
} from 'lucide-react'
import BulkUserImport from '@/components/bulk-user-import'
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

interface User {
  id: string
  email: string
  uid?: string
  role: string
  createdAt: string
  student?: {
    name: string
    clubName: string
    hostelName: string
    roomNo: string
    isTeamLead: boolean
  }
  participant?: {
    name: string
    college?: string
    avatarUrl?: string
    gender?: string
    siteName?: string
    teamName?: string
  }
  admin?: {
    name: string
    avatarUrl?: string
    gender?: string
  }
}

const UsersPage = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; role: string } | null>(null)
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [siteFilter, setSiteFilter] = useState<string>("all")
  const [teamFilter, setTeamFilter] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const siteLocations = ["Mysuru", "Amritapuri", "Coimbatore", "Bangalore"]

  useEffect(() => {
    if (!session || (session.user.role as string) !== "ADMIN") {
      router.push("/")
      return
    }
    fetchUsers()
  }, [session, router])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, siteFilter, teamFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, siteFilter, teamFilter])

  // Get unique team names from users
  const uniqueTeamNames = Array.from(
    new Set(
      users
        .filter(u => u.participant?.teamName && u.participant.teamName.trim() !== "")
        .map(u => u.participant!.teamName!)
    )
  ).sort()

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user => {
        const name = getUserDisplayName(user).toLowerCase()
        const email = user.email.toLowerCase()
        const uid = user.uid?.toLowerCase() || ""
        const college = user.participant?.college?.toLowerCase() || ""
        const siteName = user.participant?.siteName?.toLowerCase() || ""
        const teamName = user.participant?.teamName?.toLowerCase() || ""
        
        return name.includes(query) || 
               email.includes(query) || 
               uid.includes(query) || 
               college.includes(query) ||
               siteName.includes(query) ||
               teamName.includes(query)
      })
    }

    // Site filter
    if (siteFilter !== "all") {
      filtered = filtered.filter(user => {
        if (siteFilter === "not-set") {
          return !user.participant?.siteName || user.participant.siteName.trim() === ""
        }
        return user.participant?.siteName === siteFilter
      })
    }

    // Team filter
    if (teamFilter && teamFilter.trim() !== "") {
      filtered = filtered.filter(user => 
        user.participant?.teamName?.toLowerCase().includes(teamFilter.toLowerCase())
      )
    }

    setFilteredUsers(filtered)
  }

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/users")
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        setError("Failed to fetch users")
      }
    } catch (error) {
      setError("An error occurred while fetching users")
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSiteFilter("all")
    setTeamFilter("")
  }

  const hasActiveFilters = searchQuery !== "" || siteFilter !== "all" || teamFilter !== ""

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(totalPages)
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))

  const handleCreateUser = () => {
    setEditingUser(null)
    setShowForm(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleViewUser = (userId: string) => {
    router.push(`/admin/users/${userId}`)
  }

  const openDeleteDialog = (user: User) => {
    setUserToDelete({
      id: user.id,
      name: getUserDisplayName(user),
      role: user.role
    })
    setDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    if (userToDelete.role === "ADMIN") {
      setError("Cannot delete admin users")
      setDeleteDialogOpen(false)
      return
    }

    setDeleteLoading(userToDelete.id)
    
    try {
      const response = await fetch(`/api/users?userId=${userToDelete.id}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== userToDelete.id))
        setDeleteDialogOpen(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete user")
      }
    } catch (error) {
      setError("An error occurred while deleting the user")
    } finally {
      setDeleteLoading(null)
      setUserToDelete(null)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingUser(null)
    fetchUsers()
  }

  const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "ADMIN":
        return "destructive"
      case "PARTICIPANT":
        return "default"
      default:
        return "secondary"
    }
  }

  const getUserDisplayName = (user: User) => {
    return user.participant?.name || 
           user.admin?.name || 
           user.email.split('@')[0]
  }

  const getUserInitials = (user: User) => {
    const name = getUserDisplayName(user)
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getUserAvatar = (user: User) => {
    if (user.role === "ADMIN" && user.admin?.avatarUrl) {
      return user.admin.avatarUrl
    }
    if (user.role === "PARTICIPANT" && user.participant?.avatarUrl) {
      return user.participant.avatarUrl
    }
    return null
  }

  const getUserDetails = (user: User) => {
    if (user.student) {
      return `${user.student.clubName} • ${user.student.hostelName} • Room ${user.student.roomNo}`
    }
    if (user.participant) {
      const parts = []
      if (user.participant.college) parts.push(user.participant.college)
      if (user.participant.siteName) parts.push(`Site: ${user.participant.siteName}`)
      if (user.participant.teamName) parts.push(`Team: ${user.participant.teamName}`)
      return parts.length > 0 ? parts.join(" • ") : "Participant Member"
    }
    if (user.admin) {
      return "System Administrator"
    }
    return "No details available"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
            <Skeleton className="h-64 sm:h-96 w-full" />
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage system users and their roles</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleCreateUser} className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
            <Button onClick={() => setShowBulkImport(true)} variant="outline" className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
          </div>
        </div>

        {/* Create/Edit User Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit User" : "Create New User"}
              </DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? "Update the user information below." 
                  : "Add a new user to the system. Fill in the required information below."}
              </DialogDescription>
            </DialogHeader>
            <UserForm 
              editingUser={editingUser}
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>

        {/* Bulk Import Dialog */}
        <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Import Users
              </DialogTitle>
              <DialogDescription>
                Import multiple users at once using a CSV file
              </DialogDescription>
            </DialogHeader>
            <BulkUserImport 
              onSuccess={() => {
                setShowBulkImport(false)
                fetchUsers()
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="max-w-md mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Delete User
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Are you sure you want to delete this user?</p>
                {userToDelete && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 space-y-1">
                    <p className="font-medium text-red-900 dark:text-red-100">
                      {userToDelete.name}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Role: {userToDelete.role}
                    </p>
                  </div>
                )}
                <p className="font-medium text-red-600 text-sm">
                  ⚠️ This action cannot be undone. All user data will be permanently deleted.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel disabled={deleteLoading !== null} className="w-full sm:w-auto">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={deleteLoading !== null}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete User
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Users Statistics - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === "PARTICIPANT").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active participants</p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrators</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => u.role === "ADMIN").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">System admins</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg sm:text-xl">All Users ({filteredUsers.length})</CardTitle>
                  <CardDescription className="text-sm">View and manage all system users</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchUsers} className="w-full sm:w-auto">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Filters Section */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search */}
                  <div className="relative lg:col-span-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, UID, college..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>

                  {/* Site Filter */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select value={siteFilter} onValueChange={setSiteFilter}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Filter by site" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sites</SelectItem>
                        {siteLocations.map(site => (
                          <SelectItem key={site} value={site}>{site}</SelectItem>
                        ))}
                        <SelectItem value="not-set">Not Set</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Team Filter */}
                  <div className="relative">
                    <UsersRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      placeholder="Filter by team name"
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                </div>

                {/* Active Filters & Clear */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {searchQuery && (
                      <Badge variant="secondary" className="gap-1">
                        Search: {searchQuery}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setSearchQuery("")}
                        />
                      </Badge>
                    )}
                    {siteFilter !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {siteFilter === "not-set" ? "Not Set" : siteFilter}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setSiteFilter("all")}
                        />
                      </Badge>
                    )}
                    {teamFilter && (
                      <Badge variant="secondary" className="gap-1">
                        <UsersRound className="h-3 w-3" />
                        Team: {teamFilter}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setTeamFilter("")}
                        />
                      </Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="h-7 text-xs"
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  {hasActiveFilters ? "No users found matching your filters." : "No users found."}
                </p>
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    size="sm"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block lg:hidden space-y-4 p-4">
                  {currentUsers.map((user) => (
                    <Card key={user.id} className="overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 shrink-0">
                              {getUserAvatar(user) ? (
                                <AvatarImage src={getUserAvatar(user)!} alt={getUserDisplayName(user)} />
                              ) : (
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                  {getUserInitials(user)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{getUserDisplayName(user)}</div>
                              <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              {user.role !== "ADMIN" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openDeleteDialog(user)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={getRoleVariant(user.role)} className="text-xs">
                            {user.role}
                          </Badge>
                          {user.uid && (
                            <Badge variant="outline" className="text-xs">
                              UID: {user.uid}
                            </Badge>
                          )}
                          {user.participant?.siteName && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {user.participant.siteName}
                            </Badge>
                          )}
                          {user.participant?.teamName && (
                            <Badge variant="outline" className="text-xs">
                              <UsersRound className="h-3 w-3 mr-1" />
                              {user.participant.teamName}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {getUserDetails(user)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.createdAt)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">User</TableHead>
                          <TableHead className="min-w-[100px]">Role</TableHead>
                          <TableHead className="min-w-[200px]">Contact</TableHead>
                          <TableHead className="min-w-[250px]">Details</TableHead>
                          <TableHead className="min-w-[120px]">Created</TableHead>
                          <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  {getUserAvatar(user) ? (
                                    <AvatarImage src={getUserAvatar(user)!} alt={getUserDisplayName(user)} />
                                  ) : (
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                      {getUserInitials(user)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <div className="font-medium">{getUserDisplayName(user)}</div>
                                  <div className="text-sm text-muted-foreground">
                                    ID: {user.id.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRoleVariant(user.role)}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-sm truncate">{user.email}</div>
                                  {user.uid && (
                                    <div className="text-xs text-muted-foreground">UID: {user.uid}</div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm max-w-xs truncate">
                                  {getUserDetails(user)}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {user.participant?.siteName && (
                                    <Badge variant="outline" className="text-xs">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {user.participant.siteName}
                                    </Badge>
                                  )}
                                  {user.participant?.teamName && (
                                    <Badge variant="outline" className="text-xs">
                                      <UsersRound className="h-3 w-3 mr-1" />
                                      {user.participant.teamName}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                                <Calendar className="h-4 w-4" />
                                {formatDate(user.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit User
                                  </DropdownMenuItem>
                                  {user.role !== "ADMIN" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => openDeleteDialog(user)}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete User
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Pagination - Responsive */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t">
                    <div className="text-sm text-muted-foreground text-center sm:text-left">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(endIndex, filteredUsers.length)}</span> of{' '}
                      <span className="font-medium">{filteredUsers.length}</span> users
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToFirstPage}
                        disabled={currentPage === 1}
                        className="hidden sm:flex"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="ml-1">Previous</span>
                      </Button>
                      <div className="flex items-center gap-1 px-2">
                        <span className="text-sm font-medium">{currentPage}</span>
                        <span className="text-sm text-muted-foreground">/</span>
                        <span className="text-sm text-muted-foreground">{totalPages}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      >
                        <span className="mr-1">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages}
                        className="hidden sm:flex"
                      >
                        <ChevronsRight className="h-4 w-4" />
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

export default UsersPage