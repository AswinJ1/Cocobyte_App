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

    // Validate coordinates exist and are numbers
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Coordinates out of range" }, { status: 400 })
    }

    // Check for NaN
    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ error: "Coordinates cannot be NaN" }, { status: 400 })
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
        isActive: true,
        updatedAt: new Date() // Explicitly update timestamp
      },
      create: {
        participantId: user.participant.id,
        latitude,
        longitude,
        siteName,
        isActive: true
      }
    })

    console.log(`📍 Location saved: ${user.participant.name} @ ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)

    return NextResponse.json({ 
      success: true, 
      location: {
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        siteName: location.siteName
      }
    })
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
    const userSite = user?.participant?.siteName || null
    const currentParticipantId = user?.participant?.id

    // Get locations updated in last 5 minutes (active users)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    // Build where clause
    const whereClause: any = {
      isActive: true,
      updatedAt: { gte: fiveMinutesAgo }
    }

    // Non-admins only see their own site
    if (!isAdmin && userSite) {
      whereClause.siteName = userSite
    }

    const locations = await prisma.userLocation.findMany({
      where: whereClause,
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            teamName: true,
            siteName: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Filter out current user (they see themselves as blue marker)
    const filteredLocations = locations
      .filter(loc => loc.participantId !== currentParticipantId)
      .map(loc => ({
        id: loc.id,
        participantId: loc.participantId,
        participantName: loc.participant?.name || "Unknown",
        avatarUrl: loc.participant?.avatarUrl || null,
        teamName: loc.participant?.teamName || null,
        latitude: loc.latitude,
        longitude: loc.longitude,
        siteName: loc.siteName,
        updatedAt: loc.updatedAt.toISOString()
      }))

    return NextResponse.json({ 
      locations: filteredLocations,
      userSite,
      isAdmin,
      canShare: !!user?.participant,
      totalOnline: locations.length
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
      
      console.log(`📍 Location sharing stopped: ${user.participant.name}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete location error:", error)
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 })
  }
}