import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = params.id

    // Add connection timeout and retry logic
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        participant: true,
        admin: true,
      },
    }).catch(async (error) => {
      console.error("Database connection error, retrying...", error)
      
      // Disconnect and reconnect
      await prisma.$disconnect()
      await prisma.$connect()
      
      // Retry the query
      return prisma.user.findUnique({
        where: { id: userId },
        include: {
          participant: true,
          admin: true,
        },
      })
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error("Error fetching user:", error)
    
    // Disconnect on error
    await prisma.$disconnect().catch(() => {})
    
    // Check for specific Prisma errors
    if (error.code === 'P1001') {
      return NextResponse.json(
        { error: "Database connection timeout. Please try again." },
        { status: 503 }
      )
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to fetch user. Please try again." },
      { status: 500 }
    )
  }
}