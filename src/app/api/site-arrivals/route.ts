import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user's site and participant info
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        participant: {
          select: {
            id: true,
            siteName: true,
            carpoolInterestsSent: {
              select: {
                arrivalOwnerId: true,
              }
            }
          }
        }
      }
    })

    if (!currentUser?.participant?.siteName) {
      return NextResponse.json({ error: "Site not assigned" }, { status: 400 })
    }

    const userSiteName = currentUser.participant.siteName
    const currentParticipantId = currentUser.participant.id

    // IDs the current user has already expressed interest in
    const interestedInIds = currentUser.participant.carpoolInterestsSent.map(i => i.arrivalOwnerId)

    // Fetch all participants from the same site who have submitted arrival details
    const siteArrivals = await prisma.participant.findMany({
      where: {
        siteName: userSiteName,
        arrivalDetailsSubmitted: true,
      },
      select: {
        id: true,
        name: true,
        college: true,
        teamName: true,
        transportMode: true,
        arrivalFrom: true,
        arrivalTo: true,
        expectedArrivalTime: true,
        interestedInCarpool: true,
        carpoolContactNumber: true,
        gender: true,
        avatarUrl: true,
        userId: true,
        // Include carpool interests received (for showing count)
        carpoolInterestsReceived: {
          select: {
            id: true,
            interestedParticipant: {
              select: {
                id: true,
                name: true,
                college: true,
                avatarUrl: true,
              }
            },
            contactNumber: true,
            message: true,
            createdAt: true,
          }
        },
        updatedAt: true,  // Add this
        createdAt: true,  // Add this
      },
      orderBy: {
        expectedArrivalTime: 'asc'
      }
    })

    // Get stats
    const stats = {
      total: siteArrivals.length,
      byTransportMode: {
        flight: siteArrivals.filter(p => p.transportMode === 'FLIGHT').length,
        train: siteArrivals.filter(p => p.transportMode === 'TRAIN').length,
        bus: siteArrivals.filter(p => p.transportMode === 'BUS').length,
        other: siteArrivals.filter(p => p.transportMode === 'OTHER').length,
      },
      interestedInCarpool: siteArrivals.filter(p => p.interestedInCarpool).length,
    }

    // Get total participants count for the site
    const totalParticipants = await prisma.participant.count({
      where: { siteName: userSiteName }
    })

    return NextResponse.json({
      siteName: userSiteName,
      arrivals: siteArrivals,
      stats: {
        ...stats,
        totalParticipants,
        submissionRate: totalParticipants > 0 
          ? Math.round((stats.total / totalParticipants) * 100) 
          : 0
      },
      currentUserId: currentUser.id,
      currentParticipantId,
      interestedInIds, // IDs user has already expressed interest in
    })
  } catch (error) {
    console.error("Error fetching site arrivals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}