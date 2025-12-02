// app/api/users/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createUserSchema } from "@/lib/validations/auth"

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
      hostelName,
      wifiusername,
      wifiPassword,
      hostelLocation,
      contactNumber
    } = body

    // Validation
    if (!email || !password || !role || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
      newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          uid,
          role,
          participant: {
            create: {
              name,
              gender: gender || "male",
              college: college || "",
              hostelName: hostelName || "",
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
          uid,
          role,
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
      hostelName,
      wifiusername,
      wifiPassword,
      hostelLocation,
      contactNumber,
      role
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

    let updatedUser

    if (user.role === "PARTICIPANT") {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          participant: {
            update: {
              name: name || user.participant?.name,
              gender: gender || user.participant?.gender,
              college: college !== undefined ? college : user.participant?.college,
              hostelName: hostelName !== undefined ? hostelName : user.participant?.hostelName,
              wifiusername: wifiusername !== undefined ? wifiusername : user.participant?.wifiusername,
              wifiPassword: wifiPassword !== undefined ? wifiPassword : user.participant?.wifiPassword,
              hostelLocation: hostelLocation !== undefined ? hostelLocation : user.participant?.hostelLocation,
              contactNumber: contactNumber !== undefined ? contactNumber : user.participant?.contactNumber,
            },
          },
        },
        include: {
          participant: true,
        },
      })
    } else if (user.role === "ADMIN") {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          admin: {
            update: {
              name: name || user.admin?.name,
              gender: gender || user.admin?.gender,
            },
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

    // Check if user exists and get their role
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Prevent deleting admin users
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 403 }
      )
    }

    // Delete the user (cascade will handle related records)
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