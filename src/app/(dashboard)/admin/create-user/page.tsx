import React from 'react'
import UserForm from '@/components/forms/user-form'

const CreateUserPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
              <p className="text-gray-600 mt-1">Add participant </p>
            </div>
            <nav className="text-sm text-gray-500">
              <a href="/admin" className="hover:text-gray-700">Admin Dashboard</a>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Create User</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <UserForm />
      </div>
    </div>
  )
}

export default CreateUserPage
