"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import UserForm from '@/components/forms/user-form'

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
  }
  admin?: {
    name: string
  }
}

const UsersPage = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  useEffect(() => {
     if (!session || (session.user.role as string) !== "ADMIN") {
         router.push("/")
         return
       }
    fetchUsers()
  }, [session, router])

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

  const handleDeleteUser = async (userId: string, userRole: string) => {
    if (userRole === "ADMIN") {
      alert("Cannot delete admin users")
      return
    }

    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    setDeleteLoading(userId)
    
    try {
      const response = await fetch(`/api/users?userId=${userId}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId))
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to delete user")
      }
    } catch (error) {
      alert("An error occurred while deleting the user")
    } finally {
      setDeleteLoading(null)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800"
      case "PARTICIPANT":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUserDisplayName = (user: User) => {
    return user.participant?.name || 
           user.admin?.name || 
           "Unknown"
  }

  const getUserDetails = (user: User) => {
    if (user.student) {
      return `${user.student.clubName} • ${user.student.hostelName} • Room ${user.student.roomNo}`
    }
    if (user.participant) {
      return user.participant.college || "participant Member"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage system users and their roles</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {showForm ? "Hide Form" : "Create New User"}
              </button>
              <button
                onClick={() => router.push("/admin")}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create User Form */}
        {showForm && (
          <div className="mb-8">
            <UserForm />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Users Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
       
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Participants</h3>
            <p className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === "PARTICIPANT").length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                All Users ({users.length})
              </h3>
              <button
                onClick={fetchUsers}
                className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>
          
          {users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getUserDisplayName(user)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        {user.uid && (
                          <div className="text-sm text-gray-500">UID: {user.uid}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {getUserDetails(user)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {user.role !== "ADMIN" && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.role)}
                            disabled={deleteLoading === user.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {deleteLoading === user.id ? "Deleting..." : "Delete"}
                          </button>
                        )}
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

export default UsersPage
