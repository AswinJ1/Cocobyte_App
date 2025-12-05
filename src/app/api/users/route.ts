// app/api/users/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const users = await prisma.user.findMany({
      include: {
        participant: true,
        admin: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      email,
      password,
      uid,
      role,
      name,
      gender,
      college,
      siteName,
      teamName,
      hostelName,
      roomNumber,
      wifiusername,
      wifiPassword,
      hostelLocation,
      contactNumber,
    } = body

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user based on role
    let newUser

    if (role === "PARTICIPANT") {
      if (!college) {
        return NextResponse.json(
          { error: "College is required for participants" },
          { status: 400 }
        )
      }

      newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          uid: uid || `${email.split('@')[0]}_${Date.now()}`,
          role: "PARTICIPANT",
          participant: {
            create: {
              name,
              college,
              gender: gender || "male",
              siteName: siteName || "",
              teamName: teamName || "",
              hostelName: hostelName || "",
              roomNumber: roomNumber || "",
              wifiusername: wifiusername || "",
              wifiPassword: wifiPassword || "",
              hostelLocation: hostelLocation || "",
              contactNumber: contactNumber || "",
            },
          },
        },
        include: {
          participant: true,
        },
      })
    } else if (role === "ADMIN") {
      newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          uid: uid || `admin_${email.split('@')[0]}_${Date.now()}`,
          role: "ADMIN",
          admin: {
            create: {
              name,
              gender: gender || "male",
            },
          },
        },
        include: {
          admin: true,
        },
      })
    } else {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
}

// PATCH - Update existing user
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()

    const {
      name,
      gender,
      college,
      siteName,
      teamName,
      hostelName,
      roomNumber,
      wifiusername,
      wifiPassword,
      hostelLocation,
      contactNumber,
      newPassword
    } = body

    // Fetch the user to check their role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        participant: true,
        admin: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Prepare base update data
    const userUpdateData: any = {}

    // Handle password update if provided
    if (newPassword && newPassword.trim() !== "") {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        )
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      userUpdateData.password = hashedPassword
    }

    let updatedUser

    if (user.role === "PARTICIPANT") {
      // Build participant update data
      const participantUpdateData: any = {}
      
      if (name !== undefined) participantUpdateData.name = name
      if (gender !== undefined) participantUpdateData.gender = gender
      if (college !== undefined) participantUpdateData.college = college
      
      // CRITICAL: Prevent siteName from being changed once set
      const existingSiteName = user.participant?.siteName?.trim()
      if (existingSiteName && existingSiteName !== "") {
        // Site is already set - use existing value, ignore any updates
        participantUpdateData.siteName = existingSiteName
        
        // Optional: Log warning if someone tried to change it
        if (siteName && siteName !== existingSiteName) {
          console.warn(
            `Attempt to change locked siteName from "${existingSiteName}" to "${siteName}" for user ${userId}`
          )
        }
      } else {
        // Site is not set yet - allow setting it for the first time
        if (siteName !== undefined) {
          participantUpdateData.siteName = siteName
        }
      }
      
      if (teamName !== undefined) participantUpdateData.teamName = teamName
      if (hostelName !== undefined) participantUpdateData.hostelName = hostelName
      if (roomNumber !== undefined) participantUpdateData.roomNumber = roomNumber
      if (wifiusername !== undefined) participantUpdateData.wifiusername = wifiusername
      if (wifiPassword !== undefined) participantUpdateData.wifiPassword = wifiPassword
      if (hostelLocation !== undefined) participantUpdateData.hostelLocation = hostelLocation
      if (contactNumber !== undefined) participantUpdateData.contactNumber = contactNumber

      // Update participant user
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...userUpdateData,
          participant: {
            update: participantUpdateData,
          },
        },
        include: {
          participant: true,
        },
      })
    } else if (user.role === "ADMIN") {
      // Build admin update data
      const adminUpdateData: any = {}
      
      if (name !== undefined) adminUpdateData.name = name
      if (gender !== undefined) adminUpdateData.gender = gender

      // Update admin user
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...userUpdateData,
          admin: {
            update: adminUpdateData,
          },
        },
        include: {
          admin: true,
        },
      })
    } else {
      return NextResponse.json(
        { error: "Invalid user role" },
        { status: 400 }
      )
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    // Check if user is Super Admin
    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Only Super Admins can delete users" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Prevent self-deletion
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 403 }
      )
    }

    // Check if user exists and get their details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        admin: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Prevent deletion of Super Admin users
    if (user.role === "ADMIN" && user.admin?.isSuperAdmin) {
      return NextResponse.json(
        { error: "Cannot delete Super Admin users" },
        { status: 403 }
      )
    }

    // Delete user (cascade will delete related records)
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}