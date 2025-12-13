import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Update user location
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { latitude, longitude } = await req.json()

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { participant: true }
    })

    if (!user?.participant) {
      return NextResponse.json({ 
        error: "Only participants can share location" 
      }, { status: 403 })
    }

    const siteName = user.participant.siteName || "Unknown"

    const location = await prisma.userLocation.upsert({
      where: { participantId: user.participant.id },
      update: {
        latitude,
        longitude,
        siteName,
        isActive: true
      },
      create: {
        participantId: user.participant.id,
        latitude,
        longitude,
        siteName,
        isActive: true
      }
    })

    return NextResponse.json({ success: true, location })
  } catch (error) {
    console.error("Location update error:", error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}

// Get locations for map
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { participant: true }
    })

    const isAdmin = session.user.role === "ADMIN"
    const siteName = user?.participant?.siteName || null

    // Get locations updated in last 5 minutes (active users)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const locations = await prisma.userLocation.findMany({
      where: {
        isActive: true,
        updatedAt: { gte: fiveMinutesAgo },
        ...(isAdmin ? {} : siteName ? { siteName } : { siteName: "Unknown" })
      },
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            teamName: true
          }
        }
      }
    })

    return NextResponse.json({ 
      locations: locations.map(loc => ({
        id: loc.id,
        participantId: loc.participantId,
        participantName: loc.participant.name,
        avatarUrl: loc.participant.avatarUrl,
        teamName: loc.participant.teamName,
        latitude: loc.latitude,
        longitude: loc.longitude,
        siteName: loc.siteName,
        updatedAt: loc.updatedAt
      })),
      userSite: siteName,
      isAdmin,
      canShare: !!user?.participant
    })
  } catch (error) {
    console.error("Get locations error:", error)
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
  }
}

// Mark user as inactive
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { participant: true }
    })

    if (user?.participant) {
      await prisma.userLocation.updateMany({
        where: { participantId: user.participant.id },
        data: { isActive: false }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete location error:", error)
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 })
  }
}