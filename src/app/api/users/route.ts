// app/api/users/route.ts

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createUserSchema } from "@/lib/validations/auth"

// GET all users (Admin and participant)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    // Allow both ADMIN and participant to access user data
    if (!session || (session.user.role as string) !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    let users
    
    // Admin can see all users
    users = await prisma.user.findMany({
      include: {
        participant: true,
        admin: true,
      },
      orderBy: { createdAt: "desc" },
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

// POST create new user (Admin only - for participant users)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    console.log("Received body:", body)
    
    const validatedData = createUserSchema.parse(body)
    console.log("Validated data:", validatedData)
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { uid: validatedData.uid },
        ],
      },
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or UID already exists" },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)
    
    // Create user based on role
    let user
    
    if (validatedData.role === "PARTICIPANT") {
      console.log("Creating participant with data:", {
        name: validatedData.name,
        college: validatedData.college,
        hostelName: validatedData.hostelName,
        wifiusername: validatedData.wifiusername,
        wifiPassword: validatedData.wifiPassword,
        hostelLocation: validatedData.hostelLocation || null,
        contactNumber: validatedData.contactNumber,
      })
      
      user = await prisma.user.create({
        data: {
          email: validatedData.email,
          uid: validatedData.uid,
          password: hashedPassword,
          role: "PARTICIPANT",
          participant: {
            create: {
              name: validatedData.name,
              college: validatedData.college || null,
              hostelName: validatedData.hostelName,
              wifiusername: validatedData.wifiusername,
              wifiPassword: validatedData.wifiPassword,
              hostelLocation: validatedData.hostelLocation || null,
              contactNumber: validatedData.contactNumber,
            },
          },      
        },
        include: {
          participant: true,
        },
      })
    } else {
      return NextResponse.json(
        { error: "Invalid role for user creation" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating user:", error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error details:", error.message)
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// DELETE user (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }
    
    // Don't allow deleting the admin user
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    })
    
    if (userToDelete?.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 403 }
      )
    }
    
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